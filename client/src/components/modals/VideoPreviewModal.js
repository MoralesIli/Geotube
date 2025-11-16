// components/modals/VideoPreviewModal.js
import React from 'react';
import YouTube from 'react-youtube';

const VideoPreviewModal = ({
  video,
  onClose,
  onWatchComplete,
  formatDuration
}) => {
  if (!video) return null;

  return (
    <div className="glass-effect bg-gray-800/50 rounded-2xl p-4 mb-6 border-2 border-cyan-500/50">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-cyan-300">
          Vista Previa: {video.channelTitle}
        </h3>
        <p className="text-sm text-gray-300 mt-1 line-clamp-2">{video.title}</p>
      </div>
      <div className="bg-black rounded-lg overflow-hidden mb-3">
        <YouTube
          videoId={video.youtube_video_id}
          opts={{ 
            width: '100%', 
            height: '200',
            playerVars: { autoplay: 0, modestbranding: 1, rel: 0 }
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
        >
          Cerrar
        </button>
        <button 
          onClick={onWatchComplete}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
        >
          Ver Completo
        </button>
      </div>
    </div>
  );
};

export default VideoPreviewModal;