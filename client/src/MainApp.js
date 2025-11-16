import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import "./styles/MainApp.css";

// Importar hooks personalizados
import { useAppInitialization } from "./hooks/useAppInitialization";
import { useVideoOperations } from "./hooks/useVideoOperations";

// Importar componentes
import MapComponent from "./components/MapComponent";
import VideoSidebar from "./modals/VideoSidebar";
import Navbar from "./components/Navbar";
import Modals from "./Modals";

// Importar utilidades
import { restrictedCountries, restrictedCities, regionConfig, categories } from "./utils/constants";

const MainApp = () => {
  // Usar hooks personalizados
  const appState = useAppInitialization();
  const videoState = useVideoOperations();

  // Desestructurar estados y funciones
  const {
    // Estados de la app
    viewport, setViewport, targetViewport, setTargetViewport, isAnimating, setIsAnimating,
    userLocation, setUserLocation, userLocationName, setUserLocationName, searchTerm, setSearchTerm,
    activeSearchTerm, setActiveSearchTerm, showProfile, setShowProfile, showAuthModal, setShowAuthModal,
    showSettings, setShowSettings, showPasswordModal, setShowPasswordModal, showPhotoModal, setShowPhotoModal,
    showCommentsModal, setShowCommentsModal, user, setUser, activeFilter, setActiveFilter,
    searchLocation, setSearchLocation, clickedLocation, setClickedLocation, clickedLocationName, setClickedLocationName,
    showLocationPopup, setShowLocationPopup, isValidLocation, setIsValidLocation, showHistoryModal, setShowHistoryModal,
    userHistory, setUserHistory, currentRegion, setCurrentRegion, youtubeAvailable, setYoutubeAvailable,
    youtubeError, setYoutubeError, suggestions, setSuggestions, showSuggestions, setShowSuggestions,
    searchError, setSearchError, selectedCategory, setSelectedCategory, isMobile, setIsMobile,
    showSidebar, setShowSidebar, showSearchBar, setShowSearchBar, orientation, setOrientation,
    
    // Funciones
    toggleVideosVisibility,
  } = appState;

  const {
    // Estados de video
    videos, setVideos, selectedVideo, setSelectedVideo, loadingVideos, setLoadingVideos,
    nextPageToken, setNextPageToken, hasMoreVideos, setHasMoreVideos, isLoadingMore, setIsLoadingMore,
    
    // Handlers de video
    handleVideoClick, handleVideoDoubleClick, handleWatchComplete,
  } = videoState;

  // Referencias y navegación
  const animationRef = useRef();
  const startViewportRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // VARIABLES DE ENTORNO
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // Función para validar tipo de ubicación
  const isValidLocationType = useCallback((feature) => {
    const validTypes = [
      "country",
      "region",
      "place",
      "locality",
      "neighborhood",
      "address",
    ];
    return feature.place_type?.some((type) => validTypes.includes(type));
  }, []);

  // Función para verificar si una ubicación es válida
  const isValidMapLocation = useCallback(
    async (lat, lng) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `types=country,region,place,locality,neighborhood,address&` +
            `limit=1&` +
            `language=es`
        );

        if (!response.ok)
          return { isValid: false, placeName: null, featureType: "unknown" };

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const placeName = feature.place_name;
          const featureType = feature.place_type?.[0] || "unknown";
          const countryCode = feature.properties.short_code?.toUpperCase();

          if (countryCode && restrictedCountries.includes(countryCode)) {
            return {
              isValid: false,
              placeName: "Ubicación en país restringido",
              featureType: "restricted",
              countryCode,
            };
          }

          const isValid = isValidLocationType(feature);

          const invalidPatterns = [
            /unamed road/i,
            /ocean/i,
            /sea/i,
            /pacific ocean/i,
            /atlantic ocean/i,
            /indian ocean/i,
            /arctic ocean/i,
            /null/i,
            /undefined/i,
            /^\s*$/,
            /mar/i,
            /gulf/i,
            /bay/i,
            /strait/i,
            /channel/i,
          ];

          const hasValidName =
            !invalidPatterns.some((pattern) => pattern.test(placeName)) &&
            placeName.trim().length > 0;

          return {
            isValid: isValid && hasValidName,
            placeName: isValid && hasValidName ? placeName : null,
            featureType,
            countryCode,
          };
        }

        return { isValid: false, placeName: null, featureType: "unknown" };
      } catch (error) {
        console.error("Error verificando ubicación:", error);
        return { isValid: false, placeName: null, featureType: "unknown" };
      }
    },
    [MAPBOX_TOKEN, restrictedCountries, isValidLocationType]
  );

  // Función para obtener coordenadas de ubicación
  const getLocationCoordinates = useCallback(
    async (placeName) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            placeName
          )}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `types=country,region,place,locality,neighborhood,address&` +
            `limit=1&` +
            `language=es`
        );

        if (!response.ok) throw new Error("Error en geocoding");

        const data = await response.json();

        if (data.features?.[0]) {
          const feature = data.features[0];

          if (!isValidLocationType(feature)) {
            throw new Error(
              "Tipo de ubicación no válido. Solo se permiten países, ciudades, lugares o direcciones específicas."
            );
          }

          const [longitude, latitude] = feature.center;
          const locationName = feature.place_name;
          const countryCode = feature.properties.short_code?.toUpperCase();

          return { latitude, longitude, locationName, countryCode };
        }

        throw new Error(
          "Ubicación no encontrada. Verifica el nombre e intenta nuevamente."
        );
      } catch (error) {
        console.warn("Error obteniendo coordenadas:", error);
        throw error;
      }
    },
    [MAPBOX_TOKEN, isValidLocationType]
  );

  const getLocationName = useCallback(
    async (lat, lng) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `types=place,locality&` +
            `limit=1&` +
            `language=es`
        );

        if (!response.ok) throw new Error("Error en geocoding");

        const data = await response.json();

        if (data.features?.[0]) {
          return data.features[0].place_name;
        }

        return `Ubicación (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
      } catch (error) {
        console.warn("Error obteniendo nombre de ubicación:", error);
        return `Ubicación actual`;
      }
    },
    [MAPBOX_TOKEN]
  );

  // Función para buscar videos de YouTube
  const searchYouTubeVideosByLocation = useCallback(
    async (latitude, longitude, locationName, query = "", pageToken = "") => {
      try {
        const searchQuery = query || locationName.split(",")[0].trim();
        console.log("Buscando en YouTube para ubicación:", {
          query: searchQuery,
          location: locationName,
          coordinates: { latitude, longitude },
        });

        let url =
          `https://www.googleapis.com/youtube/v3/search?` +
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

        console.log("URL de búsqueda YouTube:", url);

        const searchResponse = await fetch(url);

        if (!searchResponse.ok) {
          if (searchResponse.status === 403) {
            setYoutubeAvailable(false);
            setYoutubeError("Límite de cuota excedido para YouTube API");
            throw new Error("QUOTA_EXCEEDED");
          }
          throw new Error("Error en YouTube API");
        }

        const searchData = await searchResponse.json();

        if (!searchData.items?.length) {
          console.log("No se encontraron videos subidos en esta ubicación");
          return {
            videos: [],
            nextPageToken: "",
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

              const hasLocationData =
                videoDetails?.recordingDetails?.location ||
                videoDetails?.snippet?.locationDescription;

              console.log("Metadata de ubicación del video:", {
                videoId: item.id.videoId,
                hasLocationData: hasLocationData,
                recordingDetails: videoDetails?.recordingDetails,
                locationDescription: videoDetails?.snippet?.locationDescription,
              });

              if (hasLocationData) {
                const angle = Math.random() * 2 * Math.PI;
                const distance = Math.random() * 0.1;
                const newLat = latitude + distance * Math.cos(angle);
                const newLng = longitude + distance * Math.sin(angle);

                youtubeVideos.push({
                  youtube_video_id: item.id.videoId,
                  location_name: `${locationName} - ${item.snippet.channelTitle}`,
                  title: item.snippet.title,
                  channelTitle: item.snippet.channelTitle,
                  latitude: newLat,
                  longitude: newLng,
                  views: Math.floor(Math.random() * 50000) + 1000,
                  likes: 0,
                  duration: "PT0S",
                  isCurrentLocation: false,
                  isSearchResult: true,
                  thumbnail:
                    item.snippet.thumbnails.medium?.url ||
                    item.snippet.thumbnails.default?.url,
                  publishedAt: item.snippet.publishedAt,
                  description: item.snippet.description,
                  recordingLocation: videoDetails.recordingDetails?.location,
                  locationDescription:
                    videoDetails.snippet?.locationDescription,
                  confirmedLocation: true,
                });
              }
            }
          } catch (error) {
            console.warn("Error obteniendo detalles del video:", error);
          }
        }

        if (youtubeVideos.length === 0) {
          console.log(
            "No hay videos con metadata de ubicación, usando búsqueda normal"
          );

          for (const item of searchData.items.slice(0, 12)) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * 0.1;
            const newLat = latitude + distance * Math.cos(angle);
            const newLng = longitude + distance * Math.sin(angle);

            youtubeVideos.push({
              youtube_video_id: item.id.videoId,
              location_name: `${locationName} - ${item.snippet.channelTitle}`,
              title: item.snippet.title,
              channelTitle: item.snippet.channelTitle,
              latitude: newLat,
              longitude: newLng,
              views: Math.floor(Math.random() * 50000) + 1000,
              likes: 0,
              duration: "PT0S",
              isCurrentLocation: false,
              isSearchResult: true,
              thumbnail:
                item.snippet.thumbnails.medium?.url ||
                item.snippet.thumbnails.default?.url,
              publishedAt: item.snippet.publishedAt,
              description: item.snippet.description,
              confirmedLocation: false,
            });
          }
        }

        console.log(
          "Videos encontrados con ubicación:",
          youtubeVideos.length
        );

        return {
          videos: youtubeVideos,
          nextPageToken: searchData.nextPageToken || "",
        };
      } catch (error) {
        console.error("Error buscando videos:", error);
        if (error.message === "QUOTA_EXCEEDED") {
          setYoutubeAvailable(false);
          throw error;
        }
        throw new Error("Error en búsqueda de videos");
      }
    },
    [YOUTUBE_API_KEY, currentRegion]
  );

  // Función para videos populares por región
  const fetchPopularVideosByRegion = useCallback(
    async (region = "MX") => {
      try {
        const lastQuotaError = localStorage.getItem("youtube_quota_exceeded");
        if (lastQuotaError && Date.now() - parseInt(lastQuotaError) < 3600000) {
          throw new Error("QUOTA_EXCEEDED_RECENTLY");
        }

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${region}&maxResults=12&key=${YOUTUBE_API_KEY}`
        );

        if (response.ok) {
          const data = await response.json();
          const popularVideos = data.items.map((item) => ({
            youtube_video_id: item.id,
            location_name: `${regionConfig[region]?.name || "México"} - ${
              item.snippet.channelTitle
            }`,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            latitude:
              (regionConfig[region]?.center[0] || 23.6345) +
              (Math.random() - 0.5) * 4,
            longitude:
              (regionConfig[region]?.center[1] || -102.5528) +
              (Math.random() - 0.5) * 4,
            views:
              parseInt(item.statistics.viewCount) ||
              Math.floor(Math.random() * 50000) + 10000,
            likes: parseInt(item.statistics.likeCount) || 0,
            duration: item.contentDetails?.duration || "PT0S",
            isCurrentLocation: false,
            isSearchResult: false,
            thumbnail:
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            publishedAt: item.snippet.publishedAt,
          }));

          setVideos(popularVideos);
          setActiveFilter("mexico");
          setNextPageToken("");
          setHasMoreVideos(false);
          return popularVideos;
        } else {
          if (response.status === 403) {
            localStorage.setItem(
              "youtube_quota_exceeded",
              Date.now().toString()
            );
            setYoutubeAvailable(false);
            setYoutubeError("Límite de cuota excedido para YouTube API");
            throw new Error("QUOTA_EXCEEDED");
          }
          throw new Error("Error al cargar videos populares");
        }
      } catch (error) {
        console.error("Error:", error);
        setVideos([]);
        setActiveFilter("unavailable");
        return [];
      }
    },
    [YOUTUBE_API_KEY, regionConfig, setVideos, setActiveFilter, setNextPageToken, setHasMoreVideos, setYoutubeAvailable, setYoutubeError]
  );

  // Cargar videos para ubicación
  const loadVideosForLocation = useCallback(
    async (
      latitude,
      longitude,
      locationName,
      searchQuery = "",
      pageToken = "",
      isLoadMore = false
    ) => {
      if (!isLoadMore) {
        setLoadingVideos(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await searchYouTubeVideosByLocation(
          latitude,
          longitude,
          locationName,
          searchQuery,
          pageToken
        );

        if (result.videos.length > 0) {
          if (isLoadMore) {
            setVideos((prev) => [...prev, ...result.videos]);
          } else {
            setVideos(result.videos);
          }
          setNextPageToken(result.nextPageToken);
          setHasMoreVideos(!!result.nextPageToken);
          setActiveFilter("search");
          setSearchLocation({ latitude, longitude, name: locationName });

          console.log("Videos cargados para ubicación:", {
            location: locationName,
            videos: result.videos.length,
            withLocationData: result.videos.filter((v) => v.confirmedLocation)
              .length,
          });
        } else {
          if (!isLoadMore) {
            setVideos([]);
            setNextPageToken("");
            setHasMoreVideos(false);
            setActiveFilter("no-videos");

            console.log(
              "No se encontraron videos subidos en:",
              locationName
            );

            setTimeout(() => {
              alert(
                `No se encontraron videos de "${
                  searchQuery || "contenido local"
                }" que hayan sido subidos en ${locationName}.`
              );
            }, 500);
          }
        }
      } catch (err) {
        console.error("Error buscando videos:", err);
        if (!isLoadMore) {
          if (err.message === "QUOTA_EXCEEDED") {
            setVideos([]);
            setActiveFilter("unavailable");
          } else {
            await fetchPopularVideosByRegion(currentRegion);
          }
        }
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoadingVideos(false);
        }
      }
    },
    [searchYouTubeVideosByLocation, fetchPopularVideosByRegion, currentRegion, setVideos, setNextPageToken, setHasMoreVideos, setActiveFilter, setSearchLocation, setLoadingVideos, setIsLoadingMore]
  );

  // Función para mover mapa a ubicación - CORREGIDA
  const moveMapToLocation = useCallback(
    async (locationName) => {
      // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
      if (isAnimating) {
        console.log("Animación en curso, ignorando nuevo movimiento.");
        return;
      }

      try {
        const locationData = await getLocationCoordinates(locationName);

        if (locationData) {
          setTargetViewport({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            zoom: 10,
          });

          setClickedLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
          setClickedLocationName(locationData.locationName);
          setIsValidLocation(true);

          console.log("Mapa movido a:", locationData.locationName);
        }
      } catch (error) {
        console.error("Error moviendo el mapa a la ubicación:", error);
      }
    },
    [getLocationCoordinates, setTargetViewport, setClickedLocation, setClickedLocationName, setIsValidLocation, isAnimating]
  );

  // Función para verificar restricciones
  const checkRestrictions = useCallback(
    (query, locationData = null) => {
      console.log("Verificando restricciones para:", query, locationData);

      const restrictedPatterns = new RegExp(
        restrictedCities.map((city) => city.toLowerCase()).join("|"),
        "i"
      );

      if (restrictedPatterns.test(query.toLowerCase())) {
        console.log("Query restringido detectado:", query);
        return {
          restricted: true,
          reason: "query",
          message:
            "Videos no disponibles en esta región (restricción de YouTube).",
        };
      }

      if (locationData && locationData.countryCode) {
        const countryCode = locationData.countryCode.toUpperCase();
        if (restrictedCountries.includes(countryCode)) {
          console.log("País restringido detectado:", countryCode);
          return {
            restricted: true,
            reason: "country",
            message:
              "YouTube no está disponible en este país (restricción gubernamental).",
          };
        }
      }

      if (locationData && locationData.locationName) {
        if (restrictedPatterns.test(locationData.locationName.toLowerCase())) {
          console.log(
            "Ubicación restringida detectada:",
            locationData.locationName
          );
          return {
            restricted: true,
            reason: "location",
            message:
              "Videos no disponibles en esta ubicación (restricción de YouTube).",
          };
        }
      }

      console.log("Ubicación permitida");
      return { restricted: false };
    },
    [restrictedCities, restrictedCountries]
  );

  // Función para obtener sugerencias
  const fetchSuggestions = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `types=country,region,place,locality,neighborhood,address&` +
            `limit=5&` +
            `language=es`
        );

        if (response.ok) {
          const data = await response.json();
          const validSuggestions = data.features
            .filter((feature) => isValidLocationType(feature))
            .map((feature) => feature.place_name)
            .slice(0, 5);

          setSuggestions(validSuggestions);
        }
      } catch (error) {
        console.warn("Error obteniendo sugerencias:", error);
        setSuggestions([]);
      }
    },
    [MAPBOX_TOKEN, isValidLocationType, setSuggestions]
  );

  // Función para detectar región del usuario
  const detectUserRegion = useCallback(async () => {
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
                    const countryCode =
                      data.features[0].properties.short_code?.toUpperCase();

                    if (
                      countryCode &&
                      restrictedCountries.includes(countryCode)
                    ) {
                      setYoutubeAvailable(false);
                      setYoutubeError(
                        "YouTube no está disponible en tu país debido a restricciones gubernamentales."
                      );
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
                console.warn("Error detectando región:", error);
              }
              resolve("MX");
            },
            () => resolve("MX"),
            { timeout: 5000 }
          );
        });
      }
    } catch (error) {
      console.warn("Error en detección de región:", error);
    }
    return "MX";
  }, [MAPBOX_TOKEN, restrictedCountries, regionConfig, setYoutubeAvailable, setYoutubeError]);

  // Función para verificar disponibilidad de YouTube
  const checkYouTubeAvailability = useCallback(async () => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}`
      );

      if (response.ok) {
        await response.json();
        setYoutubeAvailable(true);
        setYoutubeError("");
        return true;
      } else {
        setYoutubeAvailable(false);
        setYoutubeError("YouTube no está disponible en tu región");
        return false;
      }
    } catch (error) {
      console.warn("YouTube no disponible en esta región:", error);
      setYoutubeAvailable(false);
      setYoutubeError("No se puede acceder a YouTube en tu país");
      return false;
    }
  }, [YOUTUBE_API_KEY, setYoutubeAvailable, setYoutubeError]);

  // Función para registrar acceso a video
  const registerVideoAccess = useCallback(
    async (video) => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/register-video-access`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            youtube_video_id: video.youtube_video_id,
            titulo: video.title,
            location_name: video.location_name,
            latitude: video.latitude,
            longitude: video.longitude,
            duracion_reproduccion: 0,
          }),
        });
      } catch (error) {
        console.error("Error registrando acceso:", error);
      }
    },
    [API_BASE_URL, user]
  );

  // Función para obtener historial del usuario
  const fetchUserHistory = useCallback(async () => {
    if (!user) return [];

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/user-history/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const history = await response.json();
        setUserHistory(history);
        return history;
      }
      return [];
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      return [];
    }
  }, [API_BASE_URL, user, setUserHistory]);

  // Función para limpiar historial
  const clearUserHistory = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/clear-history/${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setUserHistory([]);
        alert("Historial limpiado correctamente");
      }
    } catch (error) {
      console.error("Error limpiando historial:", error);
      alert("Error limpiando el historial");
    }
  }, [API_BASE_URL, user, setUserHistory]);

  // Búsqueda automática cuando hay término activo y cambia la ubicación
  const autoSearchOnLocationChange = useCallback(async () => {
    if (!activeSearchTerm.trim()) return;

    console.log("Búsqueda automática por cambio de ubicación:", {
      termino: activeSearchTerm,
      ubicacion_clickeada: clickedLocation ? clickedLocationName : "none",
      ubicacion_actual: userLocation ? userLocationName : "none",
    });

    setLoadingVideos(true);

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
        return;
      }

      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(activeSearchTerm, {
        countryCode: locationCheck.countryCode,
        locationName: locationName,
      });

      if (restrictionCheck.restricted) {
        console.warn("Ubicación restringida para búsqueda automática");
        return;
      }

      await loadVideosForLocation(
        latitude,
        longitude,
        locationName,
        activeSearchTerm
      );

      console.log("Búsqueda automática exitosa:", {
        termino: activeSearchTerm,
        ubicacion: locationName,
      });
    } catch (error) {
      console.error("Error en búsqueda automática:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [
    activeSearchTerm,
    clickedLocation,
    isValidLocation,
    clickedLocationName,
    userLocation,
    userLocationName,
    loadVideosForLocation,
    checkRestrictions,
    isValidMapLocation,
    setLoadingVideos
  ]);

  // Buscar videos para ubicación clickeada
  const searchVideosForClickedLocation = useCallback(async () => {
    if (!clickedLocation || !isValidLocation) return;

    setLoadingVideos(true);
    try {
      const searchQuery =
        searchTerm.trim() || clickedLocationName.split(",")[0].trim();

      console.log("Buscando en ubicación clickeada:", {
        termino: searchQuery,
        ubicacion: clickedLocationName,
        coordenadas: clickedLocation,
      });

      await loadVideosForLocation(
        clickedLocation.latitude,
        clickedLocation.longitude,
        clickedLocationName,
        searchQuery
      );

      console.log("Búsqueda exitosa en ubicación clickeada:", {
        query: searchQuery,
        location: clickedLocationName,
      });
    } catch (error) {
      console.error("Error buscando videos:", error);
      alert(
        `Error al buscar videos de "${searchTerm}" en ${clickedLocationName}`
      );
    } finally {
      setLoadingVideos(false);
    }
  }, [
    clickedLocation,
    isValidLocation,
    clickedLocationName,
    searchTerm,
    loadVideosForLocation,
    setLoadingVideos
  ]);

  // Manejador de clic en el mapa - CORREGIDO
  const handleMapClick = useCallback(
    async (event) => {
      const { lngLat } = event;
      const clickedLat = lngLat.lat;
      const clickedLng = lngLat.lng;

      // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
      if (isAnimating) {
        console.log("Animación en curso, ignorando clic en mapa.");
        return;
      }

      const isInLandArea =
        clickedLat > -60 &&
        clickedLat < 85 &&
        clickedLng > -180 &&
        clickedLng < 180;

      if (!isInLandArea) {
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName("Ubicación en océano o área no válida");
        setShowLocationPopup(true);
        return;
      }

      setLoadingVideos(true);

      try {
        const locationCheck = await isValidMapLocation(clickedLat, clickedLng);

        if (
          locationCheck.countryCode &&
          restrictedCountries.includes(locationCheck.countryCode)
        ) {
          setIsValidLocation(false);
          setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
          setClickedLocationName("País restringido - YouTube no disponible");
          setShowLocationPopup(true);
          setLoadingVideos(false);
          return;
        }

        if (locationCheck.isValid && locationCheck.placeName) {
          const restrictionCheck = checkRestrictions(locationCheck.placeName, {
            countryCode: locationCheck.countryCode,
            locationName: locationCheck.placeName,
          });

          if (restrictionCheck.restricted) {
            setIsValidLocation(false);
            setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
            setClickedLocationName(restrictionCheck.message);
            setShowLocationPopup(true);
            setLoadingVideos(false);
            return;
          }

          setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
          setClickedLocationName(locationCheck.placeName);
          setIsValidLocation(true);
          setShowLocationPopup(true);

          // ✅ SIN setTimeout - MOVIMIENTO DIRECTO
          setTargetViewport({
            latitude: clickedLat,
            longitude: clickedLng,
            zoom: 10,
          });

          if (activeSearchTerm.trim()) {
            // ✅ SIN setTimeout - CARGA DIRECTA
            console.log(
              "Búsqueda automática en nueva ubicación clickeada:",
              {
                termino: activeSearchTerm,
                ubicacion: locationCheck.placeName,
              }
            );
            await loadVideosForLocation(
              clickedLat,
              clickedLng,
              locationCheck.placeName,
              activeSearchTerm
            );
          }
        } else {
          setIsValidLocation(false);
          setClickedLocation({ latitude: clickedLat, longitude: clickedLng });

          let message = "Ubicación no disponible para búsqueda";
          if (
            locationCheck.featureType === "water" ||
            locationCheck.featureType === "marine"
          ) {
            message = "Área marina - No se pueden buscar videos aquí";
          } else if (locationCheck.featureType === "restricted") {
            message = "País restringido - YouTube no disponible";
          } else if (!locationCheck.placeName) {
            message = "Ubicación sin nombre específico";
          }

          setClickedLocationName(message);
          setShowLocationPopup(true);
        }
      } catch (error) {
        console.error("Error procesando clic en mapa:", error);
        setIsValidLocation(false);
        setClickedLocation({ latitude: clickedLat, longitude: clickedLng });
        setClickedLocationName("Error al obtener información de ubicación");
        setShowLocationPopup(true);
      } finally {
        setLoadingVideos(false);
      }
    },
    [
      isValidMapLocation,
      restrictedCountries,
      checkRestrictions,
      isAnimating,
      activeSearchTerm,
      loadVideosForLocation,
      setClickedLocation,
      setClickedLocationName,
      setIsValidLocation,
      setShowLocationPopup,
      setTargetViewport,
      setLoadingVideos
    ]
  );

  // Buscar videos por categoría
  const searchVideosByCategory = useCallback(
    async (category, pageToken = "", isLoadMore = false) => {
      // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
      if (isAnimating && !isLoadMore) {
        console.log("Animación en curso, ignorando búsqueda por categoría.");
        return;
      }

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
            alert(
              "Primero activa tu ubicación o haz clic en una ubicación válida en el mapa"
            );
          }
          return;
        }

        const locationCheck = await isValidMapLocation(latitude, longitude);
        const restrictionCheck = checkRestrictions(locationName, {
          countryCode: locationCheck.countryCode,
          locationName: locationName,
        });

        if (restrictionCheck.restricted) {
          if (!isLoadMore) {
            alert(restrictionCheck.message);
          }
          return;
        }

        const randomKeyword =
          category.keywords[
            Math.floor(Math.random() * category.keywords.length)
          ];
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
        console.error("Error buscando videos por categoría:", error);
        if (!isLoadMore) {
          alert("Error al buscar videos para esta categoría");
        }
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoadingVideos(false);
        }
      }
    },
    [
      clickedLocation,
      isValidLocation,
      clickedLocationName,
      userLocation,
      userLocationName,
      isValidMapLocation,
      checkRestrictions,
      loadVideosForLocation,
      setLoadingVideos,
      setSelectedCategory,
      setIsLoadingMore,
      isAnimating
    ]
  );

  // Cargar videos cercanos
  const fetchOtherVideos = useCallback(async () => {
    // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
    if (isAnimating) {
      console.log("Animación en curso, ignorando carga de videos cercanos.");
      return;
    }

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
      alert(
        'Primero activa tu ubicación usando el botón "Mi Ubicación" o haz clic en una ubicación válida en el mapa'
      );
      return;
    }

    setLoadingVideos(true);
    try {
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName,
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
          zoom: 11,
        });
        setShowLocationPopup(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al buscar otros videos");
    } finally {
      setLoadingVideos(false);
    }
  }, [
    clickedLocation,
    isValidLocation,
    clickedLocationName,
    userLocation,
    userLocationName,
    loadVideosForLocation,
    checkRestrictions,
    isValidMapLocation,
    setLoadingVideos,
    setTargetViewport,
    setShowLocationPopup,
    isAnimating
  ]);

  // Cargar videos populares
  const fetchPopularVideos = useCallback(async () => {
    // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
    if (isAnimating) {
      console.log("Animación en curso, ignorando carga de videos populares.");
      return;
    }

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
      alert(
        'Primero activa tu ubicación usando el botón "Mi Ubicación" o haz clic en una ubicación válida en el mapa'
      );
      return;
    }

    setLoadingVideos(true);
    try {
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName,
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
          zoom: 10,
        });
        setShowLocationPopup(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar videos populares");
    } finally {
      setLoadingVideos(false);
    }
  }, [
    clickedLocation,
    isValidLocation,
    clickedLocationName,
    userLocation,
    userLocationName,
    loadVideosForLocation,
    checkRestrictions,
    isValidMapLocation,
    setLoadingVideos,
    setTargetViewport,
    setShowLocationPopup,
    isAnimating
  ]);

  // Búsqueda mejorada
  const fetchVideos = useCallback(
    async (query, pageToken = "", isLoadMore = false) => {
      // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
      if (isAnimating && !isLoadMore) {
        console.log("Animación en curso, ignorando búsqueda.");
        return;
      }

      if (!query.trim() && !isLoadMore) {
        setSearchError("Por favor ingresa un término de búsqueda válido.");
        return;
      }

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoadingVideos(true);
      }

      setSearchError("");

      try {
        let latitude, longitude, locationName;

        if (clickedLocation && isValidLocation) {
          latitude = clickedLocation.latitude;
          longitude = clickedLocation.longitude;
          locationName = clickedLocationName;

          console.log("Búsqueda con ubicación clickeada:", {
            query: query,
            location: locationName,
            coordinates: { latitude, longitude },
          });
        } else if (userLocation) {
          latitude = userLocation.latitude;
          longitude = userLocation.longitude;
          locationName = userLocationName;

          console.log("Búsqueda con ubicación actual:", {
            query: query,
            location: locationName,
            coordinates: { latitude, longitude },
          });
        } else {
          console.log(
            "No hay ubicación activa, buscando ubicación para:",
            query
          );

          try {
            const locationData = await getLocationCoordinates(
              query.split(",")[0]
            );
            latitude = locationData.latitude;
            longitude = locationData.longitude;
            locationName = locationData.locationName;

            if (!isLoadMore) {
              setTargetViewport({
                latitude: latitude,
                longitude: longitude,
                zoom: 10,
              });
            }

            console.log("Nueva ubicación encontrada:", locationName);
          } catch (error) {
            throw new Error(
              "Primero activa tu ubicación o selecciona una en el mapa. Error: " +
                error.message
            );
          }
        }

        const locationCheck = await isValidMapLocation(latitude, longitude);
        const finalRestrictionCheck = checkRestrictions(query, {
          countryCode: locationCheck.countryCode,
          locationName: locationName,
        });

        if (finalRestrictionCheck.restricted) {
          throw new Error(finalRestrictionCheck.message);
        }

        if (!isLoadMore) {
          setActiveSearchTerm(query);
        }

        await loadVideosForLocation(
          latitude,
          longitude,
          locationName,
          query,
          pageToken,
          isLoadMore
        );
      } catch (error) {
        console.error("Error en búsqueda:", error);
        if (!isLoadMore) {
          setSearchError(
            error.message ||
              "Error al realizar la búsqueda. Verifica el término e intenta nuevamente."
          );
        }
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoadingVideos(false);
        }
      }
    },
    [
      getLocationCoordinates,
      clickedLocation,
      isValidLocation,
      clickedLocationName,
      userLocation,
      userLocationName,
      checkRestrictions,
      isValidMapLocation,
      loadVideosForLocation,
      setSearchError,
      setIsLoadingMore,
      setLoadingVideos,
      setActiveSearchTerm,
      setTargetViewport,
      isAnimating
    ]
  );

  // Cargar más videos
  const loadMoreVideos = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) return;

    try {
      if (activeFilter === "search") {
        await fetchVideos(activeSearchTerm || searchTerm, nextPageToken, true);
      } else if (activeFilter === "category" && selectedCategory) {
        await searchVideosByCategory(selectedCategory, nextPageToken, true);
      } else if (activeFilter === "clicked") {
        await loadVideosForLocation(
          clickedLocation.latitude,
          clickedLocation.longitude,
          clickedLocationName,
          activeSearchTerm || searchTerm.trim() || "",
          nextPageToken,
          true
        );
      } else if (
        activeFilter === "other" ||
        activeFilter === "popular" ||
        activeFilter === "current"
      ) {
        const locationName = userLocationName;
        const latitude = userLocation.latitude;
        const longitude = userLocation.longitude;

        await loadVideosForLocation(
          latitude,
          longitude,
          locationName,
          activeSearchTerm || "",
          nextPageToken,
          true
        );
      }
    } catch (error) {
      console.error("Error cargando más videos:", error);
    }
  }, [
    nextPageToken,
    isLoadingMore,
    activeFilter,
    fetchVideos,
    activeSearchTerm,
    searchTerm,
    searchVideosByCategory,
    selectedCategory,
    loadVideosForLocation,
    clickedLocation,
    clickedLocationName,
    userLocation,
    userLocationName,
  ]);

  // Obtener ubicación del usuario - COMPLETAMENTE CORREGIDA
  const getUserLocation = useCallback(async () => {
    // ✅ BLOQUEAR SI YA HAY ANIMACIÓN
    if (isAnimating) {
      console.log("Animación en curso, ignorando obtención de ubicación.");
      return;
    }

    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible con este navegador.");
      return fetchPopularVideosByRegion(currentRegion);
    }

    console.log("Iniciando obtención de ubicación...");

    // Limpiar estados primero
    setClickedLocation(null);
    setClickedLocationName("");
    setIsValidLocation(false);
    setShowLocationPopup(false);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        });
      });

      const { latitude, longitude } = position.coords;
      console.log("Ubicación obtenida:", { latitude, longitude });

      // Establecer la ubicación del usuario
      setUserLocation({ latitude, longitude });

      // Obtener nombre de la ubicación
      const locationName = await getLocationName(latitude, longitude);
      setUserLocationName(locationName);

      // Verificar restricciones
      const locationCheck = await isValidMapLocation(latitude, longitude);
      const restrictionCheck = checkRestrictions(locationName, {
        countryCode: locationCheck.countryCode,
        locationName: locationName,
      });

      if (restrictionCheck.restricted) {
        alert(restrictionCheck.message);
        await fetchPopularVideosByRegion(currentRegion);
        return;
      }

      // ✅ MOVER EL MAPA UNA SOLA VEZ - SIN setTimeout
      console.log("Moviendo mapa a ubicación...");
      setTargetViewport({
        latitude: latitude,
        longitude: longitude,
        zoom: 12,
      });

      // ✅ CARGAR VIDEOS DIRECTAMENTE - SIN setTimeout
      try {
        if (activeSearchTerm.trim()) {
          console.log("Búsqueda automática en ubicación actual:", activeSearchTerm);
          await loadVideosForLocation(
            latitude,
            longitude,
            locationName,
            activeSearchTerm
          );
        } else {
          await loadVideosForLocation(latitude, longitude, locationName);
        }

        // Guardar ubicación en localStorage
        localStorage.setItem(
          "userLocation",
          JSON.stringify({
            latitude,
            longitude,
            name: locationName,
          })
        );
      } catch (error) {
        console.error("Error cargando videos:", error);
      }

    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      
      if (error.code === error.TIMEOUT) {
        alert("Tiempo de espera agotado al obtener la ubicación.");
      } else {
        alert("No se pudo obtener tu ubicación. Asegúrate de permitir el acceso a la ubicación.");
      }
      
      await fetchPopularVideosByRegion(currentRegion);
    }
  }, [
    getLocationName,
    loadVideosForLocation,
    fetchPopularVideosByRegion,
    currentRegion,
    checkRestrictions,
    isValidMapLocation,
    isAnimating,
    activeSearchTerm,
    setClickedLocation,
    setClickedLocationName,
    setIsValidLocation,
    setShowLocationPopup,
    setUserLocation,
    setUserLocationName,
    setTargetViewport
  ]);

  // Efecto de animación - COMPLETAMENTE CORREGIDO
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
        console.log("Animación completada");
      }
    };

    animationRef.current = requestAnimationFrame(animateMap);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        setIsAnimating(false);
      }
    };
  }, [targetViewport]); // ✅ QUITAMOS viewport DE LAS DEPENDENCIAS

  // Efecto para búsqueda automática
  useEffect(() => {
    if (activeSearchTerm.trim() && (clickedLocation || userLocation)) {
      const timer = setTimeout(() => {
        autoSearchOnLocationChange();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    clickedLocation,
    userLocation,
    activeSearchTerm,
    autoSearchOnLocationChange,
  ]);

  // Efecto para manejar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Efecto principal de inicialización
  useEffect(() => {
    const initializeApp = async () => {
      const checkAuthStatus = async () => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            setUser(user);
          } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        }
      };

      const region = await detectUserRegion();
      setCurrentRegion(region);

      const youtubeAvailable = await checkYouTubeAvailability();
      setYoutubeAvailable(youtubeAvailable);

      await checkAuthStatus();

      if (youtubeAvailable) {
        const savedLocation = localStorage.getItem("userLocation");
        if (savedLocation) {
          try {
            const locationData = JSON.parse(savedLocation);
            setUserLocation({
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            });
            setUserLocationName(locationData.name || "Ubicación guardada");
            await loadVideosForLocation(
              locationData.latitude,
              locationData.longitude,
              locationData.name
            );
          } catch (error) {
            console.error("Error:", error);
            await fetchPopularVideosByRegion(region);
          }
        } else {
          await fetchPopularVideosByRegion(region);
        }
      } else {
        setVideos([]);
        setActiveFilter("unavailable");
      }
    };

    initializeApp();
  }, [
    API_BASE_URL,
    MAPBOX_TOKEN,
    YOUTUBE_API_KEY,
    checkYouTubeAvailability,
    detectUserRegion,
    fetchPopularVideosByRegion,
    loadVideosForLocation,
    setUser,
    setCurrentRegion,
    setYoutubeAvailable,
    setUserLocation,
    setUserLocationName,
    setVideos,
    setActiveFilter
  ]);

  // Manejador de clic en sugerencias
  const handleSuggestionClick = useCallback(
    async (suggestion) => {
      setSearchTerm(suggestion);
      setShowSuggestions(false);

      await moveMapToLocation(suggestion);

      console.log(
        "Ubicación seleccionada:",
        suggestion,
        "- Esperando confirmación de ubicación"
      );
    },
    [moveMapToLocation, setSearchTerm, setShowSuggestions]
  );

  // Handlers para el buscador
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setSearchError("");

      if (!value.trim()) {
        setActiveSearchTerm("");
      }

      if (value.trim()) {
        fetchSuggestions(value);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [fetchSuggestions, setSearchTerm, setSearchError, setActiveSearchTerm, setShowSuggestions, setSuggestions]
  );

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (searchTerm.trim()) {
        console.log("Iniciando búsqueda manual:", {
          termino: searchTerm,
          ubicacion_clickeada: clickedLocation ? clickedLocationName : "none",
          ubicacion_actual: userLocation ? userLocationName : "none",
        });

        fetchVideos(searchTerm);
        setShowSuggestions(false);
        if (isMobile) {
          setShowSearchBar(false);
        }
      } else {
        setSearchError("Por favor ingresa un término de búsqueda válido.");
      }
    },
    [
      searchTerm,
      fetchVideos,
      clickedLocation,
      clickedLocationName,
      userLocation,
      userLocationName,
      isMobile,
      setShowSuggestions,
      setShowSearchBar,
      setSearchError
    ]
  );

  const handleSearchFocus = useCallback(() => {
    setShowSuggestions(true);
  }, [setShowSuggestions]);

  // Handlers de UI
  const handleLogin = useCallback((userData) => {
    if (userData && !localStorage.getItem("user")) {
      localStorage.setItem("user", JSON.stringify(userData));
    }

    setUser(userData);
    setShowProfile(true);
    setShowAuthModal(false);
  }, [setUser, setShowProfile, setShowAuthModal]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedLocation");
    setUser(null);
    setShowProfile(false);
    setShowSettings(false);
  }, [setUser, setShowProfile, setShowSettings]);

  const handlePhotoUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    setShowProfile(false);
  }, [setUser, setShowProfile]);

  // Helper functions
  const getSidebarTitle = useCallback(() => {
    if (!youtubeAvailable) {
      return "YouTube No Disponible";
    }

    const titles = {
      popular: "Videos Populares",
      other: "Videos Cercanos",
      current: "Videos en tu Ubicación",
      search: activeSearchTerm
        ? `Videos de "${activeSearchTerm}"`
        : `Videos de "${searchTerm}"`,
      mexico: "Videos Populares de México",
      clicked: `Videos en ${clickedLocationName}`,
      category: selectedCategory
        ? `Videos de ${selectedCategory.name}`
        : "Videos por Categoría",
      unavailable: "Servicio No Disponible",
      "no-videos": "No Hay Videos",
    };
    return titles[activeFilter] || "Videos con Vista Previa";
  }, [
    youtubeAvailable,
    activeFilter,
    activeSearchTerm,
    searchTerm,
    clickedLocationName,
    selectedCategory,
  ]);

  const getSidebarSubtitle = useCallback(() => {
    if (!youtubeAvailable) {
      return youtubeError || "YouTube no está disponible en tu país o región";
    }

    const subtitles = {
      popular: userLocationName
        ? `Videos populares en ${userLocationName}`
        : "Videos populares en tu área",
      other: userLocationName
        ? `Videos cercanos a ${userLocationName}`
        : "Videos en tu región",
      current: userLocationName
        ? `Subidos en tu ubicación: ${userLocationName}`
        : "Subidos en tu ubicación actual",
      search: searchLocation
        ? `Subidos en: ${searchLocation.name}`
        : `Búsqueda: "${activeSearchTerm || searchTerm}"`,
      mexico: "Los videos más populares en México",
      clicked: `Videos subidos en: ${clickedLocationName}`,
      category: selectedCategory
        ? `${selectedCategory.name} en ${
            searchLocation?.name || userLocationName || clickedLocationName
          }`
        : "Explorando por categoría",
      unavailable: "No se pueden cargar videos en tu región",
      "no-videos": "No se encontraron videos subidos en esta ubicación",
    };
    return subtitles[activeFilter] || "Explorando contenido local";
  }, [
    youtubeAvailable,
    youtubeError,
    activeFilter,
    userLocationName,
    searchLocation,
    activeSearchTerm,
    searchTerm,
    clickedLocationName,
    selectedCategory,
  ]);

  const formatDuration = useCallback((duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "");
    const seconds = (match[3] || "").replace("S", "");

    return hours
      ? `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
      : `${minutes}:${seconds.padStart(2, "0")}`;
  }, []);

  // Handler para doble clic en marcador
  const handleMarkerDoubleClick = useCallback((video, user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate) => {
    console.log("Doble clic en marcador:", video);
    handleVideoDoubleClick(video, user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate);
  }, [handleVideoDoubleClick]);

  // Componente de Sugerencias
  const SearchSuggestions = useCallback(() => {
    if (!showSuggestions || !suggestions.length) return null;

    return (
      <div
        ref={suggestionsRef}
        className={`absolute top-full left-0 right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto ${
          isMobile ? "mx-2" : ""
        }`}
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full text-left px-4 py-3 hover:bg-cyan-500/20 border-b border-gray-700 last:border-b-0 transition-all duration-200 text-white hover:text-cyan-300"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-cyan-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm truncate">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }, [showSuggestions, suggestions, handleSuggestionClick, isMobile]);

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Navbar */}
      <Navbar
        isMobile={isMobile}
        youtubeAvailable={youtubeAvailable}
        regionConfig={regionConfig}
        currentRegion={currentRegion}
        categories={categories}
        clickedLocation={clickedLocation}
        isValidLocation={isValidLocation}
        userLocation={userLocation}
        searchVideosByCategory={searchVideosByCategory}
        selectedCategory={selectedCategory}
        showSearchBar={showSearchBar}
        setShowSearchBar={setShowSearchBar}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchFocus={handleSearchFocus}
        searchError={searchError}
        userLocationName={userLocationName}
        user={user}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
        setShowAuthModal={setShowAuthModal}
        setShowSettings={setShowSettings}
        setShowPhotoModal={setShowPhotoModal}
        setShowPasswordModal={setShowPasswordModal}
        handleLogout={handleLogout}
        SearchSuggestions={SearchSuggestions}
        getUserLocation={getUserLocation}
      />

      {/* Modales */}
      <Modals
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
        showPhotoModal={showPhotoModal}
        setShowPhotoModal={setShowPhotoModal}
        showCommentsModal={showCommentsModal}
        setShowCommentsModal={setShowCommentsModal}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        user={user}
        handleLogin={handleLogin}
        handlePhotoUpdate={handlePhotoUpdate}
        userHistory={userHistory}
        clearUserHistory={clearUserHistory}
        fetchUserHistory={fetchUserHistory}
        isMobile={isMobile}
      />

      {/* Contenido Principal */}
      <div
        className={`flex flex-1 ${
          isMobile ? "flex-col pt-16" : "flex-row pt-20"
        }`}
      >
        {/* Mapa */}
        <MapComponent
          viewport={viewport}
          setViewport={setViewport}
          isAnimating={isAnimating}
          MAPBOX_TOKEN={MAPBOX_TOKEN}
          showLocationPopup={showLocationPopup}
          clickedLocation={clickedLocation}
          isValidLocation={isValidLocation}
          clickedLocationName={clickedLocationName}
          setShowLocationPopup={setShowLocationPopup}
          searchVideosForClickedLocation={searchVideosForClickedLocation}
          loadingVideos={loadingVideos}
          searchTerm={searchTerm}
          fetchVideos={fetchVideos}
          userLocation={userLocation}
          searchLocation={searchLocation}
          videos={videos}
          handleMarkerClick={(video) => handleVideoClick(video, user, registerVideoAccess)}
          handleMarkerDoubleClick={(video) => handleMarkerDoubleClick(video, user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate)}
          isMobile={isMobile}
          handleMapClick={handleMapClick}
          getUserLocation={getUserLocation}
          toggleVideosVisibility={toggleVideosVisibility}
          youtubeAvailable={youtubeAvailable}
          regionConfig={regionConfig}
          currentRegion={currentRegion}
          showSidebar={showSidebar}
        />

        {/* Sidebar de videos */}
        <VideoSidebar
          isMobile={isMobile}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          getSidebarTitle={getSidebarTitle}
          getSidebarSubtitle={getSidebarSubtitle}
          categories={categories}
          clickedLocation={clickedLocation}
          isValidLocation={isValidLocation}
          userLocation={userLocation}
          searchVideosByCategory={searchVideosByCategory}
          selectedCategory={selectedCategory}
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
          handleWatchComplete={() => handleWatchComplete(user, selectedVideo, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate)}
          videos={videos}
          handleVideoClick={(video) => handleVideoClick(video, user, registerVideoAccess)}
          handleVideoDoubleClick={(video) => handleVideoDoubleClick(video, user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate)}
          formatDuration={formatDuration}
          hasMoreVideos={hasMoreVideos}
          isLoadingMore={isLoadingMore}
          loadMoreVideos={loadMoreVideos}
          loadingVideos={loadingVideos}
          activeFilter={activeFilter}
          fetchOtherVideos={fetchOtherVideos}
          fetchPopularVideos={fetchPopularVideos}
          clickedLocationName={clickedLocationName}
        />
      </div>
    </div>
  );
};

export default MainApp;