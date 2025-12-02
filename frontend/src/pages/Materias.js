// frontend/src/pages/Materias.js - VERSIÓN CORREGIDA CON FILTROS Y ERRORES EN MODAL

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { materiasAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';

const Materias = () => {
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [materiasPorProfesor, setMateriasPorProfesor] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAsignarForm, setShowAsignarForm] = useState(false);
  const [showAgregarMateriaForm, setShowAgregarMateriaForm] = useState(false);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  const { isCoordinador } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'activo'
  });

  // Estado del formulario de asignación
  const [asignacionData, setAsignacionData] = useState({
    profesorId: '',
    materiaId: ''
  });

  // Estado del formulario para agregar nueva materia
  const [nuevaMateriaData, setNuevaMateriaData] = useState({
    nombre: '',
    descripcion: ''
  });

  // Estados para errores en modales
  const [errorAsignacion, setErrorAsignacion] = useState('');
  const [errorNuevaMateria, setErrorNuevaMateria] = useState('');

  // Cargar datos iniciales - VERSIÓN CORREGIDA: Cargar TODOS los profesores
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar materias y profesores en paralelo
      const [materiasRes, profesoresRes] = await Promise.all([
        materiasAPI.getMaterias(),
        usersAPI.getProfesores() // Cargar TODOS los profesores, no solo activos
      ]);

      setMaterias(materiasRes.data.materias);
      setProfesores(profesoresRes.data.profesores); // Guardar todos los profesores

      // Filtrar profesores activos para cargar sus materias
      const profesoresActivos = profesoresRes.data.profesores.filter(p => p.activo);

      // Cargar materias de cada profesor activo EN PARALELO
      const materiasPromises = profesoresActivos.map(profesor =>
        materiasAPI.getMateriasPorProfesor(profesor.id)
          .then(response => ({ profesorId: profesor.id, materias: response.data.materias }))
          .catch(error => {
            console.error(`Error cargando materias del profesor ${profesor.id}:`, error);
            return { profesorId: profesor.id, materias: [] };
          })
      );

      const resultados = await Promise.all(materiasPromises);

      const materiasProfesores = {};
      resultados.forEach(result => {
        materiasProfesores[result.profesorId] = result.materias;
      });
      
      // También inicializar materias para profesores inactivos como array vacío
      profesoresRes.data.profesores.forEach(profesor => {
        if (!materiasProfesores[profesor.id]) {
          materiasProfesores[profesor.id] = [];
        }
      });
      
      setMateriasPorProfesor(materiasProfesores);
      
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
  }, []);

  // Limpiar mensaje de éxito después de 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Aplicar filtros - VERSIÓN COMPLETAMENTE CORREGIDA
  const profesoresFiltrados = profesores.filter(profesor => {
    const cumpleBusqueda = !filtros.busqueda || 
      profesor.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      profesor.usuario.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      profesor.correo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      profesor.carrera.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      // Búsqueda en materias asignadas al profesor
      (materiasPorProfesor[profesor.id]?.some(materia => 
        materia.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase())
      ));

    const cumpleEstado = filtros.estado === 'todos' || 
      (filtros.estado === 'activo' && profesor.activo) ||
      (filtros.estado === 'inactivo' && !profesor.activo);

    return cumpleBusqueda && cumpleEstado;
  });

  // Manejar cambio en formulario de asignación
  const handleAsignacionChange = (e) => {
    setAsignacionData({
      ...asignacionData,
      [e.target.name]: e.target.value
    });
    setErrorAsignacion(''); // Limpiar error al cambiar
  };

  // Manejar cambio en formulario de nueva materia
  const handleNuevaMateriaChange = (e) => {
    setNuevaMateriaData({
      ...nuevaMateriaData,
      [e.target.name]: e.target.value
    });
    setErrorNuevaMateria(''); // Limpiar error al cambiar
  };

  // Manejar cambio en filtros
  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: 'activo'
    });
  };

  // Asignar materia a profesor - VERSIÓN CORREGIDA CON MANEJO DE ERRORES EN MODAL
  const handleAsignarMateria = async (e) => {
    e.preventDefault();
    try {
      setErrorAsignacion('');
      await materiasAPI.asignarMateria(asignacionData);
      await cargarDatos(); // Recargar datos
      setShowAsignarForm(false);
      setAsignacionData({ profesorId: '', materiaId: '' });
      setSuccess('Materia asignada exitosamente');
    } catch (error) {
      // Mostrar error dentro del modal
      setErrorAsignacion(error.response?.data?.error || 'Error al asignar materia');
    }
  };

  // Agregar nueva materia al catálogo - VERSIÓN CORREGIDA CON MANEJO DE ERRORES EN MODAL
  const handleAgregarMateria = async (e) => {
    e.preventDefault();
    try {
      setErrorNuevaMateria('');
      
      // Validar que el nombre no esté vacío
      if (!nuevaMateriaData.nombre.trim()) {
        setErrorNuevaMateria('El nombre de la materia es requerido');
        return;
      }

      // Validar que la clave no esté vacía
      if (!nuevaMateriaData.descripcion.trim()) {
        setErrorNuevaMateria('La clave de la materia es requerida');
        return;
      }

      // Llamar al endpoint real para crear la materia
      await materiasAPI.crearMateria(nuevaMateriaData);
    
      // Recargar la lista de materias
      const materiasRes = await materiasAPI.getMaterias();
      setMaterias(materiasRes.data.materias);
    
      setShowAgregarMateriaForm(false);
      setNuevaMateriaData({ nombre: '', descripcion: '' });
    
      // Mostrar mensaje de éxito
      setSuccess('Materia agregada exitosamente al catálogo');
    
    } catch (error) {
      // Mostrar error dentro del modal
      setErrorNuevaMateria(error.response?.data?.error || 'Error al agregar la materia al catálogo');
    }
  };

  // Quitar asignación de materia
  const handleQuitarMateria = async (profesorId, materiaId) => {
    if (!window.confirm('¿Estás seguro de quitar esta asignación?')) {
      return;
    }

    try {
      await materiasAPI.quitarMateria({ profesorId, materiaId });
      await cargarDatos(); // Recargar datos
      setSuccess('Asignación removida exitosamente');
    } catch (error) {
      setError('Error al quitar la asignación');
    }
  };

  // Ver materias de un profesor específico
  const verMateriasProfesor = (profesor) => {
    setProfesorSeleccionado(profesor);
  };

  // Función para cerrar modal de asignación y limpiar errores
  const cerrarModalAsignacion = () => {
    setShowAsignarForm(false);
    setErrorAsignacion('');
    setAsignacionData({ profesorId: '', materiaId: '' });
  };

  // Función para cerrar modal de nueva materia y limpiar errores
  const cerrarModalNuevaMateria = () => {
    setShowAgregarMateriaForm(false);
    setErrorNuevaMateria('');
    setNuevaMateriaData({ nombre: '', descripcion: '' });
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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de materias</h1>
            <p className="text-gray-600">Asigna materias a los profesores y gestiona el catálogo</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAgregarMateriaForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
            >
              + Nueva materia
            </button>
            <button
              onClick={() => setShowAsignarForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
            >
              + Asignar materia
            </button>
          </div>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              name="busqueda"
              placeholder="Buscar por profesor, materia, correo o formación..."
              value={filtros.busqueda}
              onChange={handleFiltroChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
          <div className="flex space-x-3">
            <select 
              name="estado"
              value={filtros.estado}
              onChange={handleFiltroChange}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="todos">Todos</option>
            </select>
            {(filtros.busqueda || filtros.estado !== 'activo') && (
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
          {(filtros.busqueda || filtros.estado !== 'activo') && (
            <span className="ml-2 text-blue-600">
              (filtros aplicados)
            </span>
          )}
        </div>
      </div>

      {/* Formulario para agregar nueva materia (modal) */}
      {showAgregarMateriaForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Agregar nueva materia</h2>
              <button
                onClick={cerrarModalNuevaMateria}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Mostrar error dentro del modal */}
            {errorNuevaMateria && (
              <div className="mb-4">
                <ErrorMessage message={errorNuevaMateria} />
              </div>
            )}
            
            <form onSubmit={handleAgregarMateria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la materia *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevaMateriaData.nombre}
                  onChange={handleNuevaMateriaChange}
                  required
                  placeholder="Ej: Base de datos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de la materia *
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={nuevaMateriaData.descripcion}
                  onChange={handleNuevaMateriaChange}
                  required
                  placeholder="Ej: ISW-101, IA-202, POO-301"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Código único de la materia (requerido)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">💡</span>
                  <div className="text-blue-700 text-sm">
                    <strong>Nota:</strong> Esta materia se agregará al catálogo general. Tanto el nombre como la clave son requeridos para identificación única.
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Agregar materia
                </button>
                <button
                  type="button"
                  onClick={cerrarModalNuevaMateria}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario de asignación (modal) */}
      {showAsignarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Asignar materia</h2>
              <button
                onClick={cerrarModalAsignacion}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Mostrar error dentro del modal */}
            {errorAsignacion && (
              <div className="mb-4">
                <ErrorMessage message={errorAsignacion} />
              </div>
            )}
            
            <form onSubmit={handleAsignarMateria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profesor *
                </label>
                <select
                  name="profesorId"
                  value={asignacionData.profesorId}
                  onChange={handleAsignacionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona un profesor</option>
                  {profesores
                    .filter(profesor => profesor.activo) // Solo mostrar profesores activos para asignación
                    .map((profesor) => (
                    <option key={profesor.id} value={profesor.id}>
                      {profesor.nombre} ({profesor.usuario})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materia *
                </label>
                <select
                  name="materiaId"
                  value={asignacionData.materiaId}
                  onChange={handleAsignacionChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una materia</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Total de materias disponibles: {materias.length}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Asignar materia
                </button>
                <button
                  type="button"
                  onClick={cerrarModalAsignacion}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de materias por profesor */}
      {profesorSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Materias de {profesorSeleccionado.nombre}
              </h2>
              <button
                onClick={() => setProfesorSeleccionado(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {materiasPorProfesor[profesorSeleccionado.id]?.length > 0 ? (
                materiasPorProfesor[profesorSeleccionado.id].map((materia) => (
                  <div key={materia.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{materia.nombre}</h3>
                      {materia.descripcion && (
                        <p className="text-sm text-gray-600">{materia.descripcion}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleQuitarMateria(profesorSeleccionado.id, materia.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Este profesor no tiene materias asignadas
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mensajes globales */}
      {error && <ErrorMessage message={error} onRetry={cargarDatos} />}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Lista de profesores con sus materias */}
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
                    Materias Asignadas
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
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          profesor.activo ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <span className={`font-medium ${
                            profesor.activo ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {profesor.nombre.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profesor.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {profesor.usuario} • {profesor.carrera}
                          </div>
                          <div className={`text-xs mt-1 ${
                            profesor.activo ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {profesor.activo ? 'Activo' : 'Inactivo'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {materiasPorProfesor[profesor.id]?.length > 0 ? (
                          materiasPorProfesor[profesor.id].slice(0, 3).map((materia) => (
                            <span
                              key={materia.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {materia.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">Sin materias asignadas</span>
                        )}
                        {materiasPorProfesor[profesor.id]?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{materiasPorProfesor[profesor.id].length - 3} más
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => verMateriasProfesor(profesor)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Ver materias
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {profesoresFiltrados.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <p className="text-gray-500">No hay profesores que coincidan con los filtros</p>
                <p className="text-gray-400 text-sm mt-2">
                  {profesores.length > 0 
                    ? 'Prueba ajustar los filtros de búsqueda'
                    : 'Primero debes crear algunos profesores en la sección de Gestión de Profesores'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información adicional - ACTUALIZADA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Información sobre la gestión de materias</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• <strong>Catálogo actual:</strong> {materias.length} materias disponibles</li>
          <li>• <strong>Profesores registrados:</strong> {profesores.length} total ({profesores.filter(p => p.activo).length} activos)</li>
          <li>• Cada profesor puede tener múltiples materias asignadas</li>
          <li>• Los profesores solo podrán subir archivos para las materias que tengan asignadas</li>
          <li>• Puedes agregar nuevas materias al catálogo usando el botón "Nueva materia"</li>
          <li>• Puedes quitar asignaciones en cualquier momento desde la vista de detalles</li>
          <li>• Usa los filtros para encontrar rápidamente a los profesores que necesitas</li>
          <li>• Puedes buscar por nombre de materia para encontrar qué profesores la tienen asignada</li>
        </ul>
      </div>
    </div>
  );
};

export default Materias;