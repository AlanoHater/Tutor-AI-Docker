# Etapa 1: Build
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./

# Instalamos dependencias (incluyendo devDependencies para Tailwind)
RUN npm install

COPY . .

# Crea la carpeta /app/build
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:alpine

# COPIAMOS DESDE 'build' (ajuste crítico por react-scripts)
COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
