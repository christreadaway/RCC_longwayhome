FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies (postinstall will handle client)
RUN npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npx vite build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

CMD ["node", "server/index.js"]
