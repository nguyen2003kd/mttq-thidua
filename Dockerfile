ARG NODE_VERSION=22
ARG PNPM_VERSION=11.10.0

FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate \
    && pnpm config set store-dir /pnpm/store

WORKDIR /app


FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=mttq-tctd-uat-fe-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM dependencies AS builder

COPY . .

ENV NODE_ENV=production
ENV CI=true
RUN pnpm build


FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3061

CMD ["nginx", "-g", "daemon off;"]
