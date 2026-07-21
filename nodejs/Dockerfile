FROM node:20-alpine

# Install build dependencies for better-sqlite3 & sharp
RUN apk add --no-cache python3 make g++ gcc sqlite-dev

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create persistent directories if missing
RUN mkdir -p data public/uploads temp_uploads

# Expose application port
EXPOSE 8080

# Set default environment
ENV PORT=8080
ENV NODE_ENV=production

# Command to start the server
CMD ["node", "server.js"]
