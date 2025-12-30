import React, { useState } from 'react';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthCard from './AuthCard';
import { setAuthToken, setUserData } from '../utils/authHelpers';
import { api } from '../utils/api';

import logo from '../assets/logo.png';
import fondo from '../assets/vapo.png';

const AuthRegister = ({ onRegisterSuccess, onNavigateToLogin, onNavigateToHome }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const newUser = await api.registerUser({ username, email, password });
      const token = `token_${newUser.id}`;
      setAuthToken(token);
      setUserData(newUser);
      setSuccess('¡Registro exitoso! Has iniciado sesión automáticamente.');
      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrar usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-black bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="bg-black bg-opacity-60 backdrop-blur-md rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Exit button */}
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

        {/* Encabezado estilo Hero */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Vapo Energy Logo" className="h-20 mb-2" />
          <h1 className="text-3xl font-black italic text-white mb-1 tracking-tighter">VECAR</h1>
          <p className="text-xs font-bold text-red-500 tracking-widest uppercase">Lo Mejor en Cubiertas y Llantas</p>
        </div>

        <AuthCard title="Registrarse" className="bg-transparent text-white">
          <div className="space-y-4">
            <AuthInput
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <AuthInput
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthInput
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <AuthInput
              type="password"
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-green-500 text-sm text-center">{success}</p>}

            <AuthButton
              text={loading ? 'Registrando...' : 'Registrarme'}
              onClick={handleRegister}
              disabled={loading}
              className="bg-black hover:bg-gray-900 text-white" // Botón negro
            />

            {/* Exit button - alternative placement */}
            <AuthButton
              text="Volver al Inicio"
              onClick={onNavigateToHome}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            />

            <p className="text-center text-gray-300 text-sm">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-black font-semibold hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default AuthRegister;
