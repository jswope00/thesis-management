# Multi-stage Dockerfile for building client with subpath support
# This is used for deployments at non-root paths (e.g., /cile)

# Stage 1: Build
FROM node:22.10.0-alpine AS build

# Set working directory
WORKDIR /app

# Accept build arguments
ARG PUBLIC_PATH=/cile/
ARG SERVER_HOST
ARG KEYCLOAK_HOST
ARG KEYCLOAK_REALM_NAME
ARG KEYCLOAK_CLIENT_ID

# Set environment variables for build
ENV PUBLIC_PATH=${PUBLIC_PATH}
ENV SERVER_HOST=${SERVER_HOST}
ENV KEYCLOAK_HOST=${KEYCLOAK_HOST}
ENV KEYCLOAK_REALM_NAME=${KEYCLOAK_REALM_NAME}
ENV KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}
ENV NODE_ENV=production

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY client/ ./

# Build the application with PUBLIC_PATH
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

# Copy custom nginx configuration
COPY client/nginx/nginx.subpath.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy runtime environment script
COPY client/public/generate-runtime-env.js /docker-entrypoint.d/01-generate-runtime-env.sh

# Make the script executable
RUN chmod +x /docker-entrypoint.d/01-generate-runtime-env.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

