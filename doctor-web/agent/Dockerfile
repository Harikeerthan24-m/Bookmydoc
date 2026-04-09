# LiveKit Cloud Agent — BookMyDoc Voice Agent
# Uses node:22-slim (glibc-based, required by LiveKit Cloud — Alpine/musl is NOT supported)
FROM node:22-slim

WORKDIR /app

# Copy manifest first to maximise layer cache
COPY package.json package-lock.json* ./

# Install production deps only — tsx transpiles TypeScript at runtime (no compile step needed)
RUN npm ci --omit=dev --ignore-scripts

# Copy agent source files
COPY agent.ts agent.helpers.ts ./

# LiveKit Cloud runs `npm start` which calls: node --import tsx agent.ts start
CMD ["npm", "start"]
