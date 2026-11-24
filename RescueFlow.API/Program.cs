using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RescueFlow.API.Data;
using RescueFlow.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
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
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RescueFlowAPI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "RescueFlowClient";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Global Exception Handler to prevent exposing SQL exception stack traces, JWTs, or headers
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var ex = exceptionHandlerPathFeature?.Error;
        if (ex != null)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Unhandled server error at {Path}: {Message}", context.Request.Path, ex.Message);
        }

        await context.Response.WriteAsJsonAsync(new
        {
            message = "An unexpected server error occurred. Please try again later."
        });
    });
});

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<RescueFlowDbContext>();

    try
    {
        // Apply any pending EF Core migrations (including VolunteerAssignments)
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migration checked and applied successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Automatic database migration skipped or encountered an issue: {Message}", ex.Message);
    }

    try
    {
        await DemoUserSeeder.SeedAsync(dbContext);
        logger.LogInformation("Demo users verified/seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Demo user seeding skipped or encountered an issue: {Message}", ex.Message);
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();