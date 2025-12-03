# 🚀 **Source-Based Deployment - Tutor Inteligente**

## 📋 **Método: Construcción desde Código Fuente**

Este método permite desplegar la aplicación construyendo las imágenes Docker directamente desde el código fuente. Es ideal cuando se quiere tener el control total del proceso de construcción y se cuenta con una conexión a internet estable.

---

## 🎯 **Requisitos Previos**

- **Docker Desktop** instalado y ejecutándose
- **Git** instalado
- **Conexión a internet** (para descargar dependencias)
- **Windows/Linux/Mac** con soporte para Docker

---

## 📥 **Paso 1: Clonar el Repositorio**

```bash
# Clonar el repositorio
git clone https://github.com/AlanoHater/Tutor-AI-Docker.git
cd Tutor-AI-Docker

# Cambiar a la rama con Docker
git checkout docker-setup
```

---

## ⚙️ **Paso 2: Configurar Variables de Entorno**

### Opción A: Copiar archivo de ejemplo
```bash
# Copiar el archivo de ejemplo
copy env-ejemplo.txt .env
# O en Linux/Mac: cp env-ejemplo.txt .env
```

### Opción B: Crear archivo .env manualmente

Crea un archivo llamado `.env` en la raíz del proyecto con este contenido:

```bash
# Puerto del servidor backend
PORT=5000

# Entorno de ejecución
NODE_ENV=production

# Base de datos SQLite
DB_PATH=/app/database/tutor.db

# API Key de Google Gemini (IMPORTANTE: reemplaza con tu clave real)
GEMINI_API_KEY=tu_clave_api_de_gemini_aqui

# JWT Secret para autenticación
JWT_SECRET=mi_clave_secreta_para_jwt_tutor_inteligente_2025
```

**⚠️ IMPORTANTE:** Debes configurar `GEMINI_API_KEY` con una clave válida de Google Gemini.

---

## 🏗️ **Paso 3: Construir las Imágenes Docker**

```bash
# Construir las imágenes desde el código fuente
docker compose build

# Este proceso descargará todas las dependencias y compilará:
# - Backend: Node.js + dependencias + código fuente
# - Frontend: Node.js build + Nginx
```

**⏱️ Tiempo estimado:** 5-10 minutos (depende de la velocidad de internet y PC)

---

## ▶️ **Paso 4: Ejecutar la Aplicación**

```bash
# Ejecutar los contenedores
docker compose up

# O ejecutar en segundo plano
docker compose up -d
```

---

## 🌐 **Paso 5: Acceder a la Aplicación**

Una vez que los contenedores estén ejecutándose:

- **Aplicación Web:** http://localhost
- **API Backend:** http://localhost:5000/api
- **Documentación API:** http://localhost:5000/api-docs

### 📋 **Credenciales de Acceso**

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Tipo:** Coordinador

---

## 🛑 **Para Detener la Aplicación**

```bash
# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (borra datos)
docker compose down -v
```

---

## 🔍 **Verificación del Despliegue**

### Ver estado de contenedores:
```bash
docker compose ps
```

### Ver logs:
```bash
# Logs de todos los servicios
docker compose logs

# Logs del backend
docker compose logs backend

# Logs del frontend
docker compose logs frontend
```

### Ver imágenes construidas:
```bash
docker images | findstr tutor-inteligente
```

---

## 🐛 **Solución de Problemas**

### Problema: "docker compose build" falla
**Solución:** Asegúrate de tener buena conexión a internet y suficiente espacio en disco.

### Problema: No puede acceder a http://localhost
**Solución:**
```bash
# Verificar que los contenedores estén ejecutándose
docker compose ps

# Reiniciar si es necesario
docker compose restart
```

### Problema: Error de autenticación
**Solución:** Verifica que el archivo `.env` tenga las variables correctas, especialmente `JWT_SECRET` y `GEMINI_API_KEY`.

### Problema: Base de datos no funciona
**Solución:**
```bash
# Reiniciar con volúmenes limpios
docker compose down -v
docker compose up --build
```

---

## 📁 **Archivos Importantes**

- `docker-compose.yml` - Configuración principal
- `backend/Dockerfile` - Cómo construir la imagen del backend
- `frontend/Dockerfile` - Cómo construir la imagen del frontend
- `frontend/nginx.conf` - Configuración del servidor web
- `.env` - Variables de entorno (crear este archivo)

---

## ⚡ **Comandos Útiles**

```bash
# Reconstruir después de cambios
docker compose up --build --force-recreate

# Ver uso de recursos
docker stats

# Limpiar imágenes no utilizadas
docker image prune -f

# Ver logs en tiempo real
docker compose logs -f
```

---

## 🎯 **Ventajas de Source-Based Deployment**

- ✅ **Siempre actualizado** - Construye desde el código más reciente
- ✅ **Personalizable** - Puedes modificar el código antes de construir
- ✅ **Transparente** - Ves exactamente qué se incluye en las imágenes
- ✅ **Sin archivos grandes** - No necesitas transferir imágenes .tar
- ✅ **Control total** - Puedes modificar Dockerfiles y configuración

---

**¡Listo para desplegar!** Si tienes problemas, revisa los logs y verifica tu configuración de Docker. 🚀