import React from 'react';

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-10 text-cyan-400">
    <svg className="w-8 h-8 animate-spin mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
      <path className="opacity-75" strokeWidth="4" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <p className="text-sm text-cyan-300">Cargando...</p>
  </div>
);

export default Loader;
