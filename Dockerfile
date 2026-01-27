# Use the official Bun image as the base image
FROM node:22-slim AS builder

RUN npm install -g pnpm@latest-10
RUN pnpm -v

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./


# Copy app and packages
COPY apps/server apps/server
COPY packages packages

# Install dependencies
WORKDIR /app/apps/server
RUN pnpm install --frozen-lockfile

# Compile the application
RUN pnpm build

# Use a lightweight image for the final stage
FROM node:22-slim

# Set the working directory
WORKDIR /app

RUN mkdir db

# Copy the compiled server from the builder stage
COPY --from=builder /app /app

WORKDIR /app/apps/server

# Expose port 3000
EXPOSE 3000

RUN ls
RUN cat package.json

# Set the port environment variable
ENV PORT=3000

# start the server
CMD ["node", "--import", "tsx", "dist/src/index.js"]
