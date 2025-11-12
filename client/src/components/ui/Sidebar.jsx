import React from 'react';
import { getSidebarTitle } from '../../utils/helpers';

const Sidebar = ({ activeFilter, context, videos = [], onVideoClick }) => {
  const title = getSidebarTitle(activeFilter, context);

  return (
    <aside className="bg-gray-900/70 backdrop-blur-md border-r border-cyan-500/20 w-full lg:w-96 overflow-y-auto p-4">
      <h2 className="text-xl font-semibold text-cyan-300 mb-2">{title}</h2>

      {videos.length === 0 ? (
        <p className="text-gray-400 text-sm mt-4">No se encontraron videos.</p>
      ) : (
        <div className="space-y-3">
          {videos.map((v, i) => (
            <div
              key={i}
              onClick={() => onVideoClick(v)}
              className="bg-gray-800/40 hover:bg-cyan-500/10 border border-gray-700 rounded-xl p-3 cursor-pointer transition-all"
            >
              <img src={v.thumbnail} alt={v.title} className="w-full rounded-lg mb-2" />
              <h3 className="text-white font-medium text-sm truncate">{v.title}</h3>
              <p className="text-cyan-400 text-xs">{v.channelTitle}</p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
