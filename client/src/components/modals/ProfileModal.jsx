import React, { useState } from 'react';

const ProfileModal = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Aquí iría la llamada a la API para actualizar el perfil
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email
        })
      });

      if (response.ok) {
        setMessage('Perfil actualizado correctamente');
        onUpdateUser({ ...user, nombre: formData.nombre, email: formData.email });
      }
    } catch (error) {
      setMessage('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      // Aquí iría la llamada a la API para cambiar la contraseña
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (response.ok) {
        setMessage('Contraseña cambiada correctamente');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      setMessage('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Aquí procesarías la imagen y la enviarías al servidor
      setMessage('Funcionalidad de cambio de foto en desarrollo');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient">Mi Perfil</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('Error') ? 'bg-red-500 bg-opacity-20 border border-red-500 text-red-300' : 'bg-green-500 bg-opacity-20 border border-green-500 text-green-300'
          }`}>
            {message}
          </div>
        )}

        <div className="flex gap-6">
          {/* Navegación */}
          <div className="w-1/3 space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Cambiar Contraseña
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'photo' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Foto de Perfil
            </button>
          </div>

          {/* Contenido */}
          <div className="w-2/3">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Guardando...' : 'Actualizar Perfil'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña Actual</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </form>
            )}

            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="user-avatar text-2xl w-20 h-20">
                    {user?.nombre?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">Foto actual</p>
                    <p className="text-sm text-gray-400">Haz clic para cambiar</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <button className="btn-primary w-full">
                  Subir Nueva Foto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;