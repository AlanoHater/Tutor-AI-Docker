// frontend/src/pages/Dashboard.js - VERSIÓN ACTUALIZADA CON "MIS MATERIAS"

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { metricsAPI, usersAPI, materiasAPI, archivosAPI, quizzesAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalArchivos: 0,
    totalMaterias: 0,
    totalProfesores: 0,
    profesoresActivos: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, isCoordinador, isProfesor } = useAuth();

  // Cargar estadísticas en tiempo real
  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      if (isCoordinador()) {
        // Para coordinador: cargar datos globales del sistema
        const [metricasRes, profesoresRes, materiasRes] = await Promise.all([
          metricsAPI.getMetricasGenerales(),
          usersAPI.getProfesores(),
          materiasAPI.getMaterias()
        ]);

        const metricas = metricasRes.data.metricasGenerales;
        const profesores = profesoresRes.data.profesores;
        
        setStats({
          totalQuizzes: metricas.totalQuizzes || 0,
          totalArchivos: metricas.totalArchivos || 0,
          totalMaterias: materiasRes.data.materias.length || 0,
          totalProfesores: metricas.totalProfesores || 0,
          profesoresActivos: metricas.profesoresActivos || 0
        });
        
      } else if (isProfesor()) {
        // Para profesor: cargar datos personales
        const [archivosRes, quizzesRes, materiasRes] = await Promise.all([
          archivosAPI.getArchivos(),
          quizzesAPI.getQuizzes(),
          materiasAPI.getMisMaterias() // NUEVO: Obtener materias del profesor
        ]);

        setStats({
          totalQuizzes: quizzesRes.data.quizzes.length || 0,
          totalArchivos: archivosRes.data.archivos.length || 0,
          totalMaterias: materiasRes.data.materias.length || 0, // NUEVO: Contar materias
          totalProfesores: 0, // No aplica para profesor
          profesoresActivos: 0 // No aplica para profesor
        });
      }
      
      setError('');
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [isCoordinador, isProfesor]);

  // Recargar datos cada 30 segundos (simula tiempo real)
  useEffect(() => {
    const intervalo = setInterval(() => {
      cargarEstadisticas();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalo);
  }, []);

  const statsCoordinador = [
    {
      title: 'Quizzes Generados',
      value: stats.totalQuizzes,
      description: 'Total de quizzes creados por todos los profesores',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      title: 'Archivos Subidos',
      value: stats.totalArchivos,
      description: 'Total de archivos subidos por todos los profesores',
      icon: '📁',
      color: 'bg-green-500'
    },
    {
      title: 'Materias Activas',
      value: stats.totalMaterias,
      description: 'Materias activas en el sistema',
      icon: '📚',
      color: 'bg-purple-500'
    },
    {
      title: 'Profesores Activos',
      value: stats.profesoresActivos,
      description: 'Profesores activos en el sistema',
      icon: '👨‍🏫',
      color: 'bg-orange-500'
    }
  ];

  const statsProfesor = [
    {
      title: 'Mis Quizzes',
      value: stats.totalQuizzes,
      description: 'Quizzes que he generado',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      title: 'Mis Archivos',
      value: stats.totalArchivos,
      description: 'Archivos que he subido',
      icon: '📁',
      color: 'bg-green-500'
    },
    // NUEVO: Estadística de materias para profesores
    {
      title: 'Mis Materias',
      value: stats.totalMaterias,
      description: 'Materias que tengo asignadas',
      icon: '📚',
      color: 'bg-purple-500'
    }
  ];

  const statsActuales = isCoordinador() ? statsCoordinador : statsProfesor;

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ¡Bienvenido, {user?.nombre}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {isCoordinador() 
            ? 'Panel de control del coordinador - Gestiona profesores, materias y visualiza métricas.'
            : 'Panel del profesor - Genera quizzes y gestiona tu material educativo.'
          }
        </p>
      </div>

      {/* Mensaje de error */}
      {error && <ErrorMessage message={error} onRetry={cargarEstadisticas} />}

      {/* Estadísticas */}
      {loading ? (
        <LoadingSpinner text="Cargando estadísticas..." />
      ) : (
        <div className={`grid grid-cols-1 ${isCoordinador() ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
          {statsActuales.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center ml-4`}>
                  <span className="text-white text-xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional para coordinador */}
      {isCoordinador() && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <span className="text-blue-600 text-xl mr-3">💡</span>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Resumen del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Total de profesores:</span> {stats.totalProfesores}
                </div>
                <div>
                  <span className="font-medium">Profesores activos:</span> {stats.profesoresActivos}
                </div>
                <div>
                  <span className="font-medium">Porcentaje de actividad:</span>{' '}
                  {stats.totalProfesores > 0 
                    ? Math.round((stats.profesoresActivos / stats.totalProfesores) * 100) 
                    : 0
                  }%
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Los datos se actualizan automáticamente cada 30 segundos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional para profesor */}
      {isProfesor() && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start">
            <span className="text-green-600 text-xl mr-3">🚀</span>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Próximos Pasos</h3>
              <ul className="text-green-700 space-y-1 text-sm">
                <li>• Sube material educativo para generar quizzes automáticamente</li>
                <li>• Revisa tu historial de quizzes generados</li>
                <li>• Descarga exámenes y respuestas en formato PDF</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;