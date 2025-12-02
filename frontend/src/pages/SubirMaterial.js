// frontend/src/pages/SubirMaterial.js - Subir archivos para generar quizzes (VERSIÓN MEJORADA)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { archivosAPI, materiasAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const SubirMaterial = () => {
  const [materias, setMaterias] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, isProfesor } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState({
    materiaId: '',
    archivo: null
  });

  // Estados para validación visual
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(false);
  const [archivoValido, setArchivoValido] = useState(false);

  // Cargar materias del profesor y archivos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar materias asignadas al profesor
      const materiasRes = await materiasAPI.getMisMaterias();
      setMaterias(materiasRes.data.materias);

      // Cargar archivos subidos
      const archivosRes = await archivosAPI.getArchivos();
      setArchivos(archivosRes.data.archivos);
      
      setError('');
    } catch (error) {
      setError('Error al cargar los datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [user.id]);

  // Manejar cambio en formulario
  const handleChange = (e) => {
    if (e.target.name === 'archivo') {
      const archivo = e.target.files[0];
      
      // Validar tipo de archivo en frontend
      if (archivo) {
        const extensionesPermitidas = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.rtf', '.odt'];
        const extension = '.' + archivo.name.split('.').pop().toLowerCase();
        
        if (!extensionesPermitidas.includes(extension)) {
          setError('Tipo de archivo no permitido. Solo se aceptan: PDF, PPT, DOC, TXT, RTF, ODT');
          setArchivoValido(false);
          setFormData({
            ...formData,
            archivo: null
          });
          e.target.value = ''; // Resetear input
          return;
        }
        
        // Verificar tamaño (10MB máximo)
        if (archivo.size > 10 * 1024 * 1024) {
          setError('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
          setArchivoValido(false);
          setFormData({
            ...formData,
            archivo: null
          });
          e.target.value = ''; // Resetear input
          return;
        }
        
        setArchivoValido(true);
        setError('');
      }
      
      setFormData({
        ...formData,
        archivo: archivo
      });
    } else {
      const value = e.target.value;
      setFormData({
        ...formData,
        [e.target.name]: value
      });
      
      // Actualizar estado de materia seleccionada
      if (e.target.name === 'materiaId') {
        setMateriaSeleccionada(!!value);
        if (value) {
          setError(''); // Limpiar error cuando se selecciona materia
        }
      }
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDACIÓN SECUENCIAL MEJORADA
    if (!formData.materiaId) {
      setError('Primero debes seleccionar una materia');
      return;
    }
    
    if (!formData.archivo) {
      setError('Debes seleccionar un archivo para subir');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const data = new FormData();
      data.append('materiaId', formData.materiaId);
      data.append('archivo', formData.archivo);

      await archivosAPI.subirArchivo(data);
      
      setSuccess('Archivo subido exitosamente. El contenido se está procesando...');
      setFormData({
        materiaId: '',
        archivo: null
      });
      setMateriaSeleccionada(false);
      setArchivoValido(false);
      
      // Recargar lista de archivos
      await cargarDatos();
      
      // Resetear el input de archivo
      document.getElementById('archivo').value = '';
      
    } catch (error) {
      setError(error.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar archivo
  const handleEliminarArchivo = async (archivoId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este archivo?\n\nEsta acción también eliminará cualquier quiz generado a partir de este archivo.')) {
      return;
    }

    try {
      setDeleting(archivoId);
      setError('');

      const response = await archivosAPI.eliminarArchivo(archivoId);
    
      setSuccess(response.data.mensaje || 'Archivo eliminado exitosamente');
      
      // Recargar lista de archivos
      await cargarDatos();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detalle || 
                          'Error al eliminar el archivo';
      setError(errorMessage);
      // Si es error de permisos, recargar datos por si cambió el estado
      if (error.response?.status === 403 || error.response?.status === 404) {
        await cargarDatos();
      }
    } finally {
      setDeleting(null);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener ícono según tipo de archivo
  const getFileIcon = (nombreArchivo) => {
    const extension = nombreArchivo.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return '📕';
    if (['ppt', 'pptx'].includes(extension)) return '📊';
    if (['doc', 'docx'].includes(extension)) return '📄';
    if (['txt'].includes(extension)) return '📝';
    if (['rtf', 'odt'].includes(extension)) return '📋';
    return '📁';
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
            <h1 className="text-2xl font-bold text-gray-800">Subir Material Educativo</h1>
            <p className="text-gray-600">
              Sube archivos de texto para generar quizzes automáticamente
            </p>
          </div>
        </div>
      </div>

      {/* Formulario de subida */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Subir Nuevo Archivo</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Indicador de progreso de validación */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Progreso de validación:</div>
            <div className="flex items-center space-x-2 text-xs">
              <span className={`px-2 py-1 rounded ${materiaSeleccionada ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                1. Materia {materiaSeleccionada ? '✓' : '...'}
              </span>
              <span className="text-gray-400">→</span>
              <span className={`px-2 py-1 rounded ${archivoValido ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                2. Archivo {archivoValido ? '✓' : '...'}
              </span>
              <span className="text-gray-400">→</span>
              <span className={`px-2 py-1 rounded ${materiaSeleccionada && archivoValido ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                3. Listo para subir
              </span>
            </div>
          </div>

          {/* Materia - Con indicador visual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materia *
              {materiaSeleccionada && (
                <span className="ml-2 text-green-600 text-xs">✓ Seleccionada</span>
              )}
            </label>
            <select
              name="materiaId"
              value={formData.materiaId}
              onChange={handleChange}
              required
              disabled={uploading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                materiaSeleccionada ? 'border-green-500 bg-green-50' : 'border-gray-300'
              }`}
            >
              <option value="">Selecciona una materia</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre}
                </option>
              ))}
            </select>
            {materias.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No tienes materias asignadas. Contacta al coordinador.
              </p>
            )}
          </div>

          {/* Archivo - Con indicador visual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo *
              {archivoValido && (
                <span className="ml-2 text-green-600 text-xs">✓ Válido</span>
              )}
            </label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition duration-200 ${
                archivoValido 
                  ? 'border-green-500 bg-green-50 hover:bg-green-100' 
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className="text-4xl mb-2">📤</span>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, PPT, DOC, TXT, RTF, ODT (Máx. 10MB)
                  </p>
                </div>
                <input
                  id="archivo"
                  name="archivo"
                  type="file"
                  onChange={handleChange}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.rtf,.odt"
                  required
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
            {formData.archivo && (
              <div className={`mt-2 p-3 rounded-lg ${
                archivoValido ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <span className={`mr-2 ${archivoValido ? 'text-green-600' : 'text-red-600'}`}>
                    {archivoValido ? '✓' : '⚠'}
                  </span>
                  <span className={`text-sm font-medium ${archivoValido ? 'text-green-800' : 'text-red-800'}`}>
                    Archivo seleccionado: {formData.archivo.name}
                    {!archivoValido && ' - Formato no válido'}
                  </span>
                </div>
              </div>
            )}
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

          {/* Botón de envío - Mejorado con validación visual */}
          <button
            type="submit"
            disabled={uploading || materias.length === 0 || !materiaSeleccionada || !archivoValido}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center"
          >
            {uploading ? (
              <LoadingSpinner size="small" text="Subiendo archivo..." />
            ) : (
              <>
                <span>📤</span>
                <span className="ml-2">Subir Archivo y Procesar</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Resto del componente se mantiene igual */}
      {/* Lista de archivos subidos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Archivos Subidos</h2>
          <p className="text-gray-600">Tu historial de material educativo</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            {archivos.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Subida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {archivos.map((archivo) => (
                    <tr key={archivo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {getFileIcon(archivo.nombre_original)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {archivo.nombre_original}
                            </div>
                            <div className="text-sm text-gray-500">
                              {archivo.nombre_original.split('.').pop()?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {archivo.materia_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(archivo.fecha_subida)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {deleting === archivo.id ? (
                          <LoadingSpinner size="small" text="" />
                        ) : (
                          <button
                            onClick={() => handleEliminarArchivo(archivo.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            disabled={deleting}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📁</div>
                <p className="text-gray-500">No has subido archivos aún</p>
                <p className="text-gray-400 text-sm mt-2">
                  Sube tu primer archivo para comenzar a generar quizzes
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información adicional - Actualizada */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Información Importante</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• <strong>Formatos permitidos:</strong> PDF, PPT, DOC, DOCX, TXT, RTF, ODT</li>
          <li>• <strong>Tamaño máximo:</strong> 10MB por archivo</li>
          <li>• <strong>Proceso secuencial:</strong> Primero selecciona materia, luego el archivo</li>
          <li>• <strong>Validación de contenido:</strong> El sistema rechazará archivos vacíos</li>
          <li>• El sistema extraerá automáticamente el contenido para generar quizzes</li>
          <li>• Después de subir el archivo, podrás generar quizzes en la siguiente sección</li>
          <li>• Puedes eliminar archivos en cualquier momento desde la lista</li>
        </ul>
      </div>
    </div>
  );
};

export default SubirMaterial;