import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState('');
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 5
  });

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';
  const YOUTUBE_API_KEY = 'AIzaSyCi_KpytxXFwg6wCQKTYoCiVffiFRoGlsQ';

  // 🔥 NUEVO: Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      console.log('🎬 VideoPlayer - localStorage user:', userData);
      if (!userData) {
        console.log('⚠️ No hay usuario autenticado en VideoPlayer');
      } else {
        console.log('✅ Usuario encontrado en VideoPlayer:', JSON.parse(userData));
      }
    };
    
    checkAuth();
  }, []);

  // Función para obtener datos del video desde YouTube API
  const fetchVideoData = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,contentDetails&` +
        `id=${videoId}&` +
        `key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener datos del video');
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(video.statistics.viewCount) || 0,
          likeCount: parseInt(video.statistics.likeCount) || 0,
          commentCount: parseInt(video.statistics.commentCount) || 0,
          duration: video.contentDetails.duration
        };
      }
      throw new Error('Video no encontrado');
    } catch (error) {
      console.error('Error fetching video data:', error);
      throw error;
    }
  };

  // Función para cargar videos relacionados desde YouTube
  const fetchRelatedVideos = async (currentVideoId, locationName) => {
    try {
      // Obtener el título del video actual para buscar videos relacionados
      const currentVideoData = await fetchVideoData(currentVideoId);
      const searchQuery = currentVideoData.channelTitle || locationName || 'México';

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `type=video&` +
        `maxResults=10&` +
        `relevanceLanguage=es&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        
        const relatedVideosData = data.items
          .filter(item => item.id.videoId !== currentVideoId)
          .map(item => ({
            youtube_video_id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.default.url,
            publishedAt: item.snippet.publishedAt
          }));

        return relatedVideosData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching related videos:', error);
      return [];
    }
  };

  // Obtener ubicación del usuario y datos del video
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Obtener ubicación del usuario desde localStorage
        const savedLocation = localStorage.getItem('userLocation');
        let currentLatitude = 23.6345;
        let currentLongitude = -102.5528;
        let currentLocationName = 'México';

        if (savedLocation) {
          const locationData = JSON.parse(savedLocation);
          setUserLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude
          });
          setUserLocationName(locationData.name || 'Tu ubicación actual');
          
          currentLatitude = locationData.latitude;
          currentLongitude = locationData.longitude;
          currentLocationName = locationData.name || 'Tu ubicación actual';
        }

        // Obtener datos del video desde YouTube API
        const videoDetails = await fetchVideoData(videoId);
        
        // Cargar videos relacionados
        const relatedVideosData = await fetchRelatedVideos(videoId, currentLocationName);

        setVideoData(videoDetails);
        setRelatedVideos(relatedVideosData);
        
        // Centrar mapa en la ubicación actual
        setViewport({
          latitude: currentLatitude,
          longitude: currentLongitude,
          zoom: 10
        });

      } catch (err) {
        setError(err.message);
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      initializeData();
    }
  }, [videoId]);

  const youtubeOpts = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      controls: 1,
      showinfo: 0
    },
  };

  // Función para formatear la duración del video
  const formatDuration = (duration) => {
    // YouTube duration format: PT1H2M3S
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const handleBackToMap = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-white text-xl font-light">Cargando video...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Error: {error}</div>
          <button 
            onClick={handleBackToMap}
            className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Volver al Mapa Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header Profesional */}
      <header className="glass-effect border-b border-gray-700 p-4 bg-gray-800/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div 
            onClick={handleBackToMap}
            className="cursor-pointer group"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all duration-300">
              GeoTube Pro
            </h1>
            <p className="text-sm text-gray-400">Reproductor de Video</p>
          </div>
          
          <div className="flex items-center gap-4">
            {userLocationName && (
              <div className="text-right">
                <p className="text-sm text-cyan-400">Tu ubicación actual</p>
                <p className="text-xs text-gray-300">{userLocationName}</p>
              </div>
            )}
            <button 
              onClick={handleBackToMap}
              className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300 border border-gray-600 hover:border-gray-500"
            >
              Volver al Mapa
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="container mx-auto p-6">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Sección de Video Principal */}
          <div className="xl:w-2/3 space-y-6">
            {/* Video Player */}
            <div className="glass-effect rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-cyan-400">Reproduciendo Video</h2>
              </div>
              <div className="bg-black">
                <YouTube videoId={videoId} opts={youtubeOpts} />
              </div>
            </div>

            {/* Información del Video */}
            <div className="glass-effect rounded-2xl p-6 border border-gray-700 bg-gray-800/50">
              <h1 className="text-2xl font-bold mb-3 text-white">{videoData.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                    {videoData.viewCount.toLocaleString()} visualizaciones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/20 px-3 py-1 rounded-full text-sm border border-green-500/30">
                    {videoData.likeCount.toLocaleString()} me gusta
                  </span>
                </div>
                {videoData.duration && (
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-500/20 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                      {formatDuration(videoData.duration)}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  Subido el {new Date(videoData.publishedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Información del Canal */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Canal</h3>
                <p className="text-white text-lg mb-2">{videoData.channelTitle}</p>
                {userLocationName && (
                  <p className="text-gray-400 text-sm">
                    Ubicación actual: {userLocationName}
                  </p>
                )}
              </div>

              {/* Descripción del Video */}
              {videoData.description && (
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Descripción</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {videoData.description.length > 300 
                      ? `${videoData.description.substring(0, 300)}...` 
                      : videoData.description
                    }
                  </p>
                </div>
              )}

              {/* Estadísticas Avanzadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{videoData.viewCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Reproducciones</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400">{videoData.likeCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 mt-1">Me Gusta</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-purple-400">{videoData.commentCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 mt-1">Comentarios</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Mapa y Videos Relacionados */}
          <div className="xl:w-1/3 space-y-6">
            {/* Mapa de Ubicación */}
            <div className="glass-effect rounded-2xl overflow-hidden border border-gray-700 bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-cyan-400 text-lg">Tu Ubicación en el Mapa</h3>
              </div>
              <div className="h-80">
                <Map
                  {...viewport}
                  style={{ width: '100%', height: '100%' }}
                  onMove={(evt) => setViewport(evt.viewState)}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                >
                  <NavigationControl position="top-right" />
                  
                  {/* Marcador de ubicación del usuario si está disponible */}
                  {userLocation && (
                    <Marker
                      latitude={userLocation.latitude}
                      longitude={userLocation.longitude}
                    >
                      <div className="cursor-pointer">
                        <div className="relative">
                          <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white rounded-full animate-pulse absolute"></div>
                          <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white rounded-full relative"></div>
                        </div>
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  {userLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                      <span>Tu Ubicación: {userLocationName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Videos Relacionados */}
            <div className="glass-effect rounded-2xl border border-gray-700 bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-cyan-400 text-lg">Videos Relacionados</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {relatedVideos.length > 0 ? (
                  relatedVideos.map((video) => (
                    <div
                      key={video.youtube_video_id}
                      onClick={() => navigate(`/video/${video.youtube_video_id}`)}
                      className="p-4 border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer transition-all duration-300 group"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 relative">
                          <img
                            src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                            alt="Thumbnail"
                            className="w-20 h-14 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/80x56/1f2937/6b7280?text=Video';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-lg"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm line-clamp-2 group-hover:text-cyan-300 transition-colors">
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {video.channelTitle}
                          </p>
                          <p className="text-xs text-cyan-400 mt-1">
                            {new Date(video.publishedAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-400">No hay videos relacionados disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;