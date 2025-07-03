# Usa uma imagem Node.js completa para a etapa de compilação
FROM node:20-alpine AS build

WORKDIR /app

# Copia package.json e package-lock.json
COPY package.json package-lock.json ./

RUN npm install

# Copia o restante do código-fonte do projeto
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# --- Etapa de Produção/Execução ---
FROM node:20-alpine AS production

WORKDIR /app

# Copia apenas os arquivos JavaScript compilados da etapa de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

RUN npm install --omit=dev

# Expor a porta que a aplicação Express escuta
EXPOSE 3000

# Define variáveis de ambiente para produção
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["npm", "start"]