import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';
import AuthModal from './components/models/AuthModal';
import ChangePasswordModal from './components/models/ChangePasswordModal';
import ChangePhotoModal from './components/models/ChangePhotoModal';
import CommentsModal from './components/models/CommentsModal';
import HistoryModal from './components/modals/HistoryModal';
import SettingsModal from './components/modals/SettingsModal';
import LocationPopup from './components/modals/LocationPopup';
import VideoPreviewModal from './components/modals/VideoPreviewModal';
import UserProfileModal from './components/modals/UserProfileModal';

const MainApp = () => {
  // Estados principales
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 2,
  });
  const [targetViewport, setTargetViewport] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // NUEVO ESTADO PARA TÉRMINO ACTIVO PERSISTENTE
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeFilter, setActiveFilter] = useState('mexico');
  const [nextPageToken, setNextPageToken] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);

  // NUEVOS ESTADOS PARA PAGINACIÓN
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Estados para geolocalización
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);

  // Estado para historial
  const [userHistory, setUserHistory] = useState([]);

  // Estados para región y disponibilidad
  const [currentRegion, setCurrentRegion] = useState('MX');
  const [youtubeAvailable, setYoutubeAvailable] = useState(true);
  const [youtubeError, setYoutubeError] = useState('');

  // Nuevos estados para sugerencias y validación
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Nuevos estados para categorías
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Referencias
  const animationRef = useRef();
  const startViewportRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // VARIABLES DE ENTORNO
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // PAÍSES Y CIUDADES RESTRINGIDAS - LISTA AMPLIADA (usando useMemo)
  const restrictedCountries = useMemo(() => ['KP', 'IR', 'SY', 'SS', 'CU', 'CN', 'TM', 'UZ', 'TJ', 'ER', 'SD', 'RU', 'BY', 'MM'], []);
  
  const restrictedCities = useMemo(() => [
    'pyongyang', 'corea del norte', 'north korea', 'korea dpr',
    'teherán', 'tehran', 'iran', 'irán', 
    'damasco', 'damascus', 'siria', 'syria',
    'juba', 'sudán del sur', 'south sudan',
    'la habana', 'havana', 'cuba',
    'beijing', 'pekín', 'shanghai', 'cantón', 'guangzhou', 'shenzhen', 'china',
    'ashgabat', 'asjabad', 'turkmenistán', 'turkmenistan',
    'tashkent', 'taskent', 'uzbekistán', 'uzbekistan',
    'dushanbe', 'tayikistán', 'tajikistan',
    'asmara', 'eritrea',
    'jartum', 'khartoum', 'sudán', 'sudan',
    'moscú', 'moscow', 'rusia', 'russia',
    'minsk', 'bielorrusia', 'belarus',
    'yangon', 'myanmar', 'birmania'
  ], []);

  // Configuración por región (usando useMemo)
  const regionConfig = useMemo(() => ({
    'MX': { 
      code: 'MX', 
      name: 'México',
      center: [23.6345, -102.5528],
      popularQueries: ['México', 'CDMX', 'Cancún', 'Guadalajara', 'Monterrey']
    },
    'US': { 
      code: 'US', 
      name: 'Estados Unidos',
      center: [39.8283, -98.5795],
      popularQueries: ['USA', 'New York', 'Los Angeles', 'Chicago', 'Miami']
    },
    'ES': { 
      code: 'ES', 
      name: 'España',
      center: [40.4637, -3.7492],
      popularQueries: ['España', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla']
    },
    'CN': { 
      code: 'CN', 
      name: 'China',
      center: [35.8617, 104.1954],
      popularQueries: ['China', 'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen']
    },
    'RU': { 
      code: 'RU', 
      name: 'Rusia',
      center: [61.5240, 105.3188],
      popularQueries: ['Rusia', 'Moscú', 'San Petersburgo', 'Novosibirsk', 'Ekaterimburgo']
    }
  }), []);

  // Categorías de búsqueda (usando useMemo)
  const categories = useMemo(() => [
    {
      id: 'cultura',
      name: 'Cultura',
      keywords: [
        'Cultura', 'Tradiciones', 'Costumbres', 'Festividades', 'Arte local',
        'Música tradicional', 'Baile típico', 'Vestimenta tradicional', 'Idioma y dialectos'
      ],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      id: 'gastronomia',
      name: 'Gastronomía',
      keywords: [
        'Comida típica', 'Gastronomía', 'Platos regionales', 'Bebidas tradicionales',
        'Mercados locales', 'Estilo de vida', 'Cocina tradicional', 'Recetas típicas'
      ],
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 'naturaleza',
      name: 'Naturaleza',
      keywords: [
        'Turismo', 'Lugares turísticos', 'Monumentos históricos', 'Parques naturales',
        'Playas', 'Montañas', 'Arquitectura', 'Paisajes', 'Atracciones turísticas'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      id: 'historia',
      name: 'Historia',
      keywords: [
        'Historia del lugar', 'Personajes históricos', 'Museos', 'Patrimonio mundial',
        'Arqueología', 'Antigüedades', 'Civilizaciones antiguas', 'Cultura prehispánica'
      ],
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500'
    },
    {
      id: 'entretenimiento',
      name: 'Entretenimiento',
      keywords: [
        'Eventos culturales', 'Festivales', 'Música moderna', 'Vida nocturna',
        'Noticias del país', 'Entretenimiento', 'Festivales musicales', 'Eventos actuales'
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  ], []);

  // PRIMERO: Definir la función para validar tipo de ubicación AL INICIO
  const isValidLocationType = useCallback((feature) => {
    const validTypes = ['country', 'region', 'place', 'locality', 'neighborhood', 'address'];
    return feature.place_type?.some(type => validTypes.includes(type));
  }, []);

  // ✅ NUEVA FUNCIÓN: Verificar si un query es una ubicación (coincidencia exacta)
  const isLocationQuery = useCallback(async (query) => {
    if (!query.trim()) return false;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&types=country,region,place,locality,neighborhood,address&limit=3&language=es`
      );

      if (!response.ok) return false;

      const data = await response.json();
      if (!data.features?.length) return false;

      // Buscar coincidencia casi exacta
      const normalizedQuery = query.trim().toLowerCase();
      const exactMatch = data.features.find(f =>
        f.text?.toLowerCase() === normalizedQuery ||
        f.place_name?.toLowerCase() === normalizedQuery
      );

      if (exactMatch && isValidLocationType(exactMatch)) {
        return true;
      }

      // Si no hay coincidencia exacta, se considera término normal
      return false;

    } catch (error) {
      console.warn('Error verificando si es ubicación:', error);
      return false;
    }
  }, [MAPBOX_TOKEN, isValidLocationType]);

  // Función para verificar si una ubicación es válida
  const isValidMapLocation = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=country,region,place,locality,neighborhood,address&` +
        `limit=1&` +
        `language=es`
      );
      
      if (!response.ok) return { isValid: false, placeName: null, featureType: 'unknown' };
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
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
        
        const isValid = isValidLocationType(feature);
        
        const invalidPatterns = [
          /unamed road/i,
          /ocean/i,
          /sea/i,
          /pacific ocean/i,
          /atlantic ocean/i,
          /indian ocean/i,
          /arctic ocean/i,
          /null/i,
          /undefined/i,
          /^\s*$/,
          /mar/i,
          /gulf/i,
          /bay/i,
          /strait/i,
          /channel/i
        ];
        
        const hasValidName = !invalidPatterns.some(pattern => pattern.test(placeName)) && 
                            placeName.trim().length > 0;
        
        return {
          isValid: isValid && hasValidName,
          placeName: isValid && hasValidName ? placeName : null,
          featureType,
          countryCode
        };
      }
      
      return { isValid: false, placeName: null, featureType: 'unknown' };
    } catch (error) {
      console.error('Error verificando ubicación:', error);
      return { isValid: false, placeName: null, featureType: 'unknown' };
    }
  }, [MAPBOX_TOKEN, restrictedCountries, isValidLocationType]);

  // Función para obtener coordenadas de ubicación
  const getLocationCoordinates = useCallback(async (placeName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=country,region,place,locality,neighborhood,address&` +
        `limit=1&` +
        `language=es`
      );
      
      if (!response.ok) throw new Error('Error en geocoding');
      
      const data = await response.json();
      
      if (data.features?.[0]) {
        const feature = data.features[0];
        
        // Validar que sea un tipo de ubicación permitido
        if (!isValidLocationType(feature)) {
          throw new Error('Tipo de ubicación no válido. Solo se permiten países, ciudades, lugares o direcciones específicas.');
        }

        const [longitude, latitude] = feature.center;
        const locationName = feature.place_name;
        const countryCode = feature.properties.short_code?.toUpperCase();
        
        return { latitude, longitude, locationName, countryCode };
      }
      
      throw new Error('Ubicación no encontrada. Verifica el nombre e intenta nuevamente.');
    } catch (error) {
      console.warn('Error obteniendo coordenadas:', error);
      throw error;
    }
  }, [MAPBOX_TOKEN, isValidLocationType]);

  const getLocationName = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=place,locality&` +
        `limit=1&` +
        `language=es`
      );
      
      if (!response.ok) throw new Error('Error en geocoding');
      
      const data = await response.json();
      
      if (data.features?.[0]) {
        return data.features[0].place_name;
      }
      
      return `Ubicación (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    } catch (error) {
      console.warn('Error obteniendo nombre de ubicación:', error);
      return `Ubicación actual`;
    }
  }, [MAPBOX_TOKEN]);

  // FUNCIÓN CORREGIDA: Buscar videos subidos en una ubicación específica
  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '', pageToken = '') => {
    try {
      const searchQuery = query || locationName.split(',')[0].trim();
      console.log('🎯 Buscando en YouTube para ubicación:', {
        query: searchQuery,
        location: locationName,
        coordinates: { latitude, longitude }
      });
      
      // Construir URL base
      let url = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `type=video&` +
        `maxResults=12&` +
        `relevanceLanguage=es&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `key=${YOUTUBE_API_KEY}`;

      // 🔥 AGREGAR FILTRO POR UBICACIÓN DE SUBIDA
      // Usar location y locationRadius para buscar videos subidos en esa área
      url += `&location=${latitude},${longitude}`;
      url += `&locationRadius=50km`; // Radio de 50km alrededor de la ubicación

      if (currentRegion) {
        url += `&regionCode=${currentRegion}`;
      }

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      console.log('📡 URL de búsqueda YouTube:', url);

      const searchResponse = await fetch(url);

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          setYoutubeAvailable(false);
          setYoutubeError('Límite de cuota excedido para YouTube API');
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('Error en YouTube API');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items?.length) {
        console.log('❌ No se encontraron videos subidos en esta ubicación');
        return {
          videos: [],
          nextPageToken: ''
        };
      }

      // 🔥 VERIFICAR METADATOS DE UBICACIÓN DE LOS VIDEOS
      const youtubeVideos = [];
      
      for (const item of searchData.items.slice(0, 12)) {
        try {
          // Obtener detalles adicionales del video para verificar ubicación
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${item.id.videoId}&key=${YOUTUBE_API_KEY}`;
          const detailsResponse = await fetch(videoDetailsUrl);
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const videoDetails = detailsData.items[0];
            
            // Verificar si el video tiene metadata de ubicación
            const hasLocationData = videoDetails?.recordingDetails?.location || 
                                  videoDetails?.snippet?.locationDescription;
            
            console.log('📍 Metadata de ubicación del video:', {
              videoId: item.id.videoId,
              hasLocationData: hasLocationData,
              recordingDetails: videoDetails?.recordingDetails,
              locationDescription: videoDetails?.snippet?.locationDescription
            });

            // Solo incluir videos que tengan metadata de ubicación o que estén claramente relacionados
            if (hasLocationData) {
              const angle = Math.random() * 2 * Math.PI;
              const distance = Math.random() * 0.1; // Radio más pequeño para mayor precisión
              const newLat = latitude + (distance * Math.cos(angle));
              const newLng = longitude + (distance * Math.sin(angle));
              
              youtubeVideos.push({
                youtube_video_id: item.id.videoId,
                location_name: `${locationName} - ${item.snippet.channelTitle}`,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                latitude: newLat,
                longitude: newLng,
                views: Math.floor(Math.random() * 50000) + 1000,
                likes: 0,
                duration: 'PT0S',
                isCurrentLocation: false,
                isSearchResult: true,
                thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
                // 🔥 NUEVO: Metadata de ubicación del video
                recordingLocation: videoDetails.recordingDetails?.location,
                locationDescription: videoDetails.snippet?.locationDescription,
                confirmedLocation: true
              });
            }
          }
        } catch (error) {
          console.warn('Error obteniendo detalles del video:', error);
        }
      }

      // Si no encontramos videos con metadata de ubicación, intentar con búsqueda normal
      if (youtubeVideos.length === 0) {
        console.log('⚠️ No hay videos con metadata de ubicación, usando búsqueda normal');
        
        for (const item of searchData.items.slice(0, 12)) {
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * 0.1;
          const newLat = latitude + (distance * Math.cos(angle));
          const newLng = longitude + (distance * Math.sin(angle));
          
          youtubeVideos.push({
            youtube_video_id: item.id.videoId,
            location_name: `${locationName} - ${item.snippet.channelTitle}`,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            latitude: newLat,
            longitude: newLng,
            views: Math.floor(Math.random() * 50000) + 1000,
            likes: 0,
            duration: 'PT0S',
            isCurrentLocation: false,
            isSearchResult: true,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description,
            confirmedLocation: false
          });
        }
      }

      console.log('✅ Videos encontrados con ubicación:', youtubeVideos.length);

      return {
        videos: youtubeVideos,
        nextPageToken: searchData.nextPageToken || ''
      };

    } catch (error) {
      console.error('Error buscando videos:', error);
      if (error.message === 'QUOTA_EXCEEDED') {
        setYoutubeAvailable(false);
        throw error;
      }
      throw new Error('Error en búsqueda de videos');
    }
  }, [YOUTUBE_API_KEY, currentRegion]);

  // Función para videos populares por región
  const fetchPopularVideosByRegion = useCallback(async (region = 'MX') => {
    try {
      const lastQuotaError = localStorage.getItem('youtube_quota_exceeded');
      if (lastQuotaError && Date.now() - parseInt(lastQuotaError) < 3600000) {
        throw new Error('QUOTA_EXCEEDED_RECENTLY');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=12&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        const popularVideos = data.items.map((item) => ({
          youtube_video_id: item.id,
          location_name: `${regionConfig[region]?.name || 'México'} - ${item.snippet.channelTitle}`,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          latitude: (regionConfig[region]?.center[0] || 23.6345) + (Math.random() - 0.5) * 4,
          longitude: (regionConfig[region]?.center[1] || -102.5528) + (Math.random() - 0.5) * 4,
          views: parseInt(item.statistics.viewCount) || Math.floor(Math.random() * 50000) + 10000,
          likes: parseInt(item.statistics.likeCount) || 0,
          duration: item.contentDetails?.duration || 'PT0S',
          isCurrentLocation: false,
          isSearchResult: false,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt
        }));

        setVideos(popularVideos);
        setActiveFilter('mexico');
        setNextPageToken('');
        setHasMoreVideos(false);
        return popularVideos;
      } else {
        if (response.status === 403) {
          localStorage.setItem('youtube_quota_exceeded', Date.now().toString());
          setYoutubeAvailable(false);
          setYoutubeError('Límite de cuota excedido para YouTube API');
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('Error al cargar videos populares');
      }
    } catch (error) {
      console.error('Error:', error);
      setVideos([]);
      setActiveFilter('unavailable');
      return [];
    }
  }, [YOUTUBE_API_KEY, regionConfig]);

  // Cargar videos para ubicación - MEJORADA
  const loadVideosForLocation = useCallback(async (latitude, longitude, locationName, searchQuery = '', pageToken = '', isLoadMore = false) => {
    if (!isLoadMore) {
      setLoadingVideos(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const result = await searchYouTubeVideosByLocation(latitude, longitude, locationName, searchQuery, pageToken);
      
      if (result.videos.length > 0) {
        if (isLoadMore) {
          setVideos(prev => [...prev, ...result.videos]);
        } else {
          setVideos(result.videos);
        }
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
        setActiveFilter('search');
        setSearchLocation({ latitude, longitude, name: locationName });
        
        console.log('✅ Videos cargados para ubicación:', {
          location: locationName,
          videos: result.videos.length,
          withLocationData: result.videos.filter(v => v.confirmedLocation).length
        });
      } else {
        // 🔥 NUEVO: Mostrar mensaje específico cuando no hay videos
        if (!isLoadMore) {
          setVideos([]);
          setNextPageToken('');
          setHasMoreVideos(false);
          setActiveFilter('no-videos');
          
          console.log('❌ No se encontraron videos subidos en:', locationName);
          
          // Mostrar alerta informativa
          setTimeout(() => {
            alert(`No se encontraron videos de "${searchQuery || 'contenido local'}" que hayan sido subidos en ${locationName}. Esto puede deberse a que:\n\n• No hay videos subidos en esta ubicación\n• Los videos no tienen metadata de ubicación\n• Restricciones regionales de YouTube`);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error buscando videos:', err);
      if (!isLoadMore) {
        if (err.message === 'QUOTA_EXCEEDED') {
          setVideos([]);
          setActiveFilter('unavailable');
        } else {
          // Intentar con videos populares como fallback
          await fetchPopularVideosByRegion(currentRegion);
        }
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingVideos(false);
      }
    }
  }, [searchYouTubeVideosByLocation, fetchPopularVideosByRegion, currentRegion]);

  // Función para mover mapa a ubicación
  const moveMapToLocation = useCallback(async (locationName) => {
    try {
      const locationData = await getLocationCoordinates(locationName);
      
      if (locationData) {
        setTargetViewport({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          zoom: 10
        });
        
        // Actualizar la ubicación clickeada para que esté disponible para búsquedas
        setClickedLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude
        });
        setClickedLocationName(locationData.locationName);
        setIsValidLocation(true);
        
        console.log('Mapa movido a:', locationData.locationName);
      }
    } catch (error) {
      console.error('Error moviendo el mapa a la ubicación:', error);
    }
  }, [getLocationCoordinates]);

  // FUNCIÓN MEJORADA PARA VERIFICAR RESTRICCIONES
  const checkRestrictions = useCallback((query, locationData = null) => {
    console.log('Verificando restricciones para:', query, locationData);
    
    // Verificar ciudades/países restringidos en el query
    const restrictedPatterns = new RegExp(
      restrictedCities.map(city => city.toLowerCase()).join('|'), 
      'i'
    );
    
    if (restrictedPatterns.test(query.toLowerCase())) {
      console.log('Query restringido detectado:', query);
      return {
        restricted: true,
        reason: 'query',
        message: 'Videos no disponibles en esta región (restricción de YouTube).'
      };
    }

    // Verificar si la ubicación está en país restringido
    if (locationData && locationData.countryCode) {
      const countryCode = locationData.countryCode.toUpperCase();
      if (restrictedCountries.includes(countryCode)) {
        console.log('País restringido detectado:', countryCode);
        return {
          restricted: true,
          reason: 'country',
          message: 'YouTube no está disponible en este país (restricción gubernamental).'
        };
      }
    }

    // Verificar también el nombre de la ubicación
    if (locationData && locationData.locationName) {
      if (restrictedPatterns.test(locationData.locationName.toLowerCase())) {
        console.log('Ubicación restringida detectada:', locationData.locationName);
        return {
          restricted: true,
          reason: 'location',
          message: 'Videos no disponibles en esta ubicación (restricción de YouTube).'
        };
      }
    }

    console.log('Ubicación permitida');
    return { restricted: false };
  }, [restrictedCities, restrictedCountries]);

  // Función para obtener sugerencias
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=country,region,place,locality,neighborhood,address&` +
        `limit=5&` +
        `language=es`
      );

      if (response.ok) {
        const data = await response.json();
        const validSuggestions = data.features
          .filter(feature => isValidLocationType(feature))
          .map(feature => feature.place_name)
          .slice(0, 5);

        setSuggestions(validSuggestions);
      }
    } catch (error) {
      console.warn('Error obteniendo sugerencias:', error);
      setSuggestions([]);
    }
  }, [MAPBOX_TOKEN, isValidLocationType]);

  // Función para detectar región del usuario
  const detectUserRegion = useCallback(async () => {
    try {
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
                  `access_token=${MAPBOX_TOKEN}&types=country&limit=1`
                );
                if (response.ok) {
                  const data = await response.json();
                  if (data.features?.[0]) {
                    const countryCode = data.features[0].properties.short_code?.toUpperCase();
                    
                    if (countryCode && restrictedCountries.includes(countryCode)) {
                      setYoutubeAvailable(false);
                      setYoutubeError('YouTube no está disponible en tu país debido a restricciones gubernamentales.');
                      resolve(countryCode);
                      return;
                    }
                    
                    if (countryCode && regionConfig[countryCode]) {
                      resolve(countryCode);
                      return;
                    }
                  }
                }
              } catch (error) {
                console.warn('Error detectando región:', error);
              }
              resolve('MX');
            },
            () => resolve('MX'),
            { timeout: 5000 }
          );
        });
      }
    } catch (error) {
      console.warn('Error en detección de región:', error);
    }
    return 'MX';
  }, [MAPBOX_TOKEN, restrictedCountries, regionConfig]);

  // Función para verificar disponibilidad de YouTube
  const checkYouTubeAvailability = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}`,
        { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (response.ok) {
        await response.json();
        setYoutubeAvailable(true);
        setYoutubeError('');
        return true;
      } else {
        setYoutubeAvailable(false);
        setYoutubeError('YouTube no está disponible en tu región');
        return false;
      }
    } catch (error) {
      console.warn('YouTube no disponible en esta región:', error);
      setYoutubeAvailable(false);
      setYoutubeError('No se puede acceder a YouTube en tu país');
      return false;
    }
  }, [YOUTUBE_API_KEY]);

  // Función para registrar acceso a video
  const registerVideoAccess = useCallback(async (video) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/register-video-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youtube_video_id: video.youtube_video_id,
          titulo: video.title,
          location_name: video.location_name,
          latitude: video.latitude,
          longitude: video.longitude,
          duracion_reproduccion: 0
        })
      });
    } catch (error) {
      console.error('Error registrando acceso:', error);
    }
  }, [API_BASE_URL, user]);

  // Función para obtener historial del usuario
  const fetchUserHistory = useCallback(async () => {
    if (!user) return [];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/user-history/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        setUserHistory(history);
        return history;
      }
      return [];
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }, [API_BASE_URL, user]);

  // Función para limpiar historial
  const clearUserHistory = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/clear-history/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUserHistory([]);
        alert('Historial limpiado correctamente');
      }
    } catch (error) {
      console.error('Error limpiando historial:', error);
      alert('Error limpiando el historial');
    }
  }, [API_BASE_URL, user]);

  // NUEVA FUNCIÓN: Búsqueda automática cuando hay término activo y cambia la ubicación
  const autoSearchOnLocationChange = useCallback(async () => {
    if (!activeSearchTerm.trim()) return;
    
    console.log('🔄 Búsqueda automática por cambio de ubicación:', {
      termino: activeSearchTerm,
      ubicacion_clickeada: clickedLocation ? clickedLocationName : 'none',
      ubicacion_actual: userLocation ? userLocationName : 'none'
    });

    setLoadingVideos(true);
    
    try {
      let latitude, longitude, locationName;

      // Determinar ubicación actual
      if (clickedLocation && isValidLocation) {
        latitude = clickedLocation.latitude;
        longitude = clickedLocation.longitude;
        locationName = clickedLocationName;
      } else if (userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
        locationName = userLocationName;
      } else {
        return; // No hay ubicación disponible
      }

      // Verificar restricciones
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(activeSearchTerm, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        console.warn('Ubicación restringida para búsqueda automática');
        return;
      }

      // Realizar búsqueda automática
      await loadVideosForLocation(latitude, longitude, locationName, activeSearchTerm);
      
      console.log('✅ Búsqueda automática exitosa:', {
        termino: activeSearchTerm,
        ubicacion: locationName
      });
    } catch (error) {
      console.error('Error en búsqueda automática:', error);
    } finally {
      setLoadingVideos(false);
    }
  }, [activeSearchTerm, clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, loadVideosForLocation, checkRestrictions, isValidMapLocation]);

  // Buscar videos para ubicación clickeada - DEFINIDA ANTES DE handleMapClick
  const searchVideosForClickedLocation = useCallback(async () => {
    if (!clickedLocation || !isValidLocation) return;
    
    setLoadingVideos(true);
    try {
      // SIEMPRE usar el término de búsqueda actual si existe
      // Si no hay término, usar el nombre de la ubicación como término genérico
      const searchQuery = searchTerm.trim() || clickedLocationName.split(',')[0].trim();
      
      console.log('Buscando en ubicación clickeada:', {
        termino: searchQuery,
        ubicacion: clickedLocationName,
        coordenadas: clickedLocation
      });
      
      await loadVideosForLocation(
        clickedLocation.latitude,
        clickedLocation.longitude,
        clickedLocationName,
        searchQuery
      );
      
      console.log('✅ Búsqueda exitosa en ubicación clickeada:', {
        query: searchQuery,
        location: clickedLocationName
      });
    } catch (error) {
      console.error('Error buscando videos:', error);
      alert(`Error al buscar videos de "${searchTerm}" en ${clickedLocationName}`);
    } finally {
      setLoadingVideos(false);
    }
  }, [clickedLocation, isValidLocation, clickedLocationName, searchTerm, loadVideosForLocation]);

  // MANEJAR CLIC EN EL MAPA CON VERIFICACIÓN DE RESTRICCIONES - CORREGIDO
  const handleMapClick = useCallback(async (event) => {
    const { lngLat } = event;
    const clickedLat = lngLat.lat;
    const clickedLng = lngLat.lng;
    
    // Si ya hay una animación en curso, no hacer nada
    if (isAnimating) return;
    
    const isInLandArea = 
      clickedLat > -60 && clickedLat < 85 &&
      clickedLng > -180 && clickedLng < 180;
    
    if (!isInLandArea) {
      setIsValidLocation(false);
      setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
      setClickedLocationName('Ubicación en océano o área no válida');
      setShowLocationPopup(true);
      return;
    }
    
    setLoadingVideos(true);
    
    try {
      const locationCheck = await isValidMapLocation(clickedLat, clickedLng);
      
      // VERIFICAR RESTRICCIONES para el clic en el mapa
      if (locationCheck.countryCode && restrictedCountries.includes(locationCheck.countryCode)) {
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName('País restringido - YouTube no disponible');
        setShowLocationPopup(true);
        setLoadingVideos(false);
        return;
      }
      
      if (locationCheck.isValid && locationCheck.placeName) {
        // VERIFICAR RESTRICCIONES por nombre de ubicación
        const restrictionCheck = checkRestrictions(locationCheck.placeName, {
          countryCode: locationCheck.countryCode,
          locationName: locationCheck.placeName
        });
        
        if (restrictionCheck.restricted) {
          setIsValidLocation(false);
          setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
          setClickedLocationName(restrictionCheck.message);
          setShowLocationPopup(true);
          setLoadingVideos(false);
          return;
        }
        
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName(locationCheck.placeName);
        setIsValidLocation(true);
        setShowLocationPopup(true);
        
        // Usar setTimeout para evitar conflictos con el estado actual
        setTimeout(() => {
          setTargetViewport({
            latitude: clickedLat,
            longitude: clickedLng,
            zoom: 10
          });
        }, 100);

        // 🔹 NUEVO: Búsqueda automática si hay término activo
        if (activeSearchTerm.trim()) {
          setTimeout(() => {
            console.log('🔄 Búsqueda automática en nueva ubicación clickeada:', {
              termino: activeSearchTerm,
              ubicacion: locationCheck.placeName
            });
            autoSearchOnLocationChange();
          }, 800);
        }
      } else {
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        
        let message = 'Ubicación no disponible para búsqueda';
        if (locationCheck.featureType === 'water' || locationCheck.featureType === 'marine') {
          message = 'Área marina - No se pueden buscar videos aquí';
        } else if (locationCheck.featureType === 'restricted') {
          message = 'País restringido - YouTube no disponible';
        } else if (!locationCheck.placeName) {
          message = 'Ubicación sin nombre específico';
        }
        
        setClickedLocationName(message);
        setShowLocationPopup(true);
      }
    } catch (error) {
      console.error('Error procesando clic en mapa:', error);
      setIsValidLocation(false);
      setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
      setClickedLocationName('Error al obtener información de ubicación');
      setShowLocationPopup(true);
    } finally {
      setLoadingVideos(false);
    }
  }, [isValidMapLocation, restrictedCountries, checkRestrictions, isAnimating, activeSearchTerm, autoSearchOnLocationChange]);

  // BUSCAR VIDEOS POR CATEGORÍA CON VERIFICACIÓN DE RESTRICCIONES - MODIFICADA PARA PAGINACIÓN
  const searchVideosByCategory = useCallback(async (category, pageToken = '', isLoadMore = false) => {
    if (!isLoadMore) {
      setLoadingVideos(true);
      setSelectedCategory(category);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      let searchQuery;
      let locationName;
      let latitude, longitude;

      // Determinar si usar ubicación clickeada o ubicación actual
      if (clickedLocation && isValidLocation) {
        latitude = clickedLocation.latitude;
        longitude = clickedLocation.longitude;
        locationName = clickedLocationName;
      } else if (userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
        locationName = userLocationName;
      } else {
        if (!isLoadMore) {
          alert('Primero activa tu ubicación o haz clic en una ubicación válida en el mapa');
        }
        return;
      }

      // VERIFICAR RESTRICCIONES para la ubicación
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        if (!isLoadMore) {
          alert(restrictionCheck.message);
        }
        return;
      }

      // Seleccionar una palabra clave aleatoria de la categoría
      const randomKeyword = category.keywords[Math.floor(Math.random() * category.keywords.length)];
      searchQuery = `${locationName} ${randomKeyword}`;
      
      await loadVideosForLocation(
        latitude,
        longitude,
        locationName,
        searchQuery,
        pageToken,
        isLoadMore
      );
    } catch (error) {
      console.error('Error buscando videos por categoría:', error);
      if (!isLoadMore) {
        alert('Error al buscar videos para esta categoría');
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingVideos(false);
      }
    }
  }, [clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, isValidMapLocation, checkRestrictions, loadVideosForLocation]);

  // CARGAR VIDEOS CERCANOS - MODIFICADO para funcionar con ubicación clickeada
  const fetchOtherVideos = useCallback(async () => {
    let latitude, longitude, locationName;

    // Determinar si usar ubicación clickeada o ubicación actual
    if (clickedLocation && isValidLocation) {
      latitude = clickedLocation.latitude;
      longitude = clickedLocation.longitude;
      locationName = clickedLocationName;
    } else if (userLocation) {
      latitude = userLocation.latitude;
      longitude = userLocation.longitude;
      locationName = userLocationName;
    } else {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación" o haz clic en una ubicación válida en el mapa');
      return;
    }

    setLoadingVideos(true);
    try {
      // VERIFICAR RESTRICCIONES
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        alert(restrictionCheck.message);
        setLoadingVideos(false);
        return;
      }
      
      await loadVideosForLocation(latitude, longitude, locationName);
      
      // Mover el mapa a la ubicación si es una ubicación clickeada
      if (clickedLocation && isValidLocation) {
        setTargetViewport({ 
          latitude: latitude, 
          longitude: longitude, 
          zoom: 11 
        });
        setShowLocationPopup(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al buscar otros videos');
    } finally {
      setLoadingVideos(false);
    }
  }, [clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, loadVideosForLocation, checkRestrictions, isValidMapLocation]);

  // CARGAR VIDEOS POPULARES - MODIFICADO para funcionar con ubicación clickeada
  const fetchPopularVideos = useCallback(async () => {
    let latitude, longitude, locationName;

    // Determinar si usar ubicación clickeada o ubicación actual
    if (clickedLocation && isValidLocation) {
      latitude = clickedLocation.latitude;
      longitude = clickedLocation.longitude;
      locationName = clickedLocationName;
    } else if (userLocation) {
      latitude = userLocation.latitude;
      longitude = userLocation.longitude;
      locationName = userLocationName;
    } else {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación" o haz clic en una ubicación válida en el mapa');
      return;
    }

    setLoadingVideos(true);
    try {
      // VERIFICAR RESTRICCIONES
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        alert(restrictionCheck.message);
        setLoadingVideos(false);
        return;
      }
      
      await loadVideosForLocation(latitude, longitude, locationName);
      
      // Mover el mapa a la ubicación si es una ubicación clickeada
      if (clickedLocation && isValidLocation) {
        setTargetViewport({ 
          latitude: latitude, 
          longitude: longitude, 
          zoom: 10 
        });
        setShowLocationPopup(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar videos populares');
    } finally {
      setLoadingVideos(false);
    }
  }, [clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, loadVideosForLocation, checkRestrictions, isValidMapLocation]);

  // BÚSQUEDA MEJORADA - MODIFICADA PARA USAR UBICACIÓN SELECCIONADA Y TÉRMINO ACTIVO
  const fetchVideos = useCallback(async (query, pageToken = '', isLoadMore = false) => {
    if (!query.trim() && !isLoadMore) {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoadingVideos(true);
    }
    
    setSearchError('');
    
    try {
      let latitude, longitude, locationName;

      // PRIORIDAD 1: Usar ubicación clickeada si está disponible y es válida
      if (clickedLocation && isValidLocation) {
        latitude = clickedLocation.latitude;
        longitude = clickedLocation.longitude;
        locationName = clickedLocationName;
        
        console.log('🔍 Búsqueda con ubicación clickeada:', {
          query: query,
          location: locationName,
          coordinates: { latitude, longitude }
        });
        
      } 
      // PRIORIDAD 2: Usar ubicación actual del usuario
      else if (userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
        locationName = userLocationName;
        
        console.log('🔍 Búsqueda con ubicación actual:', {
          query: query,
          location: locationName,
          coordinates: { latitude, longitude }
        });
      } 
      // PRIORIDAD 3: Buscar ubicación por el término (solo si no hay ubicaciones disponibles)
      else {
        console.log('⚠️  No hay ubicación activa, buscando ubicación para:', query);
        
        try {
          const locationData = await getLocationCoordinates(query.split(',')[0]);
          latitude = locationData.latitude;
          longitude = locationData.longitude;
          locationName = locationData.locationName;

          if (!isLoadMore) {
            setTargetViewport({ 
              latitude: latitude, 
              longitude: longitude, 
              zoom: 10 
            });
          }
          
          console.log('📍 Nueva ubicación encontrada:', locationName);
        } catch (error) {
          throw new Error('Primero activa tu ubicación o selecciona una en el mapa. Error: ' + error.message);
        }
      }

      // VERIFICAR RESTRICCIONES
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const finalRestrictionCheck = checkRestrictions(query, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (finalRestrictionCheck.restricted) {
        throw new Error(finalRestrictionCheck.message);
      }

      // 🔥 GUARDAR TÉRMINO ACTIVO (solo si no es carga de más videos)
      if (!isLoadMore) {
        setActiveSearchTerm(query);
      }

      // Realizar búsqueda
      await loadVideosForLocation(latitude, longitude, locationName, query, pageToken, isLoadMore);

    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      if (!isLoadMore) {
        setSearchError(error.message || 'Error al realizar la búsqueda. Verifica el término e intenta nuevamente.');
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingVideos(false);
      }
    }
  }, [getLocationCoordinates, clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, checkRestrictions, isValidMapLocation, loadVideosForLocation]);

  // NUEVA FUNCIÓN PARA CARGAR MÁS VIDEOS
  const loadMoreVideos = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return;

    try {
      if (activeFilter === 'search') {
        await fetchVideos(activeSearchTerm || searchTerm, nextPageToken, true);
      } else if (activeFilter === 'category' && selectedCategory) {
        await searchVideosByCategory(selectedCategory, nextPageToken, true);
      } else if (activeFilter === 'clicked') {
        await loadVideosForLocation(
          clickedLocation.latitude,
          clickedLocation.longitude,
          clickedLocationName,
          activeSearchTerm || searchTerm.trim() || '',
          nextPageToken,
          true
        );
      } else if (activeFilter === 'other' || activeFilter === 'popular' || activeFilter === 'current') {
        const locationName = userLocationName;
        const latitude = userLocation.latitude;
        const longitude = userLocation.longitude;
        
        await loadVideosForLocation(
          latitude,
          longitude,
          locationName,
          activeSearchTerm || '',
          nextPageToken,
          true
        );
      }
    } catch (error) {
      console.error('Error cargando más videos:', error);
    }
  }, [nextPageToken, isLoadingMore, activeFilter, fetchVideos, activeSearchTerm, searchTerm, searchVideosByCategory, selectedCategory, loadVideosForLocation, clickedLocation, clickedLocationName, userLocation, userLocationName]);

  // EFECTO DE ANIMACIÓN MEJORADO - CORREGIDO
  useEffect(() => {
    if (!targetViewport) return;

    // Cancelar animación anterior si existe
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    startViewportRef.current = { ...viewport };
    setIsAnimating(true);

    const startTime = performance.now();
    const duration = 1000;

    const animateMap = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Usar easing function más suave
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const start = startViewportRef.current;
      const end = targetViewport;

      const newViewport = {
        latitude: start.latitude + (end.latitude - start.latitude) * easedProgress,
        longitude: start.longitude + (end.longitude - start.longitude) * easedProgress,
        zoom: start.zoom + (end.zoom - start.zoom) * easedProgress,
      };

      setViewport(newViewport);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateMap);
      } else {
        // Asegurar que terminamos en la posición exacta
        setViewport({ ...end });
        setIsAnimating(false);
        setTargetViewport(null);
      }
    };

    animationRef.current = requestAnimationFrame(animateMap);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetViewport]);

  // EFECTO PARA BÚSQUEDA AUTOMÁTICA AL CAMBIAR UBICACIÓN
  useEffect(() => {
    if (activeSearchTerm.trim() && (clickedLocation || userLocation)) {
      // Pequeño delay para evitar múltiples ejecuciones
      const timer = setTimeout(() => {
        autoSearchOnLocationChange();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [clickedLocation, userLocation, activeSearchTerm, autoSearchOnLocationChange]);

  // Efecto para manejar clics fuera del dropdown de sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto principal de inicialización
  useEffect(() => {
    const initializeApp = async () => {
      const checkAuthStatus = async () => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            setUser(user);
          } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      };

      const region = await detectUserRegion();
      setCurrentRegion(region);
      
      const youtubeAvailable = await checkYouTubeAvailability();
      setYoutubeAvailable(youtubeAvailable);

      await checkAuthStatus();

      if (youtubeAvailable) {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const locationData = JSON.parse(savedLocation);
            setUserLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
            setUserLocationName(locationData.name || 'Ubicación guardada');
            await loadVideosForLocation(locationData.latitude, locationData.longitude, locationData.name);
          } catch (error) {
            console.error('Error:', error);
            await fetchPopularVideosByRegion(region);
          }
        } else {
          await fetchPopularVideosByRegion(region);
        }
      } else {
        setVideos([]);
        setActiveFilter('unavailable');
      }
    };

    initializeApp();
  }, [API_BASE_URL, MAPBOX_TOKEN, YOUTUBE_API_KEY, checkYouTubeAvailability, detectUserRegion, fetchPopularVideosByRegion, loadVideosForLocation]);

  // Obtener ubicación del usuario - MODIFICADO para búsqueda automática al regresar
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularVideosByRegion(currentRegion);
    }

    // Si ya hay animación, no hacer nada
    if (isAnimating) return;

    // BORRAR UBICACIÓN SELECCIONADA AL ACTIVAR LA UBICACIÓN ACTUAL
    setClickedLocation(null);
    setClickedLocationName('');
    setIsValidLocation(false);
    setShowLocationPopup(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        setTimeout(() => {
          setTargetViewport({ 
            latitude: latitude, 
            longitude: longitude, 
            zoom: 12 
          });
        }, 100);
        
        setUserLocation({ latitude, longitude });

        try {
          const locationName = await getLocationName(latitude, longitude);
          setUserLocationName(locationName);
          
          // VERIFICAR RESTRICCIONES
          const locationCheck = await isValidMapLocation(latitude, longitude);
          const restrictionCheck = checkRestrictions(locationName, {
            countryCode: locationCheck.countryCode,
            locationName: locationName
          });
          
          if (restrictionCheck.restricted) {
            alert(restrictionCheck.message);
            await fetchPopularVideosByRegion(currentRegion);
            return;
          }

          // 🔥 SI HAY TÉRMINO ACTIVO, BUSCAR AUTOMÁTICAMENTE
          if (activeSearchTerm.trim()) {
            console.log('🔄 Búsqueda automática al regresar a ubicación actual:', activeSearchTerm);
            await loadVideosForLocation(latitude, longitude, locationName, activeSearchTerm);
          } else {
            await loadVideosForLocation(latitude, longitude, locationName);
          }

          localStorage.setItem('userLocation', JSON.stringify({ 
            latitude, 
            longitude,
            name: locationName 
          }));

        } catch (error) {
          console.error('Error en operaciones:', error);
          setUserLocationName('Ubicación actual');
        }
      },
      (err) => {
        console.error('Error obteniendo ubicación:', err);
        setIsAnimating(false);
        alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la ubicación.');
        fetchPopularVideosByRegion(currentRegion);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, [getLocationName, loadVideosForLocation, fetchPopularVideosByRegion, currentRegion, checkRestrictions, isValidMapLocation, isAnimating, activeSearchTerm]);

  // MODIFICADA: Función para manejar clic en sugerencias
  const handleSuggestionClick = useCallback(async (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    
    // Mover el mapa a la ubicación seleccionada
    await moveMapToLocation(suggestion);
    
    // IMPORTANTE: No buscar videos inmediatamente después de mover el mapa
    // Esperar a que el usuario haga clic en la ubicación o use el buscador
    console.log('Ubicación seleccionada:', suggestion, '- Esperando confirmación de ubicación');
  }, [moveMapToLocation]);

  // Handlers para el buscador con sugerencias
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchError('');

    // 🔥 SI SE BORRA EL TÉRMINO, LIMPIAR TÉRMINO ACTIVO
    if (!value.trim()) {
      setActiveSearchTerm('');
    }

    if (value.trim()) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [fetchSuggestions]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log('🚀 Iniciando búsqueda manual:', {
        termino: searchTerm,
        ubicacion_clickeada: clickedLocation ? clickedLocationName : 'none',
        ubicacion_actual: userLocation ? userLocationName : 'none'
      });
      
      // Buscar y activar el término
      fetchVideos(searchTerm);
      setShowSuggestions(false);
    } else {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
    }
  }, [searchTerm, fetchVideos, clickedLocation, clickedLocationName, userLocation, userLocationName]);

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  // Handlers de UI
  const handleLogin = useCallback((userData) => {
    if (userData && !localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    setUser(userData);
    setShowProfile(true);
    setShowAuthModal(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedLocation');
    setUser(null);
    setShowProfile(false);
    setShowSettings(false);
  }, []);

  const handlePhotoUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    setShowProfile(false);
  }, []);

  const handleVideoClick = useCallback((video) => {
    setSelectedVideo(video);
    if (user) {
      registerVideoAccess(video);
    }
  }, [user, registerVideoAccess]);

  const handleVideoDoubleClick = useCallback((video) => {
    if (user) {
      registerVideoAccess(video);
    }
    
    const locationState = {};
    
    if (clickedLocation && isValidLocation) {
      locationState.selectedLocation = {
        latitude: clickedLocation.latitude,
        longitude: clickedLocation.longitude,
        name: clickedLocationName
      };
    } else if (searchLocation) {
      locationState.selectedLocation = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        name: searchLocation.name
      };
    }
    
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    navigate(`/video/${video.youtube_video_id}`, { 
      state: locationState 
    });
  }, [user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate]);

  const handleMarkerClick = useCallback((video) => {
    setSelectedVideo(video);
    if (user) {
      registerVideoAccess(video);
    }
  }, [user, registerVideoAccess]);

  const handleMarkerDoubleClick = useCallback((video) => {
    if (user) {
      registerVideoAccess(video);
    }
    
    const locationState = {};
    
    if (clickedLocation && isValidLocation) {
      locationState.selectedLocation = {
        latitude: clickedLocation.latitude,
        longitude: clickedLocation.longitude,
        name: clickedLocationName
      };
    } else if (searchLocation) {
      locationState.selectedLocation = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        name: searchLocation.name
      };
    }
    
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    navigate(`/video/${video.youtube_video_id}`, { 
      state: locationState 
    });
  }, [user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate]);

  const handleWatchComplete = useCallback(() => {
    if (user && selectedVideo) {
      registerVideoAccess(selectedVideo);
    }
    
    const locationState = {};
    
    if (clickedLocation && isValidLocation) {
      locationState.selectedLocation = {
        latitude: clickedLocation.latitude,
        longitude: clickedLocation.longitude,
        name: clickedLocationName
      };
    } else if (searchLocation) {
      locationState.selectedLocation = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        name: searchLocation.name
      };
    }
    
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    selectedVideo?.youtube_video_id && navigate(`/video/${selectedVideo.youtube_video_id}`, { 
      state: locationState 
    });
  }, [user, selectedVideo, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate]);

  // Helper functions
  const getSidebarTitle = useCallback(() => {
    if (!youtubeAvailable) {
      return 'YouTube No Disponible';
    }
    
    const titles = {
      popular: 'Videos Populares',
      other: 'Videos Cercanos', 
      current: 'Videos en tu Ubicación',
      search: activeSearchTerm ? `Videos de "${activeSearchTerm}"` : `Videos de "${searchTerm}"`,
      mexico: 'Videos Populares de México',
      clicked: `Videos en ${clickedLocationName}`,
      category: selectedCategory ? `Videos de ${selectedCategory.name}` : 'Videos por Categoría',
      unavailable: 'Servicio No Disponible',
      'no-videos': 'No Hay Videos'
    };
    return titles[activeFilter] || 'Videos con Vista Previa';
  }, [youtubeAvailable, activeFilter, activeSearchTerm, searchTerm, clickedLocationName, selectedCategory]);

  const getSidebarSubtitle = useCallback(() => {
    if (!youtubeAvailable) {
      return youtubeError || 'YouTube no está disponible en tu país o región';
    }
    
    const subtitles = {
      popular: userLocationName ? `Videos populares en ${userLocationName}` : 'Videos populares en tu área',
      other: userLocationName ? `Videos cercanos a ${userLocationName}` : 'Videos en tu región',
      current: userLocationName ? `Subidos en tu ubicación: ${userLocationName}` : 'Subidos en tu ubicación actual',
      search: searchLocation ? `Subidos en: ${searchLocation.name}` : `Búsqueda: "${activeSearchTerm || searchTerm}"`,
      mexico: 'Los videos más populares en México',
      clicked: `Videos subidos en: ${clickedLocationName}`,
      category: selectedCategory ? `${selectedCategory.name} en ${searchLocation?.name || userLocationName || clickedLocationName}` : 'Explorando por categoría',
      unavailable: 'No se pueden cargar videos en tu región',
      'no-videos': 'No se encontraron videos subidos en esta ubicación'
    };
    return subtitles[activeFilter] || 'Explorando contenido local';
  }, [youtubeAvailable, youtubeError, activeFilter, userLocationName, searchLocation, activeSearchTerm, searchTerm, clickedLocationName, selectedCategory]);

  const formatDuration = useCallback((duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    return hours 
      ? `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
      : `${minutes}:${seconds.padStart(2, '0')}`;
  }, []);

  // Componente de Sugerencias
  const SearchSuggestions = useCallback(() => {
    if (!showSuggestions || !suggestions.length) return null;

    return (
      <div 
        ref={suggestionsRef}
        className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full text-left px-4 py-3 hover:bg-cyan-500/20 border-b border-gray-700 last:border-b-0 transition-all duration-200 text-white hover:text-cyan-300"
          >
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }, [showSuggestions, suggestions, handleSuggestionClick]);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Navbar */}
      <div className="navbar absolute top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              VideoMap 
            </h1>
            {!youtubeAvailable && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
                <p className="text-red-300 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  YouTube no disponible - {regionConfig[currentRegion]?.name}
                </p>
              </div>
            )}
          </div>
          
          {/* Indicador de ubicación activa */}
          <div className="flex items-center gap-4 ml-4">
            {(clickedLocation && isValidLocation) && (
              <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg px-3 py-1">
                <p className="text-cyan-300 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ubicación: {clickedLocationName.split(',')[0]}
                </p>
              </div>
            )}
            
            {userLocationName && !clickedLocation && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1">
                <p className="text-green-300 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ubicación: {userLocationName.split(',')[0]}
                </p>
              </div>
            )}

            {/* Indicador de búsqueda activa */}
            {activeSearchTerm && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-3 py-1">
                <p className="text-yellow-300 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Búsqueda activa: "{activeSearchTerm}"
                </p>
              </div>
            )}

            {/* Indicador de ubicación de búsqueda */}
            <div className="text-xs text-gray-400 ml-4">
              {clickedLocation && isValidLocation ? (
                <span> Buscarás en: <strong>{clickedLocationName.split(',')[0]}</strong></span>
              ) : userLocation ? (
                <span> Buscarás en: <strong>{userLocationName.split(',')[0]}</strong></span>
              ) : (
                <span>Activa ubicación o selecciona en el mapa</span>
              )}
            </div>
          </div>
          
          {/* CATEGORÍAS EN COLUMNAS AL LADO DEL BUSCADOR */}
          <div className="flex items-center gap-2">
            {categories.map((category) => {
              const hasValidLocation = (clickedLocation && isValidLocation) || userLocation;
              
              return (
                <button
                  key={category.id}
                  onClick={() => searchVideosByCategory(category)}
                  disabled={!hasValidLocation}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium min-w-[90px] ${
                    selectedCategory?.id === category.id 
                      ? `ring-1 ring-white ${category.bgColor}`
                      : `bg-gradient-to-r ${category.color} hover:shadow-md`
                  }`}
                  title={hasValidLocation ? category.name : 'Primero activa tu ubicación o selecciona una en el mapa'}
                >
                  <span className="truncate">{category.name}</span>
                </button>
              );
            })}
          </div>
          
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar términos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="search-input glass-effect bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-80 pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="ml-4 btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-300"
              >
                Buscar
              </button>
            </form>

            {/* Sugerencias */}
            <SearchSuggestions />

            {/* Mensaje de error */}
            {searchError && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{searchError}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {userLocationName && (
            <div className="text-right">
              <p className="text-sm text-cyan-400">Tu ubicación actual</p>
              <p className="text-xs text-gray-300">{userLocationName}</p>
            </div>
          )}
          {user ? (
            <>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-secondary flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ajustes
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(!showProfile)}
                  className="user-avatar text-lg w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden border-2 border-cyan-500"
                  title={user.nombre}
                >
                  {user.foto ? (
                    <img 
                      src={user.foto} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                
                <UserProfileModal
                  user={user}
                  isOpen={showProfile}
                  onClose={() => setShowProfile(false)}
                  onChangePhoto={() => {
                    setShowProfile(false);
                    setShowPhotoModal(true);
                  }}
                  onChangePassword={() => {
                    setShowProfile(false);
                    setShowPasswordModal(true);
                  }}
                  onLogout={handleLogout}
                />
              </div>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-300"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Modales */}
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

      <HistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        userHistory={userHistory}
        onClearHistory={clearUserHistory}
      />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onShowComments={() => {
          setShowSettings(false);
          setShowCommentsModal(true);
        }}
        onShowHistory={async () => {
          await fetchUserHistory();
          setShowSettings(false);
          setShowHistoryModal(true);
        }}
        onClearHistory={() => {
          if (window.confirm('¿Estás seguro de que quieres limpiar todo tu historial? Esta acción no se puede deshacer.')) {
            clearUserHistory();
            setShowSettings(false);
          }
        }}
      />

      {/* Contenido Principal */}
      <div className="flex-1 flex pt-20">
        {/* Mapa */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            onMove={(evt) => !isAnimating && setViewport(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          >
            <NavigationControl position="top-right" />

            {showLocationPopup && clickedLocation && (
              <Popup
                latitude={clickedLocation.latitude}
                longitude={clickedLocation.longitude}
                closeButton={false}
                closeOnClick={false}
                onClose={() => setShowLocationPopup(false)}
                anchor="top"
              >
                <LocationPopup
                  isOpen={showLocationPopup}
                  onClose={() => setShowLocationPopup(false)}
                  location={clickedLocation}
                  locationName={clickedLocationName}
                  isValidLocation={isValidLocation}
                  onSearchVideos={searchVideosForClickedLocation}
                  onSearchWithTerm={() => {
                    fetchVideos(searchTerm);
                    setShowLocationPopup(false);
                  }}
                  searchTerm={searchTerm}
                  loadingVideos={loadingVideos}
                />
              </Popup>
            )}

            {userLocation && (
              <Marker latitude={userLocation.latitude} longitude={userLocation.longitude}>
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full animate-ping absolute"></div>
                  <div className="h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full"></div>
                </div>
              </Marker>
            )}

            {searchLocation && (
              <Marker latitude={searchLocation.latitude} longitude={searchLocation.longitude}>
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full animate-ping absolute"></div>
                  <div className="h-6 w-6 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full"></div>
                </div>
              </Marker>
            )}

            {videos.map((video) => (
              <Marker 
                key={video.youtube_video_id} 
                latitude={video.latitude} 
                longitude={video.longitude}
              >
                <div
                  onClick={() => handleMarkerClick(video)}
                  onDoubleClick={() => handleMarkerDoubleClick(video)}
                  className="cursor-pointer text-3xl transform hover:scale-150 transition-all duration-300"
                  title="Click para vista previa, Doble click para ver completo"
                >
                  <div className="relative">
                    <div className={`h-6 w-6 border-2 border-white rounded-full ${
                      video.isSearchResult 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}></div>
                  </div>
                </div>
              </Marker>
            ))}
          </Map>

          <button
            onClick={getUserLocation}
            disabled={isAnimating}
            className="absolute bottom-6 right-6 btn-success bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold px-6 py-3 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isAnimating ? 'Moviendo...' : 'Mi Ubicación Actual'}
          </button>

          {isAnimating && (
            <div className="absolute top-6 right-6 glass-effect bg-gray-800/80 px-4 py-2 rounded-lg">
              <p className="text-sm text-cyan-400 flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></span>
                Moviendo a la ubicación...
              </p>
            </div>
          )}

          {!youtubeAvailable && (
            <div className="absolute top-20 left-6 glass-effect bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg">
              <p className="text-sm text-red-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                YouTube no disponible en {regionConfig[currentRegion]?.name}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-1/3 bg-gradient-to-b from-slate-900 via-purple-900 to-blue-900 overflow-y-auto p-6 flex flex-col">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              {getSidebarTitle()}
            </h2>
            <p className="text-cyan-300 text-sm mt-2">
              {getSidebarSubtitle()}
            </p>
          </div>

          {!youtubeAvailable ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-red-300 mb-2">YouTube No Disponible</h3>
                <p className="text-gray-400 mb-4">
                  {youtubeError || 'YouTube no está disponible en tu país o región.'}
                </p>
                <p className="text-gray-500 text-sm">
                  Región detectada: {regionConfig[currentRegion]?.name}
                </p>
              </div>
            </div>
          ) : activeFilter === 'no-videos' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-yellow-300 mb-2">No Hay Videos</h3>
                <p className="text-gray-400 mb-4">
                  No se encontraron videos subidos en esta ubicación
                </p>
                <p className="text-gray-500 text-sm">
                  {searchLocation ? `Ubicación: ${searchLocation.name}` : clickedLocationName ? `Ubicación: ${clickedLocationName}` : 'Intenta con otra ubicación'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={fetchOtherVideos}
                  disabled={(!userLocation && !clickedLocation) || loadingVideos}
                  className={`font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    activeFilter === 'other' 
                      ? 'bg-cyan-600 border-2 border-cyan-400' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                  }`}
                  title={clickedLocation && isValidLocation ? 
                    `Buscar videos cercanos a ${clickedLocationName}` : 
                    userLocation ? 'Buscar videos cercanos a tu ubicación' : 
                    'Activa tu ubicación o selecciona una en el mapa'}
                >
                  {loadingVideos && activeFilter === 'other' ? 'Cargando...' : 'Videos Cercanos'}
                </button>
                <button
                  onClick={fetchPopularVideos}
                  disabled={(!userLocation && !clickedLocation) || loadingVideos}
                  className={`font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    activeFilter === 'popular' 
                      ? 'bg-orange-600 border-2 border-orange-400' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  }`}
                  title={clickedLocation && isValidLocation ? 
                    `Buscar videos populares en ${clickedLocationName}` : 
                    userLocation ? 'Buscar videos populares en tu ubicación' : 
                    'Activa tu ubicación o selecciona una en el mapa'}
                >
                  {loadingVideos && activeFilter === 'popular' ? 'Cargando...' : 'Populares'}
                </button>
              </div>

              {loadingVideos && (
                <div className="glass-effect bg-gray-800/50 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-cyan-400 flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></span>
                    {activeFilter === 'search' ? 'Buscando videos...' : 'Cargando videos...'}
                  </p>
                </div>
              )}

              <VideoPreviewModal
                video={selectedVideo}
                onClose={() => setSelectedVideo(null)}
                onWatchComplete={handleWatchComplete}
                formatDuration={formatDuration}
              />

              <div className="space-y-4 flex-1 overflow-y-auto">
                {videos.length > 0 ? (
                  <>
                    {videos.map((video) => (
                      <div
                        key={video.youtube_video_id}
                        onClick={() => handleVideoClick(video)}
                        onDoubleClick={() => handleVideoDoubleClick(video)}
                        className={`glass-effect bg-gray-800/50 rounded-2xl p-4 cursor-pointer transform hover:scale-102 transition-all duration-300 border-l-4 ${
                          video.isSearchResult 
                            ? 'border-l-yellow-500 bg-yellow-500/10' 
                            : video.isCurrentLocation 
                              ? 'border-l-green-500 bg-green-500/10' 
                              : 'border-l-cyan-500 bg-cyan-500/10'
                        } ${selectedVideo?.youtube_video_id === video.youtube_video_id ? 'ring-2 ring-yellow-400' : ''}`}
                        title="Click para vista previa, Doble click para ver completo"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <img 
                              src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                              alt="Miniatura del video"
                              className="w-20 h-15 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/120x90/1f2937/6b7280?text=Video';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-3 w-3 rounded-full ${
                                video.isSearchResult 
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}></div>
                              <p className="font-bold text-white text-sm">{video.channelTitle}</p>
                            </div>
                            <p className="text-xs text-gray-300 line-clamp-2 mb-1">{video.title}</p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-yellow-300">{video.views.toLocaleString()} vistas</span>
                              {video.duration && video.duration !== 'PT0S' && (
                                <span className="text-cyan-400">{formatDuration(video.duration)}</span>
                              )}
                            </div>
                            <p className="text-xs text-cyan-400 mt-1">{video.location_name}</p>
                            {video.confirmedLocation && (
                              <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-green-400 text-xs">Ubicación confirmada</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreVideos && (
                      <div className="flex justify-center mt-6 mb-4">
                        <button
                          onClick={loadMoreVideos}
                          disabled={isLoadingMore}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                              Cargando...
                            </div>
                          ) : (
                            'Mostrar más videos'
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  !loadingVideos && activeFilter !== 'no-videos' && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg">No se encontraron videos</p>
                      <p className="text-gray-500 text-sm">
                        {userLocation || clickedLocation ? 'Usa los botones para cargar videos' : 'Activa tu ubicación o usa la búsqueda'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainApp;