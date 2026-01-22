# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for Vite environment variables
ARG VITE_WS_URL=ws://localhost:8080/api/game_ws
ARG VITE_DEFAULT_TABLE=main-table

# Set environment variables for build
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_DEFAULT_TABLE=$VITE_DEFAULT_TABLE

# Build the application
RUN pnpm build

# Runtime stage - serve static files with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
