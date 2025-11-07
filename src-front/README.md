<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AStUQJRu6dZBeKaruDy9OSoAx0oU1SOn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Update `.env` with the required keys (`GEMINI_API_KEY`, `VITE_MAPIR_API_KEY`, ...)
3. Run the app:
   `npm run dev`

## Production Build (Docker)

The root `docker-compose.production.yml` builds this frontend via `src-front/Dockerfile.frontend`. The build expects `VITE_MAPIR_API_KEY` (and optionally `VITE_API_BASE_URL`) to be defined in the environment or `.env` before running:

```bash
docker compose -f ../docker-compose.production.yml build frontend \
  --build-arg VITE_MAPIR_API_KEY=$VITE_MAPIR_API_KEY \
  --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://backend:3000/api}
```

When deploying with Dockploy/Traefik, add the necessary labels in the compose file to route traffic to the `frontend` service.
