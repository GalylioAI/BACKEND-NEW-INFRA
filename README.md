# GalylioAI App Monorepo

This repository is structured for a full-stack deployment.

- `backend/` contains the Go/Python backend services, Docker Compose files, infrastructure scripts, OpenAPI spec, and backend documentation.
- `frontend/` is reserved for the frontend application.
- `.github/` stays at the repository root so GitHub Actions can build and deploy the app.

Backend commands should be run from the backend directory:

```bash
cd backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Production deployment still runs from GitHub Actions on pushes to `main`.
