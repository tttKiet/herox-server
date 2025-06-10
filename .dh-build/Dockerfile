FROM node:18-alpine AS base

WORKDIR /app

COPY package*.json tsconfig.json ./

COPY . .

RUN npm install && npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]