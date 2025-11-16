import React from 'react';
import YouTube from 'react-youtube';

const VideoSidebar = ({
  isMobile,
  showSidebar,
  setShowSidebar, // Esta prop debe venir del padre
  getSidebarTitle,
  getSidebarSubtitle,
  categories,
  clickedLocation,
  isValidLocation,
  userLocation,
  searchVideosByCategory,
  selectedCategory,
  selectedVideo,
  setSelectedVideo,
  handleWatchComplete,
  videos,
  handleVideoClick,
  handleVideoDoubleClick,
  formatDuration,
  hasMoreVideos,
  isLoadingMore,
  loadMoreVideos,
  loadingVideos,
  activeFilter,
  fetchOtherVideos,
  fetchPopularVideos,
  clickedLocationName // Esta prop debe venir del padre
}) => {

  // Función para manejar el cierre del sidebar en móvil
  const handleCloseSidebar = () => {
    if (setShowSidebar) {
      setShowSidebar(false);
    }
  };

  // Función auxiliar para obtener el nombre de ubicación
  const getLocationDisplayName = () => {
    if (clickedLocationName) {
      return clickedLocationName;
    }
    return "esta ubicación";
  };

  if (isMobile && showSidebar) {
    return (
      <div className={`videos-container-mobile video-scrollbar`}>
        {/* Header con botón de cerrar */}
        <div className="videos-header relative">
          <button
            onClick={handleCloseSidebar}
            className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full transition-all duration-300 z-10"
            title="Cerrar lista de videos"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3>{getSidebarTitle()}</h3>
          <p>{getSidebarSubtitle()}</p>
        </div>

        {/* Categorías en móvil - SCROLL HORIZONTAL */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const hasValidLocation =
                (clickedLocation && isValidLocation) || userLocation;

              return (
                <button
                  key={category.id}
                  onClick={() => searchVideosByCategory(category)}
                  disabled={!hasValidLocation}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex-shrink-0 ${
                    selectedCategory?.id === category.id
                      ? `ring-1 ring-white ${category.bgColor}`
                      : `bg-gradient-to-r ${category.color} hover:shadow-md`
                  }`}
                  title={
                    hasValidLocation
                      ? category.name
                      : "Primero activa tu ubicación o selecciona una en el mapa"
                  }
                >
                  <span className="text-xs">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de videos móvil */}
        <div className="flex-1 overflow-y-auto py-2">
          {videos.length > 0 ? (
            videos.map((video) => (
              <div
                key={video.youtube_video_id}
                onClick={() => handleVideoClick(video)}
                onDoubleClick={() => handleVideoDoubleClick(video)}
                className="video-item-mobile"
                title="Toca para vista previa, Doble toque para ver completo"
              >
                <img
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="video-thumbnail-mobile"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/120x90/1f2937/6b7280?text=Video";
                  }}
                />
                <div className="video-content-mobile">
                  <h4 className="video-title-mobile">{video.title}</h4>
                  <p className="video-channel-mobile">{video.channelTitle}</p>
                  <p className="video-views-mobile">
                    {video.views.toLocaleString()} vistas
                  </p>
                  {video.confirmedLocation && (
                    <div className="location-confirmed">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ubicación confirmada</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            !loadingVideos && (
              <div className="no-videos-message">
                <p>No se encontraron videos</p>
                <p className="text-sm text-gray-500 mt-1">
                  {userLocation || clickedLocation
                    ? "Usa los botones para cargar videos"
                    : "Activa tu ubicación o usa la búsqueda"}
                </p>
              </div>
            )
          )}
          
          {loadingVideos && (
            <div className="loading-videos">
              <div className="loading-spinner"></div>
              <span>Cargando videos...</span>
            </div>
          )}

          {hasMoreVideos && !loadingVideos && (
            <div className="flex justify-center mt-4 mb-2">
              <button
                onClick={loadMoreVideos}
                disabled={isLoadingMore}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                    Cargando...
                  </div>
                ) : (
                  "Mostrar más videos"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isMobile && showSidebar) {
    return (
      <div className="w-1/3 p-6 bg-gradient-to-b from-slate-900 via-purple-900 to-blue-900 overflow-y-auto flex flex-col">
        {/* Encabezado del sidebar */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
            {getSidebarTitle()}
          </h2>
          <p className="text-cyan-300 text-sm mt-2">
            {getSidebarSubtitle()}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="grid gap-3 mb-6 grid-cols-2">
          <button
            onClick={fetchOtherVideos}
            disabled={
              (!userLocation && !clickedLocation) || loadingVideos
            }
            className={`font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
              activeFilter === "other"
                ? "bg-cyan-600 border-2 border-cyan-400"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            } py-3 px-4`}
            title={
              clickedLocation && isValidLocation
                ? `Buscar videos cercanos a ${getLocationDisplayName()}`
                : userLocation
                ? "Buscar videos cercanos a tu ubicación"
                : "Activa tu ubicación o selecciona una en el mapa"
            }
          >
            {loadingVideos && activeFilter === "other"
              ? "Cargando..."
              : "Videos Cercanos"}
          </button>
          <button
            onClick={fetchPopularVideos}
            disabled={
              (!userLocation && !clickedLocation) || loadingVideos
            }
            className={`font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
              activeFilter === "popular"
                ? "bg-orange-600 border-2 border-orange-400"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            } py-3 px-4`}
            title={
              clickedLocation && isValidLocation
                ? `Buscar videos populares en ${getLocationDisplayName()}`
                : userLocation
                ? "Buscar videos populares en tu ubicación"
                : "Activa tu ubicación o selecciona una en el mapa"
            }
          >
            {loadingVideos && activeFilter === "popular"
              ? "Cargando..."
              : "Populares"}
          </button>
        </div>

        {loadingVideos && (
          <div className="glass-effect bg-gray-800/50 rounded-2xl text-center p-4 mb-6">
            <p className="text-cyan-400 flex items-center justify-center gap-2 text-sm">
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></span>
              {activeFilter === "search"
                ? "Buscando videos..."
                : "Cargando videos..."}
            </p>
          </div>
        )}

        {selectedVideo && (
          <div className="glass-effect bg-gray-800/50 rounded-2xl border-2 border-cyan-500/50 p-4 mb-6">
            <div className="text-center mb-3">
              <h3 className="font-bold text-cyan-300 text-lg">
                Vista Previa: {selectedVideo.channelTitle}
              </h3>
              <p className="text-gray-300 mt-1 line-clamp-2 text-sm">
                {selectedVideo.title}
              </p>
            </div>
            <div className="bg-black rounded-lg overflow-hidden mb-3">
              <YouTube
                videoId={selectedVideo.youtube_video_id}
                opts={{
                  width: "100%",
                  height: "200",
                  playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    rel: 0,
                  },
                }}
              />
            </div>
            <div className="grid gap-3 grid-cols-2">
              <button
                onClick={() => setSelectedVideo(null)}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={handleWatchComplete}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm"
              >
                Ver Completo
              </button>
            </div>
          </div>
        )}

        {/* Lista de videos - COMPLETA PARA ESCRITORIO */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          {videos.length > 0 ? (
            <>
              {videos.map((video) => (
                <div
                  key={video.youtube_video_id}
                  onClick={() => handleVideoClick(video)}
                  onDoubleClick={() => handleVideoDoubleClick(video)}
                  className={`glass-effect bg-gray-800/50 rounded-2xl cursor-pointer transform hover:scale-102 transition-all duration-300 border-l-4 ${
                    video.isSearchResult
                      ? "border-l-yellow-500 bg-yellow-500/10"
                      : video.isCurrentLocation
                      ? "border-l-green-500 bg-green-500/10"
                      : "border-l-cyan-500 bg-cyan-500/10"
                  } ${
                    selectedVideo?.youtube_video_id ===
                    video.youtube_video_id
                      ? "ring-2 ring-yellow-400"
                      : ""
                  } p-4`}
                  title="Click para vista previa, Doble click para ver completo"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                        alt="Miniatura del video"
                        className="rounded-lg object-cover w-20 h-15"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/120x90/1f2937/6b7280?text=Video";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`rounded-full ${
                            video.isSearchResult
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : "bg-gradient-to-r from-green-500 to-emerald-500"
                          } h-3 w-3`}
                        ></div>
                        <p className="font-bold text-white text-sm truncate">
                          {video.channelTitle}
                        </p>
                      </div>
                      <p className="text-gray-300 line-clamp-2 mb-1 text-xs">
                        {video.title}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-300 text-xs">
                          {video.views.toLocaleString()} vistas
                        </span>
                        {video.duration &&
                          video.duration !== "PT0S" && (
                            <span className="text-cyan-400 text-xs">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                      </div>
                      <p className="text-cyan-400 mt-1 text-xs truncate">
                        {video.location_name}
                      </p>
                      {video.confirmedLocation && (
                        <div className="flex items-center gap-1 mt-1">
                          <svg
                            className="w-3 h-3 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-green-400 text-xs">
                            Ubicación confirmada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {hasMoreVideos && (
                <div className="flex justify-center mt-4 mb-2">
                  <button
                    onClick={loadMoreVideos}
                    disabled={isLoadingMore}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                        Cargando...
                      </div>
                    ) : (
                      "Mostrar más videos"
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            !loadingVideos &&
            activeFilter !== "no-videos" && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">
                  No se encontraron videos
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {userLocation || clickedLocation
                    ? "Usa los botones para cargar videos"
                    : "Activa tu ubicación o usa la búsqueda"}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VideoSidebar;