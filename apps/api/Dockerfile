# Built from the repo root so the API gets its workspace packages: docker build -f apps/api/Dockerfile .
FROM node:22-slim
# ffmpeg turns phone voice notes into the WAV that Muse Voice Transcribe accepts.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/models/package.json packages/models/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @nomi/api --include-workspace-root=false && npm cache clean --force
COPY packages/models/src packages/models/src
COPY packages/shared/src packages/shared/src
COPY apps/api/src apps/api/src
WORKDIR /repo/apps/api
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/index.ts"]
