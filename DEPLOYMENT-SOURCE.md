# 🚀 Despliegue desde Código Fuente - Tutor Inteligente

## 📋 Requisitos Previos

- **Docker Desktop** instalado y ejecutándose
- **Git** instalado
- **Conexión a internet** (para descargar dependencias)
- **Windows/Linux/Mac** con soporte para Docker

## 📥 Paso 1: Descargar el Código Fuente

```bash
# Clonar el repositorio desde GitHub
git clone https://github.com/AlanoHater/Tutor-AI-Docker.git
cd Tutor-AI-Docker

# Cambiar a la rama con la configuración Docker
git checkout docker-setup
```

## ⚙️ Paso 2: Configurar Variables de Entorno

Crea un archivo llamado `.env` en la raíz del proyecto:

```bash
# Puerto del servidor backend
PORT=5000

# Entorno de ejecución
NODE_ENV=production

# Base de datos SQLite
DB_PATH=/app/database/tutor.db

# API Key de Google Gemini (IMPORTANTE: necesaria para IA)
GEMINI_API_KEY=AIzaSyCMa3ayOUdQUV-yeg6Z5YzPy0LHIMEGc7k

# JWT Secret para tokens de sesión
JWT_SECRET=mi_clave_secreta_para_jwt_tutor_inteligente_2025
```

**Nota:** El `GEMINI_API_KEY` es necesario para que funcione la generación automática de preguntas con IA.

## 🐳 Paso 3: Construir y Ejecutar con Docker

### Opción A: Construir y Ejecutar (Recomendado)

```bash
# Construir las imágenes y ejecutar
docker compose up --build
```

### Opción B: Construir Primero, Ejecutar Después

```bash
# Construir las imágenes
docker compose build

# Ejecutar en segundo plano
docker compose up -d

# Ver logs si es necesario
docker compose logs -f
```

## 🌐 Paso 4: Acceder a la Aplicación

- **Aplicación Web:** http://localhost
- **API Backend:** http://localhost:5000/api
- **Documentación API:** http://localhost:5000/api-docs

## 🔐 Paso 5: Credenciales de Acceso

### Usuario Administrador (Coordinador)
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** Coordinador (puede gestionar profesores y asignar materias)

**Nota:** Este usuario se crea automáticamente durante la inicialización de la base de datos.

## 🛑 Para Detener la Aplicación

```bash
# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (datos persistentes)
docker compose down -v
```

## 📁 Estructura del Proyecto

```
Tutor-AI-Docker/
├── backend/                 # Servidor Node.js/Express
│   ├── Dockerfile          # Configuración Docker backend
│   ├── package.json        # Dependencias backend
│   ├── app.js             # Servidor principal
│   ├── config/            # Configuraciones
│   ├── controllers/       # Controladores API
│   ├── routes/           # Definición de rutas
│   └── database/         # Scripts de BD
├── frontend/              # Aplicación React
│   ├── Dockerfile        # Configuración Docker frontend
│   ├── nginx.conf        # Configuración Nginx
│   ├── package.json      # Dependencias frontend
│   ├── src/              # Código fuente React
│   └── public/           # Archivos estáticos
├── docker-compose.yml    # Configuración desarrollo
├── docker-compose-prod.yml # Configuración producción
├── .gitignore           # Archivos ignorados
├── .env                # Variables de entorno (crear)
└── README-PROFESORA.md # Documentación detallada
```

## 🔧 Tecnologías Utilizadas

- **Backend:** Node.js + Express.js + SQLite
- **Frontend:** React.js + Tailwind CSS + Nginx
- **Base de Datos:** SQLite (persistente en volumen Docker)
- **IA:** Google Gemini API para generación de preguntas
- **Contenedores:** Docker + Docker Compose
- **Autenticación:** JWT (JSON Web Tokens)

## 🚨 Solución de Problemas

### Error: "Port already in use"
```bash
# Cambiar puertos en docker-compose.yml
ports:
  - "8080:80"    # Cambiar 80 por 8080
  - "5001:5000" # Cambiar 5000 por 5001
```

### Error: "Permission denied" en Linux/Mac
```bash
# Dar permisos de ejecución
chmod +x backend/app.js
```

### Error de conexión a Gemini API
- Verificar que `GEMINI_API_KEY` esté configurada correctamente
- Revisar conexión a internet

### Base de datos no se inicializa
```bash
# Ver logs del backend
docker compose logs backend

# Reiniciar con limpieza
docker compose down -v
docker compose up --build
```

## 📊 Verificación del Despliegue

### Ver estado de contenedores:
```bash
docker compose ps
```

### Ver logs en tiempo real:
```bash
docker compose logs -f
```

### Ver logs de un servicio específico:
```bash
docker compose logs backend
docker compose logs frontend
```

## 🎯 Funcionalidades Disponibles

### Para Profesores:
- ✅ Subir material educativo (PDF, PPT)
- ✅ Generar quizzes automáticamente con IA
- ✅ Gestionar quizzes creados
- ✅ Ver métricas de uso

### Para Coordinadores:
- ✅ Gestionar profesores
- ✅ Asignar materias a profesores
- ✅ Supervisar actividades
- ✅ Ver estadísticas generales

### Para Alumnos:
- ✅ Acceder a quizzes interactivos
- ✅ Responder preguntas en tiempo real
- ✅ Ver resultados

---

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Verifica que Docker Desktop esté ejecutándose
2. Revisa que todas las variables de `.env` estén configuradas
3. Consulta los logs con `docker compose logs`
4. Asegúrate de tener conexión a internet para descargar dependencias

**¡La aplicación debería estar funcionando completamente después de seguir estos pasos!**

---

*Desarrollado para la presentación del proyecto Tutor Inteligente*
*Configuración Docker optimizada para despliegue desde código fuente*
