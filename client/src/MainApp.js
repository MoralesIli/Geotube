import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';
import AuthModal from './components/models/AuthModal';
import ChangePasswordModal from './components/models/ChangePasswordModal';
import ChangePhotoModal from './components/models/ChangePhotoModal';
import CommentsModal from './components/models/CommentsModal';

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
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeFilter, setActiveFilter] = useState('mexico');
  const [nextPageToken, setNextPageToken] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [currentRegion, setCurrentRegion] = useState('MX');
  const [youtubeAvailable, setYoutubeAvailable] = useState(true);
  const [youtubeError, setYoutubeError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // NUEVO ESTADO PARA CONTROLAR VISTA MÓVIL
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);

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

  // Efecto para detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true);
        setShowSearchBar(false);
      } else {
        setShowSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // PAÍSES Y CIUDADES RESTRINGIDAS
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

  // Configuración por región
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
    }
  }), []);

  // Categorías de búsqueda - OPTIMIZADO PARA MÓVIL
  const categories = useMemo(() => [
    {
      id: 'cultura',
      name: 'Cultura',
      keywords: ['Cultura', 'Tradiciones', 'Costumbres', 'Festividades', 'Arte local'],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
      icon: '🎭'
    },
    {
      id: 'gastronomia',
      name: 'Gastronomía',
      keywords: ['Comida típica', 'Gastronomía', 'Platos regionales', 'Bebidas tradicionales'],
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
      icon: '🍽️'
    },
    {
      id: 'naturaleza',
      name: 'Naturaleza',
      keywords: ['Turismo', 'Lugares turísticos', 'Parques naturales', 'Playas', 'Montañas'],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
      icon: '🌳'
    },
    {
      id: 'historia',
      name: 'Historia',
      keywords: ['Historia del lugar', 'Personajes históricos', 'Museos', 'Patrimonio mundial'],
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      icon: '🏛️'
    },
    {
      id: 'entretenimiento',
      name: 'Entretenimiento',
      keywords: ['Eventos culturales', 'Festivales', 'Música moderna', 'Vida nocturna'],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      icon: '🎪'
    }
  ], []);

  // Función para validar tipo de ubicación
  const isValidLocationType = useCallback((feature) => {
    const validTypes = ['country', 'region', 'place', 'locality', 'neighborhood', 'address'];
    return feature.place_type?.some(type => validTypes.includes(type));
  }, []);

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

  // Función para buscar videos en YouTube por ubicación
  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '', pageToken = '') => {
    try {
      const searchQuery = query || locationName.split(',')[0].trim();
      
      let url = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `type=video&` +
        `maxResults=12&` +
        `relevanceLanguage=es&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `key=${YOUTUBE_API_KEY}`;

      url += `&location=${latitude},${longitude}`;
      url += `&locationRadius=50km`;

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

      const youtubeVideos = [];
      
      for (const item of searchData.items.slice(0, 12)) {
        try {
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${item.id.videoId}&key=${YOUTUBE_API_KEY}`;
          const detailsResponse = await fetch(videoDetailsUrl);
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const videoDetails = detailsData.items[0];
            
            const hasLocationData = videoDetails?.recordingDetails?.location || 
                                  videoDetails?.snippet?.locationDescription;

            if (hasLocationData) {
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

      if (youtubeVideos.length === 0) {
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

  // Cargar videos para ubicación
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
      } else {
        if (!isLoadMore) {
          setVideos([]);
          setNextPageToken('');
          setHasMoreVideos(false);
          setActiveFilter('no-videos');
        }
      }
    } catch (err) {
      console.error('Error buscando videos:', err);
      if (!isLoadMore) {
        if (err.message === 'QUOTA_EXCEEDED') {
          setVideos([]);
          setActiveFilter('unavailable');
        } else {
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
        
        setClickedLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude
        });
        setClickedLocationName(locationData.locationName);
        setIsValidLocation(true);
      }
    } catch (error) {
      console.error('Error moviendo el mapa a la ubicación:', error);
    }
  }, [getLocationCoordinates]);

  // Función para verificar restricciones
  const checkRestrictions = useCallback((query, locationData = null) => {
    const restrictedPatterns = new RegExp(
      restrictedCities.map(city => city.toLowerCase()).join('|'), 
      'i'
    );
    
    if (restrictedPatterns.test(query.toLowerCase())) {
      return {
        restricted: true,
        reason: 'query',
        message: 'Videos no disponibles en esta región (restricción de YouTube).'
      };
    }

    if (locationData && locationData.countryCode) {
      const countryCode = locationData.countryCode.toUpperCase();
      if (restrictedCountries.includes(countryCode)) {
        return {
          restricted: true,
          reason: 'country',
          message: 'YouTube no está disponible en este país (restricción gubernamental).'
        };
      }
    }

    if (locationData && locationData.locationName) {
      if (restrictedPatterns.test(locationData.locationName.toLowerCase())) {
        return {
          restricted: true,
          reason: 'location',
          message: 'Videos no disponibles en esta ubicación (restricción de YouTube).'
        };
      }
    }

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

  // MANEJAR CLIC EN EL MAPA
  const handleMapClick = useCallback(async (event) => {
    const { lngLat } = event;
    const clickedLat = lngLat.lat;
    const clickedLng = lngLat.lng;
    
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
      
      if (locationCheck.countryCode && restrictedCountries.includes(locationCheck.countryCode)) {
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName('País restringido - YouTube no disponible');
        setShowLocationPopup(true);
        setLoadingVideos(false);
        return;
      }
      
      if (locationCheck.isValid && locationCheck.placeName) {
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
        
        setTimeout(() => {
          setTargetViewport({
            latitude: clickedLat,
            longitude: clickedLng,
            zoom: 10
          });
        }, 100);

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
  }, [isValidMapLocation, restrictedCountries, checkRestrictions, isAnimating]);

  // BUSCAR VIDEOS POR CATEGORÍA
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

  // CARGAR VIDEOS CERCANOS
  const fetchOtherVideos = useCallback(async () => {
    let latitude, longitude, locationName;

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

  // CARGAR VIDEOS POPULARES
  const fetchPopularVideos = useCallback(async () => {
    let latitude, longitude, locationName;

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

  // BÚSQUEDA MEJORADA
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

      if (clickedLocation && isValidLocation) {
        latitude = clickedLocation.latitude;
        longitude = clickedLocation.longitude;
        locationName = clickedLocationName;
      } else if (userLocation) {
        latitude = userLocation.latitude;
        longitude = userLocation.longitude;
        locationName = userLocationName;
      } else {
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
        } catch (error) {
          throw new Error('Primero activa tu ubicación o selecciona una en el mapa. Error: ' + error.message);
        }
      }

      const locationCheck = await isValidMapLocation(latitude, longitude);
      const finalRestrictionCheck = checkRestrictions(query, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (finalRestrictionCheck.restricted) {
        throw new Error(finalRestrictionCheck.message);
      }

      if (!isLoadMore) {
        setActiveSearchTerm(query);
      }

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

  // Obtener ubicación del usuario - FUNCIÓN PRINCIPAL CORREGIDA
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularVideosByRegion(currentRegion);
    }

    if (isAnimating) return;

    // Limpiar ubicación clickeada al activar ubicación actual
    setClickedLocation(null);
    setClickedLocationName('');
    setIsValidLocation(false);
    setShowLocationPopup(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // Mover el mapa a la ubicación
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
          
          // Verificar restricciones
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

          // Cargar videos para la ubicación
          await loadVideosForLocation(latitude, longitude, locationName);

          // Guardar en localStorage
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
  }, [getLocationName, loadVideosForLocation, fetchPopularVideosByRegion, currentRegion, checkRestrictions, isValidMapLocation, isAnimating]);

  // Efecto de animación del mapa
  useEffect(() => {
    if (!targetViewport) return;

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

  // Handlers para el buscador
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchError('');

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
      fetchVideos(searchTerm);
      setShowSuggestions(false);
      if (isMobile) {
        setShowSearchBar(false);
      }
    } else {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
    }
  }, [searchTerm, fetchVideos, isMobile]);

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  // MODIFICADA: Función para manejar clic en sugerencias
  const handleSuggestionClick = useCallback(async (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    await moveMapToLocation(suggestion);
  }, [moveMapToLocation]);

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
        className={`absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto ${
          isMobile ? 'mx-2' : ''
        }`}
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
              <span className="text-sm truncate">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }, [showSuggestions, suggestions, handleSuggestionClick, isMobile]);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Navbar */}
      <div className={`navbar fixed top-0 left-0 w-full ${
        isMobile ? 'h-16' : 'h-20'
      } flex items-center justify-between px-4 sm:px-8 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700`}>
        
        {/* Logo y título */}
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className={`font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 ${
              isMobile ? 'text-xl' : 'text-3xl'
            }`}>
              VideoMap 
            </h1>
          </div>
          
          {/* Botones de categorías - SOLO EN ESCRITORIO */}
          {!isMobile && (
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
          )}
        </div>

        {/* Controles de búsqueda y usuario */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Botón de búsqueda en móvil */}
          {isMobile && (
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-2 rounded-lg transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Barra de búsqueda - EN ESCRITORIO SIEMPRE VISIBLE, EN MÓVIL SOLO CUANDO SE ACTIVA */}
          {(!isMobile || showSearchBar) && (
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
                    className={`search-input glass-effect bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isMobile ? 'w-48 pr-8' : 'w-80 pr-10'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                {!isMobile && (
                  <button 
                    type="submit" 
                    className="ml-2 btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-3 py-2 rounded-lg transition-all duration-300 text-sm"
                  >
                    Buscar
                  </button>
                )}
              </form>

              {/* Sugerencias */}
              <SearchSuggestions />

              {/* Mensaje de error */}
              {searchError && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-red-300 text-xs">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{searchError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de usuario */}
          {user ? (
            <>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-secondary flex items-center gap-1 sm:gap-2 bg-gray-700 hover:bg-gray-600 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-300"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {!isMobile && <span className="text-sm">Ajustes</span>}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(!showProfile)}
                  className={`user-avatar flex items-center justify-center text-white font-bold overflow-hidden border-2 border-cyan-500 ${
                    isMobile ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'
                  } rounded-full`}
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
              </div>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn-primary flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!isMobile && <span>Iniciar Sesión</span>}
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

      {/* Contenido Principal - ESTRUCTURA MEJORADA PARA MÓVIL */}
      <div className={`flex flex-1 ${
        isMobile ? 'flex-col pt-16' : 'flex-row pt-20'
      }`}>
        
        {/* Mapa - POSICIÓN MEJORADA DE BOTONES */}
        <div className={`relative ${
          isMobile 
            ? showSidebar ? 'h-3/5' : 'h-full'
            : 'flex-1'
        }`}>
          <Map
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            onMove={(evt) => !isAnimating && setViewport(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          >
            <NavigationControl position="top-right" />

            {/* POPUP CORREGIDO - POSICIÓN MEJORADA */}
            {showLocationPopup && clickedLocation && (
              <Popup
                latitude={clickedLocation.latitude}
                longitude={clickedLocation.longitude}
                closeButton={false}
                closeOnClick={false}
                onClose={() => setShowLocationPopup(false)}
                anchor="bottom"
                className={`rounded-xl shadow-xl border border-gray-300 bg-white/95 backdrop-blur-md ${
                  isMobile ? 'max-w-[92vw] translate-y-[-10px]' : 'w-[320px]'
                }`}
              >
                <div className={`text-center text-gray-800 ${
                  isMobile ? 'p-3 w-auto' : 'p-4'
                }`}>
                  <h3 className={`font-semibold leading-snug ${
                    isMobile ? 'text-base mb-1' : 'text-lg mb-2'
                  }`}>
                    {isValidLocation ? clickedLocationName : 'Ubicación no disponible'}
                  </h3>

                  {isValidLocation ? (
                    <>
                      <p className={`text-gray-600 mb-3 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        Coordenadas:
                        <br />
                        <span className="font-medium">
                          {clickedLocation.latitude.toFixed(4)}, {clickedLocation.longitude.toFixed(4)}
                        </span>
                      </p>

                      <div className={`space-y-2 ${
                        isMobile ? 'space-y-1' : 'space-y-2'
                      }`}>
                        <button
                          onClick={() => {
                            const searchQuery = searchTerm.trim() || clickedLocationName.split(',')[0].trim();
                            loadVideosForLocation(
                              clickedLocation.latitude,
                              clickedLocation.longitude,
                              clickedLocationName,
                              searchQuery
                            );
                            setShowLocationPopup(false);
                          }}
                          disabled={loadingVideos}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {loadingVideos ? 'Buscando...' : 'Videos de esta Ubicación'}
                        </button>

                        <button
                          onClick={() => setShowLocationPopup(false)}
                          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                        >
                          Cerrar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className={`text-gray-600 mb-2 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>{clickedLocationName}</p>
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
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full animate-ping absolute"></div>
                  <div className="h-4 w-4 sm:h-6 sm:w-6 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full"></div>
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
                  className="cursor-pointer text-2xl sm:text-3xl transform hover:scale-125 sm:hover:scale-150 transition-all duration-300"
                  title="Click para vista previa, Doble click para ver completo"
                >
                  <div className="relative">
                    <div className={`border-2 border-white rounded-full ${
                      video.isSearchResult 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    } ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`}></div>
                  </div>
                </div>
              </Marker>
            ))}
          </Map>

          {/* BOTONES DE CONTROL DEL MAPA - POSICIÓN CORREGIDA SEGÚN TU SOLUCIÓN */}
          <div className={`absolute ${
            isMobile 
              ? 'bottom-20 left-0 right-0 flex justify-center gap-3 z-50 px-4'
              : 'bottom-8 right-8 flex flex-col gap-3 z-50'
          }`}>
            
            {/* Botón Mi Ubicación - MEJORADO */}
            <button
              onClick={getUserLocation}
              disabled={isAnimating}
              className={`bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center ${
                isMobile 
                  ? 'px-4 py-3 text-sm gap-2' 
                  : 'px-6 py-3 text-lg gap-2'
              }`}
            >
              {isAnimating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  {isMobile ? 'Moviendo...' : 'Moviendo...'}
                </>
              ) : (
                <>
                  <svg className={isMobile ? "w-4 h-4" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isMobile ? 'Mi Ubicación' : 'Mi Ubicación'}
                </>
              )}
            </button>

            {/* Botón para mostrar/ocultar sidebar en móvil - MEJORADO */}
            {isMobile && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSidebar ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
                {showSidebar ? 'Ocultar Videos' : 'Mostrar Videos'}
              </button>
            )}
          </div>

          {isAnimating && (
            <div className="absolute top-4 right-4 glass-effect bg-gray-800/80 px-3 py-2 rounded-lg z-40">
              <p className="text-sm text-cyan-400 flex items-center gap-2">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></span>
                Moviendo...
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - TAMAÑO MEJORADO PARA MÓVIL */}
        {showSidebar && (
          <div className={`bg-gradient-to-b from-slate-900 via-purple-900 to-blue-900 overflow-y-auto flex flex-col ${
            isMobile 
              ? 'h-2/5 border-t border-gray-700 z-30'
              : 'w-1/3 p-6'
          }`}>
            
            {/* Encabezado del sidebar - COMPACTO */}
            <div className={`text-center ${
              isMobile ? 'p-3 border-b border-gray-700 bg-gray-800/50' : 'mb-6'
            }`}>
              <h2 className={`font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent ${
                isMobile ? 'text-lg' : 'text-3xl'
              }`}>
                {getSidebarTitle()}
              </h2>
              <p className={`text-cyan-300 ${
                isMobile ? 'text-xs mt-1 truncate px-2' : 'text-sm mt-2'
              }`}>
                {getSidebarSubtitle()}
              </p>
            </div>

            {/* Categorías en móvil - MÁS COMPACTO */}
            {isMobile && (
              <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/30">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((category) => {
                    const hasValidLocation = (clickedLocation && isValidLocation) || userLocation;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => searchVideosByCategory(category)}
                        disabled={!hasValidLocation}
                        className={`flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex-shrink-0 ${
                          selectedCategory?.id === category.id 
                            ? `ring-1 ring-white ${category.bgColor}`
                            : `bg-gradient-to-r ${category.color} hover:shadow-md`
                        }`}
                      >
                        <span className="text-xs">{category.icon}</span>
                        <span className="text-xs">{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!youtubeAvailable ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-12 sm:h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-red-300 mb-2">YouTube No Disponible</h3>
                  <p className="text-gray-400 mb-4 text-xs sm:text-sm">
                    {youtubeError || 'YouTube no está disponible en tu país o región.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Botones de acción - MÁS COMPACTOS EN MÓVIL */}
                <div className={`grid gap-2 ${
                  isMobile ? 'p-3 grid-cols-2' : 'mb-6 grid-cols-2 gap-3'
                }`}>
                  <button
                    onClick={fetchOtherVideos}
                    disabled={(!userLocation && !clickedLocation) || loadingVideos}
                    className={`font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                      activeFilter === 'other' 
                        ? 'bg-cyan-600 border-2 border-cyan-400' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                    } ${isMobile ? 'py-2 px-2 text-xs' : 'py-3 px-4 text-sm'}`}
                  >
                    {loadingVideos && activeFilter === 'other' ? 'Cargando...' : 'Videos Cercanos'}
                  </button>
                  <button
                    onClick={fetchPopularVideos}
                    disabled={(!userLocation && !clickedLocation) || loadingVideos}
                    className={`font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                      activeFilter === 'popular' 
                        ? 'bg-orange-600 border-2 border-orange-400' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    } ${isMobile ? 'py-2 px-2 text-xs' : 'py-3 px-4 text-sm'}`}
                  >
                    {loadingVideos && activeFilter === 'popular' ? 'Cargando...' : 'Populares'}
                  </button>
                </div>

                {loadingVideos && (
                  <div className={`glass-effect bg-gray-800/50 rounded-xl text-center ${
                    isMobile ? 'mx-3 p-2 mb-3' : 'p-4 mb-6'
                  }`}>
                    <p className="text-cyan-400 flex items-center justify-center gap-2 text-xs sm:text-sm">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></span>
                      {activeFilter === 'search' ? 'Buscando videos...' : 'Cargando videos...'}
                    </p>
                  </div>
                )}

                {selectedVideo && (
                  <div className={`glass-effect bg-gray-800/50 rounded-xl border-2 border-cyan-500/50 ${
                    isMobile ? 'mx-3 p-2 mb-3' : 'p-4 mb-6'
                  }`}>
                    <div className="text-center mb-2">
                      <h3 className={`font-bold text-cyan-300 ${
                        isMobile ? 'text-sm' : 'text-lg'
                      }`}>
                        Vista Previa
                      </h3>
                      <p className={`text-gray-300 mt-1 line-clamp-1 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>{selectedVideo.channelTitle}</p>
                    </div>
                    <div className="bg-black rounded-lg overflow-hidden mb-2">
                      <YouTube
                        videoId={selectedVideo.youtube_video_id}
                        opts={{ 
                          width: '100%', 
                          height: isMobile ? '120' : '200',
                          playerVars: { autoplay: 0, modestbranding: 1, rel: 0 }
                        }}
                      />
                    </div>
                    <div className={`grid gap-1 ${
                      isMobile ? 'grid-cols-2' : 'grid-cols-2 gap-3'
                    }`}>
                      <button 
                        onClick={() => setSelectedVideo(null)}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-300 text-xs sm:text-sm"
                      >
                        Cerrar
                      </button>
                      <button 
                        onClick={handleWatchComplete}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
                      >
                        Ver Completo
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de videos - MÁS COMPACTA */}
                <div className={`space-y-2 flex-1 overflow-y-auto ${
                  isMobile ? 'px-3 pb-3' : 'space-y-4'
                }`}>
                  {videos.length > 0 ? (
                    <>
                      {videos.map((video) => (
                        <div
                          key={video.youtube_video_id}
                          onClick={() => handleVideoClick(video)}
                          onDoubleClick={() => handleVideoDoubleClick(video)}
                          className={`glass-effect bg-gray-800/50 rounded-xl cursor-pointer transform hover:scale-102 transition-all duration-300 border-l-4 ${
                            video.isSearchResult 
                              ? 'border-l-yellow-500 bg-yellow-500/10' 
                              : video.isCurrentLocation 
                                ? 'border-l-green-500 bg-green-500/10' 
                                : 'border-l-cyan-500 bg-cyan-500/10'
                          } ${selectedVideo?.youtube_video_id === video.youtube_video_id ? 'ring-2 ring-yellow-400' : ''} ${
                            isMobile ? 'p-2' : 'p-4'
                          }`}
                        >
                          <div className="flex gap-2">
                            <div className="flex-shrink-0">
                              <img 
                                src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                                alt="Miniatura del video"
                                className={`rounded-lg object-cover ${
                                  isMobile ? 'w-12 h-9' : 'w-20 h-15'
                                }`}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/120x90/1f2937/6b7280?text=Video';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <div className={`rounded-full ${
                                  video.isSearchResult 
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                                } ${isMobile ? 'h-2 w-2' : 'h-3 w-3'}`}></div>
                                <p className={`font-bold text-white ${
                                  isMobile ? 'text-xs' : 'text-sm'
                                } truncate`}>{video.channelTitle}</p>
                              </div>
                              <p className={`text-gray-300 line-clamp-1 mb-1 ${
                                isMobile ? 'text-xs' : 'text-xs'
                              }`}>{video.title}</p>
                              <div className="flex justify-between items-center">
                                <span className={`text-yellow-300 ${
                                  isMobile ? 'text-xs' : 'text-xs'
                                }`}>{video.views.toLocaleString()} vistas</span>
                                {video.duration && video.duration !== 'PT0S' && (
                                  <span className={`text-cyan-400 ${
                                    isMobile ? 'text-xs' : 'text-xs'
                                  }`}>{formatDuration(video.duration)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    !loadingVideos && (
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-xs sm:text-sm">No se encontraron videos</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {userLocation || clickedLocation ? 'Usa los botones para cargar videos' : 'Activa tu ubicación o usa la búsqueda'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainApp;