// frontend/src/services/api.js - Cliente HTTP para el back-end (VERSIÓN CORREGIDA)

import axios from 'axios';

// Configurar la base URL de tu API
const API_BASE_URL = '/api';

// Crear instancia de axios CON interceptores funcionales
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Interceptor para manejar errores globalmente (RESTAURADO)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación (VERSIÓN SIMPLIFICADA Y FUNCIONAL)
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('🔐 Enviando login a:', `${API_BASE_URL}/auth/login`);
      
      // Usar axios directamente SIN la instancia con interceptores problemáticos
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
        timeout: 10000,
      });
      
      console.log('✅ Login exitoso:', response.data);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.log('❌ Error en login:', error);
      
      // El backend está enviando los errores correctamente, capturémoslos directamente
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        console.log('📨 Datos de error del backend:', errorData);
        
        return { 
          success: false, 
          error: errorData.error || 'Credenciales inválidas',
          campo: errorData.campo || 'ambos'
        };
      }
      
      // Error de conexión
      if (error.code === 'ECONNABORTED' || !error.response) {
        return { 
          success: false, 
          error: 'No se pudo conectar con el servidor',
          campo: 'sistema'
        };
      }
      
      // Error genérico
      return { 
        success: false, 
        error: 'Error desconocido',
        campo: 'sistema'
      };
    }
  },
};

// Para el resto de las APIs, usar la instancia normal con token
export const usersAPI = {
  getProfesores: () => api.get('/users/profesores'),
  crearProfesor: (profesorData) => api.post('/users/profesores', profesorData),
  toggleProfesorActivo: (id, activo) => 
    api.patch(`/users/profesores/${id}/toggle`, { activo }),
  actualizarPerfil: (perfilData) => api.put('/users/perfil', perfilData),
  cambiarContraseña: (passwordData) => api.put('/users/cambiar-contraseña', passwordData),
  cambiarContraseñaProfesor: (profesorId, nuevaContraseña) => {
    console.log('🔗 Llamando API cambiarContraseñaProfesor:', { profesorId, nuevaContraseña: '***' });
    return api.put(`/users/profesores/${profesorId}/reset-password`, { 
      nuevaContraseña 
    });
  },
  exportarDatos: () => api.get('/users/exportar-datos', { responseType: 'blob' }),
};

export const materiasAPI = {
  getMaterias: () => api.get('/materias'),
  getMisMaterias: () => api.get('/materias/mis-materias'),
  getMateriasPorProfesor: (profesorId) => 
    api.get(`/materias/profesor/${profesorId}`),
  asignarMateria: (data) => api.post('/materias/asignar', data),
  quitarMateria: (data) => api.delete('/materias/quitar', { data }),
  crearMateria: (data) => api.post('/materias', data)
};

export const archivosAPI = {
  getArchivos: () => api.get('/archivos'),
  subirArchivo: (formData) => 
    api.post('/archivos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  eliminarArchivo: (id) => api.delete(`/archivos/${id}`),
};

export const quizzesAPI = {
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  generarQuiz: (data) => api.post('/quizzes/generar', data),
  descargarPDFExamen: (id) => 
    api.get(`/quizzes/${id}/pdf/examen`, { responseType: 'blob' }),
  descargarPDFRespuestas: (id) => 
    api.get(`/quizzes/${id}/pdf/respuestas`, { responseType: 'blob' }),
};

export const metricsAPI = {
  getMetricasGenerales: () => api.get('/metrics/generales'),
  getMetricasProfesor: (profesorId) => 
    api.get(`/metrics/profesor/${profesorId}`),
  getReporteUso: (periodo = '30dias') => 
    api.get(`/metrics/reporte-uso?periodo=${periodo}`),
};

export default api;