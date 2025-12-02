// frontend/src/context/AuthContext.js - Manejo global de autenticación (VERSIÓN ACTUALIZADA)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación al cargar la app
  // En AuthContext.js, modifica el useEffect:
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
    
      if (token && userData) {
        try {
          // Verificar si el token está expirado (decodificación básica)
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = tokenPayload.exp * 1000 < Date.now();

          if (isExpired) {
            console.log('Token expirado, haciendo logout...');
            logout();
            return;
          }

          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Agrega este comentario para desactivar la regla

  // Función de login
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { token, usuario } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(usuario));
        
        // Actualizar estado
        setUser(usuario);
        setIsAuthenticated(true);
        
        return { success: true, user: usuario };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      const message = error.response?.data?.error || 'Error de conexión';
      return { success: false, error: message };
    }
  };

  // Función de logout
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Limpiar preferencias específicas del usuario si existen
    if (user) {
      localStorage.removeItem(`preferencias_${user.id}`);
    }
    
    setUser(null);
    setIsAuthenticated(false);
  };

  // Función para actualizar datos del usuario (FUNCIÓN CORREGIDA)
  const updateUser = (nuevosDatos) => {
    console.log('🔄 Actualizando datos del usuario en contexto:', nuevosDatos);
    const updatedUser = { ...user, ...nuevosDatos };
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  // Verificar si el usuario es coordinador
  const isCoordinador = () => {
    return user?.rol === 'coordinador';
  };

  // Verificar si el usuario es profesor
  const isProfesor = () => {
    return user?.rol === 'profesor';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    isCoordinador,
    isProfesor,
    updateUser // FUNCIÓN AGREGADA
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};