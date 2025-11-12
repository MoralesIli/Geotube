// src/utils/formatters.js

//  Formatea duración tipo ISO (PT3M10S → 3:10)
export const formatDuration = (duration) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '').replace('H', '') || '0';
  const minutes = (match[2] || '').replace('M', '') || '0';
  const seconds = (match[3] || '').replace('S', '') || '0';
  return hours !== '0'
    ? `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
    : `${minutes}:${seconds.padStart(2, '0')}`;
};

//  Fecha local bonita
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

// Hora local corta
export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit'
  });
};
