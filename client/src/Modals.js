import React from 'react';
import AuthModal from './components/models/AuthModal';
import ChangePasswordModal from './components/models/ChangePasswordModal';
import ChangePhotoModal from './components/models/ChangePhotoModal';
import CommentsModal from './components/models/CommentsModal';

const Modals = ({
  showAuthModal,
  setShowAuthModal,
  showPasswordModal,
  setShowPasswordModal,
  showPhotoModal,
  setShowPhotoModal,
  showCommentsModal,
  setShowCommentsModal,
  showHistoryModal,
  setShowHistoryModal,
  showSettings,
  setShowSettings,
  user,
  handleLogin,
  handlePhotoUpdate,
  userHistory,
  clearUserHistory,
  fetchUserHistory,
  isMobile
}) => {
  // Modal de Historial
  const HistoryModal = () => {
    if (!showHistoryModal) return null;

    return (
      <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`modal-content w-full ${
            isMobile ? "max-w-full h-full" : "max-w-4xl max-h-[90vh]"
          } bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 overflow-hidden`}
        >
          <div className="relative p-4 sm:p-8 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Historial de Videos Vistos
                </h2>
                <p className="text-cyan-300/80 text-xs sm:text-sm mt-1 sm:mt-2">
                  {userHistory.length} video
                  {userHistory.length !== 1 ? "s" : ""} en tu historial
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-cyan-400 hover:text-cyan-300 text-2xl w-8 h-8 sm:w-10 sm:h-10 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
            {userHistory.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 sm:w-12 sm:h-12 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-2">
                  Historial Vacío
                </h3>
                <p className="text-gray-400 text-sm">
                  Los videos que veas aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {userHistory.map((item, index) => (
                  <div
                    key={index}
                    className="group bg-gray-800/50 hover:bg-cyan-500/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-700 hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-12 h-9 sm:w-16 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors text-xs sm:text-sm leading-tight mb-1">
                          {item.titulo}
                        </h4>
                        <p className="text-cyan-400 text-xs mb-1 sm:mb-2 truncate">
                          {item.location_name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            Visto el{" "}
                            {new Date(item.fecha).toLocaleDateString("es-MX")}
                          </span>
                          <span>
                            {new Date(item.fecha).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {userHistory.length > 0 && (
            <div className="p-4 sm:p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={clearUserHistory}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                >
                  Limpiar Todo el Historial
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 text-sm sm:text-base"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal de Ajustes
  const SettingsModal = () => {
    if (!showSettings) return null;

    return (
      <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          className={`modal-content w-full ${
            isMobile ? "max-w-full" : "max-w-md"
          } bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20`}
        >
          <div className="p-4 sm:p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Ajustes
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-cyan-400 hover:text-cyan-300 text-xl w-8 h-8 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowCommentsModal(true);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                <div className="flex items-center gap-2 sm:gap-3 justify-center">
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
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <span>Comentarios del Proyecto</span>
                </div>
              </button>

              <button
                onClick={async () => {
                  await fetchUserHistory();
                  setShowSettings(false);
                  setShowHistoryModal(true);
                }}
                className="w-full group bg-gray-700/50 hover:bg-cyan-500/20 border border-gray-600 hover:border-cyan-500/50 rounded-xl p-3 sm:p-4 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white group-hover:text-cyan-300 text-sm sm:text-base">
                      Ver Historial Completo
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Explora todos los videos que has visto
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "¿Estás seguro de que quieres limpiar todo tu historial? Esta acción no se puede deshacer."
                    )
                  ) {
                    clearUserHistory();
                    setShowSettings(false);
                  }
                }}
                className="w-full group bg-gray-700/50 hover:bg-red-500/20 border border-gray-600 hover:border-red-500/50 rounded-xl p-3 sm:p-4 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white group-hover:text-red-300 text-sm sm:text-base">
                      Limpiar Historial
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Eliminar todos los registros de visualización
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        user={user}
      />

      <ChangePhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={user}
        onPhotoUpdate={handlePhotoUpdate}
      />

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        user={user}
      />

      <HistoryModal />
      <SettingsModal />
    </>
  );
};

export default Modals;