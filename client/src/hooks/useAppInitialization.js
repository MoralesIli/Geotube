import { useState, useEffect, useCallback, useMemo } from 'react';

export const useAppInitialization = () => {
  // Estados principales
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 2,
  });
  const [targetViewport, setTargetViewport] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("mexico");
  const [searchLocation, setSearchLocation] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [currentRegion, setCurrentRegion] = useState("MX");
  const [youtubeAvailable, setYoutubeAvailable] = useState(true);
  const [youtubeError, setYoutubeError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ESTADOS PARA CONTROLAR VISTA MÓVIL
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  // Efecto para detectar tamaño de pantalla y orientación
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      if (typeof window === "undefined") return;
      
      const width = window.innerWidth || 1024;
      const isMobileDetected = width < 1024;
      const isLandscape = width > window.innerHeight;

      setIsMobile(isMobileDetected);
      setOrientation(isLandscape ? 'landscape' : 'portrait');

      // Actualizar clases del body para CSS
      document.body.classList.toggle('orientation-landscape', isLandscape);
      document.body.classList.toggle('orientation-portrait', !isLandscape);

      if (width >= 1024) {
        setShowSidebar(true);
        setShowSearchBar(false);
      } else {
        setShowSidebar(false);
      }
    };

    if (typeof window !== "undefined") {
      checkMobileAndOrientation();
      window.addEventListener("resize", checkMobileAndOrientation);
      window.addEventListener("orientationchange", checkMobileAndOrientation);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkMobileAndOrientation);
        window.removeEventListener("orientationchange", checkMobileAndOrientation);
      }
    };
  }, []);

  // Función para alternar la visibilidad de los videos en móvil
  const toggleVideosVisibility = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  return {
    // Estados
    viewport,
    setViewport,
    targetViewport,
    setTargetViewport,
    isAnimating,
    setIsAnimating,
    userLocation,
    setUserLocation,
    userLocationName,
    setUserLocationName,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    setActiveSearchTerm,
    showProfile,
    setShowProfile,
    showAuthModal,
    setShowAuthModal,
    showSettings,
    setShowSettings,
    showPasswordModal,
    setShowPasswordModal,
    showPhotoModal,
    setShowPhotoModal,
    showCommentsModal,
    setShowCommentsModal,
    user,
    setUser,
    activeFilter,
    setActiveFilter,
    searchLocation,
    setSearchLocation,
    clickedLocation,
    setClickedLocation,
    clickedLocationName,
    setClickedLocationName,
    showLocationPopup,
    setShowLocationPopup,
    isValidLocation,
    setIsValidLocation,
    showHistoryModal,
    setShowHistoryModal,
    userHistory,
    setUserHistory,
    currentRegion,
    setCurrentRegion,
    youtubeAvailable,
    setYoutubeAvailable,
    youtubeError,
    setYoutubeError,
    suggestions,
    setSuggestions,
    showSuggestions,
    setShowSuggestions,
    searchError,
    setSearchError,
    selectedCategory,
    setSelectedCategory,
    isMobile,
    setIsMobile,
    showSidebar,
    setShowSidebar,
    showSearchBar,
    setShowSearchBar,
    orientation,
    setOrientation,
    
    // Funciones
    toggleVideosVisibility,
  };
};