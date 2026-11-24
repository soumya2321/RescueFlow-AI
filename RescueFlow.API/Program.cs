
using System.Text;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RescueFlow.API.Data;
using RescueFlow.API.Services;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if (builder.Environment.IsDevelopment())
{
    allowedOrigins = allowedOrigins
        .Concat(new[]
        {
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        })
        .Distinct()
        .ToArray();
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
builder.Services.AddDbContext<RescueFlowDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("RescueFlowDB")));

builder.Services.AddScoped<JwtTokenService>();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? "RescueFlowAPI";

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? "RescueFlowClient";

builder.Services.AddAuthentication(
    JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };

        // Validate the account on every authenticated request.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var userIdClaim = context.Principal?
                    .FindFirstValue(ClaimTypes.NameIdentifier);

                var roleClaim = context.Principal?
                    .FindFirstValue(ClaimTypes.Role);

                if (!int.TryParse(userIdClaim, out int userId)
                    || userId <= 0)
                {
                    context.Fail("Invalid user identity.");
                    return;
                }

                var dbContext = context.HttpContext
                    .RequestServices
                    .GetRequiredService<RescueFlowDbContext>();

                var user = await dbContext.Users
                    .AsNoTracking()
                    .Where(u => u.UserId == userId)
                    .Select(u => new
                    {
                        u.IsActive,
                        u.Role
                    })
                    .FirstOrDefaultAsync(
                        context.HttpContext.RequestAborted);

                if (user == null)
                {
                    context.Fail("User account not found.");
                    return;
                }

                if (!user.IsActive)
                {
                    context.Fail("User account is inactive.");
                    return;
                }

                if (user.Role != roleClaim)
                {
                    context.Fail(
                        "User role has changed. Please log in again.");
                    return;
                }
            }
        };
    });

builder.Services.AddAuthorization();


builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?
                .ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});
var app = builder.Build();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            message = "An unexpected error occurred. Please try again later."
        });
    });
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    using var scope = app.Services.CreateScope();

    var context = scope.ServiceProvider
        .GetRequiredService<RescueFlowDbContext>();

    await DemoDataSeeder.SeedAsync(context);

    Console.WriteLine("Demo account seeding completed.");
}

app.UseCors("AllowFrontend");

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
// Enforce live verification on NGO rescue mutations, not login/profile access.
app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    if (context.User.IsInRole("NGO") && !HttpMethods.IsGet(context.Request.Method) &&
        (path.StartsWithSegments("/api/donations") || path.StartsWithSegments("/api/volunteer-assignments")))
    {
        var db = context.RequestServices.GetRequiredService<RescueFlowDbContext>();
        var id = int.Parse(context.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Serialize verification changes and rescue mutations using the profile row.
        await using var tx = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
        if (!await db.NGOProfiles.AnyAsync(n => n.UserId == id && n.IsVerified && n.VerificationStatus == "Approved"))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { message = "NGO approval is required." });
            return;
        }
        await next(context);
        if (context.Response.StatusCode < 400) await tx.CommitAsync();
        return;
    }
    await next(context);
});

app.MapControllers();

app.Run();
