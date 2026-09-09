FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 3100
EXPOSE 4173

ENV PORT=3100
ENV HOST=0.0.0.0

CMD ["sh", "-c", "bun mcp-server/server.js & bun run preview --host 0.0.0.0 --port 4173"]
