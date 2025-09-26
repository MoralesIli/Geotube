const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Reemplaza con tu usuario
  password: '12345', // Reemplaza con tu contraseña
  database: 'geotube_db',
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
});

// Middleware para habilitar CORS y JSON
app.use(cors());
app.use(express.json());

// API Keys - Reemplaza con tus claves reales
const YOUTUBE_API_KEY = 'AIzaSyAMXqOfXkEHPmpu0O5a83k7c_snASAEJ50';
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

// Función para buscar videos en YouTube por ubicación
const searchYouTubeVideos = async (lat, lng, query) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        location: `${lat},${lng}`,
        locationRadius: '50km', // Radio de búsqueda alrededor de la ubicación
        key: YOUTUBE_API_KEY,
      },
    });
    return response.data.items;
  } catch (error) {
    console.error('Error searching YouTube videos:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Función para obtener coordenadas de una búsqueda con Mapbox
const geocodeLocation = async (query) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        country: 'mx', // Limita la búsqueda a México
        language: 'es',
      },
    });
    // Validar si la ubicación está dentro de México (Mapbox ya lo hace con 'country: mx')
    if (response.data.features.length > 0) {
      const feature = response.data.features[0];
      const [longitude, latitude] = feature.center;
      return {
        latitude,
        longitude,
        location_name: feature.place_name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Endpoint de la API para buscar y guardar videos
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Falta el término de búsqueda.' });
  }

  // 1. Geolocalizar la ubicación
  const location = await geocodeLocation(q);
  if (!location) {
    return res.status(404).json({ error: 'No se pudo encontrar la ubicación en México.' });
  }

  // 2. Buscar videos de YouTube en la ubicación
  const youtubeVideos = await searchYouTubeVideos(location.latitude, location.longitude, q);
  if (!youtubeVideos || youtubeVideos.length === 0) {
    return res.status(404).json({ error: 'No se encontraron videos de YouTube para esta ubicación.' });
  }

  // 3. Guardar videos en la base de datos y devolverlos
  const videoIds = youtubeVideos.map(item => item.id.videoId);
  const insertPromises = videoIds.map(videoId => {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO videos (location_name, latitude, longitude, youtube_video_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)";
      db.query(sql, [location.location_name, location.latitude, location.longitude, videoId], (err, result) => {
        if (err) {
          console.error('Error inserting video:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  });

  try {
    await Promise.all(insertPromises);
    const savedVideos = videoIds.map(videoId => ({
      location_name: location.location_name,
      latitude: location.latitude,
      longitude: location.longitude,
      youtube_video_id: videoId,
    }));
    res.json(savedVideos);
  } catch (error) {
    res.status(500).json({ error: 'Error saving videos to database.' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
