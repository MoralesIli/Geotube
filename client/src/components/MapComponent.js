import React, { useCallback } from 'react';
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import MobileControls from './MobileControls';

const MapComponent = ({
  viewport,
  setViewport,
  isAnimating,
  MAPBOX_TOKEN,
  showLocationPopup,
  clickedLocation,
  isValidLocation,
  clickedLocationName,
  setShowLocationPopup,
  searchVideosForClickedLocation,
  loadingVideos,
  searchTerm,
  fetchVideos,
  userLocation,
  searchLocation,
  videos,
  handleMarkerClick,
  handleMarkerDoubleClick,
  isMobile,
  handleMapClick,
  getUserLocation,
  toggleVideosVisibility,
  youtubeAvailable,
  regionConfig,
  currentRegion,
  showSidebar
}) => {

  const handleMapMove = useCallback((evt) => {
    if (!isAnimating) {
      setViewport(evt.viewState);
    }
  }, [isAnimating, setViewport]);

  return (
    <div className={`relative mobile-map-container ${isMobile ? "h-full" : "flex-1"}`}>
      <Map
        {...viewport}
        style={{ width: "100%", height: "100%" }}
        onMove={handleMapMove}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      >
        {/* Ocultar controles en móvil */}
        {!isMobile && <NavigationControl position="top-right" />}

        {showLocationPopup && clickedLocation && (
          <Popup
            latitude={clickedLocation.latitude}
            longitude={clickedLocation.longitude}
            closeButton={false}
            closeOnClick={false}
            onClose={() => setShowLocationPopup(false)}
            anchor="top"
            className={`rounded-xl shadow-2xl border border-gray-300 bg-white/95 backdrop-blur-md ${
              isMobile ? "max-w-[90vw]" : ""
            }`}
          >
            <div
              className={`text-center text-gray-800 ${
                isMobile ? "p-3 w-auto" : "p-4 w-65"
              }`}
            >
              <h3
                className={`font-semibold leading-snug ${
                  isMobile ? "text-base mb-1" : "text-lg mb-2"
                }`}
              >
                {isValidLocation
                  ? clickedLocationName
                  : "Ubicación no disponible"}
              </h3>

              {isValidLocation ? (
                <>
                  <p
                    className={`text-gray-600 mb-3 ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    Coordenadas:
                    <br />
                    <span className="font-medium">
                      {clickedLocation.latitude.toFixed(4)},{" "}
                      {clickedLocation.longitude.toFixed(4)}
                    </span>
                  </p>

                  <div
                    className={`space-y-2 ${
                      isMobile ? "space-y-1" : "space-y-2"
                    }`}
                  >
                    <button
                      onClick={searchVideosForClickedLocation}
                      disabled={loadingVideos}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      {loadingVideos
                        ? "Buscando..."
                        : "Videos de esta Ubicación"}
                    </button>

                    {searchTerm.trim() && (
                      <button
                        onClick={() => {
                          fetchVideos(searchTerm);
                          setShowLocationPopup(false);
                        }}
                        disabled={loadingVideos}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
                      >
                        {loadingVideos
                          ? "Buscando..."
                          : `Buscar "${searchTerm}" aquí`}
                      </button>
                    )}

                    <button
                      onClick={() => setShowLocationPopup(false)}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className={`text-gray-600 mb-2 ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {clickedLocationName}
                  </p>
                  <p
                    className={`text-gray-500 mb-3 ${
                      isMobile ? "text-xs" : "text-xs"
                    }`}
                  >
                    Haz clic en ciudades o lugares con nombre específico en
                    el mapa.
                  </p>
                  <button
                    onClick={() => setShowLocationPopup(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                  >
                    Entendido
                  </button>
                </>
              )}
            </div>
          </Popup>
        )}

        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          >
            <div className="relative">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full animate-ping absolute"></div>
              <div className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full"></div>
            </div>
          </Marker>
        )}

        {searchLocation && (
          <Marker
            latitude={searchLocation.latitude}
            longitude={searchLocation.longitude}
          >
            <div className="relative">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full animate-ping absolute"></div>
              <div className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full"></div>
            </div>
          </Marker>
        )}

        {videos.map((video) => (
          <Marker
            key={video.youtube_video_id}
            latitude={video.latitude}
            longitude={video.longitude}
          >
            <div
              onClick={() => handleMarkerClick(video)}
              onDoubleClick={() => handleMarkerDoubleClick(video)}
              className="cursor-pointer text-2xl sm:text-3xl transform hover:scale-125 sm:hover:scale-150 transition-all duration-300"
              title="Click para vista previa, Doble click para ver completo"
            >
              <div className="relative">
                <div
                  className={`border-2 border-white rounded-full ${
                    video.isSearchResult
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  } ${isMobile ? "h-5 w-5" : "h-6 w-6"}`}
                ></div>
              </div>
            </div>
          </Marker>
        ))}
      </Map>

      {/* ✅ MobileControls integrado dentro del contenedor del mapa */}
      <MobileControls
        isMobile={isMobile}
        isAnimating={isAnimating}
        getUserLocation={getUserLocation}
        toggleVideosVisibility={toggleVideosVisibility}
        youtubeAvailable={youtubeAvailable}
        regionConfig={regionConfig}
        currentRegion={currentRegion}
        showSidebar={showSidebar}
      />
    </div>
  );
};

export default MapComponent;