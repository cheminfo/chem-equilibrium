FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/chem-equilibrium/package.json packages/chem-equilibrium/
COPY packages/equilibrium.cheminfo.org/package.json packages/equilibrium.cheminfo.org/
RUN npm ci
COPY . .
RUN npm run build

FROM joseluisq/static-web-server:2-alpine
COPY --from=builder /app/packages/equilibrium.cheminfo.org/dist /public
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=/public/index.html
ENV SERVER_PORT=80
EXPOSE 80
