# RescueFlow AI - Deployment Guide

## Deployment Environment

Windows host with Ubuntu WSL2, Docker and Coolify.

## Deployment Sequence

1. Configure Ubuntu WSL2.
2. Install Docker and Coolify.
3. Connect the GitHub repository.
4. Deploy SQL Server using Docker Compose.
5. Initialize RescueFlowDB using the database scripts.
6. Configure database credentials and JWT secrets.
7. Deploy the ASP.NET Core backend using its Dockerfile.
8. Configure the backend network alias rescueflow-backend.
9. Deploy the React frontend using its Dockerfile.
10. Configure Nginx reverse proxy routing.
11. Publish frontend port 8090 on the loopback interface.
12. Configure GitHub Actions continuous integration.
13. Configure the local automatic deployment service.
14. Verify infrastructure and application health.
15. Execute end-to-end workflow testing.

## Backend Runtime Variables

- ASPNETCORE_ENVIRONMENT
- ASPNETCORE_HTTP_PORTS
- Jwt__Key
- Jwt__Issuer
- Jwt__Audience
- ConnectionStrings__RescueFlowDB

Actual secret values must be configured privately in Coolify.

## Operational Commands

Check containers:

    sudo docker ps

Check automatic deployment timer:

    sudo systemctl status rescueflow-cd.timer

Check deployment logs:

    sudo journalctl -u rescueflow-cd.service -n 30

Trigger immediate CI/CD check:

    sudo systemctl start rescueflow-cd.service

Check deployment state:

    sudo cat /var/lib/rescueflow-cd/state.json

Check application health:

    curl http://127.0.0.1:8090/health

## Application Access

Application: http://localhost:8090

Coolify: http://localhost:8000

## Verified Results

- Seven infrastructure checks passed.
- Twelve end-to-end workflow stages passed.
- SQL Server persistence verified.
- Automatic backend and frontend deployments verified.
- Verified deployment commit: b6dbc8778d46920415e9af05a840bba343e15471.

## Future Improvements

- Public cloud deployment
- HTTPS configuration
- Comprehensive security testing
- Automated database backups
- Commit-pinned deployments
- Automated integration tests within CI
