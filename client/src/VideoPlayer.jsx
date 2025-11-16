import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import YouTube from 'react-youtube';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/VideoPlayer.css';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryClickCount, setCategoryClickCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentSearchType, setCurrentSearchType] = useState('related');

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

  const categories = [
    {
      id: 'cultura',
      name: 'Cultura',
      keywords: ['cultura', 'tradiciones', 'costumbres', 'festividades', 'arte'],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      id: 'gastronomia',
      name: 'Gastronomia',
      keywords: ['comida', 'gastronomia', 'platos', 'recetas', 'culinaria'],
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 'naturaleza',
      name: 'Naturaleza',
      keywords: ['naturaleza', 'paisajes', 'playas', 'montañas', 'parques'],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      id: 'historia',
      name: 'Historia',
      keywords: ['historia', 'museos', 'patrimonio', 'arqueologia', 'antiguo'],
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500'
    },
    {
      id: 'entretenimiento',
      name: 'Entretenimiento',
      keywords: ['entretenimiento', 'musica', 'festivales', 'eventos', 'diversion'],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  ];

  useEffect(() => {
    console.log('Location state recibido:', location.state);
    
    if (location.state?.selectedLocation) {
      const { latitude, longitude, name } = location.state.selectedLocation;
      setSelectedLocation({ latitude, longitude });
      setSelectedLocationName(name);
      
      setViewport({
        latitude: latitude,
        longitude: longitude,
        zoom: 12
      });
      console.log('Ubicacion seleccionada establecida desde MainApp');
    } else {
      setSelectedLocation(null);
      setSelectedLocationName('');
      console.log('No hay ubicacion seleccionada desde MainApp');
    }

    const savedUserLocation = localStorage.getItem('userLocation');
    if (savedUserLocation) {
      try {
        const locationData = JSON.parse(savedUserLocation);
        setUserLocation({ 
          latitude: locationData.latitude, 
          longitude: locationData.longitude 
        });
        setUserLocationName(locationData.name || 'Mi ubicacion actual');
        
        console.log('Ubicacion actual del usuario cargada:', locationData);
        
        if (!location.state?.selectedLocation) {
          setViewport({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            zoom: 10
          });
        }
      } catch (error) {
        console.error('Error parsing user location:', error);
      }
    }
  }, [location]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.log('Usuario no autenticado en VideoPlayer');
    }
  }, []);

  const extractLocationFromDescription = useCallback((description) => {
    if (!description) return null;
    
    const locationPatterns = [
      /(Ciudad de Mexico|CDMX|Mexico City)/i,
      /(Cancun|Cancun)/i,
      /(Guadalajara)/i,
      /(Monterrey)/i,
      /(Playa del Carmen)/i,
      /(Tulum)/i,
      /(Oaxaca)/i,
      /(Puerto Vallarta)/i,
      /(Los Cabos|Cabo San Lucas)/i,
      /(Mazatlan|Mazatlan)/i,
      /(Acapulco)/i,
      /(Chihuahua)/i,
      /(Merida|Merida)/i,
      /(Puebla)/i,
      /(Queretaro|Queretaro)/i,
      /(San Luis Potosi|San Luis Potosi)/i,
      /(Tijuana)/i,
      /(Veracruz)/i,
      /(Zacatecas)/i,
      /(Guanajuato)/i,
      /(San Miguel de Allende)/i,
      /(Morelia)/i,
      /(Cuernavaca)/i,
      /(Toluca)/i,
      /(Chiapas)/i,
      /(Yucatan|Yucatan)/i,
      /(Quintana Roo)/i,
      /(Baja California)/i,
      /(Sonora)/i,
      /(Jalisco)/i,
      /(Nuevo Leon|Nuevo Leon)/i
    ];

    for (const pattern of locationPatterns) {
      const match = description.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }, []);

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
      console.error('Error obteniendo estadisticas:', error);
    }
    return null;
  }, [YOUTUBE_API_KEY]);

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

  const fetchRelatedVideos = useCallback(async (currentVideoId, locationName, category = null, searchQuery = '', pageToken = '', isLoadMore = false) => {
    try {
      let finalSearchQuery = searchQuery;
      
      if (!searchQuery) {
        const currentVideoData = await fetchVideoStatistics(currentVideoId);
        
        if (category) {
          const randomKeyword = category.keywords[Math.floor(Math.random() * category.keywords.length)];
          finalSearchQuery = `${locationName} ${randomKeyword}`;
          console.log(`Buscando videos por categoria ${category.name}:`, finalSearchQuery);
        } else {
          finalSearchQuery = currentVideoData?.channelTitle || locationName || 'Mexico';
          console.log('Busqueda normal de videos relacionados:', finalSearchQuery);
        }
      }

      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&relevanceLanguage=es&q=${encodeURIComponent(finalSearchQuery)}&key=${YOUTUBE_API_KEY}`;

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        
        const relatedVideos = data.items
          .filter(item => item.id.videoId !== currentVideoId)
          .map(item => ({
            youtube_video_id: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.default.url,
            publishedAt: item.snippet.publishedAt,
            searchCategory: category?.name || 'general',
            searchType: searchQuery ? 'search' : (category ? 'category' : 'related')
          }));

        console.log(`${relatedVideos.length} videos relacionados encontrados`);
        
        return {
          videos: relatedVideos,
          nextPageToken: data.nextPageToken || ''
        };
      }
      return { videos: [], nextPageToken: '' };
    } catch (error) {
      console.error('Error fetching related videos:', error);
      return { videos: [], nextPageToken: '' };
    }
  }, [YOUTUBE_API_KEY, fetchVideoStatistics]);

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!searchTerm.trim()) {
      setSearchError('Por favor ingresa un termino de busqueda valido.');
      return;
    }

    setSearchError('');
    setLoading(true);

    let locationName = 'Mexico';
    if (selectedLocationName) {
      locationName = selectedLocationName;
    } else if (userLocationName) {
      locationName = userLocationName;
    } else if (videoLocationName) {
      locationName = videoLocationName;
    }

    try {
      const result = await fetchRelatedVideos(videoId, locationName, null, searchTerm, '');
      
      if (result.videos.length > 0) {
        setRelatedVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
        setCurrentSearchType('search');
        setSelectedCategory(null);
        console.log(`Busqueda exitosa para "${searchTerm}" en ${locationName}`);
      } else {
        setSearchError(`No se encontraron videos para "${searchTerm}"`);
        setRelatedVideos([]);
      }
    } catch (error) {
      console.error('Error en busqueda:', error);
      setSearchError('Error al realizar la busqueda');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVideos = async () => {
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      let locationName = 'Mexico';
      if (selectedLocationName) {
        locationName = selectedLocationName;
      } else if (userLocationName) {
        locationName = userLocationName;
      } else if (videoLocationName) {
        locationName = videoLocationName;
      }

      let searchQuery = '';
      let category = null;

      if (currentSearchType === 'search') {
        searchQuery = searchTerm;
      } else if (currentSearchType === 'category') {
        category = selectedCategory;
      }

      const result = await fetchRelatedVideos(videoId, locationName, category, searchQuery, nextPageToken, true);
      
      if (result.videos.length > 0) {
        setRelatedVideos(prev => [...prev, ...result.videos]);
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
      }
    } catch (error) {
      console.error('Error cargando mas videos:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCategoryClick = (category) => {
    setCategoryClickCount(prev => {
      const newCount = prev + 1;
      
      if (newCount === 1) {
        setTimeout(() => {
          if (categoryClickCount === 0) {
            selectCategory(category);
          }
          setCategoryClickCount(0);
        }, 300);
      } 
      else if (newCount === 2) {
        clearCategorySelection();
        setCategoryClickCount(0);
      }
      
      return newCount;
    });
  };

  const selectCategory = async (category) => {
    console.log(`Categoria seleccionada: ${category.name}`);
    setSelectedCategory(category);
    setSearchTerm('');
    
    let locationName = 'Mexico';
    if (selectedLocationName) {
      locationName = selectedLocationName;
    } else if (userLocationName) {
      locationName = userLocationName;
    } else if (videoLocationName) {
      locationName = videoLocationName;
    }

    const result = await fetchRelatedVideos(videoId, locationName, category);
    setRelatedVideos(result.videos);
    setNextPageToken(result.nextPageToken);
    setHasMoreVideos(!!result.nextPageToken);
    setCurrentSearchType('category');
    
    console.log(`Mostrando videos de ${category.name} para ${locationName}`);
  };

  const clearCategorySelection = async () => {
    console.log('Limpiando seleccion de categoria');
    setSelectedCategory(null);
    setSearchTerm('');
    
    let locationName = 'Mexico';
    if (selectedLocationName) {
      locationName = selectedLocationName;
    } else if (userLocationName) {
      locationName = userLocationName;
    } else if (videoLocationName) {
      locationName = videoLocationName;
    }

    const result = await fetchRelatedVideos(videoId, locationName);
    setRelatedVideos(result.videos);
    setNextPageToken(result.nextPageToken);
    setHasMoreVideos(!!result.nextPageToken);
    setCurrentSearchType('related');
    
    console.log('Mostrando videos relacionados normales');
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        const videoDetails = await fetchVideoStatistics(videoId);
        
        if (videoDetails) {
          setVideoData(videoDetails);
          setVideoStats(videoDetails);
          setVideoTags(videoDetails.tags.slice(0, 10));
          
          const categoryName = getCategoryName(videoDetails.categoryId);
          setVideoCategory(categoryName);

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
              
              if (!selectedLocation && !userLocation) {
                setViewport({
                  latitude: locationCoords.latitude,
                  longitude: locationCoords.longitude,
                  zoom: 10
                });
              }
            }
          }
        }

        let locationName = 'Mexico';
        if (selectedLocationName) {
          locationName = selectedLocationName;
        } else if (userLocationName) {
          locationName = userLocationName;
        } else if (videoLocationName) {
          locationName = videoLocationName;
        }

        const result = await fetchRelatedVideos(videoId, locationName);
        setRelatedVideos(result.videos);
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
        setCurrentSearchType('related');

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
  }, [videoId, fetchVideoStatistics, getCategoryName, extractLocationFromDescription, getLocationCoordinates, fetchRelatedVideos, selectedLocation, selectedLocationName, userLocationName, videoLocationName, userLocation]);

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

  const formatLargeNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }, []);

  const getTimeSincePublished = useCallback((publishedAt) => {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffInMs = now - published;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} dias`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-white text-xl font-light">Cargando video...</div>
          <div className="text-gray-400 text-sm mt-2">Obteniendo informacion detallada</div>
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
      <header className="glass-effect border-b border-gray-700 p-4 bg-gray-800/80 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* ✅ CORRECCIÓN: Título en contenedor separado sin overflow-hidden */}
            <div className="header-titulo">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                VideoMap Pro
              </h1>
              <p className="text-sm text-gray-400">Reproductor de Video</p>
              {selectedCategory && (
                <p className="text-sm text-green-400 mt-1 busqueda-texto-largo">
                  Filtrado por: {selectedCategory.name}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              {userLocationName && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-cyan-400">Ubicacion actual</p>
                  <p className="text-xs text-gray-300">{userLocationName}</p>
                </div>
              )}
              <button 
                onClick={handleBackToMap}
                className="bg-gradient-to-r from-gray-700 to-gray-600 px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-500 transition-all duration-300 border border-gray-600 hover:border-gray-500 flex-shrink-0"
              >
                Volver al Mapa
              </button>
            </div>
          </div>

          <div className="mb-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar terminos relacionados..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchError('');
                  }}
                  className="w-full glass-effect bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-300"
              >
                Buscar
              </button>
            </form>
            
            {searchError && (
              <div className="mt-2 bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-red-300 text-sm">
                {searchError}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="categorias-grid w-full max-w-full px-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  onDoubleClick={() => clearCategorySelection()}
                  className={`text-center p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory?.id === category.id 
                      ? `ring-4 ring-white ${category.bgColor} shadow-2xl` 
                      : `${category.bgColor} bg-gradient-to-r shadow-lg border border-white/20`
                  }`}
                  title={`Click: Filtrar por ${category.name}\nDoble Click: Quitar filtro`}
                >
                  <span className="text-white text-sm font-medium text-center whitespace-normal break-words">
                    {category.name}
                    {selectedCategory?.id === category.id && ' ✓'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="flex flex-col xl:flex-row gap-8">
          <div className="xl:w-2/3 space-y-6">
            <div className="glass-effect rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-cyan-400">Reproduciendo Video</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  {showVideoLocation && (
                    <p className="text-sm text-green-400 flex items-center gap-2 busqueda-texto-largo">
                      <span>Ubicacion del video: {videoLocationName}</span>
                    </p>
                  )}
                  {selectedLocationName && (
                    <p className="text-sm text-yellow-400 flex items-center gap-2 busqueda-texto-largo">
                      <span>Ubicacion seleccionada: {selectedLocationName}</span>
                    </p>
                  )}
                  {userLocationName && (
                    <p className="text-sm text-blue-400 flex items-center gap-2 busqueda-texto-largo">
                      <span>Mi ubicacion: {userLocationName}</span>
                    </p>
                  )}
                  {selectedCategory && (
                    <p className="text-sm text-purple-400 flex items-center gap-2 busqueda-texto-largo">
                      <span>Categoria: {selectedCategory.name}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* ✅ CORRECCIÓN: Eliminado bg-black y usando video-container */}
              <div className="video-container">
                <YouTube videoId={videoId} opts={youtubeOpts} />
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-700 bg-gray-800/50">
              <h1 className="text-2xl font-bold mb-3 text-white">{videoData?.title}</h1>
              
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
                      Duracion: {formatDuration(videoStats.duration)}
                    </span>
                  </div>
                )}
                {videoCategory && (
                  <div className="flex items-center gap-2">
                    <span className="bg-pink-500/20 px-3 py-1 rounded-full text-sm border border-pink-500/30">
                      Categoria: {videoCategory}
                    </span>
                  </div>
                )}
              </div>

              {selectedLocationName && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 mb-6 border border-yellow-500/30">
                  <h3 className="font-semibold mb-3 text-yellow-400 text-lg flex items-center gap-2">
                    Ubicacion Seleccionada desde el Mapa
                  </h3>
                  <p className="text-white text-lg mb-2">{selectedLocationName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span>Lat: {selectedLocation?.latitude.toFixed(4)}</span>
                    <span>Lng: {selectedLocation?.longitude.toFixed(4)}</span>
                    <button 
                      onClick={() => {
                        setViewport({
                          latitude: selectedLocation.latitude,
                          longitude: selectedLocation.longitude,
                          zoom: 12
                        });
                      }}
                      className="ml-auto bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-xs transition-colors text-white"
                    >
                      Centrar en Mapa
                    </button>
                  </div>
                </div>
              )}

              {showVideoLocation && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 mb-6 border border-green-500/30">
                  <h3 className="font-semibold mb-3 text-green-400 text-lg flex items-center gap-2">
                    Informacion de Ubicacion del Video
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

              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Informacion del Canal</h3>
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
                    Mi ubicacion actual: {userLocationName}
                  </p>
                )}
              </div>

              {videoData?.description && (
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-cyan-400 text-lg">Descripcion</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {videoData.description.length > 400 
                      ? `${videoData.description.substring(0, 400)}...` 
                      : videoData.description
                    }
                  </p>
                  {videoData.description.length > 400 && (
                    <button className="text-cyan-400 text-sm mt-2 hover:text-cyan-300">
                      Ver descripcion completa
                    </button>
                  )}
                </div>
              )}

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

          <div className="xl:w-1/3 space-y-6">
            <div className="glass-effect rounded-2xl overflow-hidden border border-gray-700 bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-cyan-400 text-lg">
                  Mapa de Ubicaciones
                </h3>
                {selectedCategory && (
                  <p className="text-sm text-purple-400 mt-1 busqueda-texto-largo">
                    Filtrado por: {selectedCategory.name}
                  </p>
                )}
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
                  
                  {selectedLocation && (
                    <Marker
                      latitude={selectedLocation.latitude}
                      longitude={selectedLocation.longitude}
                    >
                      <div className="cursor-pointer">
                        <div className="relative">
                          <div className="h-8 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full animate-ping absolute"></div>
                          <div className="h-6 w-6 bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-white rounded-full relative"></div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Seleccionada
                          </div>
                        </div>
                      </div>
                    </Marker>
                  )}
                  
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
                  
                  {userLocation && (
                    <Marker
                      latitude={userLocation.latitude}
                      longitude={userLocation.longitude}
                    >
                      <div className="cursor-pointer">
                        <div className="relative">
                          <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white rounded-full"></div>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Mi Ubicacion
                          </div>
                        </div>
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="space-y-2">
                  {selectedLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Ubicacion seleccionada: {selectedLocationName}</span>
                    </div>
                  )}
                  
                  {showVideoLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Ubicacion del video: {videoLocationName}</span>
                    </div>
                  )}
                  
                  {userLocation && (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      <span className="text-sm">Mi ubicacion: {userLocationName}</span>
                    </div>
                  )}
                  
                  {!showVideoLocation && !userLocation && !selectedLocation && (
                    <div className="text-center text-gray-400 text-sm">
                      No se detecto ubicacion especifica para este video
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl border border-gray-700 bg-gray-800/50">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-cyan-400 text-lg">
                    {selectedCategory 
                      ? `Videos de ${selectedCategory.name}` 
                      : searchTerm 
                        ? `Resultados:` 
                        : 'Videos Relacionados'
                    }
                  </h3>
                  {(selectedCategory || searchTerm) && (
                    <button
                      onClick={clearCategorySelection}
                      className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-white transition-colors flex-shrink-0"
                      title="Quitar filtro"
                    >
                      X
                    </button>
                  )}
                </div>
                {selectedCategory && (
                  <p className="text-sm text-purple-400 mt-1 busqueda-texto-largo">
                    Mostrando contenido de {selectedCategory.name.toLowerCase()}
                  </p>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {relatedVideos.length > 0 ? (
                  <>
                    {relatedVideos.map((video) => (
                      <div
                        key={video.youtube_video_id}
                        onClick={() => navigate(`/video/${video.youtube_video_id}`, { 
                          state: { 
                            selectedLocation: selectedLocation ? { 
                              latitude: selectedLocation.latitude, 
                              longitude: selectedLocation.longitude, 
                              name: selectedLocationName 
                            } : null
                          }
                        })}
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
                            {video.searchCategory && video.searchCategory !== 'general' && (
                              <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1 rounded">
                                {video.searchCategory.charAt(0)}
                              </div>
                            )}
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
                    ))}
                    
                    {hasMoreVideos && (
                      <div className="flex justify-center mt-4 mb-4">
                        <button
                          onClick={loadMoreVideos}
                          disabled={isLoadingMore}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm"
                        >
                          {isLoadingMore ? (
                            <div className="flex items-center gap-2">
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                              Cargando...
                            </div>
                          ) : (
                            'Mostrar mas videos'
                          )}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-400">
                      {selectedCategory 
                        ? `No hay videos de ${selectedCategory.name} disponibles` 
                        : searchTerm
                          ? `No hay resultados para "${searchTerm}"`
                          : 'No hay videos relacionados disponibles'
                      }
                    </p>
                    {(selectedCategory || searchTerm) && (
                      <button
                        onClick={clearCategorySelection}
                        className="text-cyan-400 text-sm mt-2 hover:text-cyan-300"
                      >
                        Quitar filtro
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-effect rounded-2xl border border-gray-700 bg-gray-800/50 p-4">
              <h3 className="font-semibold text-cyan-400 text-lg mb-3">Informacion Tecnica</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Video ID:</span>
                  <span className="text-white font-mono">{videoId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolucion:</span>
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
