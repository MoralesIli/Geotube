import { useState, useCallback } from 'react';

export const useVideoOperations = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [nextPageToken, setNextPageToken] = useState("");
  const [hasMoreVideos, setHasMoreVideos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleVideoClick = useCallback((video, user, registerVideoAccess) => {
    setSelectedVideo(video);
    if (user) {
      registerVideoAccess(video);
    }
  }, []);

  const handleVideoDoubleClick = useCallback((video, user, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate) => {
    if (user) {
      registerVideoAccess(video);
    }

    const locationState = {};

    if (clickedLocation && isValidLocation) {
      locationState.selectedLocation = {
        latitude: clickedLocation.latitude,
        longitude: clickedLocation.longitude,
        name: clickedLocationName,
      };
    } else if (searchLocation) {
      locationState.selectedLocation = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        name: searchLocation.name,
      };
    }

    if (locationState.selectedLocation) {
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(locationState.selectedLocation)
      );
    }

    navigate(`/video/${video.youtube_video_id}`, {
      state: locationState,
    });
  }, []);

  const handleWatchComplete = useCallback((user, selectedVideo, registerVideoAccess, clickedLocation, isValidLocation, clickedLocationName, searchLocation, navigate) => {
    if (user && selectedVideo) {
      registerVideoAccess(selectedVideo);
    }

    const locationState = {};

    if (clickedLocation && isValidLocation) {
      locationState.selectedLocation = {
        latitude: clickedLocation.latitude,
        longitude: clickedLocation.longitude,
        name: clickedLocationName,
      };
    } else if (searchLocation) {
      locationState.selectedLocation = {
        latitude: searchLocation.latitude,
        longitude: searchLocation.longitude,
        name: searchLocation.name,
      };
    }

    if (locationState.selectedLocation) {
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(locationState.selectedLocation)
      );
    }

    selectedVideo?.youtube_video_id &&
      navigate(`/video/${selectedVideo.youtube_video_id}`, {
        state: locationState,
      });
  }, []);

  return {
    // Estados de video
    videos,
    setVideos,
    selectedVideo,
    setSelectedVideo,
    loadingVideos,
    setLoadingVideos,
    nextPageToken,
    setNextPageToken,
    hasMoreVideos,
    setHasMoreVideos,
    isLoadingMore,
    setIsLoadingMore,
    
    // Handlers de video
    handleVideoClick,
    handleVideoDoubleClick,
    handleWatchComplete,
  };
};