# ---- Base image ----
FROM node:20-alpine as base
WORKDIR /app

# ---- Install all dependencies ----
FROM base as deps
COPY package*.json ./
RUN npm install

# ---- Build the app ----
FROM base as build
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# ---- Prune dev dependencies ----
FROM base as prune
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --production

# ---- Production image ----
FROM node:20-alpine as prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=prune /app/node_modules ./node_modules
COPY package*.json ./

CMD ["npm", "run", "start:prod"]
