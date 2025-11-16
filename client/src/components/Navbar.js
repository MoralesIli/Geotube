import React from 'react';

const Navbar = ({
  isMobile,
  youtubeAvailable,
  regionConfig,
  currentRegion,
  categories,
  clickedLocation,
  isValidLocation,
  userLocation,
  searchVideosByCategory,
  selectedCategory,
  showSearchBar,
  setShowSearchBar,
  searchTerm,
  handleSearchChange,
  handleSearchSubmit,
  handleSearchFocus,
  searchError,
  userLocationName,
  user,
  showProfile,
  setShowProfile,
  setShowAuthModal,
  setShowSettings,
  setShowPhotoModal,
  setShowPasswordModal,
  handleLogout,
  SearchSuggestions
}) => {
  return (
    <div
      className={`navbar fixed top-0 left-0 w-full ${
        isMobile ? "h-16" : "h-20"
      } flex items-center justify-between px-4 sm:px-8 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700`}
    >
      {/* Logo y título */}
      <div className="flex items-center gap-2 sm:gap-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1
            className={`font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 ${
              isMobile ? "text-xl" : "text-3xl"
            }`}
          >
            VideoMap
          </h1>

          {/* Indicadores de estado - SOLO ESCRITORIO */}
          {!isMobile && !youtubeAvailable && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
              <p className="text-red-300 text-sm font-medium flex items-center gap-2">
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
                YouTube no disponible - {regionConfig[currentRegion]?.name}
              </p>
            </div>
          )}
        </div>

        {/* Botones de categorías - SOLO ESCRITORIO */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            {categories.map((category) => {
              const hasValidLocation =
                (clickedLocation && isValidLocation) || userLocation;

              return (
                <button
                  key={category.id}
                  onClick={() => searchVideosByCategory(category)}
                  disabled={!hasValidLocation}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium min-w-[90px] ${
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
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Controles de búsqueda y usuario */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Botón de búsqueda en móvil */}
        {isMobile && (
          <button
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-2 rounded-lg transition-all duration-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        )}

        {/* Barra de búsqueda */}
        {(!isMobile || showSearchBar) && (
          <div className="search-container relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar términos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className={`search-input glass-effect bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isMobile ? "w-48 pr-8" : "w-80 pr-10"
                  }`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {!isMobile && (
                <button
                  type="submit"
                  className="ml-2 btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-3 py-2 rounded-lg transition-all duration-300 text-sm"
                >
                  Buscar
                </button>
              )}
            </form>

            <SearchSuggestions />

            {searchError && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-red-300 text-xs">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 flex-shrink-0"
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
                  <span>{searchError}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información de ubicación - SOLO ESCRITORIO */}
        {!isMobile && userLocationName && (
          <div className="text-right hidden sm:block">
            <p className="text-sm text-cyan-400">Tu ubicación actual</p>
            <p className="text-xs text-gray-300 truncate max-w-[120px]">
              {userLocationName}
            </p>
          </div>
        )}

        {/* Botones de usuario */}
        {user ? (
          <>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary flex items-center gap-1 sm:gap-2 bg-gray-700 hover:bg-gray-600 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-300"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {!isMobile && <span className="text-sm">Ajustes</span>}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`user-avatar flex items-center justify-center text-white font-bold overflow-hidden border-2 border-cyan-500 ${
                  isMobile ? "w-8 h-8 text-sm" : "w-10 h-10 text-lg"
                } rounded-full`}
                title={user.nombre}
              >
                {user.foto ? (
                  <img
                    src={user.foto}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {showProfile && (
                <div
                  className={`absolute right-0 glass-effect bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 border border-gray-600 overflow-hidden ${
                    isMobile ? "top-10 w-64" : "top-12 w-80"
                  }`}
                >
                  <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                    <div className="flex items-center gap-3">
                      {user.foto ? (
                        <img
                          src={user.foto}
                          alt="Foto de perfil"
                          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-cyan-500 shadow-lg"
                        />
                      ) : (
                        <div
                          className={`bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                            isMobile
                              ? "w-10 h-10 text-lg"
                              : "w-14 h-14 text-xl"
                          }`}
                        >
                          {user.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-cyan-400 text-sm sm:text-lg truncate">
                          {user.nombre}
                        </p>
                        <p className="text-gray-300 text-xs sm:text-sm truncate">
                          {user.email}
                        </p>
                        {user.google_id && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <p className="text-xs text-green-400 font-medium">
                              Cuenta Google
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        setShowPhotoModal(true);
                      }}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-cyan-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-medium">Cambiar Foto</span>
                    </button>

                    {!user.google_id && (
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group text-sm sm:text-base"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-cyan-400 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                        <span className="font-medium">
                          Cambiar Contraseña
                        </span>
                      </button>
                    )}

                    <div className="border-t border-gray-700 my-1 sm:my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 text-red-400 hover:text-red-300 group text-sm sm:text-base"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="font-medium">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-primary flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 text-sm"
          >
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {!isMobile && <span>Iniciar Sesión</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;