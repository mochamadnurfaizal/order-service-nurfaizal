# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY . .

# Set environment variable for Loki URL (can be overridden at runtime)
ENV LOKI_URL=http://host.docker.internal:3100/loki/api/v1/push

# Expose app port
EXPOSE 3000

# Default command runs migrations and starts the app
CMD ["sh", "./start.sh"]
