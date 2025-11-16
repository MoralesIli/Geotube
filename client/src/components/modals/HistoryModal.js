// components/modals/HistoryModal.js
import React from 'react';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  userHistory, 
  onClearHistory 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-content w-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 max-h-[90vh] overflow-hidden">
        <div className="relative p-8 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Historial de Videos Vistos
              </h2>
              <p className="text-cyan-300/80 text-sm mt-2">
                {userHistory.length} video{userHistory.length !== 1 ? 's' : ''} en tu historial
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-cyan-400 hover:text-cyan-300 text-2xl w-10 h-10 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {userHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Historial Vacío</h3>
              <p className="text-gray-400">Los videos que veas aparecerán aquí</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userHistory.map((item, index) => (
                <div key={index} className="group bg-gray-800/50 hover:bg-cyan-500/10 rounded-2xl p-4 border border-gray-700 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors text-sm leading-tight mb-1">
                        {item.titulo}
                      </h4>
                      <p className="text-cyan-400 text-xs mb-2">{item.location_name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Visto el {new Date(item.fecha).toLocaleDateString('es-MX')}</span>
                        <span>{new Date(item.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {userHistory.length > 0 && (
          <div className="p-6 bg-gray-900/50 border-t border-gray-700">
            <div className="flex gap-3">
              <button
                onClick={onClearHistory}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Limpiar Todo el Historial
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
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

export default HistoryModal;