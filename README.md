# 🎓 Tutor Inteligente - Presentación

## 📋 Requisitos Previos

- **Docker Desktop** instalado y ejecutándose
- **Windows/Linux/Mac** con soporte para Docker

## 🚀 **DOS MÉTODOS DE DESPLIEGUE**

### 📦 **Método 1: Source-Based Deployment (RECOMENDADO)**
**Construye las imágenes desde el código fuente** - Más flexible y siempre actualizado.

[📖 **Ver Instrucciones Completas**](DEPLOYMENT-SOURCE.md)

```bash
# Clonar y desplegar desde código fuente
git clone https://github.com/AlanoHater/Tutor-AI-Docker.git
cd Tutor-AI-Docker
git checkout docker-setup
cp env-ejemplo.txt .env
# Editar .env con tu GEMINI_API_KEY
docker compose build
docker compose up
```

### 🖼️ **Método 2: Pre-built Images (ALTERNATIVO)**
**Usa imágenes Docker pre-compiladas** - Más rápido pero requiere archivos grandes.

### Paso 1: Cargar las Imágenes Docker

```bash
# Cargar la imagen del backend
docker load -i tutor-backend-v2.tar

# Cargar la imagen del frontend
docker load -i tutor-frontend-v2.tar
```

### Paso 2: Crear el Archivo .env

Crea un archivo llamado `.env` en la misma carpeta con el siguiente contenido:

```bash
# Configuración del servidor
PORT=5000
NODE_ENV=production

# Base de datos SQLite
DB_PATH=/app/database/tutor.db

# API Key de Google Gemini (para generar preguntas)
GEMINI_API_KEY=AIzaSyCMa3ayOUdQUV-yeg6Z5YzPy0LHIMEGc7k
```

### Paso 3: Ejecutar la Aplicación

```bash
docker compose -f docker-compose-prod.yml up
```

### Paso 4: Acceder a la Aplicación

- **Aplicación Web**: http://localhost
- **API Backend**: http://localhost:5000/api
- **Documentación API**: http://localhost:5000/api-docs

### Paso 5: Credenciales de Acceso

**Usuario Coordinador:**
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: Coordinador (puede gestionar profesores y asignar materias)

**Nota**: Este usuario fue creado automáticamente durante la inicialización de la base de datos.

## 🔄 Version v2 - Mejoras Realizadas

Esta versión incluye las siguientes correcciones y mejoras:

- ✅ **Autenticación corregida**: Credenciales de usuario admin funcionando correctamente
- ✅ **JWT_SECRET configurado**: Sistema de tokens de sesión operativo
- ✅ **Base de datos optimizada**: Inicialización correcta con contraseñas encriptadas
- ✅ **Configuración completa**: Todas las variables de entorno necesarias incluidas
- ✅ **Imágenes actualizadas**: Contienen todas las correcciones y mejoras

## 🎯 Funcionalidades de la Aplicación

### Para Profesores:
- ✅ Gestión de materias asignadas
- ✅ Subida de material educativo (PDF, PPT, etc.)
- ✅ Generación automática de quizzes con IA
- ✅ Creación de exámenes y respuestas
- ✅ Gestión de alumnos y calificaciones

### Para Coordinadores:
- ✅ Gestión de profesores
- ✅ Asignación de materias
- ✅ Métricas y estadísticas
- ✅ Supervisión de actividades

### Para Alumnos:
- ✅ Acceso a quizzes interactivos
- ✅ Respuestas en tiempo real
- ✅ Visualización de resultados

## 🛑 Para Detener la Aplicación

```bash
# Presiona Ctrl+C en la terminal, o ejecuta:
docker compose -f docker-compose-prod.yml down
```

## 📁 Archivos Incluidos

- `tutor-backend-v2.tar` - Imagen Docker del servidor backend (versión corregida)
- `tutor-frontend-v2.tar` - Imagen Docker de la aplicación web (versión corregida)
- `docker-compose-prod.yml` - Configuración para ejecutar los contenedores
- `.env` - Variables de entorno (debes crearlo tú)
- `env-ejemplo.txt` - Plantilla del archivo .env
- `README-PROFESORA.md` - Este archivo de instrucciones

## 🔧 Tecnologías Utilizadas

- **Frontend**: React.js con Tailwind CSS
- **Backend**: Node.js con Express.js
- **Base de Datos**: SQLite
- **IA**: Google Gemini para generación de preguntas
- **Contenedores**: Docker

## 📞 Soporte

Si tienes algún problema para ejecutar la aplicación, verifica que:
1. Docker Desktop esté ejecutándose
2. Las imágenes se cargaron correctamente
3. El archivo `.env` existe y tiene el contenido correcto
4. Los puertos 80 y 5000 estén disponibles

---

**Desarrollado por**: [Tu Nombre]
**Proyecto**: Tutor Inteligente - Sistema de Gestión Educativa
