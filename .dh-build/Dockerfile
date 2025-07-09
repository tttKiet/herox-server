FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json tsconfig.json ./
COPY . .

RUN npm install && npm run build
RUN npm install -g pm2

EXPOSE 3000

CMD ["pm2-runtime", "dist/index.js", "-i", "max"]