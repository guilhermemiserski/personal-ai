FROM node:20-bookworm-slim AS web-builder

WORKDIR /build/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci

COPY apps/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM python:3.12-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/requirements.txt ./api/requirements.txt
RUN pip install --no-cache-dir -r ./api/requirements.txt
COPY apps/api ./api

COPY --from=web-builder /build/web/.next/standalone ./
COPY --from=web-builder /build/web/.next/static ./.next/static

COPY scripts/start-production.sh /app/start-production.sh
RUN chmod +x /app/start-production.sh

ENV NODE_ENV=production
ENV API_PROXY_URL=http://127.0.0.1:8000
ENV NEXT_PUBLIC_API_URL=/api
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000
CMD ["/app/start-production.sh"]
