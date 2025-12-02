// frontend/src/pages/HistorialQuizzes.js - VERSIÓN MEJORADA CON DISEÑO RESPONSIVE

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { quizzesAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const HistorialQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizSeleccionado, setQuizSeleccionado] = useState(null);
  const { isProfesor } = useAuth();

  // Cargar quizzes del usuario
  const cargarQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizzesAPI.getQuizzes();
      setQuizzes(response.data.quizzes);
      setError('');
    } catch (error) {
      setError('Error al cargar el historial de quizzes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarQuizzes();
  }, []);

  // Descargar PDF del examen
  const handleDescargarPDFExamen = async (quizId, titulo) => {
    try {
      const response = await quizzesAPI.descargarPDFExamen(quizId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `examen-${titulo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      setError('Error al descargar el PDF del examen');
    }
  };

  // Descargar PDF de respuestas
  const handleDescargarPDFRespuestas = async (quizId, titulo) => {
    try {
      const response = await quizzesAPI.descargarPDFRespuestas(quizId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `respuestas-${titulo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      setError('Error al descargar el PDF de respuestas');
    }
  };

  // Ver detalles del quiz
  const verDetallesQuiz = async (quizId) => {
    try {
      const response = await quizzesAPI.getQuiz(quizId);
      setQuizSeleccionado(response.data.quiz);
    } catch (error) {
      setError('Error al cargar los detalles del quiz');
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear tipo de preguntas
  const formatearTipoPreguntas = (tipo) => {
    const tipos = {
      'opcion_multiple': 'Opción Múltiple',
      'verdadero_falso': 'V/F',
      'preguntas_abiertas': 'Abiertas'
    };
    return tipos[tipo] || tipo;
  };

  // Obtener ícono según tipo de quiz
  const getQuizIcon = (tipoPreguntas) => {
    const icons = {
      'opcion_multiple': '🔘',
      'verdadero_falso': '✅',
      'preguntas_abiertas': '📝'
    };
    return icons[tipoPreguntas] || '🎯';
  };

  // Obtener color según tipo de quiz
  const getQuizColor = (tipoPreguntas) => {
    const colors = {
      'opcion_multiple': 'blue',
      'verdadero_falso': 'green', 
      'preguntas_abiertas': 'purple'
    };
    return colors[tipoPreguntas] || 'gray';
  };

  if (!isProfesor()) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <ErrorMessage message="No tienes permisos para acceder a esta sección" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historial de Quizzes</h1>
            <p className="text-gray-600">
              Revisa y gestiona todos los quizzes que has generado
            </p>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
            Total: <span className="font-semibold">{quizzes.length}</span> quizzes
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && <ErrorMessage message={error} onRetry={cargarQuizzes} />}

      {/* Lista de quizzes - VERSIÓN RESPONSIVE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : quizzes.length > 0 ? (
          <div className="overflow-hidden">
            {/* Versión Desktop - Tabla */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      {/* Ícono */}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Quiz
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Materia
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Pregs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-xl">
                          {getQuizIcon(quiz.tipo_preguntas)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {quiz.titulo}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            Archivo: {quiz.archivo_nombre}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="line-clamp-2">{quiz.materia_nombre}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getQuizColor(quiz.tipo_preguntas)}-100 text-${getQuizColor(quiz.tipo_preguntas)}-800`}>
                          {formatearTipoPreguntas(quiz.tipo_preguntas)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium text-center">
                        {quiz.cantidad_preguntas}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatearFecha(quiz.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => verDetallesQuiz(quiz.id)}
                            className="text-blue-600 hover:text-blue-900 text-sm text-left"
                          >
                            Ver detalles
                          </button>
                          <button
                            onClick={() => handleDescargarPDFExamen(quiz.id, quiz.titulo)}
                            className="text-green-600 hover:text-green-900 text-sm text-left"
                          >
                            Descargar examen
                          </button>
                          <button
                            onClick={() => handleDescargarPDFRespuestas(quiz.id, quiz.titulo)}
                            className="text-purple-600 hover:text-purple-900 text-sm text-left"
                          >
                            Descargar respuestas
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Versión Mobile - Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getQuizIcon(quiz.tipo_preguntas)}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {quiz.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {quiz.materia_nombre}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${getQuizColor(quiz.tipo_preguntas)}-100 text-${getQuizColor(quiz.tipo_preguntas)}-800`}>
                      {formatearTipoPreguntas(quiz.tipo_preguntas)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">{quiz.cantidad_preguntas}</span> preguntas
                    </div>
                    <div className="text-right">
                      {formatearFecha(quiz.fecha_creacion)}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Archivo: {quiz.archivo_nombre}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => verDetallesQuiz(quiz.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleDescargarPDFExamen(quiz.id, quiz.titulo)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
                    >
                      Examen
                    </button>
                    <button
                      onClick={() => handleDescargarPDFRespuestas(quiz.id, quiz.titulo)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
                    >
                      Respuestas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-500">No has generado quizzes aún</p>
            <p className="text-gray-400 text-sm mt-2">
              Ve a la sección "Generar Quiz" para crear tu primer examen
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles del quiz (se mantiene igual) */}
      {quizSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalles del Quiz</h2>
              <button
                onClick={() => setQuizSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Información del quiz */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-semibold">Título</div>
                <div className="text-gray-800">{quizSeleccionado.titulo}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-semibold">Materia</div>
                <div className="text-gray-800">{quizSeleccionado.materia_nombre}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-semibold">Archivo Origen</div>
                <div className="text-gray-800">{quizSeleccionado.archivo_nombre}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-yellow-600 font-semibold">Tipo de Preguntas</div>
                <div className="text-gray-800">{formatearTipoPreguntas(quizSeleccionado.tipo_preguntas)}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-indigo-600 font-semibold">Total de Preguntas</div>
                <div className="text-gray-800">{quizSeleccionado.cantidad_preguntas}</div>
              </div>
            </div>

            {/* Preguntas */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Preguntas ({quizSeleccionado.preguntas?.length || 0})
              </h3>
              
              {quizSeleccionado.preguntas && quizSeleccionado.preguntas.length > 0 ? (
                <div className="space-y-4">
                  {quizSeleccionado.preguntas.map((pregunta, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start mb-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <p className="text-gray-800 font-medium flex-1">{pregunta.texto}</p>
                      </div>
                      
                      {pregunta.tipo === 'opcion_multiple' && pregunta.opciones && (
                        <div className="ml-8 space-y-2">
                          {pregunta.opciones.map((opcion, opcionIndex) => {
                            const letra = String.fromCharCode(65 + opcionIndex);
                            const esRespuesta = letra === pregunta.respuesta;
                            return (
                              <div
                                key={opcionIndex}
                                className={`flex items-center p-2 rounded ${
                                  esRespuesta
                                    ? 'bg-green-100 border border-green-200'
                                    : 'bg-gray-50'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 flex items-center justify-center rounded text-sm font-medium mr-3 ${
                                    esRespuesta
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  {letra}
                                </span>
                                <span className={esRespuesta ? 'text-green-800 font-medium' : 'text-gray-700'}>
                                  {opcion}
                                  {esRespuesta && <span className="ml-2 text-green-600">✓</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {pregunta.tipo === 'verdadero_falso' && (
                        <div className="ml-8">
                          <div className="bg-gray-50 p-3 rounded">
                            <span className="font-medium text-gray-700">
                              Respuesta correcta: {pregunta.respuesta}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {pregunta.tipo === 'preguntas_abiertas' && pregunta.puntosClave && (
                        <div className="ml-8">
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                            <div className="text-yellow-800 font-medium mb-2">Puntos clave a evaluar:</div>
                            <div className="text-yellow-700 text-sm">{pregunta.puntosClave}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay preguntas para mostrar</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => handleDescargarPDFExamen(quizSeleccionado.id, quizSeleccionado.titulo)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                📥 Descargar Examen
              </button>
              <button
                onClick={() => handleDescargarPDFRespuestas(quizSeleccionado.id, quizSeleccionado.titulo)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                📥 Descargar Respuestas
              </button>
              <button
                onClick={() => setQuizSeleccionado(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialQuizzes;