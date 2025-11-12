import React, { useState } from 'react';

const ChangePhotoModal = ({ isOpen, onClose, user, onPhotoUpdate }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE_URL = process.env.REACT_APP_API_URL;

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
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      const token = localStorage.getItem('token');
      
      console.log(' Subiendo foto de perfil...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ foto: base64Image })
      });

      console.log(' Respuesta del servidor:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();

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
      
      if (err.message.includes('Failed to fetch')) {
        setError('No se pudo conectar al servidor. Verifica que esté corriendo.');
      } else if (err.message.includes('404')) {
        setError('Error: La ruta no existe en el servidor. Verifica la URL.');
      } else {
        setError(err.message || 'Error al subir la imagen');
      }
    } finally {
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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ foto: null })
      });

      console.log(' Respuesta del servidor:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
      }

      //  CORREGIDO: Removí la variable 'data' que no se usaba
      await response.json();

      console.log('Foto eliminada correctamente');

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
      
      if (err.message.includes('Failed to fetch')) {
        setError('No se pudo conectar al servidor. Verifica que esté corriendo.');
      } else if (err.message.includes('404')) {
        setError('Error: La ruta no existe en el servidor. Verifica la URL.');
      } else {
        setError(err.message || 'Error al eliminar la foto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Limpiar estado al cancelar
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-content max-w-md bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Cambiar Foto de Perfil
          </h2>
          <button
            onClick={handleCancel}
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
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF (MAX. 5MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
                disabled={loading}
              />
            </label>
          </div>
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
            onClick={handleCancel}
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