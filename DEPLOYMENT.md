# Guía de Deployment - Conductor Tracker

Esta guía explica cómo desplegar la aplicación Conductor Tracker en diferentes entornos de producción.

## 🎯 Opciones de Deployment

### 1. Servidor Web Estático (Recomendado)

La aplicación genera archivos estáticos que pueden servirse desde cualquier servidor web.

#### Nginx
```nginx
server {
    listen 80;
    server_name conductor-tracker.local;
    root /path/to/conductor-tracker/dist;
    index index.html;

    # Configuración SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName conductor-tracker.local
    DocumentRoot /path/to/conductor-tracker/dist
    
    # Configuración SPA
    <Directory "/path/to/conductor-tracker/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Cache para assets
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

### 2. Servidor Node.js (Incluido)

Usa el servidor standalone incluido para deployment rápido:

```bash
# Build de producción
npm run build

# Instalar dependencias de producción
npm install --production

# Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:8080`

### 3. Contenedor Docker

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  conductor-tracker:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

### 4. Servicios Cloud

#### Netlify
1. Conecta tu repositorio
2. Configuración de build:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Añade archivo `_redirects` en `dist/`:
   ```
   /*    /index.html   200
   ```

#### Vercel
1. Conecta tu repositorio
2. Configuración automática detectada
3. Añade `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

#### GitHub Pages
1. Configura GitHub Actions:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## ⚙️ Configuración de Producción

### Variables de Entorno
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
```

### Optimizaciones de Build
```javascript
// vite.config.js - configuración adicional para producción
export default defineConfig({
  // ... configuración existente
  build: {
    // Optimizaciones adicionales
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['dexie', 'jspdf', 'chart.js'],
          utils: ['./src/utils/dateUtils.js', './src/utils/formatUtils.js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## 🔒 Consideraciones de Seguridad

### Headers de Seguridad
```nginx
# Nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

### HTTPS (Recomendado)
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
}
```

## 📊 Monitoreo y Logs

### Logs de Acceso
```nginx
# Nginx - formato de log personalizado
log_format conductor_tracker '$remote_addr - $remote_user [$time_local] '
                            '"$request" $status $body_bytes_sent '
                            '"$http_referer" "$http_user_agent"';

access_log /var/log/nginx/conductor-tracker.access.log conductor_tracker;
```

### Métricas de Performance
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB total
- **Lighthouse Score**: > 90

## 🚀 Proceso de Deployment

### 1. Pre-deployment
```bash
# Ejecutar tests
npm run test

# Verificar build
npm run build

# Verificar preview
npm run preview
```

### 2. Deployment Automatizado
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando deployment..."

# Backup de versión anterior
if [ -d "dist.backup" ]; then
    rm -rf dist.backup
fi
if [ -d "dist" ]; then
    mv dist dist.backup
fi

# Build de producción
echo "📦 Generando build de producción..."
npm run build

# Verificar archivos generados
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: Build fallido"
    exit 1
fi

# Deployment
echo "📤 Desplegando archivos..."
rsync -avz --delete dist/ user@server:/path/to/webroot/

# Verificar deployment
echo "✅ Verificando deployment..."
curl -f http://your-domain.com/ > /dev/null

echo "🎉 Deployment completado exitosamente!"
```

### 3. Rollback
```bash
#!/bin/bash
# rollback.sh

if [ -d "dist.backup" ]; then
    echo "🔄 Realizando rollback..."
    rm -rf dist
    mv dist.backup dist
    rsync -avz --delete dist/ user@server:/path/to/webroot/
    echo "✅ Rollback completado"
else
    echo "❌ No hay backup disponible"
    exit 1
fi
```

## 🔧 Troubleshooting

### Problemas Comunes

**Build falla**
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Assets no cargan**
- Verificar configuración de rutas en servidor web
- Comprobar permisos de archivos
- Revisar configuración de CORS

**SPA routing no funciona**
- Configurar fallback a index.html
- Verificar configuración de servidor web
- Comprobar que no hay conflictos de rutas

### Logs de Debug
```bash
# Servidor Node.js con logs detallados
DEBUG=* npm start

# Build con información detallada
npm run build -- --debug
```

## 📋 Checklist de Deployment

- [ ] Tests pasando
- [ ] Build de producción exitoso
- [ ] Configuración de servidor web
- [ ] Headers de seguridad configurados
- [ ] HTTPS configurado (recomendado)
- [ ] Backup de versión anterior
- [ ] Monitoreo configurado
- [ ] Plan de rollback preparado
- [ ] Documentación actualizada

---

**Nota**: Esta aplicación funciona completamente offline una vez cargada, por lo que el servidor solo necesita servir los archivos estáticos iniciales.