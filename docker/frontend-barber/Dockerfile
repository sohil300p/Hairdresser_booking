FROM node:20-alpine AS builder
WORKDIR /app

COPY src-front/assets ./assets
COPY src-front/barber/package.json src-front/barber/package-lock.json* ./barber/
WORKDIR /app/barber
RUN npm ci

ARG VITE_API_BASE_URL
ARG VITE_MAPIR_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAPIR_API_KEY=$VITE_MAPIR_API_KEY

COPY src-front/barber ./
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/barber/dist /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/frontend-barber/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
