# Use the official Bun image as the base image
FROM oven/bun:1.3 AS builder

RUN apt update -y && apt install curl unzip -y
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN npm -v
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
