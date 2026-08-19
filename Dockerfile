FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable


FROM base AS dependencies

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


FROM base AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1


# Variables públicas de Next.js.
# Deben existir durante "pnpm build".
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL

ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_SITE_URL=$NEXT_PUBLIC_CONVEX_SITE_URL


# Detener el build si GitHub Actions no proporcionó las variables.
RUN test -n "$NEXT_PUBLIC_CONVEX_URL" || \
    (echo "ERROR: NEXT_PUBLIC_CONVEX_URL no fue proporcionada" && exit 1)

RUN test -n "$NEXT_PUBLIC_CONVEX_SITE_URL" || \
    (echo "ERROR: NEXT_PUBLIC_CONVEX_SITE_URL no fue proporcionada" && exit 1)


COPY --from=dependencies /app/node_modules ./node_modules

COPY . .

RUN pnpm build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000


RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs


COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static


USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]