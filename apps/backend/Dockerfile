FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --filter @microstore-auto-post/backend... --frozen-lockfile=false
COPY . .
RUN pnpm --filter @microstore-auto-post/backend build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
RUN mkdir -p logs
EXPOSE 5000
CMD ["node", "dist/server.js"]
