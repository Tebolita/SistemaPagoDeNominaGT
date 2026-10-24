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
# El proceso no necesita privilegios de root
USER node
# Fiabilidad: Docker marca el contenedor como no saludable si la API o la BD no responden
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Las variables (DATABASE_URL, SECRET_KEY, BREVO_*, CORS_ORIGIN) llegan desde docker-compose
CMD ["node", "dist/src/main.js"]
