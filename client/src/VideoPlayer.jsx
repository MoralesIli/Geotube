import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
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

  const [videoLocation, setVideoLocation] = useState(null);
  const [videoLocationName, setVideoLocationName] = useState('');
  const [videoStats, setVideoStats] = useState(null);
  const [showVideoLocation, setShowVideoLocation] = useState(false);
  const [videoTags, setVideoTags] = useState([]);
  const [videoCategory, setVideoCategory] = useState('');

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';
  const YOUTUBE_API_KEY = 'AIzaSyAmkc92taptBHHwQsQdOJiGW7Wktghl-OI';

  // Verificar autenticación
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('Usuario no autenticado en VideoPlayer');
    }
  }, []);

  // Función optimizada para extraer ubicación de la descripción
  const extractLocationFromDescription = useCallback((description) => {
    if (!description) return null;
    
    const locationPatterns = [
      /(Ciudad de México|CDMX|Mexico City)/i,
      /(Cancún|Cancun)/i,
      /(Guadalajara)/i,
      /(Monterrey)/i,
      /(Playa del Carmen)/i,
      /(Tulum)/i,
      /(Oaxaca)/i,
      /(Puerto Vallarta)/i,
      /(Los Cabos|Cabo San Lucas)/i,
      /(Mazatlán|Mazatlan)/i,
      /(Acapulco)/i,
      /(Chihuahua)/i,
      /(Mérida|Merida)/i,
      /(Puebla)/i,
      /(Querétaro|Queretaro)/i,
      /(San Luis Potosí|San Luis Potosi)/i,
      /(Tijuana)/i,
      /(Veracruz)/i,
      /(Zacatecas)/i,
      /(Guanajuato)/i,
      /(San Miguel de Allende)/i,
      /(Morelia)/i,
      /(Cuernavaca)/i,
      /(Toluca)/i,
      /(Chiapas)/i,
      /(Yucatán|Yucatan)/i,
      /(Quintana Roo)/i,
      /(Baja California)/i,
      /(Sonora)/i,
      /(Jalisco)/i,
      /(Nuevo León|Nuevo Leon)/i
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }, []);

  // Función optimizada para obtener coordenadas
  const getLocationCoordinates = useCallback(async (locationName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${MAPBOX_TOKEN}&country=mx&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features?.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          return { latitude, longitude, name: data.features[0].place_name };
        }
      }
    } catch (error) {
      console.error('Error obteniendo coordenadas:', error);
    }
    return null;
  }, [MAPBOX_TOKEN]);

  // Función optimizada para obtener estadísticas del video
  const fetchVideoStatistics = useCallback(async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.items?.length > 0) {
          const video = data.items[0];
          return {
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            viewCount: parseInt(video.statistics.viewCount) || 0,
            likeCount: parseInt(video.statistics.likeCount) || 0,
            commentCount: parseInt(video.statistics.commentCount) || 0,
            favoriteCount: parseInt(video.statistics.favoriteCount) || 0,
            duration: video.contentDetails.duration,
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            thumbnails: video.snippet.thumbnails
          };
        }
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
    return null;
  }, [YOUTUBE_API_KEY]);

  // Función para obtener nombre de categoría
  const getCategoryName = useCallback((categoryId) => {
    const categories = {
      '1': 'Film & Animation',
      '2': 'Autos & Vehicles',
      '10': 'Music',
      '15': 'Pets & Animals',
      '17': 'Sports',
      '18': 'Short Movies',
      '19': 'Travel & Events',
      '20': 'Gaming',
      '21': 'Videoblogging',
      '22': 'People & Blogs',
      '23': 'Comedy',
      '24': 'Entertainment',
      '25': 'News & Politics',
      '26': 'Howto & Style',
      '27': 'Education',
      '28': 'Science & Technology',
      '29': 'Nonprofits & Activism',
      '30': 'Movies',
      '31': 'Anime/Animation',
      '32': 'Action/Adventure',
      '33': 'Classics',
      '34': 'Comedy',
      '35': 'Documentary',
      '36': 'Drama',
      '37': 'Family',
      '38': 'Foreign',
      '39': 'Horror',
      '40': 'Sci-Fi/Fantasy',
      '41': 'Thriller',
      '42': 'Shorts',
      '43': 'Shows',
      '44': 'Trailers'
    };
    
    return categories[categoryId] || 'Unknown Category';
  }, []);

  // Función optimizada para cargar videos relacionados
  const fetchRelatedVideos = useCallback(async (currentVideoId, locationName) => {
    try {
      const currentVideoData = await fetchVideoStatistics(currentVideoId);
      const searchQuery = currentVideoData?.channelTitle || locationName || 'México';

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&relevanceLanguage=es&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        
        return data.items
          .filter(item => item.id.videoId !== currentVideoId)
          .map(item => ({
            youtube_video_id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.default.url,
            publishedAt: item.snippet.publishedAt
          }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching related videos:', error);
      return [];
    }
  }, [YOUTUBE_API_KEY, fetchVideoStatistics]);

  // Inicializar datos del video
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Obtener ubicación del usuario desde localStorage
        const savedLocation = localStorage.getItem('userLocation');
        let currentLocationName = 'México';

        if (savedLocation) {
          const locationData = JSON.parse(savedLocation);
          setUserLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude
          });
          setUserLocationName(locationData.name || 'Tu ubicación actual');
          currentLocationName = locationData.name || 'Tu ubicación actual';
        }

        // Obtener datos detallados del video
        const videoDetails = await fetchVideoStatistics(videoId);
        
        if (videoDetails) {
          setVideoData(videoDetails);
          setVideoStats(videoDetails);
          setVideoTags(videoDetails.tags.slice(0, 10));
          
          const categoryName = getCategoryName(videoDetails.categoryId);
          setVideoCategory(categoryName);

          // Intentar extraer ubicación del video
          const extractedLocation = extractLocationFromDescription(videoDetails.description);
          if (extractedLocation) {
            const locationCoords = await getLocationCoordinates(extractedLocation);
            if (locationCoords) {
              setVideoLocation({
                latitude: locationCoords.latitude,
                longitude: locationCoords.longitude
              });
              setVideoLocationName(locationCoords.name);
              setShowVideoLocation(true);
              
              setViewport({
                latitude: locationCoords.latitude,
                longitude: locationCoords.longitude,
                zoom: 10
              });
            }
          }
        }

        // Cargar videos relacionados
        const relatedVideosData = await fetchRelatedVideos(videoId, currentLocationName);
        setRelatedVideos(relatedVideosData);

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
  }, [videoId, fetchVideoStatistics, getCategoryName, extractLocationFromDescription, getLocationCoordinates, fetchRelatedVideos]);

  // Configuración de YouTube
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
  const formatDuration = useCallback((duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
  }, []);

  // Función para formatear números grandes
  const formatLargeNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  // Función para calcular tiempo desde la publicación
  const getTimeSincePublished = useCallback((publishedAt) => {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffInMs = now - published;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
    }
    const years = Math.floor(diffInDays / 365);
    return `Hace ${years} año${years > 1 ? 's' : ''}`;
  }, []);

  const handleBackToMap = () => {
    navigate('/');
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-white text-xl font-light">Cargando video...</div>
          <div className="text-gray-400 text-sm mt-2">Obteniendo información detallada</div>
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
              VideoMap Pro
            </h1>
            <p className="text-sm text-gray-400">Reproductor de Video</p>
          </div>
          
          <div className="flex items-center gap-4">
            {userLocationName && (
              <div className="text-right">
                <p className="text-sm text-cyan-400">Ubicación actual</p>
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
                {showVideoLocation && (
                  <p className="text-sm text-green-400 mt-1 flex items-center gap-2">
                    <span>📍</span>
                    <span>Ubicación detectada: {videoLocationName}</span>
                  </p>
                )}
              </div>
              <div className="bg-black">
                <YouTube videoId={videoId} opts={youtubeOpts} />
              </div>
            </div>

            {/* Información del Video */}
            <div className="glass-effect rounded-2xl p-6 border border-gray-700 bg-gray-800/50">
              <h1 className="text-2xl font-bold mb-3 text-white">{videoData?.title}</h1>
              
              {/* Estadísticas Principales */}
              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/20 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                    Visualizaciones: {formatLargeNumber(videoStats?.viewCount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500/20 px-3 py-1 rounded-full text-sm border border-green-500/30">
                    Me gusta: {formatLargeNumber(videoStats?.likeCount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500/20 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                    Comentarios: {formatLargeNumber(videoStats?.commentCount)}
                  </span>
                </div>
                {videoStats?.duration && (
                  <div className="flex items-center gap-2">
                    <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm border border-yellow-500/30">
                      Duración: {formatDuration(videoStats.duration)}
                    </span>
                  </div>
                )}
                {videoCategory && (
                  <div className="flex items-center gap-2">
                    <span className="bg-pink-500/20 px-3 py-1 rounded-full text-sm border border-pink-500/30">
                      Categoría: {videoCategory}
                    </span>
                  </div>
                )}
              </div>

              {/* Información de Ubicación */}
              {showVideoLocation && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 mb-6 border border-green-500/30">
                  <h3 className="font-semibold mb-3 text-green-400 text-lg flex items-center gap-2">
                    📍 Información de Ubicación
                  </h3>
                  <p className="text-white text-lg mb-2">{videoLocationName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>Lat: {videoLocation?.latitude.toFixed(4)}</span>
                    <span>Lng: {videoLocation?.longitude.toFixed(4)}</span>
                    <button 
                      onClick={() => {
                        setViewport({
                          latitude: videoLocation.latitude,
                          longitude: videoLocation.longitude,
                          zoom: 12
                        });
                      }}
                      className="ml-auto bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs transition-colors"
                    >
                      Centrar Mapa
                    </button>
                  </div>
                </div>
              )}

              {/* Información del Canal */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Información del Canal</h3>
                <p className="text-white text-lg mb-2">{videoData?.channelTitle}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Publicado: {getTimeSincePublished(videoData?.publishedAt)}</span>
                  <span>•</span>
                  <span>
                    {new Date(videoData?.publishedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {userLocationName && (
                  <p className="text-gray-400 text-sm mt-2">
                    📍 Tu ubicación actual: {userLocationName}
                  </p>
                )}
              </div>

              {/* Descripción del Video */}
              {videoData?.description && (
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Descripción</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {videoData.description.length > 400 
                      ? `${videoData.description.substring(0, 400)}...` 
                      : videoData.description
                    }
                  </p>
                  {videoData.description.length > 400 && (
                    <button className="text-cyan-400 text-sm mt-2 hover:text-cyan-300">
                      Ver descripción completa
                    </button>
                  )}
                </div>
              )}

              {/* Etiquetas del Video */}
              {videoTags.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Etiquetas</h3>
                  <div className="flex flex-wrap gap-2">
                    {videoTags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Estadísticas Avanzadas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{formatLargeNumber(videoStats?.viewCount)}</div>
                  <div className="text-sm text-gray-400 mt-1">Reproducciones</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20 text-center">
                  <div className="text-2xl font-bold text-green-400">{formatLargeNumber(videoStats?.likeCount)}</div>
                  <div className="text-sm text-gray-400 mt-1">Me Gusta</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20 text-center">
                  <div className="text-2xl font-bold text-purple-400">{formatLargeNumber(videoStats?.commentCount)}</div>
                  <div className="text-sm text-gray-400 mt-1">Comentarios</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatLargeNumber(videoStats?.favoriteCount || 0)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Favoritos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Mapa y Videos Relacionados */}
          <div className="xl:w-1/3 space-y-6">
            {/* Mapa de Ubicación */}
            <div className="glass-effect rounded-2xl overflow-hidden border border-gray-700 bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-cyan-400 text-lg">
                  {showVideoLocation ? 'Ubicación del Video' : 'Mapa'}
                </h3>
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
                  
                  {/* Marcador de ubicación del video */}
                  {showVideoLocation && videoLocation && (
                    <Marker
                      latitude={videoLocation.latitude}
                      longitude={videoLocation.longitude}
                    >
                      <div className="cursor-pointer">
                        <div className="relative">
                          <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-white rounded-full animate-ping absolute"></div>
                          <div className="h-6 w-6 bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-white rounded-full relative"></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Video
                          </div>
                        </div>
                      </div>
                    </Marker>
                  )}
                  
                  {/* Marcador de ubicación del usuario */}
                  {userLocation && (
                    <Marker
                      latitude={userLocation.latitude}
                      longitude={userLocation.longitude}
                    >
                      <div className="cursor-pointer">
                        <div className="relative">
                          <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white rounded-full"></div>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Ubicación
                          </div>
                        </div>
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="space-y-2">
                  {showVideoLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Ubicación del video: {videoLocationName}</span>
                    </div>
                  )}
                  {userLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      <span className="text-sm">Tu ubicación: {userLocationName}</span>
                    </div>
                  )}
                  {!showVideoLocation && !userLocation && (
                    <div className="text-center text-gray-400 text-sm">
                      No se detectó ubicación específica para este video
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm line-clamp-2 group-hover:text-cyan-300 transition-colors">
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {video.channelTitle}
                          </p>
                          <p className="text-xs text-cyan-400 mt-1">
                            {getTimeSincePublished(video.publishedAt)}
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

            {/* Información Técnica */}
            <div className="glass-effect rounded-2xl border border-gray-700 bg-gray-800/50 p-4">
              <h3 className="font-semibold text-cyan-400 text-lg mb-3">Información Técnica</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Video ID:</span>
                  <span className="text-white font-mono">{videoId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolución:</span>
                  <span className="text-white">1080p</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plataforma:</span>
                  <span className="text-white">YouTube</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reproductor:</span>
                  <span className="text-white">YouTube IFrame API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;