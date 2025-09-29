import React, { useState, useEffect } from 'react';
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
    zoom: 2,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Función para obtener ubicación con nombre real
  const getLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=region,place,locality&language=es&country=mx`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        for (let feature of data.features) {
          if (feature.place_type.includes('place') || feature.place_type.includes('region')) {
            return feature.place_name;
          }
        }
        return data.features[0].place_name;
      }
      return `Ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (error) {
      return `Mi ubicación actual`;
    }
  };

  // Obtener ubicación del usuario
  const getUserLocation = async (recenter = false) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
          setIsUsingCurrentLocation(true);

          const locationName = await getLocationName(latitude, longitude);

          if (recenter) {
            setViewport({
              latitude,
              longitude,
              zoom: 12,
            });
          }

          try {
            const response = await fetch(
              `http://localhost:3001/api/searchByCoords?lat=${latitude}&lng=${longitude}`
            );
            const data = await response.json();
            if (Array.isArray(data)) {
              const updatedVideos = data.map(video => ({
                ...video,
                location_name: locationName,
                isCurrentLocation: true
              }));
              setVideos(updatedVideos);
            }
          } catch (err) {
            console.error('Error buscando videos:', err);
          }
        },
        (err) => {
          console.error('Error obteniendo ubicación:', err);
          setIsUsingCurrentLocation(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Buscar videos por ubicación
  const fetchVideos = async (query) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Error de conexión');
      const data = await response.json();
      setVideos(data);
      setIsUsingCurrentLocation(false);
    } catch (error) {
      console.error('Error al buscar videos:', error);
    }
  };

  // Buscar videos populares basados en la ubicación actual
  const fetchPopularVideos = async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    try {
      const simulatedPopularVideos = [
        {
          youtube_video_id: 'dQw4w9WgXcQ',
          location_name: await getLocationName(userLocation.latitude, userLocation.longitude),
          latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
          longitude: userLocation.longitude + (Math.random() - 0.5) * 0.1,
          views: 15000,
          isPopular: true
        },
        {
          youtube_video_id: '9bZkp7q19f0',
          location_name: await getLocationName(userLocation.latitude, userLocation.longitude),
          latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
          longitude: userLocation.longitude + (Math.random() - 0.5) * 0.1,
          views: 12000,
          isPopular: true
        },
        {
          youtube_video_id: 'kJQP7kiw5Fk',
          location_name: await getLocationName(userLocation.latitude, userLocation.longitude),
          latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
          longitude: userLocation.longitude + (Math.random() - 0.5) * 0.1,
          views: 9800,
          isPopular: true
        }
      ];
      
      setVideos(simulatedPopularVideos);
    } catch (error) {
      console.error('Error cargando videos populares:', error);
    }
  };

  // Buscar otros videos relacionados
  const fetchOtherVideos = async () => {
    if (!userLocation) {
      alert('Primero activa tu ubicación usando el botón "Mi Ubicación"');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/searchByCoords?lat=${userLocation.latitude}&lng=${userLocation.longitude}`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        const locationName = await getLocationName(userLocation.latitude, userLocation.longitude);
        const otherVideos = data.slice(0, 4).map(video => ({
          ...video,
          location_name: `${locationName} - Relacionado`,
          isOther: true
        }));
        setVideos(otherVideos);
      }
    } catch (error) {
      console.error('Error buscando otros videos:', error);
    }
  };

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
    navigateToVideo(video);
  };

  const handleMarkerClick = (video) => {
    setSelectedVideo(video);
  };

  const handleMarkerDoubleClick = (video) => {
    navigateToVideo(video);
  };

  // Función para navegar al video
  const navigateToVideo = (video) => {
    if (video && video.youtube_video_id) {
      navigate(`/video/${video.youtube_video_id}`);
    }
  };

  // Handler para el botón "Ver Completo"
  const handleWatchComplete = () => {
    if (selectedVideo && selectedVideo.youtube_video_id) {
      navigate(`/video/${selectedVideo.youtube_video_id}`);
    }
  };

  // Cargar videos de México al inicio
  useEffect(() => {
    fetchVideos('México');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchVideos(searchTerm);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Barra superior */}
      <div className="navbar absolute top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            GeoTube Pro
          </h1>
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder="Buscar ciudades, lugares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input glass-effect"
            />
            <button type="submit" className="ml-4 btn-primary">
              Buscar
            </button>
          </form>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-secondary flex items-center gap-2"
              >
                Ajustes
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowProfile(!showProfile)}
                  className="user-avatar text-lg"
                  title={user.nombre}
                >
                  {user.nombre.charAt(0).toUpperCase()}
                </button>
                
                {showProfile && (
                  <div className="absolute right-0 top-16 w-64 glass-effect rounded-2xl shadow-2xl z-50">
                    <div className="p-6 border-b border-white/10">
                      <p className="font-bold text-cyan-400">{user.nombre}</p>
                      <p className="text-sm text-gray-300">{user.email}</p>
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
                      <button 
                        onClick={() => {
                          setShowProfile(false);
                          setShowPasswordModal(true);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition"
                      >
                        Cambiar Contraseña
                      </button>
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
              className="btn-primary flex items-center gap-2"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Modal de autenticación */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Modal de Cambiar Contraseña */}
      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Modal de Cambiar Foto */}
      <ChangePhotoModal 
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={user}
      />

      {/* Modal de Ajustes */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gradient">
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
              {/* Configuración de la aplicación */}
              <div className="glass-effect rounded-xl p-4">
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

              {/* Historial */}
              <div className="glass-effect rounded-xl p-4">
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

              {/* Privacidad y Seguridad */}
              <div className="glass-effect rounded-xl p-4">
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
            onMove={(evt) => setViewport(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          >
            <NavigationControl position="top-right" />

            {userLocation && (
              <Marker latitude={userLocation.latitude} longitude={userLocation.longitude}>
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-r from-red-500 to-pink-500 border-3 border-white rounded-full animate-ping absolute"></div>
                  <div className="absolute -bottom-10 -left-6 glass-effect text-xs px-3 py-1 rounded-full font-bold">
                  </div>
                </div>
              </Marker>
            )}

            {videos.map((video) => (
              <Marker key={video.youtube_video_id} latitude={video.latitude} longitude={video.longitude}>
                <div
                  onClick={() => handleMarkerClick(video)}
                  onDoubleClick={() => handleMarkerDoubleClick(video)}
                  className="cursor-pointer text-3xl transform hover:scale-150 transition-all duration-300"
                  title="Click para vista previa, Doble click para ver completo"
                >
                  📍
                </div>
              </Marker>
            ))}
          </Map>

          <button
            onClick={() => getUserLocation(true)}
            className="absolute bottom-6 right-6 btn-success text-lg font-bold px-6 py-3 rounded-2xl shadow-2xl"
          >
            Mi Ubicación
          </button>
        </div>

        {/* Sidebar */}
        <div className="w-1/3 bg-gradient-to-b from-slate-900 via-purple-900 to-blue-900 overflow-y-auto p-6 flex flex-col">
          {/* Header del sidebar */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Videos con Vista Previa
            </h2>
            <p className="text-cyan-300 text-sm mt-2">
              {isUsingCurrentLocation ? 'Basado en tu ubicación actual' : 'Explorando México'}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={fetchOtherVideos}
              disabled={!userLocation}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Otros Videos
            </button>
            <button
              onClick={fetchPopularVideos}
              disabled={!userLocation}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Populares
            </button>
          </div>

          {/* Vista previa */}
          {selectedVideo && (
            <div className="glass-effect rounded-2xl p-4 mb-6 border-2 border-cyan-500/50">
              <div className="text-center mb-3">
                <h3 className="text-lg font-bold text-cyan-300">
                  Vista Previa: {selectedVideo.location_name}
                </h3>
              </div>
              <div className="bg-black rounded-lg overflow-hidden mb-3">
                <YouTube
                  videoId={selectedVideo.youtube_video_id}
                  opts={{ 
                    width: '100%', 
                    height: '200',
                    playerVars: {
                      autoplay: 0,
                      modestbranding: 1,
                      rel: 0
                    }
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

          {/* Lista de videos con miniaturas */}
          <div className="space-y-4 flex-1 overflow-y-auto">
            {videos.length > 0 ? (
              videos.map((video) => (
                <div
                  key={video.youtube_video_id}
                  onClick={() => handleVideoClick(video)}
                  onDoubleClick={() => handleVideoDoubleClick(video)}
                  className={`glass-effect rounded-2xl p-4 cursor-pointer transform hover:scale-102 transition-all duration-300 border-l-4 ${
                    video.isPopular ? 'border-l-orange-500 bg-orange-500/10' :
                    video.isOther ? 'border-l-cyan-500 bg-cyan-500/10' :
                    'border-l-green-500 bg-green-500/10'
                  } ${selectedVideo?.youtube_video_id === video.youtube_video_id ? 'ring-2 ring-yellow-400' : ''}`}
                  title="Click para vista previa, Doble click para ver completo"
                >
                  <div className="flex gap-4">
                    {/* Miniaturas de vista previa */}
                    <div className="flex-shrink-0">
                      <img 
                        src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                        alt="Miniatura del video"
                        className="w-20 h-15 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`text-lg ${
                          video.isPopular ? 'text-orange-400' :
                          video.isOther ? 'text-cyan-400' :
                          'text-green-400'
                        }`}>
                          📍
                        </div>
                        <p className="font-bold text-white text-sm">{video.location_name}</p>
                      </div>
                      <p className="text-xs text-gray-300">ID: {video.youtube_video_id}</p>
                      {video.views && (
                        <p className="text-xs text-yellow-300">{video.views.toLocaleString()} views</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg">No se encontraron videos</p>
                <p className="text-gray-500 text-sm">Usa la búsqueda o activa tu ubicación</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainApp;