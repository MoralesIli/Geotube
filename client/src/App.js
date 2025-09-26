import { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import YouTube from 'react-youtube';

const App = () => {
  const [viewport, setViewport] = useState({
    latitude: 23.6345, // México centro
    longitude: -102.5528,
    zoom: 2,
  });

  const [userLocation, setUserLocation] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const MAPBOX_TOKEN =
    'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

  // 🔹 Obtener ubicación del usuario
  const getUserLocation = (recenter = false) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
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

  // 🔹 Buscar videos en el backend
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
    } catch (error) {
      console.error('Error fetching videos:', error);
      setMessage('Error al buscar videos. Intenta más tarde.');
    }
  };

  useEffect(() => {
    fetchVideos('México');
    getUserLocation(true);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchVideos(searchTerm);
    }
  };

  const handleMarkerClick = (video) => {
    setSelectedVideo(video);
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
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12" // 🛰️ Satélite + etiquetas
            projection={{ name: 'globe' }} // 🌍 Globo 3D
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
            {/* Controles de navegación */}
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
                key={video.id}
                latitude={video.latitude}
                longitude={video.longitude}
                anchor="bottom"
              >
                <div
                  onClick={() => handleMarkerClick(video)}
                  className="cursor-pointer"
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
        <div className="w-1/3 bg-gray-800 overflow-y-auto p-4">
          <h2 className="text-xl font-bold mb-4">Videos Destacados</h2>
          {selectedVideo && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">
                {selectedVideo.location_name}
              </h3>
              <YouTube
                videoId={selectedVideo.youtube_video_id}
                opts={{ width: '100%' }}
              />
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => handleMarkerClick(video)}
                className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
              >
                <p className="font-semibold">{video.location_name}</p>
                <p className="text-sm text-gray-400">
                  ID: {video.youtube_video_id}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
