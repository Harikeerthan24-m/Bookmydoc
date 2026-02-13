FROM node:20.11-alpine as base

FROM base as deps
WORKDIR /app
COPY package.json ./
RUN npm install
COPY ui/package.json ./ui/
RUN cd ui && npm install && cd ../

FROM base as dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/ui/node_modules ./ui/node_modules
COPY . .

FROM base as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/ui/node_modules ./ui/node_modules
COPY . .
COPY .env.prod.sample .env
RUN npm run build:ui
RUN npm run build

FROM base as runner
WORKDIR /app
COPY --from=builder /app/ui/build ./ui/build
COPY --from=builder /app/ui/package.json ./ui
COPY --from=builder /app/.env ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 8080/tcp

CMD npm run start:prod
