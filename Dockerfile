# Stage 1: Build the Next.js application
FROM node:alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application's source code
COPY . .

# Build the application
RUN yarn build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/out /usr/share/nginx/html
