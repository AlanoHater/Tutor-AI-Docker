// frontend/src/pages/GenerarQuiz.js - VERSIÓN CORREGIDA CON MEJOR MANEJO DE ERRORES

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { archivosAPI, quizzesAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const GenerarQuiz = () => {
  const [archivos, setArchivos] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, isProfesor } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState({
    archivoId: '',
    tipoPreguntas: 'opcion_multiple',
    cantidadPreguntas: 5
  });

  // Estado para el quiz generado
  const [quizGenerado, setQuizGenerado] = useState(null);
  const [mostrarQuiz, setMostrarQuiz] = useState(false);

  // Cargar archivos del profesor
  const cargarDatos = async () => {
    try {
      // Cargar archivos subidos
      const archivosRes = await archivosAPI.getArchivos();
      setArchivos(archivosRes.data.archivos);
      setError('');
    } catch (error) {
      console.error('Error cargando archivos:', error);
      // No mostrar error fatal, solo log
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [user.id]);

  // Manejar cambio en formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Generar quiz
  const handleGenerarQuiz = async (e) => {
    e.preventDefault();
    
    if (!formData.archivoId) {
      setError('Por favor selecciona un archivo');
      return;
    }

    try {
      setGenerando(true);
      setError('');
      setSuccess('');
      setQuizGenerado(null);
      setMostrarQuiz(false);

      console.log('Enviando datos para generar quiz:', formData);

      // Usar fetch directamente para ver la respuesta completa
      const response = await fetch('http://localhost:5000/api/quizzes/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Respuesta HTTP:', response.status, response.statusText);

      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      
      const quiz = data.quiz;
      
      setQuizGenerado(quiz);
      setSuccess(`¡Quiz generado exitosamente! Se crearon ${quiz.cantidadPreguntas} preguntas.`);
      
      // Recargar datos para actualizar estadísticas
      await cargarDatos();
      
    } catch (error) {
      console.error('Error completo al generar quiz:', error);
      
      // Mostrar error específico
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica que el servidor esté corriendo en http://localhost:5000');
      } else {
        setError(error.message);
      }
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarPDFExamen = async (quizId) => {
    try {
      setError('');
      console.log(`Descargando PDF examen para quiz ID: ${quizId}`);
    
      const response = await quizzesAPI.descargarPDFExamen(quizId);
    
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Respuesta inválida del servidor');
      }
    
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
    
      const nombreSeguro = `examen-${quizGenerado.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf`;
      link.download = nombreSeguro;
    
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    } catch (error) {
      console.error('Error descargando PDF examen:', error);
      setError('Error al descargar el PDF del examen. Intenta de nuevo.');
    }
  };

  // En GenerarQuiz.js, en la función handleDescargarPDFRespuestas:

  const handleDescargarPDFRespuestas = async (quizId) => {
    try {
      setError('');
      console.log(`Descargando PDF respuestas para quiz ID: ${quizId}`);
    
      const response = await quizzesAPI.descargarPDFRespuestas(quizId);
    
      // Verificar si es un blob válido
      if (!(response.data instanceof Blob)) {
        throw new Error('El servidor no devolvió un archivo PDF válido');
      }
    
      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
    
      // Nombre de archivo seguro
      const nombreSeguro = `respuestas-${quizGenerado.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf`;
      link.download = nombreSeguro;
    
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    
      // Liberar memoria
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
      console.log('✅ PDF descargado exitosamente');
    
    } catch (error) {
      console.error('❌ Error descargando PDF respuestas:', error);
      console.error('Respuesta completa:', error.response);
    
      if (error.response?.data) {
        // Si el servidor devolvió un error JSON
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const errorData = JSON.parse(reader.result);
            setError(`Error: ${errorData.error || errorData.detalle || 'Error desconocido'}`);
          };
          reader.readAsText(error.response.data);
        } catch (e) {
          setError('Error al descargar el PDF de respuestas. Verifica la consola para más detalles.');
        }
      } else {
        setError('Error de conexión. Verifica que el servidor esté funcionando.');
      }
    }
  };

  // Formatear tipo de preguntas para mostrar
  const formatearTipoPreguntas = (tipo) => {
    const tipos = {
      'opcion_multiple': 'Opción Múltiple',
      'verdadero_falso': 'Verdadero/Falso',
      'preguntas_abiertas': 'Preguntas Abiertas'
    };
    return tipos[tipo] || tipo;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Generar Quiz</h1>
            <p className="text-gray-600">
              Crea quizzes automáticamente a partir de tus archivos subidos
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de generación */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Configurar Quiz</h2>
        
        <form onSubmit={handleGenerarQuiz} className="space-y-6">
          {/* Archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de Origen *
            </label>
            <select
              name="archivoId"
              value={formData.archivoId}
              onChange={handleChange}
              required
              disabled={generando}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Selecciona un archivo</option>
              {archivos.map((archivo) => (
                <option key={archivo.id} value={archivo.id}>
                  {archivo.nombre_original} - {archivo.materia_nombre}
                </option>
              ))}
            </select>
            {archivos.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No tienes archivos subidos. Primero sube un archivo en la sección "Subir Material".
              </p>
            )}
          </div>

          {/* Tipo de preguntas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Preguntas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'opcion_multiple', label: 'Opción Múltiple', icon: '🔘' },
                { value: 'verdadero_falso', label: 'Verdadero/Falso', icon: '✅' },
                { value: 'preguntas_abiertas', label: 'Preguntas Abiertas', icon: '📝' }
              ].map((tipo) => (
                <label
                  key={tipo.value}
                  className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition duration-200 ${
                    formData.tipoPreguntas === tipo.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoPreguntas"
                    value={tipo.value}
                    checked={formData.tipoPreguntas === tipo.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="text-2xl mb-2">{tipo.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{tipo.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cantidad de preguntas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad de Preguntas: <span className="font-bold">{formData.cantidadPreguntas}</span>
            </label>
            <input
              type="range"
              name="cantidadPreguntas"
              min="1"
              max="20"
              value={formData.cantidadPreguntas}
              onChange={handleChange}
              disabled={generando}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          {/* Mensajes */}
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {/* Botón de generación */}
          <button
            type="submit"
            disabled={generando || archivos.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center"
          >
            {generando ? (
              <LoadingSpinner size="small" text="Generando quiz..." />
            ) : (
              '🎯 Generar Quiz Automáticamente'
            )}
          </button>
        </form>
      </div>

      {/* Quiz Generado */}
      {quizGenerado && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Quiz Generado</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setMostrarQuiz(!mostrarQuiz)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                {mostrarQuiz ? 'Ocultar' : 'Ver Preguntas'}
              </button>
              <button
                onClick={() => handleDescargarPDFExamen(quizGenerado.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                📥 Descargar Examen
              </button>
              <button
                onClick={() => handleDescargarPDFRespuestas(quizGenerado.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                📥 Descargar Respuestas
              </button>
            </div>
          </div>

          {/* Información del quiz */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-600 font-semibold">Título</div>
              <div className="text-gray-800">{quizGenerado.titulo}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-600 font-semibold">Tipo</div>
              <div className="text-gray-800">{formatearTipoPreguntas(quizGenerado.tipoPreguntas)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-600 font-semibold">Preguntas</div>
              <div className="text-gray-800">{quizGenerado.cantidadPreguntas}</div>
            </div>
          </div>

          {/* Preguntas generadas */}
          {mostrarQuiz && quizGenerado.preguntas && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preguntas Generadas</h3>
              <div className="space-y-6">
                {quizGenerado.preguntas.map((pregunta, index) => (
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
                    
                    {pregunta.tipo === 'preguntas_abiertas' && (
                      <div className="ml-8">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          {pregunta.respuesta ? (
                            <>
                              <div className="text-yellow-800 font-medium mb-2">Respuesta esperada:</div>
                              <div className="text-yellow-700 text-sm">{pregunta.respuesta}</div>
                            </>
                          ) : (
                            <div className="text-yellow-700 text-sm">
                              Esta es una pregunta abierta. Evalúe la respuesta del estudiante según la profundidad y precisión del análisis.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Cómo funciona</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• Selecciona un archivo que hayas subido previamente</li>
          <li>• Elige el tipo de preguntas que deseas generar</li>
          <li>• Ajusta la cantidad de preguntas (1-20)</li>
          <li>• El sistema generará automáticamente el quiz basado en el contenido del archivo</li>
          <li>• Puedes descargar el examen para estudiantes y la versión con respuestas para ti</li>
          <li className="text-blue-600 font-medium">• Para preguntas abiertas, el PDF de respuestas incluirá puntos clave para evaluar</li>
        </ul>
      </div>
    </div>
  );
};

export default GenerarQuiz;