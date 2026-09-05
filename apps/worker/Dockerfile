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
COPY apps/worker apps/worker
COPY packages packages
RUN npm run db:generate -w @dipantauin/prisma && npm run build -w @dipantauin/worker

FROM build AS production-dependencies
RUN npm prune --omit=dev && npm remove prisma --no-save --ignore-scripts

FROM node:22-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=build --chown=node:node /app/apps/worker/dist ./apps/worker/dist
COPY --from=build --chown=node:node /app/packages/prisma/package.json /app/packages/prisma/index.ts ./packages/prisma/
USER node
CMD ["node", "apps/worker/dist/index.js"]
