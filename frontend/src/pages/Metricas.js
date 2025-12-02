// frontend/src/pages/Metricas.js - Dashboard de métricas para coordinadores

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { metricsAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const Metricas = () => {
  const [metricasGenerales, setMetricasGenerales] = useState(null);
  const [reporteUso, setReporteUso] = useState(null);
  const [topProfesores, setTopProfesores] = useState([]);
  const [periodo, setPeriodo] = useState('30dias');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isCoordinador } = useAuth();

  // Cargar métricas
  const cargarMetricas = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [generalesRes, reporteRes, profesoresRes] = await Promise.all([
        metricsAPI.getMetricasGenerales(),
        metricsAPI.getReporteUso(periodo),
        usersAPI.getProfesores()
      ]);

      setMetricasGenerales(generalesRes.data);
      setReporteUso(reporteRes.data);
      
      // Filtrar y ordenar profesores activos
      const profesoresActivos = profesoresRes.data.profesores
        .filter(p => p.activo)
        .slice(0, 10); // Top 10
      setTopProfesores(profesoresActivos);
      
      setError('');
    } catch (error) {
      setError('Error al cargar las métricas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCoordinador()) {
      cargarMetricas();
    }
  }, [periodo, isCoordinador]);

  // Manejar cambio de período
  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
  };

  // Formatear número
  const formatearNumero = (num) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  // Calcular porcentaje
  const calcularPorcentaje = (valor, total) => {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  };

  if (!isCoordinador()) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <ErrorMessage message="No tienes permisos para acceder a esta sección" />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Cargando métricas del sistema..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard de Métricas</h1>
            <p className="text-gray-600">
              Estadísticas y reportes de uso del sistema
            </p>
          </div>
          
          {/* Selector de período */}
          <div className="flex space-x-2">
            {[
              { value: '7dias', label: '7 días' },
              { value: '30dias', label: '30 días' },
              { value: '90dias', label: '90 días' }
            ].map((opcion) => (
              <button
                key={opcion.value}
                onClick={() => handlePeriodoChange(opcion.value)}
                className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                  periodo === opcion.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {opcion.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && <ErrorMessage message={error} onRetry={cargarMetricas} />}

      {/* Métricas Generales */}
      {metricasGenerales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Profesores */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Profesores</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatearNumero(metricasGenerales.metricasGenerales.totalProfesores)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-green-600 font-medium">
                    {metricasGenerales.metricasGenerales.profesoresActivos} activos
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    {metricasGenerales.metricasGenerales.porcentajeActivos}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">👨‍🏫</span>
              </div>
            </div>
          </div>

          {/* Total de Quizzes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quizzes Generados</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatearNumero(metricasGenerales.metricasGenerales.totalQuizzes)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {metricasGenerales.metricasGenerales.promedioQuizzesPorProfesor} por profesor
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📝</span>
              </div>
            </div>
          </div>

          {/* Total de Archivos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archivos Subidos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatearNumero(metricasGenerales.metricasGenerales.totalArchivos)}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-500">
                    Material educativo procesado
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📁</span>
              </div>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado del Sistema</p>
                <p className="text-2xl font-bold text-gray-900 mt-2 capitalize">
                  {metricasGenerales.resumen.estado.toLowerCase()}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    metricasGenerales.resumen.nivelUso === 'Alto' 
                      ? 'text-green-600'
                      : metricasGenerales.resumen.nivelUso === 'Medio'
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}>
                    {metricasGenerales.resumen.nivelUso} uso
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Uso y Top Profesores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del Período */}
        {reporteUso && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Resumen del Período ({periodo === '7dias' ? '7 días' : periodo === '90dias' ? '90 días' : '30 días'})
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 font-semibold">Archivos Subidos</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {formatearNumero(reporteUso.resumen.totalArchivos)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {reporteUso.resumen.promedioDiarioArchivos} por día
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 font-semibold">Quizzes Generados</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {formatearNumero(reporteUso.resumen.totalQuizzes)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {reporteUso.resumen.promedioDiarioQuizzes} por día
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Top Profesores */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Profesores Activos</h2>
          
          {topProfesores.length > 0 ? (
            <div className="space-y-3">
              {topProfesores.map((profesor, index) => (
                <div key={profesor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">
                          {profesor.nombre.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {profesor.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profesor.usuario}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {profesor.carrera}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👨‍🏫</div>
              <p className="text-gray-500">No hay profesores activos</p>
            </div>
          )}
        </div>
      </div>

      {/* Uso por Materia */}
      {metricasGenerales && metricasGenerales.usoPorMateria && metricasGenerales.usoPorMateria.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Uso por Materia</h2>
          
          <div className="space-y-3">
            {metricasGenerales.usoPorMateria
              .filter(materia => materia.total_archivos > 0)
              .slice(0, 5) // Top 5 materias
              .map((materia, index) => (
                <div key={materia.materia} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-lg">{index + 1}.</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {materia.materia}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${calcularPorcentaje(materia.total_archivos, metricasGenerales.metricasGenerales.totalArchivos)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {materia.total_archivos} archivos
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Distribución de Quizzes */}
      {metricasGenerales && metricasGenerales.distribucionQuizzes && metricasGenerales.distribucionQuizzes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Distribución de Quizzes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metricasGenerales.distribucionQuizzes.map((tipo) => (
              <div key={tipo.tipo_preguntas} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {tipo.tipo_preguntas.replace('_', ' ')}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {tipo.total}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {calcularPorcentaje(tipo.total, metricasGenerales.metricasGenerales.totalQuizzes)}% del total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📈 Acerca de estas métricas</h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• Las métricas se actualizan en tiempo real según la actividad del sistema</li>
          <li>• Puedes cambiar el período de análisis usando los botones superiores</li>
          <li>• Los datos incluyen todos los profesores, materias y quizzes del sistema</li>
          <li>• El "nivel de uso" se calcula basado en la actividad promedio diaria</li>
        </ul>
      </div>
    </div>
  );
};

export default Metricas;