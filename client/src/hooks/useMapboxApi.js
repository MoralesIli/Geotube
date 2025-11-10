import { useCallback } from 'react';
import { restrictedCountries } from '../utils/restrictions';

export const useMapboxAPI = (MAPBOX_TOKEN_PARAM) => {
  const MAPBOX_TOKEN = MAPBOX_TOKEN_PARAM || process.env.REACT_APP_MAPBOX_TOKEN;

  const isValidLocationType = useCallback((feature) => {
    const validTypes = ['country', 'region', 'place', 'locality', 'neighborhood', 'address'];
    return feature.place_type?.some(type => validTypes.includes(type));
  }, []);

  const isValidMapLocation = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&types=country,region,place,locality,neighborhood,address&limit=1&language=es`
      );

      if (!response.ok)
        return { isValid: false, placeName: null, featureType: 'unknown' };

      const data = await response.json();
      if (!data.features?.length) return { isValid: false, placeName: null, featureType: 'unknown' };

      const feature = data.features[0];
      const placeName = feature.place_name;
      const featureType = feature.place_type?.[0] || 'unknown';
      const countryCode = feature.properties.short_code?.toUpperCase();

      if (countryCode && restrictedCountries.includes(countryCode)) {
        return {
          isValid: false,
          placeName: 'Ubicación en país restringido',
          featureType: 'restricted',
          countryCode
        };
      }

      const invalidPatterns = [
        /unamed road/i, /ocean/i, /sea/i, /pacific ocean/i, /atlantic ocean/i,
        /indian ocean/i, /arctic ocean/i, /null/i, /undefined/i, /^\s*$/,
        /mar/i, /gulf/i, /bay/i, /strait/i, /channel/i
      ];

      const isValid = isValidLocationType(feature);
      const hasValidName = !invalidPatterns.some(p => p.test(placeName)) && placeName.trim().length > 0;

      return {
        isValid: isValid && hasValidName,
        placeName: isValid && hasValidName ? placeName : null,
        featureType,
        countryCode
      };
    } catch (error) {
      console.error('Error verificando ubicación:', error);
      return { isValid: false, placeName: null, featureType: 'unknown' };
    }
  }, [MAPBOX_TOKEN, isValidLocationType]);

  const getLocationCoordinates = useCallback(async (placeName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?` +
        `access_token=${MAPBOX_TOKEN}&types=country,region,place,locality,neighborhood,address&limit=1&language=es`
      );

      if (!response.ok) throw new Error('Error en geocoding');
      const data = await response.json();

      if (!data.features?.[0]) throw new Error('Ubicación no encontrada.');
      const feature = data.features[0];

      if (!isValidLocationType(feature)) {
        throw new Error('Tipo de ubicación no válido.');
      }

      const [longitude, latitude] = feature.center;
      const locationName = feature.place_name;
      const countryCode = feature.properties.short_code?.toUpperCase();

      return { latitude, longitude, locationName, countryCode };
    } catch (error) {
      console.warn('Error obteniendo coordenadas:', error);
      throw error;
    }
  }, [MAPBOX_TOKEN, isValidLocationType]);

  const getLocationName = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&types=place,locality&limit=1&language=es`
      );

      if (!response.ok) throw new Error('Error en geocoding');
      const data = await response.json();
      return data.features?.[0]?.place_name || `Ubicación (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    } catch {
      return 'Ubicación actual';
    }
  }, [MAPBOX_TOKEN]);

  return { isValidMapLocation, getLocationCoordinates, getLocationName, isValidLocationType };
};
