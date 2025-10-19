import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import VideoPlayer from './VideoPlayer';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;