# ── Compilación ──────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Ejecución ────────────────────────────────────────────────
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4000
# Las variables (DATABASE_URL, SECRET_KEY, BREVO_*, CORS_ORIGIN) llegan desde docker-compose
CMD ["node", "dist/src/main.js"]
