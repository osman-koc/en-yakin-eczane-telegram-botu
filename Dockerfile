# --- deps stage (build only, not shipped) ---
# hadolint ignore=DL3008,DL3009
FROM node:20-bookworm-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev

# --- runtime stage ---
# Final image: distroless contains only Node runtime + glibc, no shell/package manager.
# CVE warnings from the deps stage above do NOT appear in the deployed image.
FROM gcr.io/distroless/nodejs20-debian12

ENV NODE_ENV=production
ENV USE_COLLECT_API=false
ENV COLLECT_API_URI="https://api.collectapi.com/health/dutyPharmacy"
ENV OPENSTREETMAP_URI="https://nominatim.openstreetmap.org/reverse"
ENV GOOGLE_MAPS_URI="https://www.google.com/maps/search/?api=1"

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# distroless built-in non-root user (uid 65532)
USER nonroot

CMD ["bot.js"]
