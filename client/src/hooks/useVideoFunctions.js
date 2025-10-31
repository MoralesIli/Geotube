import { useCallback } from 'react';

export const useVideoFunctions = (appState, appData, mapFunctions) => {
  const {
    YOUTUBE_API_KEY,
    API_BASE_URL,
    user,
    setVideos,
    setLoadingVideos,
    setIsLoadingMore,
    setNextPageToken,
    setHasMoreVideos,
    setActiveFilter,
    setSearchLocation,
    setYoutubeAvailable,
    setYoutubeError,
    setActiveSearchTerm,
    currentRegion,
    clickedLocation,
    isValidLocation,
    clickedLocationName,
    userLocation,
    userLocationName,
    searchTerm,
    setSearchError,
    setTargetViewport
  } = appState;

  const { isValidMapLocation, checkRestrictions, getLocationCoordinates } = mapFunctions;

  const showLocationWarning = useCallback((searchQuery, locationName) => {
    const warningMessage = `No se encontraron videos de "${searchQuery || 'contenido local'}" que hayan sido subidos en ${locationName}. Esto puede deberse a que:\n\n• No hay videos subidos en esta ubicación\n• Los videos no tienen terminos de la ubicación`;
    
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #e53e3e;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    warningDiv.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #e53e3e; font-size: 18px; font-weight: 600;">
          No se encontraron videos
        </h3>
        <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.4;">
          No se encontraron videos de "${searchQuery || 'contenido local'}" en ${locationName}.
        </p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0; color: #718096; font-size: 13px; font-weight: 500;">
          Posibles causas:
        </p>
        <ul style="margin: 0; padding-left: 16px; color: #718096; font-size: 13px; line-height: 1.4;">
          <li>No hay videos subidos en esta ubicación</li>
          <li>Los videos no tienen informacion de ubicación</li>
          <li>Restricciones regionales de YouTube</li>
        </ul>
      </div>
      <button 
        onclick="this.parentElement.remove()"
        style="
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
        "
      >
        Aceptar
      </button>
    `;

    document.body.appendChild(warningDiv);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;
    
    document.body.appendChild(overlay);

    const closeWarning = () => {
      warningDiv.remove();
      overlay.remove();
    };

    overlay.addEventListener('click', closeWarning);
    
    const closeButton = warningDiv.querySelector('button');
    closeButton.addEventListener('click', closeWarning);
  }, []);

  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '', pageToken = '') => {
    try {
      const searchQuery = query || locationName.split(',')[0].trim();
      console.log('Buscando en YouTube para ubicación:', {
        query: searchQuery,
        location: locationName,
        coordinates: { latitude, longitude }
      });
      
      let url = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&` +
        `type=video&` +
        `maxResults=12&` +
        `relevanceLanguage=es&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `key=${YOUTUBE_API_KEY}`;

      url += `&location=${latitude},${longitude}`;
      url += `&locationRadius=50km`;

      if (currentRegion) {
        url += `&regionCode=${currentRegion}`;
      }

      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      console.log('URL de búsqueda YouTube:', url);

      const searchResponse = await fetch(url);

      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          setYoutubeAvailable(false);
          setYoutubeError('Límite de cuota excedido para YouTube API');
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('Error en YouTube API');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items?.length) {
        console.log('No se encontraron videos subidos en esta ubicación');
        return {
          videos: [],
          nextPageToken: ''
        };
      }

      const youtubeVideos = [];
      
      for (const item of searchData.items.slice(0, 12)) {
        try {
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,recordingDetails&id=${item.id.videoId}&key=${YOUTUBE_API_KEY}`;
          const detailsResponse = await fetch(videoDetailsUrl);
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const videoDetails = detailsData.items[0];
            
            const hasLocationData = videoDetails?.recordingDetails?.location || 
                                  videoDetails?.snippet?.locationDescription;
            
            console.log('Metadata de ubicación del video:', {
              videoId: item.id.videoId,
              hasLocationData: hasLocationData,
              recordingDetails: videoDetails?.recordingDetails,
              locationDescription: videoDetails?.snippet?.locationDescription
            });

            if (hasLocationData) {
              const angle = Math.random() * 2 * Math.PI;
              const distance = Math.random() * 0.1;
              const newLat = latitude + (distance * Math.cos(angle));
              const newLng = longitude + (distance * Math.sin(angle));
              
              youtubeVideos.push({
                youtube_video_id: item.id.videoId,
                location_name: `${locationName} - ${item.snippet.channelTitle}`,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle,
                latitude: newLat,
                longitude: newLng,
                views: Math.floor(Math.random() * 50000) + 1000,
                likes: 0,
                duration: 'PT0S',
                isCurrentLocation: false,
                isSearchResult: true,
                thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
                publishedAt: item.snippet.publishedAt,
                description: item.snippet.description,
                recordingLocation: videoDetails.recordingDetails?.location,
                locationDescription: videoDetails.snippet?.locationDescription,
                confirmedLocation: true
              });
            }
          }
        } catch (error) {
          console.warn('Error obteniendo detalles del video:', error);
        }
      }

      if (youtubeVideos.length === 0) {
        console.log('No hay videos con ese termino de ubicación, usando búsqueda normal');
        
        for (const item of searchData.items.slice(0, 12)) {
          const angle = Math.random() * 2 * Math.PI;
          const distance = Math.random() * 0.1;
          const newLat = latitude + (distance * Math.cos(angle));
          const newLng = longitude + (distance * Math.sin(angle));
          
          youtubeVideos.push({
            youtube_video_id: item.id.videoId,
            location_name: `${locationName} - ${item.snippet.channelTitle}`,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            latitude: newLat,
            longitude: newLng,
            views: Math.floor(Math.random() * 50000) + 1000,
            likes: 0,
            duration: 'PT0S',
            isCurrentLocation: false,
            isSearchResult: true,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description,
            confirmedLocation: false
          });
        }
      }

      console.log('Videos encontrados con ubicación:', youtubeVideos.length);

      return {
        videos: youtubeVideos,
        nextPageToken: searchData.nextPageToken || ''
      };

    } catch (error) {
      console.error('Error buscando videos:', error);
      if (error.message === 'QUOTA_EXCEEDED') {
        setYoutubeAvailable(false);
        throw error;
      }
      throw new Error('Error en búsqueda de videos');
    }
  }, [YOUTUBE_API_KEY, currentRegion, setYoutubeAvailable, setYoutubeError]);

  const loadVideosForLocation = useCallback(async (latitude, longitude, locationName, searchQuery = '', pageToken = '', isLoadMore = false) => {
    if (!isLoadMore) {
      setLoadingVideos(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const result = await searchYouTubeVideosByLocation(latitude, longitude, locationName, searchQuery, pageToken);
      
      if (result.videos.length > 0) {
        if (isLoadMore) {
          setVideos(prev => [...prev, ...result.videos]);
        } else {
          setVideos(result.videos);
        }
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
        setActiveFilter('search');
        setSearchLocation({ latitude, longitude, name: locationName });
        
        console.log('Videos cargados para ubicación:', {
          location: locationName,
          videos: result.videos.length,
          withLocationData: result.videos.filter(v => v.confirmedLocation).length
        });
      } else {
        if (!isLoadMore) {
          setVideos([]);
          setNextPageToken('');
          setHasMoreVideos(false);
          setActiveFilter('no-videos');
          
          console.log('No se encontraron videos subidos en:', locationName);
          
          setTimeout(() => {
            showLocationWarning(searchQuery, locationName);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error buscando videos:', err);
      if (!isLoadMore) {
        if (err.message === 'QUOTA_EXCEEDED') {
          setVideos([]);
          setActiveFilter('unavailable');
        }
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingVideos(false);
      }
    }
  }, [searchYouTubeVideosByLocation, setVideos, setLoadingVideos, setIsLoadingMore, setNextPageToken, setHasMoreVideos, setActiveFilter, setSearchLocation, showLocationWarning]);

  const fetchVideos = useCallback(async (query, pageToken = '', isLoadMore = false) => {
    if (!query.trim() && !isLoadMore) {
      setSearchError('Por favor ingresa un término de búsqueda válido.');
      return;
    }

    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoadingVideos(true);
    }
    
    setSearchError('');
    
    try {
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
        try {
          const locationData = await getLocationCoordinates(query.split(',')[0]);
          latitude = locationData.latitude;
          longitude = locationData.longitude;
          locationName = locationData.locationName;

          if (!isLoadMore) {
            setTargetViewport({ 
              latitude: latitude, 
              longitude: longitude, 
              zoom: 10 
            });
          }
          
          console.log('Nueva ubicación encontrada:', locationName);
        } catch (error) {
          throw new Error('Primero activa tu ubicación o selecciona una en el mapa. Error: ' + error.message);
        }
      }

      const locationCheck = await isValidMapLocation(latitude, longitude);
      const finalRestrictionCheck = checkRestrictions(query, {
        countryCode: locationCheck.countryCode,
        locationName: locationName
      });
      
      if (finalRestrictionCheck.restricted) {
        throw new Error(finalRestrictionCheck.message);
      }

      if (!isLoadMore) {
        setActiveSearchTerm(query);
      }

      await loadVideosForLocation(latitude, longitude, locationName, query, pageToken, isLoadMore);

    } catch (error) {
      console.error('Error en búsqueda:', error);
      if (!isLoadMore) {
        setSearchError(error.message || 'Error al realizar la búsqueda. Verifica el término e intenta nuevamente.');
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoadingVideos(false);
      }
    }
  }, [
    clickedLocation, isValidLocation, clickedLocationName, userLocation, userLocationName,
    getLocationCoordinates, isValidMapLocation, checkRestrictions, loadVideosForLocation,
    setSearchError, setIsLoadingMore, setLoadingVideos, setActiveSearchTerm, setTargetViewport
  ]);

  const registerVideoAccess = useCallback(async (video) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/register-video-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youtube_video_id: video.youtube_video_id,
          titulo: video.title,
          location_name: video.location_name,
          latitude: video.latitude,
          longitude: video.longitude,
          duracion_reproduccion: 0
        })
      });
    } catch (error) {
      console.error('Error registrando acceso:', error);
    }
  }, [API_BASE_URL, user]);

  const fetchPopularVideosByRegion = useCallback(async (region = 'MX') => {
    try {
      const lastQuotaError = localStorage.getItem('youtube_quota_exceeded');
      if (lastQuotaError && Date.now() - parseInt(lastQuotaError) < 3600000) {
        throw new Error('QUOTA_EXCEEDED_RECENTLY');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=12&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        const popularVideos = data.items.map((item) => ({
          youtube_video_id: item.id,
          location_name: `${appData.regionConfig[region]?.name || 'México'} - ${item.snippet.channelTitle}`,
          title: item.snippet.title,
          channelTitle: item.snippet.channelTitle,
          latitude: (appData.regionConfig[region]?.center[0] || 23.6345) + (Math.random() - 0.5) * 4,
          longitude: (appData.regionConfig[region]?.center[1] || -102.5528) + (Math.random() - 0.5) * 4,
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
        setHasMoreVideos(false);
        return popularVideos;
      } else {
        if (response.status === 403) {
          localStorage.setItem('youtube_quota_exceeded', Date.now().toString());
          setYoutubeAvailable(false);
          setYoutubeError('Límite de cuota excedido para YouTube API');
          throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error('Error al cargar videos populares');
      }
    } catch (error) {
      console.error('Error:', error);
      setVideos([]);
      setActiveFilter('unavailable');
      return [];
    }
  }, [YOUTUBE_API_KEY, appData.regionConfig, setVideos, setActiveFilter, setNextPageToken, setHasMoreVideos, setYoutubeAvailable, setYoutubeError]);

  return {
    searchYouTubeVideosByLocation,
    loadVideosForLocation,
    fetchVideos,
    registerVideoAccess,
    fetchPopularVideosByRegion
  };
};