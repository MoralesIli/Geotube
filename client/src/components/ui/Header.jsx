import React from 'react';

const Header = ({ title, onSettingsClick, onHistoryClick }) => (
  <header className="flex justify-between items-center bg-gray-900/70 border-b border-cyan-500/20 p-4">
    <h1 className="text-cyan-300 text-lg font-bold">{title}</h1>
    <div className="flex items-center gap-3">
      <button
        onClick={onHistoryClick}
        className="text-cyan-400 hover:text-cyan-200 transition"
      >
        🕓 Historial
      </button>
      <button
        onClick={onSettingsClick}
        className="text-cyan-400 hover:text-cyan-200 transition"
      >
        ⚙️ Ajustes
      </button>
    </div>
  </header>
);

export default Header;
