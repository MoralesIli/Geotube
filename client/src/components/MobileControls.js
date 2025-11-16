import React, { useState } from 'react';

const MobileControls = ({
  isMobile,
  isAnimating,
  getUserLocation,
  toggleVideosVisibility,
  youtubeAvailable,
  regionConfig,
  currentRegion,
  showSidebar
}) => {
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // ✅ Función mejorada para manejar clic en ubicación
  const handleGetUserLocation = async () => {
    if (isAnimating || isLocationLoading) {
      console.log("Ya se está obteniendo la ubicación...");
      return;
    }

    setIsLocationLoading(true);
    try {
      await getUserLocation();
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
    } finally {
      // ✅ Timeout para resetear el estado de carga
      setTimeout(() => {
        setIsLocationLoading(false);
      }, 2000);
    }
  };

  // Controles para ESCRITORIO - Integrado con controles de Mapbox
  if (!isMobile) {
    return (
      <div className="absolute top-4 right-20 z-10">
        <button
          onClick={handleGetUserLocation}
          disabled={isAnimating || isLocationLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 px-4 py-2 text-sm border-2 border-white/20"
        >
          {(isAnimating || isLocationLoading) ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Moviendo...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Mi Ubicación
            </>
          )}
        </button>
      </div>
    );
  }

  // Controles para MÓVIL
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Botón de ubicación - INTEGRADO CON CONTROLES DE MAPBOX (ESQUINA SUPERIOR DERECHA) */}
      <div className="absolute top-20 right-4 pointer-events-auto">
        <button
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-2xl border-2 border-white transition-all duration-300 disabled:opacity-50"
          onClick={handleGetUserLocation}
          title="Mi ubicación actual"
          disabled={isAnimating || isLocationLoading}
        >
          {(isAnimating || isLocationLoading) ? (
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Botón de mostrar/ocultar videos - ABAJO CENTRADO */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <button
          className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-2xl shadow-2xl border-2 border-white/20 transition-all duration-300 transform hover:scale-105"
          onClick={toggleVideosVisibility}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {showSidebar ? 'Ocultar Videos' : 'Mostrar Videos'}
        </button>
      </div>

      {/* Indicador de animación en móvil */}
      {(isAnimating || isLocationLoading) && (
        <div className="absolute top-28 left-4 right-4 pointer-events-auto">
          <div className="glass-effect bg-gray-800/80 px-3 py-2 rounded-lg">
            <p className="text-sm text-cyan-400 flex items-center gap-2 justify-center">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></span>
              Obteniendo ubicación...
            </p>
          </div>
        </div>
      )}

      {/* Indicador de YouTube no disponible */}
      {!youtubeAvailable && (
        <div className="absolute top-36 left-4 right-4 pointer-events-auto">
          <div className="glass-effect bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-2">
            <p className="text-sm text-red-300 flex items-center gap-2 justify-center">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              YouTube no disponible en {regionConfig[currentRegion]?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileControls;