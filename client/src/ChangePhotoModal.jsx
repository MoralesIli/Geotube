import React, { useState } from 'react';

const ChangePhotoModal = ({ isOpen, onClose, user, onPhotoUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convertir imagen a base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result;
          
          const token = localStorage.getItem('token');
          
          console.log(' Subiendo foto de perfil...');
          
          const response = await fetch('http://localhost:3001/api/auth/profile-photo', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ foto: base64Image })
          });

          // Verificar si la respuesta es JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error(' El servidor devolvió HTML:', textResponse.substring(0, 200));
            throw new Error('Error del servidor: respuesta no válida');
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Error al actualizar la foto');
          }

          console.log(' Foto actualizada:', data.user);

          // Actualizar localStorage y estado
          const currentUser = JSON.parse(localStorage.getItem('user'));
          const updatedUser = { 
            ...currentUser, 
            foto: data.user.foto 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));

          // Llamar callback para actualizar estado en MainApp
          if (onPhotoUpdate) {
            onPhotoUpdate(updatedUser);
          }

          // Cerrar modal
          onClose();

          // Limpiar estado
          setSelectedFile(null);
          setPreviewUrl('');

        } catch (err) {
          console.error(' Error en upload:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('Error al procesar la imagen');
        setLoading(false);
      };

    } catch (err) {
      console.error(' Error general:', err);
      setError('Error al subir la imagen');
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      console.log(' Eliminando foto de perfil...');
      
      const response = await fetch('http://localhost:3001/api/auth/profile-photo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ foto: null })
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(' El servidor devolvió HTML:', textResponse.substring(0, 200));
        throw new Error('Error del servidor: respuesta no válida');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la foto');
      }

      console.log(' Foto eliminada correctamente');

      // Actualizar localStorage y estado
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { 
        ...currentUser, 
        foto: null 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Llamar callback para actualizar estado en MainApp
      if (onPhotoUpdate) {
        onPhotoUpdate(updatedUser);
      }

      // Cerrar modal
      onClose();

    } catch (err) {
      console.error(' Error eliminando foto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-content max-w-md bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Cambiar Foto de Perfil
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          {/* Foto actual */}
          <div className="flex justify-center mb-4">
            {user?.foto ? (
              <img 
                src={user.foto} 
                alt="Foto de perfil actual" 
                className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-cyan-500">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-gray-300 text-sm">Foto actual</p>
        </div>

        {/* Preview de nueva foto */}
        {previewUrl && (
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-24 h-24 rounded-full object-cover border-4 border-green-500"
              />
            </div>
            <p className="text-green-400 text-sm">Vista previa de la nueva foto</p>
          </div>
        )}

        {/* Selector de archivo */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3 text-gray-300">
            Seleccionar nueva imagen
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 transition-colors"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-2">
            Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          {user?.foto && (
            <button
              onClick={handleRemovePhoto}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando...' : 'Eliminar Foto'}
            </button>
          )}
          
          <button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Subiendo...' : 'Subir Foto'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePhotoModal;