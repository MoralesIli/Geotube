import React from 'react';

const SearchSuggestions = ({ show, suggestions = [], onSelect, isMobile }) => {
  if (!show || suggestions.length === 0) return null;

  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-gray-600 
      rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto ${isMobile ? 'mx-2' : ''}`}
    >
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="w-full text-left px-4 py-3 hover:bg-cyan-500/20 border-b border-gray-700 last:border-b-0 
          transition-all duration-200 text-white hover:text-cyan-300"
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm truncate">{suggestion}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SearchSuggestions;
