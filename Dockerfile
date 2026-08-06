FROM node:22-bullseye-slim

WORKDIR /app

COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable \
 && pnpm install --prod
COPY . /app
CMD ["node", "index.js"]
