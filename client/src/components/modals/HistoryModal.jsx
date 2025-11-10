import React from 'react';
import { formatDate, formatTime } from '../../utils/formatters';

const HistoryModal = ({ show, onClose, userHistory = [], clearUserHistory, isMobile }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full ${isMobile ? 'max-w-full h-full' : 'max-w-4xl max-h-[90vh]'} 
          bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 overflow-hidden`}>
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Historial de Videos
            </h2>
            <p className="text-cyan-300/80 text-sm mt-1">{userHistory.length} video(s) vistos</p>
          </div>
          <button onClick={onClose} className="text-cyan-400 hover:text-cyan-200 text-2xl">×</button>
        </div>

        {/* Cuerpo */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {userHistory.length === 0 ? (
            <div className="text-center py-12 text-cyan-300">
              <p>No hay videos en tu historial.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userHistory.map((item, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/30 transition">
                  <h4 className="text-white font-semibold truncate">{item.titulo}</h4>
                  <p className="text-cyan-400 text-sm truncate">{item.location_name}</p>
                  <div className="text-gray-400 text-xs flex justify-between">
                    <span>{formatDate(item.fecha)}</span>
                    <span>{formatTime(item.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {userHistory.length > 0 && (
          <div className="p-4 sm:p-6 bg-gray-900/50 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
            <button
              onClick={clearUserHistory}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl hover:scale-105 transition">
              Limpiar Historial
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;
