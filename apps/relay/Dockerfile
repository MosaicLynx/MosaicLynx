FROM node:24.12.0-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/relay/package.json apps/relay/package.json
RUN pnpm install --frozen-lockfile --filter @mosaiclynx/relay...

COPY apps/relay apps/relay
RUN pnpm --filter @mosaiclynx/relay build

FROM node:24.12.0-alpine@sha256:c921b97d4b74f51744057454b306b418cf693865e73b8100559189605f6955b8 AS runtime

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/relay/package.json apps/relay/package.json
RUN pnpm install --frozen-lockfile --prod --filter @mosaiclynx/relay...
COPY --from=build --chown=node:node /workspace/apps/relay/dist apps/relay/dist
WORKDIR /workspace/apps/relay
USER node
EXPOSE 8787
CMD ["node", "dist/index.js"]
