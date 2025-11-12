import { useCallback } from 'react';

export const useYouTubeAPI = (YOUTUBE_API_KEY, regionConfig) => {
  const searchYouTubeVideosByLocation = useCallback(async (latitude, longitude, locationName, query = '') => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query || locationName)}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items || [];
  }, [YOUTUBE_API_KEY]);

  const fetchPopularVideosByRegion = useCallback(async (region = 'MX') => {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=12&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items.map(item => ({
      youtube_video_id: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url,
      location_name: `${regionConfig[region]?.name || 'Región'}`
    }));
  }, [YOUTUBE_API_KEY, regionConfig]);

  return { searchYouTubeVideosByLocation, fetchPopularVideosByRegion };
};
