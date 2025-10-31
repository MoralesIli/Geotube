import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';

import { useMainApp } from './hooks/useMainApp';
import { useAppData } from './hooks/useAppData';
import { useMapFunctions } from './hooks/useMapFunctions';
import { useVideoFunctions } from './hooks/useVideoFunctions';

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
  const appState = useMainApp();
  const appData = useAppData();
  const mapFunctions = useMapFunctions(appState, appData);
  const videoFunctions = useVideoFunctions(appState, appData, mapFunctions);

  const {
    // Estados
    viewport, setViewport,
    targetViewport, setTargetViewport,
    isAnimating, setIsAnimating,
    userLocation, setUserLocation,
    userLocationName, setUserLocationName,
    videos, setVideos,
    selectedVideo, setSelectedVideo,
    searchTerm, setSearchTerm,
    activeSearchTerm, setActiveSearchTerm,
    showProfile, setShowProfile,
    showAuthModal, setShowAuthModal,
    showSettings, setShowSettings,
    showPasswordModal, setShowPasswordModal,
    showPhotoModal, setShowPhotoModal,
    showCommentsModal, setShowCommentsModal,
    showHistoryModal, setShowHistoryModal,
    user, setUser,
    loadingVideos, setLoadingVideos,
    activeFilter, setActiveFilter,
    nextPageToken, setNextPageToken,
    searchLocation, setSearchLocation,
    hasMoreVideos, setHasMoreVideos,
    isLoadingMore, setIsLoadingMore,
    clickedLocation, setClickedLocation,
    clickedLocationName, setClickedLocationName,
    showLocationPopup, setShowLocationPopup,
    isValidLocation, setIsValidLocation,
    userHistory, setUserHistory,
    currentRegion, setCurrentRegion,
    youtubeAvailable, setYoutubeAvailable,
    youtubeError, setYoutubeError,
    suggestions, setSuggestions,
    showSuggestions, setShowSuggestions,
    searchError, setSearchError,
    selectedCategory, setSelectedCategory,
    
    // Referencias
    animationRef,
    startViewportRef,
    searchInputRef,
    suggestionsRef,
    
    // Constantes
    MAPBOX_TOKEN,
    YOUTUBE_API_KEY,
    API_BASE_URL,
    navigate
  } = appState;

  const { restrictedCountries, restrictedCities, regionConfig, categories } = appData;
  const { isValidLocationType, isValidMapLocation, getLocationCoordinates, getLocationName, checkRestrictions, handleMapClick } = mapFunctions;
  const { searchYouTubeVideosByLocation, loadVideosForLocation, fetchVideos, registerVideoAccess, fetchPopularVideosByRegion } = videoFunctions;

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

  // Obtener ubicación del usuario
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularVideosByRegion(currentRegion);
    }

    if (isAnimating) return;

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
  }, [isAnimating, getLocationName, loadVideosForLocation, fetchPopularVideosByRegion, currentRegion, checkRestrictions, isValidMapLocation, activeSearchTerm]);

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

  // Handlers para el buscador con sugerencias
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
      console.log('🚀 Iniciando búsqueda manual:', {
        termino: searchTerm,
        ubicacion_clickeada: clickedLocation ? clickedLocationName : 'none',
        ubicacion_actual: userLocation ? userLocationName : 'none'
      });
      
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
  }, [showSuggestions, suggestions]);

  const handleSuggestionClick = useCallback(async (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    
    try {
      const locationData = await getLocationCoordinates(suggestion);
      
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
        
        console.log('Mapa movido a:', locationData.locationName);
      }
    } catch (error) {
      console.error('Error moviendo el mapa a la ubicación:', error);
    }
  }, [getLocationCoordinates]);

  // Función para buscar videos por categoría
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

  // Función para buscar videos en ubicación clickeada
  const searchVideosForClickedLocation = useCallback(async () => {
    if (!clickedLocation || !isValidLocation) return;
    
    setLoadingVideos(true);
    try {
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

  // Función para cargar más videos
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
      }
    } catch (error) {
      console.error('Error cargando más videos:', error);
    }
  }, [nextPageToken, isLoadingMore, activeFilter, fetchVideos, activeSearchTerm, searchTerm, searchVideosByCategory, selectedCategory, loadVideosForLocation, clickedLocation, clickedLocationName]);

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

  // Funciones para videos cercanos y populares
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