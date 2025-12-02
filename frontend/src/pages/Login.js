// frontend/src/pages/Login.js - Página de inicio de sesión (VERSIÓN FINAL)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Login = () => {
  const [credentials, setCredentials] = useState({
    usuario: '',
    contraseña: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campoError, setCampoError] = useState('');
  
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError('');
      setCampoError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica del frontend
    if (!credentials.usuario.trim() || !credentials.contraseña.trim()) {
      setError('Por favor completa todos los campos');
      setCampoError('ambos');
      return;
    }

    setLoading(true);
    setError('');
    setCampoError('');

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.error);
      setCampoError(result.campo || 'sistema');
      
      // Limpiar campos específicos según el error
      if (result.campo === 'usuario') {
        setCredentials(prev => ({ ...prev, usuario: '' }));
      } else if (result.campo === 'contraseña') {
        setCredentials(prev => ({ ...prev, contraseña: '' }));
      } else if (result.campo === 'ambos') {
        setCredentials({ usuario: '', contraseña: '' });
      }
    }
    
    setLoading(false);
  };

  // Función para obtener estilos de campo
  const getFieldStyles = (fieldName) => {
    const baseStyles = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition duration-200";
    
    if (campoError === fieldName || campoError === 'ambos') {
      return `${baseStyles} border-red-300 focus:ring-red-500 bg-white`;
    }
    
    return `${baseStyles} border-gray-300 focus:ring-blue-500 bg-white`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Evalio</h1>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-400 text-xl mr-2">⚠️</span>
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="usuario" className={`block text-sm font-medium mb-2 ${
              campoError === 'usuario' || campoError === 'ambos' ? 'text-red-600' : 'text-gray-700'
            }`}>
              Usuario
            </label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              required
              value={credentials.usuario}
              onChange={handleChange}
              className={getFieldStyles('usuario')}
              placeholder="Ingresa tu usuario"
              disabled={loading}
              autoComplete="username"
            />
            {campoError === 'usuario' && (
              <p className="text-red-500 text-xs mt-1">Usuario no encontrado</p>
            )}
          </div>

          <div>
            <label htmlFor="contraseña" className={`block text-sm font-medium mb-2 ${
              campoError === 'contraseña' || campoError === 'ambos' ? 'text-red-600' : 'text-gray-700'
            }`}>
              Contraseña
            </label>
            <input
              id="contraseña"
              name="contraseña"
              type="password"
              required
              value={credentials.contraseña}
              onChange={handleChange}
              className={getFieldStyles('contraseña')}
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              autoComplete="current-password"
            />
            {campoError === 'contraseña' && (
              <p className="text-red-500 text-xs mt-1">Contraseña incorrecta</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium transition duration-200 flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" text="" /> : 'Iniciar sesión'}
          </button>
        </form>

        {/* Información de credenciales de prueba */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            <strong>Demo:</strong> Usa <code>admin</code> / <code>admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;