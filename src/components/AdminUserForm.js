import React, { useState, useEffect } from 'react';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';

const AdminUserForm = ({ onUpdateUser, selectedUser, loading }) => {
  const [id, setId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const roles = ['user', 'admin'];

  useEffect(() => {
    if (selectedUser) {
      setId(selectedUser.id);
      setUsername(selectedUser.username);
      setEmail(selectedUser.email);
      setRole(selectedUser.role);
    } else {
      setId('');
      setUsername('');
      setEmail('');
      setRole('');
    }
  }, [selectedUser]);

  const handleSubmit = () => {
    setError('');
    if (!username || !email || !role) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    const userData = {
      username,
      email,
      role,
    };

    onUpdateUser(id, userData);
    
    // Limpiar formulario después de enviar
    setId('');
    setUsername('');
    setEmail('');
    setRole('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedUser ? 'Editar Usuario' : 'Selecciona un Usuario'}</h3>
      <div className="space-y-4">
        <AuthInput
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!selectedUser}
        />
        <AuthInput
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!selectedUser}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black transition text-gray-800"
          disabled={!selectedUser}
        >
          <option value="">Selecciona un rol</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <AuthButton text={loading ? "Procesando..." : "Guardar Cambios"} onClick={handleSubmit} disabled={loading || !selectedUser} />
      </div>
    </div>
  );
};

export default AdminUserForm;