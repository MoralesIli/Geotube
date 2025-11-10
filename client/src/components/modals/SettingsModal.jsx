import React from 'react';

const SettingsModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Ajustes
          </h2>
          <button onClick={onClose} className="text-cyan-400 hover:text-cyan-200 text-2xl">×</button>
        </div>

        {/* Contenido */}
        <div className="p-6 text-gray-300 space-y-3">
          <p>Proyecto desarrollado en React y Mapbox con integración de YouTube API.</p>
          <p>Autor: <span className="text-cyan-400">Tu nombre o equipo</span></p>
          <p className="text-sm text-gray-400">Versión 1.0.0</p>
        </div>

        <div className="p-4 border-t border-gray-700 text-right">
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl transition">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
