# Use the official Bun image as the base image
FROM oven/bun:1.3 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lock ./
COPY tsconfig.json tsconfig.base.json ./
COPY bunfig.toml ./
COPY turbo.json ./

# Copy app and packages
COPY apps/server apps/server
COPY packages packages

# Install dependencies
# WORKDIR /app/apps/server
RUN bun --version
RUN bun install

RUN ls -lR

# Compile the application
WORKDIR /app/apps/server
RUN bun compile

# Use a lightweight image for the final stage
FROM oven/bun:1.3

# Set the working directory
WORKDIR /app

# Copy the compiled server from the builder stage
COPY --from=builder /app/apps/server/server .

# Expose port 3000
EXPOSE 3000

# Set the port environment variable
ENV PORT=3000

# start the server
CMD ["./server"]
