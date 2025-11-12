// src/utils/helpers.js

import { restrictedCities, restrictedCountries } from "./restrictions";

// 🚫 Revisa si un query o ubicación está restringida
export const checkRestrictions = (query, locationData = null) => {
  console.log("Verificando restricciones para:", query, locationData);

  const restrictedPatterns = new RegExp(
    restrictedCities.map((city) => city.toLowerCase()).join("|"),
    "i"
  );

  if (restrictedPatterns.test(query.toLowerCase())) {
    console.log("Query restringido detectado:", query);
    return {
      restricted: true,
      reason: "query",
      message: "Videos no disponibles en esta región (restricción de YouTube).",
    };
  }

  if (locationData && locationData.countryCode) {
    const countryCode = locationData.countryCode.toUpperCase();
    if (restrictedCountries.includes(countryCode)) {
      console.log("País restringido detectado:", countryCode);
      return {
        restricted: true,
        reason: "country",
        message:
          "YouTube no está disponible en este país (restricción gubernamental).",
      };
    }
  }

  if (locationData && locationData.locationName) {
    if (restrictedPatterns.test(locationData.locationName.toLowerCase())) {
      console.log(
        "Ubicación restringida detectada:",
        locationData.locationName
      );
      return {
        restricted: true,
        reason: "location",
        message:
          "Videos no disponibles en esta ubicación (restricción de YouTube).",
      };
    }
  }

  console.log("Ubicación permitida");
  return { restricted: false };
};

// Crea un título de sección lateral según el tipo de filtro
export const getSidebarTitle = (activeFilter, context = {}) => {
  const { youtubeAvailable, activeSearchTerm, searchTerm, clickedLocationName, selectedCategory } = context;

  if (!youtubeAvailable) {
    return 'YouTube No Disponible';
  }

  const titles = {
    popular: 'Videos Populares',
    other: 'Videos Cercanos',
    current: 'Videos en tu Ubicación',
    search: activeSearchTerm
      ? `Videos de "${activeSearchTerm}"`
      : `Videos de "${searchTerm}"`,
    mexico: 'Videos Populares de México',
    clicked: clickedLocationName
      ? `Videos en ${clickedLocationName}`
      : 'Videos Seleccionados',
    category: selectedCategory
      ? `Videos de ${selectedCategory.name}`
      : 'Videos por Categoría',
    unavailable: 'Servicio No Disponible',
    'no-videos': 'No Hay Videos'
  };

  return titles[activeFilter] || 'Videos con Vista Previa';
};
// Interpolación para animar el mapa (movimiento suave)
export const animateViewport = (start, end, progress) => ({
  latitude: start.latitude + (end.latitude - start.latitude) * progress,
  longitude: start.longitude + (end.longitude - start.longitude) * progress,
  zoom: start.zoom + (end.zoom - start.zoom) * progress,
});
