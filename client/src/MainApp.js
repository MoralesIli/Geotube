import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';
import AuthModal from './AuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangePhotoModal from './ChangePhotoModal';

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
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeFilter, setActiveFilter] = useState('mexico');
  const [nextPageToken, setNextPageToken] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);

  // Estados para geolocalización
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);

  // Estado para historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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

  // Constantes - MOVER A VARIABLES DE ENTORNO EN PRODUCCIÓN
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || 'AIzaSyAMXqOfXkEHPmpu0O5a83k7c_snASAEJ50';
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // PAÍSES Y CIUDADES RESTRINGIDAS - LISTA AMPLIADA
  const restrictedCountries = ['KP', 'IR', 'SY', 'SS', 'CU', 'CN', 'TM', 'UZ', 'TJ', 'ER', 'SD', 'RU', 'BY', 'MM'];
  const restrictedCities = [
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
  ];

  // Configuración por región
  const regionConfig = {
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
  };

  // Categorías de búsqueda
  const categories = [
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
  ];

  // Sugerencias populares
  const popularSuggestions = [
    'Ciudad de México, México',
    'Cancún, México',
    'Guadalajara, México',
    'Monterrey, México',
    'Madrid, España',
    'Barcelona, España',
    'New York, USA',
    'Los Angeles, USA',
    'Tokyo, Japón',
    'París, Francia',
    'Londres, Reino Unido',
    'Roma, Italia',
    'Buenos Aires, Argentina',
    'Santiago, Chile',
    'Bogotá, Colombia',
    'Lima, Perú',
    'São Paulo, Brasil',
    'Berlín, Alemania',
    'Ámsterdam, Países Bajos',
    'Estambul, Turquía'
  ];

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
  }, []);

  // Función para validar tipo de ubicación
  const isValidLocationType = useCallback((feature) => {
    const validTypes = ['country', 'region', 'place', 'locality', 'neighborhood', 'address'];
    return feature.place_type?.some(type => validTypes.includes(type));
  }, []);

  // Función para obtener sugerencias
  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions(popularSuggestions);
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
  };

  // Función para detectar región del usuario
  const detectUserRegion = async () => {
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
  };

  // Función para verificar disponibilidad de YouTube
  const checkYouTubeAvailability = async () => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}`,
        { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (response.ok) {
        const data = await response.json();
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
  };

  // Función para registrar acceso a video
  const registerVideoAccess = async (video) => {
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
  };

  // Función para obtener historial del usuario
  const fetchUserHistory = async () => {
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
  };

  // Función para limpiar historial
  const clearUserHistory = async () => {
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
  };

  // Función para verificar si una ubicación es válida
  const isValidMapLocation = async (lat, lng) => {
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
  };

  //  MANEJAR CLIC EN EL MAPA CON VERIFICACIÓN DE RESTRICCIONES
  const handleMapClick = async (event) => {
    const { lngLat } = event;
    const clickedLat = lngLat.lat;
    const clickedLng = lngLat.lng;
    
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
        
        setTargetViewport({
          latitude: clickedLat,
          longitude: clickedLng,
          zoom: 10
        });
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
  };

  // BUSCAR VIDEOS POR CATEGORÍA CON VERIFICACIÓN DE RESTRICCIONES
  const searchVideosByCategory = async (category) => {
    setLoadingVideos(true);
    setSelectedCategory(category);
    
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
        alert('Primero activa tu ubicación o haz clic en una ubicación válida en el mapa');
        setLoadingVideos(false);
        return;
      }

      // VERIFICAR RESTRICCIONES para la ubicación
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

      // Seleccionar una palabra clave aleatoria de la categoría
      const randomKeyword = category.keywords[Math.floor(Math.random() * category.keywords.length)];
      searchQuery = `${locationName} ${randomKeyword}`;
      
      const result = await searchYouTubeVideosByLocation(
        latitude,
        longitude,
        locationName,
        searchQuery
      );
      
      if (result.videos.length > 0) {
        setVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setActiveFilter('category');
        setSearchLocation({
          latitude: latitude,
          longitude: longitude,
          name: locationName
        });
        setShowLocationPopup(false);
      } else {
        // Intentar con otra palabra clave si la primera no funciona
        const fallbackKeyword = category.keywords.find(k => k !== randomKeyword) || category.keywords[0];
        const fallbackQuery = `${locationName} ${fallbackKeyword}`;
        
        const fallbackResult = await searchYouTubeVideosByLocation(
          latitude,
          longitude,
          locationName,
          fallbackQuery
        );
        
        if (fallbackResult.videos.length > 0) {
          setVideos(fallbackResult.videos);
          setNextPageToken(fallbackResult.nextPageToken);
          setActiveFilter('category');
          setSearchLocation({
            latitude: latitude,
            longitude: longitude,
            name: locationName
          });
          setShowLocationPopup(false);
        } else {
          alert(`No se encontraron videos de ${category.name} para esta ubicación`);
        }
      }
    } catch (error) {
      console.error('Error buscando videos por categoría:', error);
      alert('Error al buscar videos para esta categoría');
    } finally {
      setLoadingVideos(false);
    }
  };

  // Buscar videos para ubicación clickeada
  const searchVideosForClickedLocation = async () => {
    if (!clickedLocation || !isValidLocation) return;
    
    setLoadingVideos(true);
    try {
      const result = await searchYouTubeVideosByLocation(
        clickedLocation.latitude,
        clickedLocation.longitude,
        clickedLocationName
      );
      
      if (result.videos.length > 0) {
        setVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setActiveFilter('clicked');
        setSearchLocation({
          latitude: clickedLocation.latitude,
          longitude: clickedLocation.longitude,
          name: clickedLocationName
        });
        setShowLocationPopup(false);
      } else {
        alert('No se encontraron videos para esta ubicación');
      }
    } catch (error) {
      console.error('Error buscando videos:', error);
      alert('Error al buscar videos para esta ubicación');
    } finally {
      setLoadingVideos(false);
    }
  };

  // Efectos principales
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
  }, []);

  useEffect(() => {
    if (!targetViewport) return;

    startViewportRef.current = viewport;
    setIsAnimating(true);

    const startTime = performance.now();
    const duration = 1000;

    const animateMap = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress * (2 - progress);

      const start = startViewportRef.current;
      const end = targetViewport;

      setViewport({
        latitude: start.latitude + (end.latitude - start.latitude) * easedProgress,
        longitude: start.longitude + (end.longitude - start.longitude) * easedProgress,
        zoom: start.zoom + (end.zoom - start.zoom) * easedProgress,
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateMap);
      } else {
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

  // Funciones de geocoding
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
          throw new Error('Tipo de ubicación no válido. Solo se permiten países, ciudades, lugares o direcciones.');
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

  // Función principal de búsqueda de videos
  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '', pageToken = '') => {
    try {
      const searchQuery = query || locationName.split(',')[0].trim();
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&relevanceLanguage=es&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`;

      if (currentRegion) {
        url += `&regionCode=${currentRegion}`;
      }

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

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
        return {
          videos: [],
          nextPageToken: ''
        };
      }

      const youtubeVideos = searchData.items.slice(0, 12).map((item) => {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 0.3;
        const newLat = latitude + (distance * Math.cos(angle));
        const newLng = longitude + (distance * Math.sin(angle));
        
        return {
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
          description: item.snippet.description
        };
      });

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
  }, [YOUTUBE_API_KEY]);

  // Cargar videos para ubicación
  const loadVideosForLocation = useCallback(async (latitude, longitude, locationName, isSearch = false) => {
    setLoadingVideos(true);
    
    try {
      const result = await searchYouTubeVideosByLocation(latitude, longitude, locationName);
      
      if (result.videos.length > 0) {
        setVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setActiveFilter(isSearch ? 'search' : 'current');
        setSearchLocation(isSearch ? { latitude, longitude, name: locationName } : null);
      } else {
        await fetchPopularVideosByRegion(currentRegion);
      }
    } catch (err) {
      console.error('Error buscando videos:', err);
      if (err.message === 'QUOTA_EXCEEDED') {
        setVideos([]);
        setActiveFilter('unavailable');
      } else {
        await fetchPopularVideosByRegion(currentRegion);
      }
    } finally {
      setLoadingVideos(false);
    }
  }, [searchYouTubeVideosByLocation, fetchPopularVideosByRegion, currentRegion]);

  // Obtener ubicación del usuario
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularVideosByRegion(currentRegion);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        setTargetViewport({ 
          latitude: latitude, 
          longitude: longitude, 
          zoom: 12 
        });
        
        setUserLocation({ latitude, longitude });

        try {
          const locationName = await getLocationName(latitude, longitude);
          setUserLocationName(locationName);
          
          // VERIFICAR RESTRICCIONES para ubicación del usuario
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
          
          await loadVideosForLocation(latitude, longitude, locationName);

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
  }, [getLocationName, loadVideosForLocation, fetchPopularVideosByRegion, currentRegion, checkRestrictions]);

  // Cargar videos populares
  const fetchPopularVideos = useCallback(async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    setLoadingVideos(true);
    try {
      const locationName = userLocationName || await getLocationName(userLocation.latitude, userLocation.longitude);
      
      //  VERIFICAR RESTRICCIONES
      const locationCheck = await isValidMapLocation(userLocation.latitude, userLocation.longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        alert(restrictionCheck.message);
        setLoadingVideos(false);
        return;
      }
      
      await loadVideosForLocation(userLocation.latitude, userLocation.longitude, locationName);
      setActiveFilter('popular');
      setTargetViewport({ latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 10 });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar videos populares');
    } finally {
      setLoadingVideos(false);
    }
  }, [userLocation, userLocationName, getLocationName, loadVideosForLocation, checkRestrictions]);

  // Cargar otros videos
  const fetchOtherVideos = useCallback(async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    setLoadingVideos(true);
    try {
      const locationName = userLocationName || await getLocationName(userLocation.latitude, userLocation.longitude);
      
      // VERIFICAR RESTRICCIONES
      const locationCheck = await isValidMapLocation(userLocation.latitude, userLocation.longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (restrictionCheck.restricted) {
        alert(restrictionCheck.message);
        setLoadingVideos(false);
        return;
      }
      
      const result = await searchYouTubeVideosByLocation(userLocation.latitude, userLocation.longitude, locationName);
      
      if (result.videos.length > 0) {
        setVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setActiveFilter('other');
      } else {
        await loadVideosForLocation(userLocation.latitude, userLocation.longitude, locationName);
      }
      
      setTargetViewport({ latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 11 });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al buscar otros videos');
    } finally {
      setLoadingVideos(false);
    }
  }, [userLocation, userLocationName, getLocationName, searchYouTubeVideosByLocation, loadVideosForLocation, checkRestrictions]);

  // BÚSQUEDA MEJORADA CON VERIFICACIÓN COMPLETA DE RESTRICCIONES
  const fetchVideos = useCallback(async (query, pageToken = '') => {
    if (!query.trim()) {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
      return;
    }

    setLoadingVideos(true);
    setSearchError('');
    
    try {
      let latitude, longitude, locationName, countryCode;

      // Determinar qué ubicación usar
      if (clickedLocation && isValidLocation) {
        // Usar ubicación clickeada en el mapa
        latitude = clickedLocation.latitude;
        longitude = clickedLocation.longitude;
        locationName = clickedLocationName;
        
        // VERIFICAR RESTRICCIONES para ubicación clickeada
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
        
      } else if (userLocation) {
        // Usar ubicación actual del usuario
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
        locationName = userLocationName;
        
        // VERIFICAR RESTRICCIONES para ubicación actual
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
        
      } else {
        // Buscar la ubicación por nombre
        const locationData = await getLocationCoordinates(query.split(',')[0]);
        latitude = locationData.latitude;
        longitude = locationData.longitude;
        locationName = locationData.locationName;
        countryCode = locationData.countryCode;

        // VERIFICAR RESTRICCIONES para búsqueda por nombre
        const restrictionCheck = checkRestrictions(query, locationData);
        if (restrictionCheck.restricted) {
          alert(restrictionCheck.message);
          setLoadingVideos(false);
          return;
        }

        setTargetViewport({ 
          latitude: latitude, 
          longitude: longitude, 
          zoom: 10 
        });
      }

      // VERIFICACIÓN FINAL antes de buscar videos
      const finalLocationCheck = await isValidMapLocation(latitude, longitude);
      const finalRestrictionCheck = checkRestrictions(query, {
        countryCode: finalLocationCheck.countryCode,
        locationName: locationName
      });
      
      if (finalRestrictionCheck.restricted) {
        alert(finalRestrictionCheck.message);
        setLoadingVideos(false);
        return;
      }

      // Si pasa todas las verificaciones, buscar videos
      const result = await searchYouTubeVideosByLocation(
        latitude,
        longitude,
        locationName,
        query,
        pageToken
      );

      if (result.videos.length > 0) {
        if (pageToken) {
          setVideos(prev => [...prev, ...result.videos]);
        } else {
          setVideos(result.videos);
        }
        
        setNextPageToken(result.nextPageToken);
        setUserLocationName(locationName);
        setActiveFilter('search');
        setSearchLocation({
          latitude: latitude,
          longitude: longitude,
          name: locationName
        });
        setShowSuggestions(false);
      } else {
        throw new Error('No se encontraron videos para esta búsqueda');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchError(error.message || 'Error al realizar la búsqueda. Verifica el término e intenta nuevamente.');
      
      if (error.message.includes('Tipo de ubicación no válido')) {
        setSearchError('Solo se permiten búsquedas de países, ciudades, lugares o direcciones específicas.');
      } else if (error.message === 'QUOTA_EXCEEDED') {
        setSearchError('Límite de cuota excedido para YouTube API.');
      }
    } finally {
      setLoadingVideos(false);
    }
  }, [getLocationCoordinates, searchYouTubeVideosByLocation, clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName, checkRestrictions]);

  // Handlers para el buscador con sugerencias
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchError('');

    if (value.trim()) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions(popularSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchVideos(searchTerm);
      setShowSuggestions(false);
    } else {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    fetchVideos(suggestion);
  };

  const handleSearchFocus = () => {
    if (!suggestions.length) {
      setSuggestions(popularSuggestions);
    }
    setShowSuggestions(true);
  };

  // Handlers de UI
  const handleLogin = (userData) => {
    if (userData && !localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    
    setUser(userData);
    setShowProfile(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedLocation'); // Limpiar ubicación seleccionada
    setUser(null);
    setShowProfile(false);
    setShowSettings(false);
  };

  const handlePhotoUpdate = (updatedUser) => {
    setUser(updatedUser);
    setShowProfile(false);
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    if (user) {
      registerVideoAccess(video);
    }
  };

  const handleVideoDoubleClick = (video) => {
    if (user) {
      registerVideoAccess(video);
    }
    
    // Pasar la ubicación seleccionada al VideoPlayer
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
    
    // Guardar también en localStorage como backup
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    navigate(`/video/${video.youtube_video_id}`, { 
      state: locationState 
    });
  };

  const handleMarkerClick = (video) => {
    setSelectedVideo(video);
    if (user) {
      registerVideoAccess(video);
    }
  };

  const handleMarkerDoubleClick = (video) => {
    if (user) {
      registerVideoAccess(video);
    }
    
    // Pasar la ubicación seleccionada al VideoPlayer
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
    
    // Guardar también en localStorage como backup
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    navigate(`/video/${video.youtube_video_id}`, { 
      state: locationState 
    });
  };

  const handleWatchComplete = () => {
    if (user && selectedVideo) {
      registerVideoAccess(selectedVideo);
    }
    
    // Pasar la ubicación seleccionada al VideoPlayer
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
    
    // Guardar también en localStorage como backup
    if (locationState.selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(locationState.selectedLocation));
    }
    
    selectedVideo?.youtube_video_id && navigate(`/video/${selectedVideo.youtube_video_id}`, { 
      state: locationState 
    });
  };

  // Helper functions
  const getSidebarTitle = () => {
    if (!youtubeAvailable) {
      return 'YouTube No Disponible';
    }
    
    const titles = {
      popular: 'Videos Populares',
      other: 'Videos Cercanos', 
      current: 'Videos en tu Ubicación',
      search: `Resultados: "${searchTerm}"`,
      mexico: 'Videos Populares de México',
      clicked: `Videos en ${clickedLocationName}`,
      category: selectedCategory ? `Videos de ${selectedCategory.name}` : 'Videos por Categoría',
      unavailable: 'Servicio No Disponible'
    };
    return titles[activeFilter] || 'Videos con Vista Previa';
  };

  const getSidebarSubtitle = () => {
    if (!youtubeAvailable) {
      return youtubeError || 'YouTube no está disponible en tu país o región';
    }
    
    const subtitles = {
      popular: userLocationName ? `Videos populares en ${userLocationName}` : 'Videos populares en tu área',
      other: userLocationName ? `Videos cercanos a ${userLocationName}` : 'Videos en tu región',
      current: userLocationName ? `Basado en tu ubicación: ${userLocationName}` : 'Basado en tu ubicación actual',
      search: searchLocation ? `Ubicación: ${searchLocation.name}` : `Búsqueda: "${searchTerm}"`,
      mexico: 'Los videos más populares en México',
      clicked: `Ubicación seleccionada: ${clickedLocationName}`,
      category: selectedCategory ? `${selectedCategory.name} en ${searchLocation?.name || userLocationName || clickedLocationName}` : 'Explorando por categoría',
      unavailable: 'No se pueden cargar videos en tu región'
    };
    return subtitles[activeFilter] || 'Explorando contenido local';
  };

  const formatDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    return hours 
      ? `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
      : `${minutes}:${seconds.padStart(2, '0')}`;
  };

  // Componente de Sugerencias
  const SearchSuggestions = () => {
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
  };

  // Componente de Categorías en el Mapa
  const MapCategories = () => {
    const hasValidLocation = (clickedLocation && isValidLocation) || userLocation;
    
    return (
      <div className="absolute top-6 left-6 glass-effect bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-600">
        <div className="flex flex-col gap-2">
          <p className="text-cyan-400 text-sm font-semibold mb-2 text-center">Categorías</p>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => searchVideosByCategory(category)}
              disabled={!hasValidLocation}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                selectedCategory?.id === category.id 
                  ? `ring-2 ring-white ${category.bgColor}`
                  : `bg-gradient-to-r ${category.color} hover:shadow-lg`
              }`}
              title={hasValidLocation ? category.name : 'Primero activa tu ubicación o selecciona una en el mapa'}
            >
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
        {!hasValidLocation && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Activa tu ubicación o selecciona una en el mapa
          </p>
        )}
      </div>
    );
  };

  // Modal de Historial
  const HistoryModal = () => {
    if (!showHistoryModal) return null;

    return (
      <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="modal-content w-full max-w-4xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 max-h-[90vh] overflow-hidden">
          {/* Header */}
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
                onClick={() => setShowHistoryModal(false)}
                className="text-cyan-400 hover:text-cyan-300 text-2xl w-10 h-10 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
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

          {/* Footer */}
          {userHistory.length > 0 && (
            <div className="p-6 bg-gray-900/50 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={clearUserHistory}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Limpiar Todo el Historial
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
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

  // Modal de Ajustes Simplificado - Solo Historial
  const SettingsModal = () => {
    if (!showSettings) return null;

    return (
      <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="modal-content w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Ajustes
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-cyan-400 hover:text-cyan-300 text-xl w-8 h-8 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content - Solo Historial */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-cyan-300">Historial de Visualización</h3>
                <p className="text-gray-400 text-sm mt-1">Gestiona tu historial de videos vistos</p>
              </div>

              <button 
                onClick={async () => {
                  await fetchUserHistory();
                  setShowSettings(false);
                  setShowHistoryModal(true);
                }}
                className="w-full group bg-gray-700/50 hover:bg-cyan-500/20 border border-gray-600 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white group-hover:text-cyan-300">Ver Historial Completo</p>
                    <p className="text-gray-400 text-sm">Explora todos los videos que has visto</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres limpiar todo tu historial? Esta acción no se puede deshacer.')) {
                    clearUserHistory();
                    setShowSettings(false);
                  }
                }}
                className="w-full group bg-gray-700/50 hover:bg-red-500/20 border border-gray-600 hover:border-red-500/50 rounded-xl p-4 transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white group-hover:text-red-300">Limpiar Historial</p>
                    <p className="text-gray-400 text-sm">Eliminar todos los registros de visualización</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Navbar */}
      <div className="navbar absolute top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              VideoMap Pro
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
                
                {showProfile && (
                  <div className="absolute right-0 top-16 w-80 glass-effect bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 border border-gray-600 overflow-hidden">
                    <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                      <div className="flex items-center gap-4">
                        {user.foto ? (
                          <img 
                            src={user.foto} 
                            alt="Foto de perfil" 
                            className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500 shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-cyan-400 text-lg truncate">{user.nombre}</p>
                          <p className="text-gray-300 text-sm truncate">{user.email}</p>
                          {user.google_id && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                              <p className="text-xs text-green-400 font-medium">Cuenta Google</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowPhotoModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group"
                      >
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Cambiar Foto de Perfil</span>
                      </button>
                      
                      {!user.google_id && (
                        <button 
                          onClick={() => {
                            setShowProfile(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group"
                        >
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          <span className="font-medium">Cambiar Contraseña</span>
                        </button>
                      )}
                      
                      <div className="border-t border-gray-700 my-2"></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 text-red-400 hover:text-red-300 group"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
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

      <HistoryModal />
      <SettingsModal />

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
                className="rounded-xl shadow-2xl border border-gray-300 bg-white/95 backdrop-blur-md"
              >
                <div className="p-4 w-65 text-center text-gray-800">
                  <h3 className="font-semibold text-lg mb-2 leading-snug">
                    {isValidLocation ? clickedLocationName : 'Ubicación no disponible'}
                  </h3>

                  {isValidLocation ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        Coordenadas:
                        <br />
                        <span className="font-medium">
                          {clickedLocation.latitude.toFixed(4)}, {clickedLocation.longitude.toFixed(4)}
                        </span>
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={searchVideosForClickedLocation}
                          disabled={loadingVideos}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {loadingVideos ? 'Buscando...' : 'Buscar Videos'}
                        </button>
                        <button
                          onClick={() => setShowLocationPopup(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                        >
                          Cerrar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-3">{clickedLocationName}</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Haz clic en ciudades o lugares con nombre específico en el mapa.
                      </p>
                      <button
                        onClick={() => setShowLocationPopup(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                      >
                        Entendido
                      </button>
                    </>
                  )}
                </div>
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

          {/* Botones de categorías flotantes - SOLO EN EL MAPA */}
          <MapCategories />

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
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={fetchOtherVideos}
                  disabled={!userLocation || loadingVideos}
                  className={`font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    activeFilter === 'other' 
                      ? 'bg-cyan-600 border-2 border-cyan-400' 
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                  }`}
                >
                  {loadingVideos && activeFilter === 'other' ? 'Cargando...' : 'Videos Cercanos'}
                </button>
                <button
                  onClick={fetchPopularVideos}
                  disabled={!userLocation || loadingVideos}
                  className={`font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                    activeFilter === 'popular' 
                      ? 'bg-orange-600 border-2 border-orange-400' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                  }`}
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

              {selectedVideo && (
                <div className="glass-effect bg-gray-800/50 rounded-2xl p-4 mb-6 border-2 border-cyan-500/50">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold text-cyan-300">
                      Vista Previa: {selectedVideo.channelTitle}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1 line-clamp-2">{selectedVideo.title}</p>
                  </div>
                  <div className="bg-black rounded-lg overflow-hidden mb-3">
                    <YouTube
                      videoId={selectedVideo.youtube_video_id}
                      opts={{ 
                        width: '100%', 
                        height: '200',
                        playerVars: { autoplay: 0, modestbranding: 1, rel: 0 }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setSelectedVideo(null)}
                      className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      Cerrar
                    </button>
                    <button 
                      onClick={handleWatchComplete}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Ver Completo
                    </button>
                  </div>
                </div>
              )}

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
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  !loadingVideos && (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg">No se encontraron videos</p>
                      <p className="text-gray-500 text-sm">
                        {userLocation ? 'Usa los botones para cargar videos' : 'Activa tu ubicación o usa la búsqueda'}
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