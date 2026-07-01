FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --filter @microstore-auto-post/frontend... --frozen-lockfile=false
COPY . .
RUN pnpm --filter @microstore-auto-post/frontend build

FROM nginx:alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
