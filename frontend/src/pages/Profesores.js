// frontend/src/pages/Profesores.js - VERSIÓN MEJORADA CON TODAS LAS FUNCIONALIDADES

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const Profesores = () => {
  const [profesores, setProfesores] = useState([]);
  const [profesoresFiltrados, setProfesoresFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  const { isCoordinador } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    formacion: '',
    estado: ''
  });

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    correo: '',
    contraseña: '',
    carrera: 'Licenciatura'
  });

  // Cargar profesores
  const cargarProfesores = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfesores();
      setProfesores(response.data.profesores);
      setProfesoresFiltrados(response.data.profesores);
      setError('');
    } catch (error) {
      setError('Error al cargar los profesores');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProfesores();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let resultados = [...profesores];

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase().trim();
      resultados = resultados.filter(profesor =>
        profesor.nombre?.toLowerCase().includes(busqueda) ||
        profesor.usuario?.toLowerCase().includes(busqueda) ||
        profesor.correo?.toLowerCase().includes(busqueda) ||
        profesor.carrera?.toLowerCase().includes(busqueda)
      );
    }

    if (filtros.formacion) {
      resultados = resultados.filter(profesor =>
        profesor.carrera === filtros.formacion
      );
    }

    if (filtros.estado) {
      const estadoBool = filtros.estado === 'activo';
      resultados = resultados.filter(profesor => {
        const activo = Boolean(profesor.activo);
        return activo === estadoBool;
      });
    }

    setProfesoresFiltrados(resultados);
  }, [filtros, profesores]);

  // Manejar cambio en formulario
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Manejar cambio en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      formacion: '',
      estado: ''
    });
  };

  // Crear nuevo profesor
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.crearProfesor(formData);
      await cargarProfesores();
      setShowForm(false);
      setFormData({
        nombre: '',
        usuario: '',
        correo: '',
        contraseña: '',
        carrera: 'Licenciatura'
      });
      setError('');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al crear profesor';
      setError(errorMessage);
      // NO cerramos el formulario para que el usuario pueda ver el error y corregirlo
    }
  };

  // Activar/desactivar profesor
  const toggleActivo = async (id, activoActual) => {
    try {
      await usersAPI.toggleProfesorActivo(id, !activoActual);
      await cargarProfesores();
      
      // Si se desactivó un profesor, podríamos enviar una notificación al backend
      // para que cierre la sesión de ese profesor si está activa
      if (!activoActual) {
        console.log(`Profesor ${id} desactivado - Se debería cerrar su sesión si está activa`);
        // En un sistema real, aquí podrías llamar a un endpoint para cerrar sesiones activas
      }
    } catch (error) {
      setError('Error al actualizar estado del profesor');
    }
  };

  // Ver detalles del profesor
  const verDetalles = (profesor) => {
    setProfesorSeleccionado(profesor);
    setShowDetalles(true);
  };

  // Cerrar modal de detalles
  const cerrarDetalles = () => {
    setShowDetalles(false);
    setProfesorSeleccionado(null);
  };

  // Cerrar modal de formulario y limpiar errores
  const cerrarFormulario = () => {
    setShowForm(false);
    setError('');
    setFormData({
      nombre: '',
      usuario: '',
      correo: '',
      contraseña: '',
      carrera: 'Licenciatura'
    });
  };

  // Componente Switch personalizado
  const Switch = ({ activo, onChange, id }) => {
    return (
      <button
        type="button"
        onClick={() => onChange(id, activo)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          activo ? 'bg-green-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            activo ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    );
  };

  if (!isCoordinador()) {
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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de profesores</h1>
            <p className="text-gray-600">Administra los profesores del sistema</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
          >
            + Nuevo profesor
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              name="busqueda"
              placeholder="Buscar por nombre, usuario, correo o formación..."
              value={filtros.busqueda}
              onChange={handleFiltroChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          <div className="flex space-x-3">
            <select 
              name="formacion"
              value={filtros.formacion}
              onChange={handleFiltroChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Todas las formaciones</option>
              <option value="Licenciatura">Licenciatura</option>
              <option value="Maestría">Maestría</option>
              <option value="Doctorado">Doctorado</option>
              <option value="Especialización">Especialización</option>
            </select>
            <select 
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            {(filtros.busqueda || filtros.formacion || filtros.estado) && (
              <button
                onClick={limpiarFiltros}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition duration-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          Mostrando {profesoresFiltrados.length} de {profesores.length} profesores
          {(filtros.busqueda || filtros.formacion || filtros.estado) && (
            <span className="ml-2 text-blue-600">
              (filtros aplicados)
            </span>
          )}
        </div>
      </div>

      {/* Modal de nuevo profesor */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Nuevo profesor</h2>
              <button
                onClick={cerrarFormulario}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Mostrar error dentro del modal si existe */}
            {error && (
              <div className="mb-4">
                <ErrorMessage message={error} />
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario *
                </label>
                <input
                  type="text"
                  name="usuario"
                  value={formData.usuario}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formación
                </label>
                <select
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestría">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                  <option value="Especialización">Especialización</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Crear profesor
                </button>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles del profesor */}
      {showDetalles && profesorSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Detalles del Profesor</h2>
              <button
                onClick={cerrarDetalles}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Información de Registro</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Nombre completo:</span>
                    <div className="text-blue-900 mt-1">{profesorSeleccionado.nombre}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Usuario:</span>
                    <div className="text-blue-900 mt-1">{profesorSeleccionado.usuario}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Correo electrónico:</span>
                    <div className="text-blue-900 mt-1">{profesorSeleccionado.correo}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Formación:</span>
                    <div className="text-blue-900 mt-1">{profesorSeleccionado.carrera}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Contraseña:</span>
                    <div className="text-blue-900 mt-1 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                      ••••••••••
                    </div>
                    <p className="text-blue-600 text-xs mt-1">
                      La contraseña está encriptada por seguridad
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Información del Sistema</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">ID:</span> {profesorSeleccionado.id}
                  </div>
                  <div>
                    <span className="font-medium">Rol:</span> Profesor
                  </div>
                  <div>
                    <span className="font-medium">Fecha de registro:</span> {new Date(profesorSeleccionado.fecha_creacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      profesorSeleccionado.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profesorSeleccionado.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={cerrarDetalles}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de error global */}
      {error && !showForm && <ErrorMessage message={error} onRetry={cargarProfesores} />}

      {/* Lista de profesores */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profesoresFiltrados.map((profesor) => (
                  <tr key={profesor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {profesor.nombre.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profesor.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(profesor.fecha_creacion).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profesor.usuario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profesor.correo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {profesor.carrera}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profesor.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {profesor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => verDetalles(profesor)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                          title="Ver detalles del profesor"
                        >
                          👁️ Ver
                        </button>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            activo={profesor.activo} 
                            onChange={toggleActivo}
                            id={profesor.id}
                          />
                          <span className="text-xs text-gray-500">
                            {profesor.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {profesoresFiltrados.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👨‍🏫</div>
                <p className="text-gray-500">No se encontraron profesores</p>
                <p className="text-gray-400 text-sm mt-2">
                  {profesores.length > 0 
                    ? 'Prueba ajustar los filtros de búsqueda'
                    : 'Crea el primer profesor usando el botón "Nuevo profesor"'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profesores;