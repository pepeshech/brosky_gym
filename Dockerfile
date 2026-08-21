# Step 1: Build the React application
FROM node:22-alpine AS build

WORKDIR /workspace

# Copy dependency files for npm workspaces
COPY package*.json ./
COPY app/package*.json ./app/

# Install dependencies (use npm ci for reproducible builds)
RUN npm ci

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy built static assets from the build stage
COPY --from=build /workspace/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Change permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port 80 for traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
