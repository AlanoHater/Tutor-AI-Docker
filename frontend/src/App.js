// frontend/src/App.js - Aplicación principal (VERSIÓN COMPLETA)

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profesores from './pages/Profesores';
import Materias from './pages/Materias';
import SubirMaterial from './pages/SubirMaterial';
import GenerarQuiz from './pages/GenerarQuiz';
import HistorialQuizzes from './pages/HistorialQuizzes';
import Metricas from './pages/Metricas';
import Configuracion from './pages/Configuracion';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profesores" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profesores />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/materias" 
          element={
            <ProtectedRoute>
              <Layout>
                <Materias />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/subir-material" 
          element={
            <ProtectedRoute>
              <Layout>
                <SubirMaterial />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/generar-quiz" 
          element={
            <ProtectedRoute>
              <Layout>
                <GenerarQuiz />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/historial-quizzes" 
          element={
            <ProtectedRoute>
              <Layout>
                <HistorialQuizzes />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/metricas" 
          element={
            <ProtectedRoute>
              <Layout>
                <Metricas />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/configuracion" 
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracion />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* Ruta 404 */}
        <Route path="*" element={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600 mb-8">Página no encontrada</p>
              <a 
                href="/dashboard" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
              >
                Volver al Dashboard
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;