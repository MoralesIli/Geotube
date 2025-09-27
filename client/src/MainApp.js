import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';

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
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

  // Obtener ubicación del usuario y buscar videos cercanos
  const getUserLocation = (recenter = false) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });

          if (recenter) {
            setViewport((prev) => ({
              ...prev,
              latitude,
              longitude,
              zoom: 6,
            }));
          }

          // Llamar al backend para buscar videos cercanos
          try {
            setMessage('Buscando videos en tu ubicación...');
            const response = await fetch(
              `http://localhost:3001/api/searchByCoords?lat=${latitude}&lng=${longitude}`
            );
            const data = await response.json();
            if (Array.isArray(data)) {
              setVideos(data);
              setMessage('');
            } else {
              setMessage('No se encontraron videos en tu ubicación.');
            }
          } catch (err) {
            console.error(err);
            setMessage('Error buscando videos en tu ubicación.');
          }
        },
        (err) => {
          console.error('Error obteniendo ubicación:', err);
          setMessage('No se pudo obtener tu ubicación.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setMessage('La geolocalización no está soportada en este navegador.');
    }
  };

  // Buscar videos en el backend por nombre de ubicación
  const fetchVideos = async (query) => {
    setMessage('Buscando videos...');
    try {
      const response = await fetch(
        `http://localhost:3001/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await response.json();
      if (data.length === 0) {
        setMessage('No se encontraron videos.');
      } else {
        setMessage('');
      }
      setVideos(data);
      setSelectedVideo(null); // Limpiar video seleccionado al buscar nuevos
    } catch (error) {
      console.error('Error fetching videos:', error);
      setMessage('Error al buscar videos. Intenta más tarde.');
    }
  };

  useEffect(() => {
    fetchVideos('México');
    
    // Obtener ubicación del usuario sin buscar videos automáticamente
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ latitude, longitude });
        },
        (err) => {
          console.error('Error obteniendo ubicación inicial:', err);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchVideos(searchTerm);
    }
  };

  // Click simple: Mostrar vista previa
  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  // Doble click: Navegar a página completa
  const handleVideoDoubleClick = (video) => {
    navigate(`/video/${video.youtube_video_id}`);
  };

  // Click en marker: Mostrar vista previa
  const handleMarkerClick = (video) => {
    setSelectedVideo(video);
  };

  // Doble click en marker: Navegar a página completa
  const handleMarkerDoubleClick = (video) => {
    navigate(`/video/${video.youtube_video_id}`);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Barra superior */}
      <div className="absolute top-0 left-0 w-full h-16 bg-blue-700 flex items-center justify-between px-4 z-10">
        <h1 className="text-2xl font-bold">GeoTube 🌐</h1>
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <input
            type="text"
            placeholder="Buscar lugares, videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2 px-4 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="ml-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            🔍
          </button>
        </form>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex pt-16">
        {/* Mapa */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            style={{ width: '100%', height: '100%' }}
            onMove={(evt) => setViewport(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            projection={{ name: 'globe' }}
            terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            fog={{
              range: [0.5, 10],
              color: '#242B4B',
              'horizon-blend': 0.2,
              'high-color': '#88ccee',
              'space-color': '#000000',
              'star-intensity': 0.6,
            }}
          >
            <NavigationControl position="top-right" />

            {/* Marker ubicación del usuario */}
            {userLocation && (
              <Marker
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                anchor="center"
              >
                <div className="h-4 w-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-ping"></div>
              </Marker>
            )}

            {/* Markers de videos */}
            {videos.map((video) => (
              <Marker
                key={video.youtube_video_id}
                latitude={video.latitude}
                longitude={video.longitude}
                anchor="bottom"
              >
                <div
                  onClick={() => handleMarkerClick(video)}
                  onDoubleClick={() => handleMarkerDoubleClick(video)}
                  className="cursor-pointer text-2xl transform hover:scale-125 transition-transform duration-200"
                  title="Click para vista previa, Doble click para ver completo"
                >
                  📍
                </div>
              </Marker>
            ))}
          </Map>

          {/* Botón flotante de mi ubicación */}
          <button
            onClick={() => getUserLocation(true)}
            className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            📍 Mi ubicación
          </button>

          {message && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 p-4 rounded-lg">
              <p className="text-white text-center">{message}</p>
            </div>
          )}
        </div>

        {/* Sidebar derecha */}
        <div className="w-1/3 bg-gray-800 overflow-y-auto p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Videos Destacados</h2>
          
          {/* Vista previa del video seleccionado */}
          {selectedVideo && (
            <div className="mb-6 bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3 text-center">
                🎬 Vista Previa: {selectedVideo.location_name}
              </h3>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="flex-1 bg-gray-600 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cerrar Vista Previa
                </button>
                <button
                  onClick={() => navigate(`/video/${selectedVideo.youtube_video_id}`)}
                  className="flex-1 bg-red-600 py-2 rounded hover:bg-red-500 transition font-semibold"
                >
                  Ver Completo 🚀
                </button>
              </div>
            </div>
          )}

          {/* Lista de videos */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3">
              {videos.map((video) => (
                <div
                  key={video.youtube_video_id}
                  onClick={() => handleVideoClick(video)}
                  onDoubleClick={() => handleVideoDoubleClick(video)}
                  className={`bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors ${
                    selectedVideo && selectedVideo.youtube_video_id === video.youtube_video_id 
                    ? 'border-2 border-blue-500' 
                    : ''
                  }`}
                  title="Click para vista previa, Doble click para ver completo"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                      alt="Thumbnail"
                      className="w-16 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm line-clamp-2">{video.location_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {video.youtube_video_id}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      📍
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg text-xs text-gray-300">
            <p>💡 <strong>Instrucciones:</strong></p>
            <p>• <strong>Click simple</strong> en un video: Vista previa</p>
            <p>• <strong>Doble click</strong> en un video: Ver completo</p>
            <p>• Mismo comportamiento en los marcadores del mapa 📍</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainApp;