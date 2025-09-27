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
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 5
  });

  const MAPBOX_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/video/${videoId}`);
        if (!response.ok) throw new Error('Video no encontrado');
        const data = await response.json();
        setVideoData(data);
        
        // Centrar mapa en la ubicación del video
        setViewport(prev => ({
          ...prev,
          latitude: parseFloat(data.video.coordinates.lat),
          longitude: parseFloat(data.video.coordinates.lng),
          zoom: 10
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const youtubeOpts = {
    height: '480',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
        <button 
          onClick={() => navigate('/')}
          className="ml-4 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Volver al Mapa
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-red-600 hover:text-red-500"
        >
          GeoTube 🌐
        </button>
        <button 
          onClick={() => navigate('/')}
          className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700"
        >
          Volver al Mapa
        </button>
      </header>

      {/* Contenido Principal */}
      <div className="flex flex-col lg:flex-row p-4 gap-6">
        {/* Sección de Video */}
        <div className="lg:w-2/3">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden">
            <YouTube videoId={videoId} opts={youtubeOpts} />
          </div>

          {/* Información del Video */}
          <div className="mt-4 bg-gray-800 rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">{videoData.video.title}</h1>
            <div className="flex items-center text-gray-400 text-sm mb-4">
              <span>{videoData.video.views} visualizaciones</span>
              <span className="mx-2">•</span>
              <span>{new Date(videoData.video.uploadDate).toLocaleDateString()}</span>
            </div>
            
            {/* Información de Ubicación */}
            <div className="bg-gray-700 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">📍 Ubicación del Video</h3>
              <p>{videoData.video.location}</p>
              <p className="text-sm text-gray-400">
                Coordenadas: {videoData.video.coordinates.lat}, {videoData.video.coordinates.lng}
              </p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-2xl font-bold">{videoData.video.views}</div>
                <div className="text-sm text-gray-400">Reproducciones</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-2xl font-bold">{videoData.video.uniqueViewers}</div>
                <div className="text-sm text-gray-400">Espectadores únicos</div>
              </div>
              <div className="bg-gray-700 rounded p-3">
                <div className="text-2xl font-bold">{videoData.statistics?.length || 0}</div>
                <div className="text-sm text-gray-400">Días activo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Videos Relacionados y Mapa */}
        <div className="lg:w-1/3 space-y-6">
          {/* Mapa de Ubicación */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <h3 className="p-4 font-semibold border-b border-gray-700">🗺️ Ubicación en el Mapa</h3>
            <div className="h-64">
              <Map
                {...viewport}
                style={{ width: '100%', height: '100%' }}
                onMove={(evt) => setViewport(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              >
                <NavigationControl position="top-right" />
                {videoData && (
                  <Marker
                    latitude={parseFloat(videoData.video.coordinates.lat)}
                    longitude={parseFloat(videoData.video.coordinates.lng)}
                    anchor="bottom"
                  >
                    <div className="text-2xl">📍</div>
                  </Marker>
                )}
              </Map>
            </div>
          </div>

          {/* Videos Relacionados */}
          <div className="bg-gray-800 rounded-lg">
            <h3 className="p-4 font-semibold border-b border-gray-700">📹 Videos Relacionados</h3>
            <div className="max-h-96 overflow-y-auto">
              {videoData.relatedVideos.map((video) => (
                <div
                  key={video.youtube_video_id}
                  onClick={() => navigate(`/video/${video.youtube_video_id}`)}
                  className="p-3 border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex gap-3">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`}
                      alt="Thumbnail"
                      className="w-16 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2">{video.location_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {video.view_count} visualizaciones
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {videoData.relatedVideos.length === 0 && (
                <p className="p-4 text-gray-400 text-center">No hay videos relacionados</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;