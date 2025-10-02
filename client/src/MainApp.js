import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';
import AuthModal from './AuthModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangePhotoModal from './ChangePhotoModal';

const MainApp = () => {
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 4,
  });
  const [targetViewport, setTargetViewport] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef();

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
  const navigate = useNavigate();

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';
  const YOUTUBE_API_KEY = 'AIzaSyCi_KpytxXFwg6wCQKTYoCiVffiFRoGlsQ';

  // 🔥 OPTIMIZADO: Efecto para animación del mapa más rápido
  useEffect(() => {
    if (targetViewport && !isAnimating) {
      setIsAnimating(true);
      
      const startViewport = { ...viewport };
      const endViewport = { ...targetViewport };
      const duration = 1000; // 🔥 Reducido de 1500ms a 1000ms
      const startTime = performance.now();

      const animateMap = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 🔥 FUNCIÓN EASING MÁS RÁPIDA
        const easeOutQuad = (t) => t * (2 - t);
        const easedProgress = easeOutQuad(progress);

        setViewport({
          latitude: startViewport.latitude + (endViewport.latitude - startViewport.latitude) * easedProgress,
          longitude: startViewport.longitude + (endViewport.longitude - startViewport.longitude) * easedProgress,
          zoom: startViewport.zoom + (endViewport.zoom - startViewport.zoom) * easedProgress,
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
        animationRef.current && cancelAnimationFrame(animationRef.current);
      };
    }
  }, [targetViewport, isAnimating, viewport]);

  // 🔥 OPTIMIZADO: Función para obtener nombre de ubicación más rápida
  const getLocationName = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality&limit=1&language=es`
      );
      
      if (!response.ok) throw new Error('Error en geocoding');
      
      const data = await response.json();
      
      // 🔥 OBTENER SOLO EL PRIMER RESULTADO MÁS RÁPIDO
      if (data.features?.[0]) {
        return data.features[0].place_name;
      }
      
      return `Ubicación (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    } catch (error) {
      console.warn('Error obteniendo nombre de ubicación:', error);
      return `Ubicación actual`;
    }
  }, [MAPBOX_TOKEN]);

  // Función para buscar videos de YouTube
  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName) => {
    try {
      const cityName = locationName.split(',')[0].trim();
      const searchQuery = cityName;

      console.log('Buscando videos para:', searchQuery);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&maxResults=10&relevanceLanguage=es&` +
        `q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`
      );

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          throw new Error('QUOTA_EXCEEDED');
        }
        const errorData = await searchResponse.json();
        throw new Error(`YouTube API: ${errorData.error?.message || 'Unknown error'}`);
      }

      const searchData = await searchResponse.json();
      
      if (searchData.items?.length > 0) {
        const videoIds = searchData.items.slice(0, 5).map(item => item.id.videoId).join(',');
        
        await new Promise(resolve => setTimeout(resolve, 500));

        let videoStats = {};
        try {
          const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?` +
            `part=statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
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

        const youtubeVideos = searchData.items.slice(0, 8).map((item) => {
          const videoId = item.id.videoId;
          const stats = videoStats[videoId] || { 
            viewCount: Math.floor(Math.random() * 50000) + 1000,
            likeCount: 0,
            duration: 'PT0S'
          };
          
          const randomOffset = () => (Math.random() - 0.5) * 0.1;
          
          return {
            youtube_video_id: videoId,
            location_name: `${cityName} - ${item.snippet.channelTitle}`,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            latitude: latitude + randomOffset(),
            longitude: longitude + randomOffset(),
            views: stats.viewCount,
            likes: stats.likeCount,
            duration: stats.duration,
            isCurrentLocation: true,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description
          };
        });

        console.log(`Encontrados ${youtubeVideos.length} videos para ${cityName}`);
        return youtubeVideos;
      }
      
      return [];
    } catch (error) {
      console.error('Error buscando videos:', error);
      if (error.message === 'QUOTA_EXCEEDED') throw error;
      throw new Error('Error en búsqueda de videos');
    }
  }, [YOUTUBE_API_KEY]);

  // Función para cargar videos populares de México
  const fetchPopularMexicoVideos = useCallback(async () => {
    try {
      console.log('Cargando videos populares de México...');
      
      const lastQuotaError = localStorage.getItem('youtube_quota_exceeded');
      if (lastQuotaError && Date.now() - parseInt(lastQuotaError) < 3600000) {
        throw new Error('QUOTA_EXCEEDED_RECENTLY');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,contentDetails&chart=mostPopular&` +
        `regionCode=MX&maxResults=8&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Videos populares encontrados:', data.items?.length || 0);
        
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
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
          publishedAt: item.snippet.publishedAt
        }));

        setVideos(popularVideos);
        setActiveFilter('mexico');
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
      
      // Fallback con videos hardcodeados
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
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        },
        {
          youtube_video_id: '9bZkp7q19f0',
          location_name: 'México - Video Viral',
          title: 'Video Viral Internacional',
          channelTitle: 'Canal Viral',
          latitude: 20.6597,
          longitude: -103.3496,
          views: 2500000,
          likes: 75000,
          duration: 'PT4M12S',
          isCurrentLocation: false,
          thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg'
        }
      ];
      setVideos(fallbackVideos);
      setActiveFilter('mexico');
      return fallbackVideos;
    }
  }, [YOUTUBE_API_KEY]);

  // 🔥 OPTIMIZADO: Cargar videos sin bloquear la interfaz
  const loadVideosForLocation = useCallback(async (latitude, longitude, locationName) => {
    setLoadingVideos(true);
    
    // 🔥 USAR setTimeout PARA NO BLOQUEAR LA INTERFAZ
    setTimeout(async () => {
      try {
        const youtubeVideos = await searchYouTubeVideosByLocation(latitude, longitude, locationName);
        
        if (youtubeVideos.length > 0) {
          setVideos(youtubeVideos);
          setActiveFilter('current');
        } else {
          await fetchPopularMexicoVideos();
        }
      } catch (err) {
        console.error('Error buscando videos:', err);
        await fetchPopularMexicoVideos();
      } finally {
        setLoadingVideos(false);
      }
    }, 100); // 🔥 Pequeño delay para no bloquear la UI
  }, [searchYouTubeVideosByLocation, fetchPopularMexicoVideos]);

  // Búsqueda de videos por término
  const fetchVideos = useCallback(async (query) => {
    setLoadingVideos(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&maxResults=10&relevanceLanguage=es&` +
        `q=${encodeURIComponent(query)}%20México&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        
        const searchVideos = data.items.map((item) => ({
          youtube_video_id: item.id.videoId,
          location_name: `México - ${item.snippet.channelTitle}`,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          latitude: 23.6345 + (Math.random() - 0.5) * 6,
          longitude: -102.5528 + (Math.random() - 0.5) * 6,
          views: Math.floor(Math.random() * 50000) + 10000,
          likes: Math.floor(Math.random() * 1000),
          duration: 'PT0S',
          isCurrentLocation: false,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
        }));

        setVideos(searchVideos);
        
        if (query.toLowerCase() === 'méxico' || query.toLowerCase() === 'mexico') {
          setUserLocationName('México');
          setActiveFilter('mexico');
          setTargetViewport({ latitude: 23.6345, longitude: -102.5528, zoom: 4.5 });
        } else {
          setUserLocationName('');
          setActiveFilter('search');
        }
      } else {
        throw new Error('Error en búsqueda');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al buscar videos');
    } finally {
      setLoadingVideos(false);
    }
  }, [YOUTUBE_API_KEY]);

  // 🔥 OPTIMIZADO: Función para obtener ubicación del usuario con movimiento inmediato
  const getUserLocation = useCallback(async (recenter = true) => {
    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con este navegador.');
      return fetchPopularMexicoVideos();
    }

    // Mostrar indicador de carga inmediatamente
    setIsAnimating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log('Ubicación obtenida:', latitude, longitude);
        
        // 🔥 MOVER EL MAPA INMEDIATAMENTE
        setTargetViewport({ 
          latitude: latitude, 
          longitude: longitude, 
          zoom: 12 
        });
        
        // 🔥 ACTUALIZAR ESTADOS DE UBICACIÓN
        setUserLocation({ latitude, longitude });

        // 🔥 OBTENER NOMBRE DE UBICACIÓN EN PARALELO CON LA ANIMACIÓN
        const locationNamePromise = getLocationName(latitude, longitude);
        
        // 🔥 CARGAR VIDEOS EN PARALELO
        const videosPromise = loadVideosForLocation(latitude, longitude, 'Cargando ubicación...');

        try {
          // Esperar ambas promesas en paralelo
          const [locationName] = await Promise.all([locationNamePromise]);
          
          setUserLocationName(locationName);
          
          // Guardar en localStorage (no bloqueante)
          localStorage.setItem('userLocation', JSON.stringify({ 
            latitude, 
            longitude,
            name: locationName 
          }));

        } catch (error) {
          console.error('Error en operaciones paralelas:', error);
          setUserLocationName('Ubicación actual');
        }
        // La animación se detendrá automáticamente cuando termine
      },
      (err) => {
        console.error('Error obteniendo ubicación:', err);
        setIsAnimating(false); // 🔥 IMPORTANTE: Detener animación en caso de error
        alert('No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la ubicación.');
        fetchPopularMexicoVideos();
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000, // 🔥 Reducido de 15s a 10s
        maximumAge: 30000 // 🔥 Reducido de 60s a 30s para datos más frescos
      }
    );
  }, [getLocationName, loadVideosForLocation, fetchPopularMexicoVideos]);

  // Videos populares basados en ubicación
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

  // Otros videos relacionados
  const fetchOtherVideos = useCallback(async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    setLoadingVideos(true);
    try {
      const locationName = userLocationName || await getLocationName(userLocation.latitude, userLocation.longitude);
      const otherVideos = await searchYouTubeVideosByLocation(userLocation.latitude, userLocation.longitude, locationName);
      
      if (otherVideos.length > 0) {
        setVideos(otherVideos);
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

  // Centrar en México
  const loadMexicoVideos = async () => {
    setTargetViewport({ latitude: 23.6345, longitude: -102.5528, zoom: 4.5 });
    await fetchPopularMexicoVideos();
  };

  // Inicialización de la app
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

  // Handlers de autenticación
  const handleLogin = (userData) => {
    setUser(userData);
    setShowProfile(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfile(false);
  };

  // Handlers de videos
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
    searchTerm.trim() && fetchVideos(searchTerm);
  };

  // Títulos del sidebar
  const getSidebarTitle = () => {
    const titles = {
      popular: 'Videos Populares',
      other: 'Videos Cercanos', 
      current: 'Videos en tu Ubicación',
      search: 'Resultados de Búsqueda',
      mexico: 'Videos Populares de México'
    };
    return titles[activeFilter] || 'Videos con Vista Previa';
  };

  const getSidebarSubtitle = () => {
    const subtitles = {
      popular: userLocationName ? `Videos populares en ${userLocationName}` : 'Videos populares en tu área',
      other: userLocationName ? `Videos cercanos a ${userLocationName}` : 'Videos en tu región',
      current: userLocationName ? `Basado en tu ubicación: ${userLocationName}` : 'Basado en tu ubicación actual',
      search: `Búsqueda: "${searchTerm}"`,
      mexico: 'Los videos más populares en México'
    };
    return subtitles[activeFilter] || 'Explorando contenido local';
  };

  // Formatear duración del video
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
      {/* Barra superior */}
      <div className="navbar absolute top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            GeoTube Pro
          </h1>
          
          <button
            onClick={loadMexicoVideos}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-4 py-2 rounded-lg transition-all duration-300"
          >
            <span>🇲🇽</span>
            Ver México
          </button>
          
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder="Buscar ciudades, lugares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input glass-effect bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button type="submit" className="ml-4 btn-primary bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-300">
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
                  className="user-avatar text-lg w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold"
                  title={user.nombre}
                >
                  {user.nombre.charAt(0).toUpperCase()}
                </button>
                
                {showProfile && (
                  <div className="absolute right-0 top-16 w-64 glass-effect bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-700">
                    <div className="p-6 border-b border-white/10">
                      <p className="font-bold text-cyan-400">{user.nombre}</p>
                      <p className="text-sm text-gray-300">{user.email}</p>
                      {user.google_id && (
                        <p className="text-xs text-green-400 mt-1">Cuenta Google</p>
                      )}
                    </div>
                    <div className="p-4">
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowPhotoModal(true);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition"
                      >
                        Cambiar Foto de Perfil
                      </button>
                      
                      {!user.google_id && (
                        <button 
                          onClick={() => {
                            setShowProfile(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition"
                        >
                          Cambiar Contraseña
                        </button>
                      )}
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition"
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
      />

      {/* Modal de Ajustes */}
      {showSettings && (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-content max-w-2xl bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Ajustes y Configuración
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
                <h3 className="text-lg font-semibold mb-3">Configuración de la Aplicación</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3">
                    <span>Modo Oscuro</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span>Reproducción Automática</span>
                    <input type="checkbox" className="toggle" />
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span>Calidad de Video</span>
                    <select className="bg-gray-700 text-white px-3 py-1 rounded">
                      <option>Alta</option>
                      <option>Media</option>
                      <option>Baja</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center p-3">
                    <span>Notificaciones</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="glass-effect bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Historial</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Ver Historial de Videos Vistos
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Ver Historial de Búsquedas
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Limpiar Historial Completo
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Descargar Mis Datos
                  </button>
                </div>
              </div>

              <div className="glass-effect bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3">Privacidad y Seguridad</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Configuración de Privacidad
                  </button>
                  <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                    Gestionar Dispositivos Conectados
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

      {/* Contenido principal */}
      <div className="flex-1 flex pt-20">
        {/* Mapa */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            onMove={(evt) => !isAnimating && setViewport(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          >
            <NavigationControl position="top-right" />

            {userLocation && (
              <Marker latitude={userLocation.latitude} longitude={userLocation.longitude}>
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full animate-ping absolute"></div>
                  <div className="h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white rounded-full"></div>
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
                    <div className="h-6 w-6 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </Marker>
            ))}
          </Map>

          <button
            onClick={() => getUserLocation(true)}
            disabled={isAnimating}
            className="absolute bottom-6 right-6 btn-success bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-bold px-6 py-3 rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isAnimating ? 'Moviendo...' : 'Mi Ubicación'}
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
                Buscando videos en tu ubicación...
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
              videos.map((video) => (
                <div
                  key={video.youtube_video_id}
                  onClick={() => handleVideoClick(video)}
                  onDoubleClick={() => handleVideoDoubleClick(video)}
                  className={`glass-effect bg-gray-800/50 rounded-2xl p-4 cursor-pointer transform hover:scale-102 transition-all duration-300 border-l-4 ${
                    video.isCurrentLocation ? 'border-l-green-500 bg-green-500/10' : 'border-l-cyan-500 bg-cyan-500/10'
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
                        <div className="h-3 w-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
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
              ))
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