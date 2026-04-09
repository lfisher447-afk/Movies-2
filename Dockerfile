# Use the official Node.js 18 Alpine base image for a small footprint
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package info
COPY package*.json ./

# Install the production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Health check to verify the app is running
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Command to run the application
CMD ["npm", "start"]
