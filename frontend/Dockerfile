# Build multi-stage: compila el bundle Angular de producción y lo sirve con
# nginx, que además hace de reverse proxy hacia el backend en /api (por eso
# environment.production.ts usa apiBaseUrl: '/api', same-origin).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
