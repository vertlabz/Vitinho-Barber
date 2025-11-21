# ---- Production image (simples, confiável, sem prisma errors) ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# copiar arquivos de config
COPY package*.json ./

# copiar node_modules já prontos do host (IMPORTANTE!)
COPY node_modules ./node_modules

# copiar código compilado
COPY dist ./dist
COPY prisma ./prisma

# gerar prisma client (usa binários já baixados no host)
RUN npx prisma generate || true

EXPOSE 4000
CMD ["node", "dist/server.js"]
