import React, { useState } from 'react';

const ChangePhotoModal = ({ isOpen, onClose, user }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor selecciona una imagen');
      return;
    }

    setLoading(true);
    
    try {
      // Aquí iría la lógica para subir la imagen al servidor
      // Por ahora simulamos una subida exitosa
      setTimeout(() => {
        setMessage('Foto de perfil actualizada correctamente');
        setLoading(false);
        setTimeout(() => {
          onClose();
        }, 2000);
      }, 1500);
    } catch (error) {
      setMessage('Error al subir la imagen');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient">Cambiar Foto de Perfil</h2>
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

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="user-avatar text-2xl w-24 h-24 text-xl">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user?.nombre?.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <p className="text-gray-300">{user?.nombre}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Seleccionar imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
            />
            <p className="text-xs text-gray-400 mt-2">Formatos: JPG, PNG, GIF. Máx: 5MB</p>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="btn-primary w-full"
          >
            {loading ? 'Subiendo...' : 'Actualizar Foto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePhotoModal;