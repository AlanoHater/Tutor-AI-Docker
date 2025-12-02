// frontend/src/pages/Configuracion.js - Configuración del usuario y sistema (VERSIÓN CORREGIDA)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const Configuracion = () => {
  const { user, updateUser, isCoordinador } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Estado del formulario de perfil
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    correo: '',
    carrera: ''
  });

  // Estado para gestión de contraseñas de profesores (solo coordinador)
  const [profesores, setProfesores] = useState([]);
  const [profesorData, setProfesorData] = useState({
    profesorId: '',
    nuevaContraseña: '',
    confirmarContraseña: ''
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      setPerfilData({
        nombre: user.nombre || '',
        correo: user.correo || '',
        carrera: user.carrera || 'Licenciatura'
      });
    }
  }, [user]);

  // Cargar profesores cuando se active la pestaña de seguridad (solo coordinador)
  useEffect(() => {
    if (isCoordinador() && activeTab === 'seguridad') {
      cargarProfesores();
    }
  }, [activeTab, isCoordinador]);

  // Función para cargar profesores
  const cargarProfesores = async () => {
    try {
      const response = await usersAPI.getProfesores();
      const profesoresActivos = response.data.profesores.filter(p => p.activo);
      
      console.log('📋 Profesores cargados:', profesoresActivos.map(p => ({
        id: p.id,
        tipoId: typeof p.id,
        nombre: p.nombre,
        activo: p.activo
      })));
      
      setProfesores(profesoresActivos);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      setError('Error al cargar la lista de profesores');
    }
  };

  // Manejar cambio en formulario de perfil
  const handlePerfilChange = (e) => {
    setPerfilData({
      ...perfilData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar cambio en formulario de profesor
  const handleProfesorChange = (e) => {
    setProfesorData({
      ...profesorData,
      [e.target.name]: e.target.value
    });
  };

  // Guardar perfil (FUNCIONALIDAD REAL)
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.actualizarPerfil(perfilData);
      
      // Actualizar el contexto de autenticación con los nuevos datos
      if (updateUser) {
        updateUser(response.data.usuario);
      }
      
      setSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setError(error.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña de profesor - VERSIÓN CON MEJOR DEBUGGING DEL ID
  const handleCambiarContraseñaProfesor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('🔄 INICIANDO CAMBIO DE CONTRASEÑA...');
    console.log('📋 Datos del formulario:', profesorData);

    // Validaciones
    if (!profesorData.profesorId) {
      console.log('❌ Error: No se seleccionó profesor');
      setError('Debes seleccionar un profesor');
      setLoading(false);
      return;
    }

    if (profesorData.nuevaContraseña.length < 6) {
      console.log('❌ Error: Contraseña muy corta');
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (profesorData.nuevaContraseña !== profesorData.confirmarContraseña) {
      console.log('❌ Error: Contraseñas no coinciden');
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Enviando petición al backend...');
      console.log('🔗 URL:', `/api/users/profesores/${profesorData.profesorId}/cambiar-contraseña`);
      console.log('📦 Datos enviados:', { nuevaContraseña: '***' });
            
      // Encontrar el profesor seleccionado para debugging
      //const profesorSeleccionado = profesores.find(p => p.id === parseInt(profesorData.profesorId));
      //console.log('👨‍🏫 Profesor seleccionado:', {
        //id: profesorData.profesorId,
        //tipoId: typeof profesorData.profesorId,
        //profesor: profesorSeleccionado
      //});

      //console.log('📤 Datos que se envían al backend:', {
        //profesorId: profesorData.profesorId,
        //tipoId: typeof profesorData.profesorId,
        //nuevaContraseña: '***' // Por seguridad
      //});

      const response = await usersAPI.cambiarContraseñaProfesor(
        profesorData.profesorId,
        profesorData.nuevaContraseña
      );
      
      console.log('✅ Respuesta del backend:', response.data);
      
      setSuccess(response.data.mensaje || 'Contraseña del profesor cambiada correctamente');
      setProfesorData({
        profesorId: '',
        nuevaContraseña: '',
        confirmarContraseña: ''
      });
    } catch (error) {
      console.error('❌ Error completo en frontend:', error);
      console.error('❌ Detalles del error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Error al cambiar la contraseña del profesor';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detalle) {
        errorMessage = error.response.data.detalle;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Exportar datos en CSV (FUNCIONALIDAD REAL)
  const handleExportarDatos = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📤 Iniciando exportación de datos...');
      
      const response = await usersAPI.exportarDatos();
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { 
        type: 'text/csv; charset=utf-8' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `datos-tutor-inteligente-${user?.usuario}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Datos exportados correctamente en formato CSV');
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detalle || 
                          'Error al exportar los datos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tabs actualizadas
  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: '👤' },
    { id: 'seguridad', label: 'Seguridad', icon: '🔒' },
    { id: 'exportar', label: 'Exportar Datos', icon: '📤' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
            <p className="text-gray-600">
              Gestiona tu perfil, seguridad y datos del sistema
            </p>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {user?.rol === 'coordinador' ? 'Coordinador' : 'Profesor'}
            </span>
            <span>•</span>
            <span>{user?.usuario}</span>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white rounded-xl shadow-sm p-1">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
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

      {/* Contenido de las pestañas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Pestaña: Perfil */}
        {activeTab === 'perfil' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Información del Perfil</h2>
            
            <form onSubmit={handleGuardarPerfil} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={perfilData.nombre}
                    onChange={handlePerfilChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={perfilData.correo}
                    onChange={handlePerfilChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formación
                </label>
                <select
                  name="carrera"
                  value={perfilData.carrera}
                  onChange={handlePerfilChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                >
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                  <option value="Especialización">Especialización</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Información del sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Usuario:</span> {user?.usuario}
                  </div>
                  <div>
                    <span className="font-medium">Rol:</span> {user?.rol === 'coordinador' ? 'Coordinador' : 'Profesor'}
                  </div>
                  <div>
                    <span className="font-medium">Fecha de registro:</span> {new Date(user?.fecha_creacion).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> <span className="text-green-600 font-medium">Activo</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                >
                  {loading ? <LoadingSpinner size="small" text="" /> : <span>💾</span>}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pestaña: Seguridad - SOLO PARA COORDINADORES */}
        {activeTab === 'seguridad' && isCoordinador() && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Contraseñas - Profesores</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">🔒</span>
                  <div>
                    <h4 className="font-medium text-blue-800">Funcionalidad para Coordinadores</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      Aquí puedes restablecer las contraseñas de los profesores que hayan olvidado sus credenciales de acceso.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCambiarContraseñaProfesor} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Profesor *
                  </label>
                  <select
                    name="profesorId"
                    value={profesorData.profesorId}
                    onChange={handleProfesorChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  >
                    <option value="">Selecciona un profesor</option>
                    {profesores.map((profesor) => (
                      <option key={profesor.id} value={profesor.id}>
                        {profesor.nombre} ({profesor.usuario})
                      </option>
                    ))}
                  </select>
                  {profesores.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No hay profesores registrados en el sistema.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña *
                  </label>
                  <input
                    type="password"
                    name="nuevaContraseña"
                    value={profesorData.nuevaContraseña}
                    onChange={handleProfesorChange}
                    required
                    minLength="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La contraseña debe tener al menos 6 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirmarContraseña"
                    value={profesorData.confirmarContraseña}
                    onChange={handleProfesorChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <div>
                      <h4 className="font-medium text-yellow-800">Información importante</h4>
                      <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                        <li>• Esta acción cambiará inmediatamente la contraseña del profesor seleccionado</li>
                        <li>• El profesor podrá acceder al sistema con la nueva contraseña de inmediato</li>
                        <li>• Se recomienda notificar al profesor sobre el cambio de contraseña</li>
                        <li>• El profesor podrá cambiar su contraseña nuevamente desde su perfil</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || profesores.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                  >
                    {loading ? <LoadingSpinner size="small" text="" /> : <span>🔒</span>}
                    <span>Cambiar Contraseña del Profesor</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mostrar mensaje si un profesor intenta acceder a Seguridad */}
        {activeTab === 'seguridad' && !isCoordinador() && (
          <div className="max-w-2xl">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="text-yellow-600 text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-yellow-700">
                La gestión de contraseñas de profesores es una función exclusiva para coordinadores.
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Si has olvidado tu contraseña, contacta al coordinador del sistema.
              </p>
            </div>
          </div>
        )}

        {/* Pestaña: Exportar Datos */}
        {activeTab === 'exportar' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Exportar Datos</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 Exportar tu información</h3>
                <p className="text-blue-700 mb-4">
                  Puedes exportar todos tus datos del sistema, incluyendo:
                </p>
                <ul className="text-blue-700 space-y-2 text-sm">
                  <li>• Información de tu perfil</li>
                  <li>• Archivos subidos</li>
                  <li>• Quizzes generados</li>
                  <li>• Historial de actividad</li>
                  <li>• Configuraciones personales</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <div>
                    <h4 className="font-medium text-yellow-800">Consideraciones importantes</h4>
                    <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                      <li>• Los datos se exportarán en formato CSV (compatible con Excel)</li>
                      <li>• El proceso puede tomar unos segundos</li>
                      <li>• Guarda el archivo en un lugar seguro</li>
                      <li>• Esta acción no elimina tus datos del sistema</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExportarDatos}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center space-x-2"
                >
                  {loading ? <LoadingSpinner size="small" text="" /> : <span>📤</span>}
                  <span>Exportar Mis Datos (CSV)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de información del sistema */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">ℹ️ Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Versión:</span> 1.0.0
          </div>
          <div>
            <span className="font-medium">Última actualización:</span> Oct 2024
          </div>
          <div>
            <span className="font-medium">Soporte:</span> soporte@tutorinteligente.edu
          </div>
          <div>
            <span className="font-medium">Estado:</span> <span className="text-green-600 font-medium">Operativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;