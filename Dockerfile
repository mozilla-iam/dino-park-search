FROM node:14-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production
COPY . /app
CMD ["node", "-r", "esm", "index.js"]
