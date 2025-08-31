FROM node:20-alpine

# Create working directory and set permissions
WORKDIR /app

# Install global deps (needed for TypeORM CLI, Nest dev mode)
RUN npm install -g ts-node typescript @nestjs/cli

# Install deps first (cache layer)
COPY package*.json ./
RUN npm install

# Copy entrypoint scripts
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
COPY wait-for-it.sh /app/wait-for-it.sh

# Ensure scripts are executable
RUN chmod +x /app/docker-entrypoint.sh /app/wait-for-it.sh

# Use the built-in "node" user instead of root
USER node

EXPOSE 3000

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
