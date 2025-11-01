import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const useMainApp = () => {
  const navigate = useNavigate();
  
  // Estados principales
  const [viewport, setViewport] = useState({
    latitude: 23.6345,
    longitude: -102.5528,
    zoom: 2,
  });
  const [targetViewport, setTargetViewport] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationName, setUserLocationName] = useState('');
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeFilter, setActiveFilter] = useState('mexico');
  const [nextPageToken, setNextPageToken] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [clickedLocationName, setClickedLocationName] = useState('');
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isValidLocation, setIsValidLocation] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [currentRegion, setCurrentRegion] = useState('MX');
  const [youtubeAvailable, setYoutubeAvailable] = useState(true);
  const [youtubeError, setYoutubeError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Referencias
  const animationRef = useRef();
  const startViewportRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Variables de entorno
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
  const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  return {
    // Estados
    viewport, setViewport,
    targetViewport, setTargetViewport,
    isAnimating, setIsAnimating,
    userLocation, setUserLocation,
    userLocationName, setUserLocationName,
    videos, setVideos,
    selectedVideo, setSelectedVideo,
    searchTerm, setSearchTerm,
    activeSearchTerm, setActiveSearchTerm,
    showProfile, setShowProfile,
    showAuthModal, setShowAuthModal,
    showSettings, setShowSettings,
    showPasswordModal, setShowPasswordModal,
    showPhotoModal, setShowPhotoModal,
    showCommentsModal, setShowCommentsModal,
    showHistoryModal, setShowHistoryModal,
    user, setUser,
    loadingVideos, setLoadingVideos,
    activeFilter, setActiveFilter,
    nextPageToken, setNextPageToken,
    searchLocation, setSearchLocation,
    hasMoreVideos, setHasMoreVideos,
    isLoadingMore, setIsLoadingMore,
    clickedLocation, setClickedLocation,
    clickedLocationName, setClickedLocationName,
    showLocationPopup, setShowLocationPopup,
    isValidLocation, setIsValidLocation,
    userHistory, setUserHistory,
    currentRegion, setCurrentRegion,
    youtubeAvailable, setYoutubeAvailable,
    youtubeError, setYoutubeError,
    suggestions, setSuggestions,
    showSuggestions, setShowSuggestions,
    searchError, setSearchError,
    selectedCategory, setSelectedCategory,
    
    // Referencias
    animationRef,
    startViewportRef,
    searchInputRef,
    suggestionsRef,
    
    // Constantes
    MAPBOX_TOKEN,
    YOUTUBE_API_KEY,
    API_BASE_URL,
    navigate
  };
};