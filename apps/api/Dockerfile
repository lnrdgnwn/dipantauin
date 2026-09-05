FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/prisma/package.json packages/prisma/package.json
COPY packages/email/package.json packages/email/package.json
RUN npm ci

FROM dependencies AS build
COPY apps/api apps/api
COPY apps/worker apps/worker
COPY packages packages
RUN npm run db:generate -w @dipantauin/prisma && npm run build -w @dipantauin/worker && npm run build -w @dipantauin/api

FROM build AS production-dependencies
RUN npm prune --omit=dev && npm remove prisma --no-save --ignore-scripts

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=build --chown=node:node /app/apps/worker/dist ./apps/worker/dist
COPY --from=build --chown=node:node /app/packages/prisma/package.json /app/packages/prisma/index.ts ./packages/prisma/
COPY --from=build --chown=node:node /app/packages/email/package.json /app/packages/email/index.ts ./packages/email/
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]
