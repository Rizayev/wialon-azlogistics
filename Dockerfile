# Single-container build: React client (static) + Express API/proxy.
FROM node:22-alpine

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm install

# Build client + server
COPY . .
RUN npm run build

# Drop dev dependencies (tsx, vite, typescript) from the runtime image
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
