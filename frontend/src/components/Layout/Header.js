// frontend/src/components/Layout/Header.js - Header de la aplicación

import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Evalio</h1>
            <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
              {user?.rol === 'coordinador' ? 'Coordinador' : 'Profesor'}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-blue-100">
              Hola, {user?.nombre}
            </span>
            <button
              onClick={logout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition duration-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;