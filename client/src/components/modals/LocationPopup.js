// components/modals/LocationPopup.js
import React from 'react';

const LocationPopup = ({
  isOpen,
  onClose,
  location,
  locationName,
  isValidLocation,
  onSearchVideos,
  onSearchWithTerm,
  searchTerm,
  loadingVideos
}) => {
  if (!isOpen || !location) return null;

  return (
    <div className="rounded-xl shadow-2xl border border-gray-300 bg-white/95 backdrop-blur-md">
      <div className="p-4 w-65 text-center text-gray-800">
        <h3 className="font-semibold text-lg mb-2 leading-snug">
          {isValidLocation ? locationName : 'Ubicación no disponible'}
        </h3>

        {isValidLocation ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Coordenadas:
              <br />
              <span className="font-medium">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </p>

            <div className="space-y-2">
              {/* Botón para buscar videos generales de la ubicación */}
              <button
                onClick={onSearchVideos}
                disabled={loadingVideos}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
              >
                {loadingVideos ? 'Buscando...' : 'Videos de esta Ubicación'}
              </button>

              {/* Botón para buscar con el término actual si existe */}
              {searchTerm.trim() && (
                <button
                  onClick={onSearchWithTerm}
                  disabled={loadingVideos}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
                >
                  {loadingVideos ? 'Buscando...' : `Buscar "${searchTerm}" aquí`}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">{locationName}</p>
            <p className="text-xs text-gray-500 mb-4">
              Haz clic en ciudades o lugares con nombre específico en el mapa.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
            >
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationPopup;