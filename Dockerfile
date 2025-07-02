  FROM node:20-alpine AS build

  WORKDIR /app

  COPY package.json package-lock.json ./
  
  RUN npm install --omit=dev

  COPY . .

  RUN npm run build
  
  # --- Etapa de Produção/Execução ---
  FROM node:20-alpine AS production
  
  WORKDIR /app
  
  
  # Copia os arquivos de build e as dependências (node_modules) da etapa de build
  COPY --from=build /app/dist ./dist
  COPY --from=build /app/node_modules ./node_modules
  COPY --from=build /app/package.json ./package.json
  

  EXPOSE 3000
  
  # Define variáveis de ambiente para produção
  ENV NODE_ENV=production
  
  # Comando para iniciar a aplicação
  # Usa o script "start" definido no seu package.json
  CMD ["npm", "start"]