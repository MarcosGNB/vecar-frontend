import React, { useState } from 'react';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthCard from './AuthCard';
import { setAuthToken, setUserData } from '../utils/authHelpers';
import { api } from '../utils/api';

import logo from '../assets/logo.png';
import fondo from '../assets/vapo.png';

const AuthLogin = ({ onLoginSuccess, onNavigateToRegister, onNavigateToHome, isModal = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      setLoading(false);
      return;
    }

    try {
      const user = await api.loginUser(username, password);
      const token = `token_${user.id}`;
      setAuthToken(token);
      setUserData(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Content that will be rendered inside either modal or full screen
  const loginContent = (
    <div className={`${isModal ? 'bg-white' : 'bg-black bg-opacity-60 backdrop-blur-md'} rounded-xl p-6 w-full max-w-md ${isModal ? '' : 'shadow-2xl'}`}>
      {/* Exit button - only show for full screen version */}
      {!isModal && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onNavigateToHome}
            className="text-white hover:text-gray-300 transition-colors duration-200"
            title="Volver al inicio"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Encabezado estilo Hero */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Vapo Energy Logo" className="h-20 mb-2" />
        <h1 className={`text-3xl font-black italic ${isModal ? 'text-gray-900' : 'text-white'} mb-1 tracking-tighter`}>VECAR</h1>
        <p className={`text-xs font-bold ${isModal ? 'text-red-600' : 'text-red-500'} tracking-widest uppercase`}>Lo Mejor en Cubiertas y Llantas</p>
      </div>

      <AuthCard title="Iniciar Sesión" className={`bg-transparent ${isModal ? 'text-gray-800' : 'text-white'}`}>
        <div className="space-y-4">
          <AuthInput
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <AuthInput
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <AuthButton
            text={loading ? "Cargando..." : "Entrar"}
            onClick={handleLogin}
            disabled={loading}
            className="bg-black hover:bg-gray-900 text-white" // Botón negro
          />

          {/* Exit button for full screen version - alternative placement */}
          {!isModal && (
            <AuthButton
              text="Volver al Inicio"
              onClick={onNavigateToHome}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            />
          )}

          <p className={`text-center ${isModal ? 'text-gray-600' : 'text-gray-300'} text-sm`}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={onNavigateToRegister}
              className={`${isModal ? 'text-blue-600' : 'text-black'} font-semibold hover:underline`}
            >
              Regístrate aquí
            </button>
          </p>
        </div>
      </AuthCard>
    </div>
  );

  // If it's a modal, return just the content
  if (isModal) {
    return loginContent;
  }

  // If it's not a modal, return the full screen version
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-black bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      {loginContent}
    </div>
  );
};

export default AuthLogin;
