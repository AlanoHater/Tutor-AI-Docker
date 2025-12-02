// frontend/src/components/Layout/Sidebar.js - Navegación lateral

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { isCoordinador, isProfesor } = useAuth();
  const location = useLocation();

  const menuItems = [
    // Dashboard siempre primero
    { path: '/dashboard', label: 'Dashboard', icon: '📊', visible: true },
  
    // Items para coordinadores
    { path: '/profesores', label: 'Gestión de profesores', icon: '👨‍🏫', visible: isCoordinador() },
    { path: '/materias', label: 'Gestión de materias', icon: '📚', visible: isCoordinador() },
    { path: '/metricas', label: 'Métricas y reportes', icon: '📈', visible: isCoordinador() },
  
    // Items para profesores
    { path: '/subir-material', label: 'Subir material', icon: '📤', visible: isProfesor() },
    { path: '/generar-quiz', label: 'Generar quiz', icon: '🎯', visible: isProfesor() },
    { path: '/historial-quizzes', label: 'Historial de quizzes', icon: '📝', visible: isProfesor() },
  
    // Configuración siempre al final
    { path: '/configuracion', label: 'Configuración', icon: '⚙️', visible: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems
            .filter(item => item.visible)
            .map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;