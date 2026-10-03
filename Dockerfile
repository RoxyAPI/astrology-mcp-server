FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN bun run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/dist/index.js ./index.js
USER node
ENTRYPOINT ["node", "index.js"]
