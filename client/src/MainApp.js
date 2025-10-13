import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';
import AuthModal from './AuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangePhotoModal from './ChangePhotoModal';

const MainApp = () => {
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 2,
  });
  const [targetViewport, setTargetViewport] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef();
  const startViewportRef = useRef(null);

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
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // ESTADOS PARA GEOLOCALIZACIÓN GLOBAL
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';
  const YOUTUBE_API_KEY = 'AIzaSyCi_KpytxXFwg6wCQKTYoCiVffiFRoGlsQ';

  const popularSuggestions = [
    'Ciudad de México',
    'Cancún',
    'Guadalajara',
    'Monterrey',
    'Playa del Carmen',
    'Tulum',
    'Oaxaca',
    'Puerto Vallarta',
    'Los Cabos',
    'Mazatlán'
  ];

  // Función mejorada para verificar si una ubicación es válida
  const isValidMapLocation = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=country,region,place,locality,neighborhood&` +
        `limit=1&` +
        `language=es`
      );
      
      if (!response.ok) return { isValid: false, placeName: null, featureType: 'unknown' };
      
      const data = await response.json();
      
      // Verificar si es una ubicación válida con nombre específico
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const placeName = feature.place_name;
        const featureType = feature.place_type?.[0] || 'unknown';
        
        // Solo aceptar tipos de ubicación específicos
        const validTypes = ['country', 'region', 'place', 'locality', 'neighborhood'];
        
        if (!validTypes.includes(featureType)) {
          return { isValid: false, placeName: null, featureType };
        }
        
        // Excluir ubicaciones genéricas o sin nombre específico
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
          /^\s*$/, // nombre vacío
          /mar/i, // mar
          /gulf/i, // golfo
          /bay/i, // bahía
          /strait/i, // estrecho
          /channel/i // canal
        ];
        
        const hasValidName = !invalidPatterns.some(pattern => pattern.test(placeName)) && 
                            placeName.trim().length > 0;
        
        const isValid = hasValidName && validTypes.includes(featureType);
        
        return {
          isValid,
          placeName: isValid ? placeName : null,
          featureType
        };
      }
      
      return { isValid: false, placeName: null, featureType: 'unknown' };
    } catch (error) {
      console.error('Error verificando ubicación:', error);
      return { isValid: false, placeName: null, featureType: 'unknown' };
    }
  };

  // Manejar clic en el mapa - CORREGIDO
  const handleMapClick = async (event) => {
    const { lngLat } = event;
    const clickedLat = lngLat.lat;
    const clickedLng = lngLat.lng;
    
    // Verificar primero si las coordenadas están en áreas terrestres aproximadas
    // Coordenadas aproximadas de los límites terrestres (excluyendo océanos)
    const isInLandArea = 
      clickedLat > -60 && clickedLat < 85 && // Excluir áreas polares extremas
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
      // Verificar si es una ubicación válida con nombre específico
      const locationCheck = await isValidMapLocation(clickedLat, clickedLng);
      
      if (locationCheck.isValid && locationCheck.placeName) {
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName(locationCheck.placeName);
        setIsValidLocation(true);
        setShowLocationPopup(true);
        
        // Mover el mapa a la ubicación clickeada
        setTargetViewport({
          latitude: clickedLat,
          longitude: clickedLng,
          zoom: 10
        });
      } else {
        // Ubicación no válida (océano, área sin nombre, etc.)
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        
        // Mensaje más específico según el tipo de ubicación
        let message = 'Ubicación no disponible para búsqueda';
        if (locationCheck.featureType === 'water' || locationCheck.featureType === 'marine') {
          message = 'Área marina - No se pueden buscar videos aquí';
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

  // Resto del código permanece igual...
  useEffect(() => {
    const checkAuthStatus = () => {
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

    checkAuthStatus();
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

  const getLocationCoordinates = useCallback(async (placeName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(placeName)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,region&limit=1&language=es`
      );
      
      if (!response.ok) throw new Error('Error en geocoding');
      
      const data = await response.json();
      
      if (data.features?.[0]) {
        const [longitude, latitude] = data.features[0].center;
        const locationName = data.features[0].place_name;
        return { latitude, longitude, locationName };
      }
      
      throw new Error('Lugar no encontrado');
    } catch (error) {
      console.warn('Error obteniendo coordenadas:', error);
      throw error;
    }
  }, [MAPBOX_TOKEN]);

  const getLocationName = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality&limit=1&language=es`
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

  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '', pageToken = '') => {
    try {
      const searchQuery = query || locationName.split(',')[0].trim();
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&relevanceLanguage=es&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const searchResponse = await fetch(url);

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) throw new Error('QUOTA_EXCEEDED');
        throw new Error('Error en YouTube API');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items?.length) {
        return { videos: [], nextPageToken: '' };
      }

      const videoIds = searchData.items.slice(0, 8).map(item => item.id.videoId).join(',');
      let videoStats = {};

      try {
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          statsData.items.forEach(video => {
            videoStats[video.id] = {
              viewCount: parseInt(video.statistics.viewCount) || Math.floor(Math.random() * 50000) + 1000,
              likeCount: parseInt(video.statistics.likeCount) || 0,
              duration: video.contentDetails?.duration || 'PT0S'
            };
          });
        }
      } catch (statsError) {
        console.warn('Error obteniendo estadísticas');
      }

      const youtubeVideos = searchData.items.slice(0, 12).map((item) => {
        const videoId = item.id.videoId;
        const stats = videoStats[videoId] || { 
          viewCount: Math.floor(Math.random() * 50000) + 1000,
          likeCount: 0,
          duration: 'PT0S'
        };
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 0.3;
        const newLat = latitude + (distance * Math.cos(angle));
        const newLng = longitude + (distance * Math.sin(angle));
        
        return {
          youtube_video_id: videoId,
          location_name: `${locationName} - ${item.snippet.channelTitle}`,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          latitude: newLat,
          longitude: newLng,
          views: stats.viewCount,
          likes: stats.likeCount,
          duration: stats.duration,
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
      if (error.message === 'QUOTA_EXCEEDED') throw error;
      throw new Error('Error en búsqueda de videos');
    }
  }, [YOUTUBE_API_KEY]);

  const fetchPopularMexicoVideos = useCallback(async () => {
    try {
      const lastQuotaError = localStorage.getItem('youtube_quota_exceeded');
      if (lastQuotaError && Date.now() - parseInt(lastQuotaError) < 3600000) {
        throw new Error('QUOTA_EXCEEDED_RECENTLY');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=MX&maxResults=12&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        const popularVideos = data.items.map((item) => ({
          youtube_video_id: item.id,
          location_name: `México - ${item.snippet.channelTitle}`,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          latitude: 19.4326 + (Math.random() - 0.5) * 4,
          longitude: -99.1332 + (Math.random() - 0.5) * 4,
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
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('Error al cargar videos populares');
      }
    } catch (error) {
      console.error('Error:', error);
      const fallbackVideos = [
        {
          youtube_video_id: 'dQw4w9WgXcQ',
          location_name: 'México - Video Popular',
          title: 'Video Musical Popular',
          channelTitle: 'Canal Musical',
          latitude: 19.4326,
          longitude: -99.1332,
          views: 1500000,
          likes: 50000,
          duration: 'PT3M33S',
          isCurrentLocation: false,
          isSearchResult: false,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        }
      ];
      setVideos(fallbackVideos);
      setActiveFilter('mexico');
      setNextPageToken('');
      return fallbackVideos;
    }
  }, [YOUTUBE_API_KEY]);

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
        await fetchPopularMexicoVideos();
      }
    } catch (err) {
      console.error('Error buscando videos:', err);
      await fetchPopularMexicoVideos();
    } finally {
      setLoadingVideos(false);
    }
  }, [searchYouTubeVideosByLocation, fetchPopularMexicoVideos]);

  const loadMoreVideos = useCallback(async () => {
    if (!nextPageToken) return;

    setLoadingVideos(true);
    try {
      let result;
      
      if (activeFilter === 'search' && searchLocation) {
        result = await searchYouTubeVideosByLocation(
          searchLocation.latitude, 
          searchLocation.longitude, 
          searchLocation.name, 
          searchTerm,
          nextPageToken
        );
      } else if (userLocation && activeFilter === 'current') {
        result = await searchYouTubeVideosByLocation(
          userLocation.latitude,
          userLocation.longitude,
          userLocationName,
          '',
          nextPageToken
        );
      } else if (activeFilter === 'clicked' && clickedLocation) {
        result = await searchYouTubeVideosByLocation(
          clickedLocation.latitude,
          clickedLocation.longitude,
          clickedLocationName,
          '',
          nextPageToken
        );
      } else {
        return;
      }

      if (result.videos.length > 0) {
        setVideos(prev => [...prev, ...result.videos]);
        setNextPageToken(result.nextPageToken);
      }
    } catch (error) {
      console.error('Error cargando más videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  }, [nextPageToken, activeFilter, searchLocation, userLocation, userLocationName, searchTerm, clickedLocation, clickedLocationName, searchYouTubeVideosByLocation]);

  const fetchVideos = useCallback(async (query, pageToken = '') => {
    setLoadingVideos(true);
    try {
      const locationData = await getLocationCoordinates(query);
      
      setTargetViewport({ 
        latitude: locationData.latitude, 
        longitude: locationData.longitude, 
        zoom: 10 
      });

      const result = await searchYouTubeVideosByLocation(
        locationData.latitude,
        locationData.longitude,
        locationData.locationName,
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
        setUserLocationName(locationData.locationName);
        setActiveFilter('search');
        setSearchLocation({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          name: locationData.locationName
        });
      } else {
        throw new Error('No se encontraron videos para esta ubicación');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      
      if (error.message.includes('Lugar no encontrado')) {
        alert('No se pudo encontrar el lugar especificado. Intenta con un nombre más específico.');
      }
      
      try {
        const fallbackResult = await searchYouTubeVideosByLocation(
          23.6345, -102.5528, 'México', query
        );
        setVideos(fallbackResult.videos);
        setNextPageToken(fallbackResult.nextPageToken);
        setActiveFilter('search');
      } catch (fallbackError) {
        console.error('Error en búsqueda fallback:', fallbackError);
      }
    } finally {
      setLoadingVideos(false);
    }
  }, [getLocationCoordinates, searchYouTubeVideosByLocation]);

  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularMexicoVideos();
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
        fetchPopularMexicoVideos();
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, [getLocationName, loadVideosForLocation, fetchPopularMexicoVideos]);

  const fetchPopularVideos = useCallback(async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    setLoadingVideos(true);
    try {
      const locationName = userLocationName || await getLocationName(userLocation.latitude, userLocation.longitude);
      await loadVideosForLocation(userLocation.latitude, userLocation.longitude, locationName);
      setActiveFilter('popular');
      setTargetViewport({ latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 10 });
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar videos populares');
    } finally {
      setLoadingVideos(false);
    }
  }, [userLocation, userLocationName, getLocationName, loadVideosForLocation]);

  const fetchOtherVideos = useCallback(async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    setLoadingVideos(true);
    try {
      const locationName = userLocationName || await getLocationName(userLocation.latitude, userLocation.longitude);
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
  }, [userLocation, userLocationName, getLocationName, searchYouTubeVideosByLocation, loadVideosForLocation]);

  useEffect(() => {
    const initializeApp = async () => {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          setUserLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
          setUserLocationName(locationData.name || 'Ubicación guardada');
          await loadVideosForLocation(locationData.latitude, locationData.longitude, locationData.name);
        } catch (error) {
          console.error('Error:', error);
          await fetchPopularMexicoVideos();
        }
      } else {
        await fetchPopularMexicoVideos();
      }
    };

    initializeApp();
  }, [loadVideosForLocation, fetchPopularMexicoVideos]);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `country=mx&` +
        `types=place,locality,region,neighborhood&` +
        `language=es&` +
        `limit=5`
      );

      if (response.ok) {
        const data = await response.json();
        const suggestionsData = data.features.map(feature => ({
          id: feature.id,
          name: feature.place_name,
          center: feature.center
        }));
        setSuggestions(suggestionsData);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [MAPBOX_TOKEN]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.name);
    setShowSuggestions(false);
    fetchVideos(suggestion.name);
  };

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
  };

  const handleVideoDoubleClick = (video) => {
    navigate(`/video/${video.youtube_video_id}`);
  };

  const handleMarkerClick = (video) => {
    setSelectedVideo(video);
  };

  const handleMarkerDoubleClick = (video) => {
    navigate(`/video/${video.youtube_video_id}`);
  };

  const handleWatchComplete = () => {
    selectedVideo?.youtube_video_id && navigate(`/video/${selectedVideo.youtube_video_id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchTerm.trim()) {
      fetchVideos(searchTerm);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getSidebarTitle = () => {
    const titles = {
      popular: 'Videos Populares',
      other: 'Videos Cercanos', 
      current: 'Videos en tu Ubicación',
      search: `Resultados: "${searchTerm}"`,
      mexico: 'Videos Populares de México',
      clicked: `Videos en ${clickedLocationName}`
    };
    return titles[activeFilter] || 'Videos con Vista Previa';
  };

  const getSidebarSubtitle = () => {
    const subtitles = {
      popular: userLocationName ? `Videos populares en ${userLocationName}` : 'Videos populares en tu área',
      other: userLocationName ? `Videos cercanos a ${userLocationName}` : 'Videos en tu región',
      current: userLocationName ? `Basado en tu ubicación: ${userLocationName}` : 'Basado en tu ubicación actual',
      search: searchLocation ? `Ubicación: ${searchLocation.name}` : `Búsqueda: "${searchTerm}"`,
      mexico: 'Los videos más populares en México',
      clicked: `Ubicación seleccionada: ${clickedLocationName}`
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

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      <div className="navbar absolute top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            VideoMap Pro
          </h1>
          
          <form onSubmit={handleSearchSubmit} className="flex items-center relative" ref={searchInputRef}>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar ciudades, lugares..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                className="search-input glass-effect bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-80"
              />
              
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
                  {loadingSuggestions ? (
                    <div className="p-3 text-center text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mx-auto"></div>
                      <span className="ml-2">Buscando...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-cyan-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="text-sm">{suggestion.name}</span>
                        </div>
                      </div>
                    ))
                  ) : searchTerm.length >= 2 ? (
                    <div className="p-3 text-center text-gray-400 text-sm">
                      No se encontraron sugerencias para "{searchTerm}"
                    </div>
                  ) : (
                    <div>
                      <div className="p-2 text-xs text-gray-400 border-b border-gray-700">
                        Lugares populares en México
                      </div>
                      {popularSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick({ name: suggestion })}
                          className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="text-cyan-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="ml-4 btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-300"
            >
              Buscar
            </button>
          </form>
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
                  <div className="absolute right-0 top-16 w-64 glass-effect bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-700">
                    <div className="p-6 border-b border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        {user.foto ? (
                          <img 
                            src={user.foto} 
                            alt="Foto de perfil" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-cyan-400">{user.nombre}</p>
                          <p className="text-sm text-gray-300">{user.email}</p>
                          {user.google_id && (
                            <p className="text-xs text-green-400 mt-1">Cuenta Google</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowPhotoModal(true);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition flex items-center gap-2"
                      >
                        Cambiar Foto de Perfil
                      </button>
                      
                      {!user.google_id && (
                        <button 
                          onClick={() => {
                            setShowProfile(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition flex items-center gap-2"
                        >
                          Cambiar Contraseña
                        </button>
                      )}
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition flex items-center gap-2"
                      >
                        Cerrar Sesión
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

      {showSettings && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-content max-w-md bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Ajustes
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="glass-effect bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Historial</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Ver Historial de Videos Vistos
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Limpiar Historial Completo
                  </button>
                </div>
              </div>

              <div className="glass-effect bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Datos</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Descargar Mis Datos
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Exportar Datos de la Cuenta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex pt-20">
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

            {/* Popup para ubicación clickeada - MEJORADO */}
            {showLocationPopup && clickedLocation && (
              <Popup
                latitude={clickedLocation.latitude}
                longitude={clickedLocation.longitude}
                closeButton={true}
                closeOnClick={false}
                onClose={() => setShowLocationPopup(false)}
                anchor="top"
                className="custom-popup"
              >
                <div className="p-4 min-w-64">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">
                    {isValidLocation ? clickedLocationName : 'Ubicación no disponible'}
                  </h3>
                  
                  {isValidLocation ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        Coordenadas: {clickedLocation.latitude.toFixed(4)}, {clickedLocation.longitude.toFixed(4)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={searchVideosForClickedLocation}
                          disabled={loadingVideos}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingVideos ? 'Buscando...' : 'Buscar Videos'}
                        </button>
                        <button
                          onClick={() => setShowLocationPopup(false)}
                          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        {clickedLocationName}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Haz clic en ciudades, pueblos o áreas con nombre específico en el mapa.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowLocationPopup(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                        >
                          Entendido
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            )}

            {/* Marcadores existentes... */}
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
            <div className="absolute top-6 left-6 glass-effect bg-gray-800/80 px-4 py-2 rounded-lg">
              <p className="text-sm text-cyan-400 flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></span>
                Moviendo a la ubicación...
              </p>
            </div>
          )}
        </div>

        <div className="w-1/3 bg-gradient-to-b from-slate-900 via-purple-900 to-blue-900 overflow-y-auto p-6 flex flex-col">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              {activeFilter === 'clicked' ? `Videos en ${clickedLocationName}` : getSidebarTitle()}
            </h2>
            <p className="text-cyan-300 text-sm mt-2">
              {activeFilter === 'clicked' ? `Ubicación seleccionada: ${clickedLocationName}` : getSidebarSubtitle()}
            </p>
          </div>

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
                
                {nextPageToken && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMoreVideos}
                      disabled={loadingVideos}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingVideos ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          Cargando...
                        </span>
                      ) : (
                        'Mostrar más videos'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg">No se encontraron videos</p>
                <p className="text-gray-500 text-sm">
                  {userLocation ? 'Usa los botones para cargar videos' : 'Activa tu ubicación o usa la búsqueda'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainApp;