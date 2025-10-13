const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = 3001;

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'geotube_db',
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL as id ' + db.threadId);
});

// Middleware para habilitar CORS y JSON
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Keys
const YOUTUBE_API_KEY = 'AIzaSyAMXqOfXkEHPmpu0O5a83k7c_snASAEJ50';
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoieWV1ZGllbCIsImEiOiJjbWM5eG84bDIwbWFoMmtwd3NtMjJ1bzM2In0.j3hc_w65OfZKXbC2YUB64Q';

const JWT_SECRET = 'tu_clave_secreta_super_segura_geotube_2024';

// Configura el cliente de Google OAuth
const GOOGLE_CLIENT_ID = '369281279205-i1b62ojhbhq6jel1oh8li22o1aklklqj.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// ==================== RUTAS DE SALUD ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro de usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const [existingUsers] = await db.promise().execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [result] = await db.promise().execute(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email: email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: result.insertId,
        nombre,
        email
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login de usuario
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const [users] = await db.promise().execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        foto: user.foto || null
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para autenticación con Google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    const [existingUsers] = await db.promise().execute(
      'SELECT * FROM usuarios WHERE email = ? OR google_id = ?',
      [email, googleId]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      
      if (!user.google_id || !user.foto) {
        await db.promise().execute(
          'UPDATE usuarios SET google_id = ?, foto = ? WHERE id = ?',
          [googleId, picture, user.id]
        );
        user.google_id = googleId;
        user.foto = picture;
      }
    } else {
      const [result] = await db.promise().execute(
        'INSERT INTO usuarios (nombre, email, google_id, foto, password) VALUES (?, ?, ?, ?, ?)',
        [name, email, googleId, picture, '']
      );

      user = {
        id: result.insertId,
        nombre: name,
        email: email,
        google_id: googleId,
        foto: picture
      };
    }

    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        googleId: googleId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Autenticación con Google exitosa',
      token: jwtToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        foto: user.foto,
        google_id: user.google_id
      }
    });

  } catch (error) {
    console.error('❌ Error en autenticación con Google:', error);
    res.status(500).json({ error: 'Error en autenticación con Google: ' + error.message });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Obtener perfil de usuario
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.promise().execute(
      'SELECT id, nombre, email, foto, creado_en FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [stats] = await db.promise().execute(
      `SELECT COUNT(*) as total_videos, 
              COUNT(DISTINCT video_id) as videos_unicos,
              MAX(fecha) as ultimo_acceso
       FROM accesos 
       WHERE usuario_id = ?`,
      [req.user.id]
    );

    res.json({
      user: users[0],
      statistics: stats[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS DE HISTORIAL ====================

// Registrar acceso a video - VERSIÓN CORREGIDA
app.post('/api/register-video-access', authenticateToken, async (req, res) => {
  const { youtube_video_id, titulo, location_name, latitude, longitude, duracion_reproduccion = 0 } = req.body;

  try {
    console.log('🎬 Registrando acceso a video para usuario:', req.user.id);
    console.log('📹 Video ID:', youtube_video_id);
    console.log('📍 Ubicación:', location_name);

    // Buscar si el video ya existe
    let [videos] = await db.promise().execute(
      'SELECT id FROM videos WHERE youtube_video_id = ?', 
      [youtube_video_id]
    );

    let videoId;
    
    if (videos.length === 0) {
      // Insertar nuevo video
      console.log('➕ Creando nuevo video en BD');
      const [result] = await db.promise().execute(
        'INSERT INTO videos (youtube_video_id, location_name, latitude, longitude, titulo) VALUES (?, ?, ?, ?, ?)',
        [youtube_video_id, location_name, latitude, longitude, titulo || 'Video de YouTube']
      );
      videoId = result.insertId;
      console.log('✅ Video creado con ID:', videoId);
    } else {
      videoId = videos[0].id;
      console.log('📹 Video existente, ID:', videoId);
    }

    // Registrar el acceso directamente (sin usar el procedimiento almacenado)
    const ip_origen = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent') || 'Unknown';
    
    const [accessResult] = await db.promise().execute(
      'INSERT INTO accesos (usuario_id, video_id, es_valido, ip_origen, user_agent, duracion_reproduccion) VALUES (?, ?, 1, ?, ?, ?)',
      [req.user.id, videoId, ip_origen, user_agent, duracion_reproduccion]
    );

    console.log('✅ Acceso registrado exitosamente. ID de acceso:', accessResult.insertId);

    // Actualizar contador de vistas del video
    await db.promise().execute(
      'UPDATE videos SET vistas_totales = COALESCE(vistas_totales, 0) + 1 WHERE id = ?',
      [videoId]
    );

    console.log('✅ Contador de vistas actualizado');

    res.json({ 
      success: true, 
      message: 'Acceso registrado correctamente',
      accessId: accessResult.insertId,
      videoId: videoId
    });

  } catch (error) {
    console.error('❌ Error registrando acceso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Obtener historial de videos vistos por usuario
app.get('/api/user-history/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    console.log('📚 Solicitando historial para usuario:', userId);

    // Verificar que el usuario solo pueda ver su propio historial
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [history] = await db.promise().execute(`
      SELECT 
        v.youtube_video_id,
        v.titulo,
        v.location_name,
        v.latitude,
        v.longitude,
        a.fecha,
        a.duracion_reproduccion,
        v.vistas_totales
      FROM accesos a
      JOIN videos v ON a.video_id = v.id
      WHERE a.usuario_id = ?
      ORDER BY a.fecha DESC
      LIMIT 50
    `, [userId]);

    console.log('✅ Historial obtenido. Registros encontrados:', history.length);
    
    res.json(history);

  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Limpiar historial de usuario
app.delete('/api/clear-history/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    console.log('🗑️ Limpiando historial para usuario:', userId);

    const [result] = await db.promise().execute(
      'DELETE FROM accesos WHERE usuario_id = ?',
      [userId]
    );

    console.log('✅ Historial limpiado. Registros eliminados:', result.affectedRows);
    
    res.json({ 
      success: true, 
      message: 'Historial limpiado correctamente',
      deletedRows: result.affectedRows 
    });

  } catch (error) {
    console.error('❌ Error limpiando historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTAS PRINCIPALES ====================

// Función para buscar videos en YouTube por ubicación
const searchYouTubeVideos = async (lat, lng, query) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        location: `${lat},${lng}`,
        locationRadius: '50km',
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
        country: 'mx',
        language: 'es',
      },
    });
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

// Endpoint para buscar y guardar videos por nombre de ubicación
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Falta el término de búsqueda.' });
  }

  const location = await geocodeLocation(q);
  if (!location) {
    return res.status(404).json({ error: 'No se pudo encontrar la ubicación en México.' });
  }

  const youtubeVideos = await searchYouTubeVideos(location.latitude, location.longitude, q);
  if (!youtubeVideos || youtubeVideos.length === 0) {
    return res.status(404).json({ error: 'No se encontraron videos de YouTube para esta ubicación.' });
  }

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

// Endpoint: buscar videos cerca de coordenadas
app.get('/api/searchByCoords', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Faltan coordenadas (lat, lng).' });
  }

  const youtubeVideos = await searchYouTubeVideos(lat, lng, 'México');
  if (!youtubeVideos || youtubeVideos.length === 0) {
    return res.status(404).json({ error: 'No se encontraron videos en esta ubicación.' });
  }

  const videoIds = youtubeVideos.map(item => item.id.videoId);
  const insertPromises = videoIds.map(videoId => {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO videos (location_name, latitude, longitude, youtube_video_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)";
      db.query(sql, [`Ubicación actual`, lat, lng, videoId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });

  try {
    await Promise.all(insertPromises);
    const savedVideos = videoIds.map(videoId => ({
      location_name: "Ubicación actual",
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      youtube_video_id: videoId,
    }));
    res.json(savedVideos);
  } catch (error) {
    res.status(500).json({ error: 'Error guardando videos en la base de datos.' });
  }
});

// Endpoint para obtener información detallada del video
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    // Obtener información del video
    const [videoRows] = await db.promise().execute(
      `SELECT v.*, 
              COUNT(a.id) as total_views,
              COUNT(DISTINCT a.ip_origen) as unique_viewers
       FROM videos v 
       LEFT JOIN accesos a ON v.id = a.video_id 
       WHERE v.youtube_video_id = ? 
       GROUP BY v.id`,
      [videoId]
    );

    if (videoRows.length === 0) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    const video = videoRows[0];

    // Obtener videos relacionados (misma ubicación)
    const [relatedRows] = await db.promise().execute(
      `SELECT v.*, 
              COUNT(a.id) as view_count
       FROM videos v 
       LEFT JOIN accesos a ON v.id = a.video_id 
       WHERE v.location_name = ? AND v.youtube_video_id != ?
       GROUP BY v.id 
       ORDER BY view_count DESC 
       LIMIT 10`,
      [video.location_name, videoId]
    );

    res.json({
      video: {
        id: video.youtube_video_id,
        title: video.location_name,
        location: video.location_name,
        coordinates: {
          lat: video.latitude,
          lng: video.longitude
        },
        uploadDate: video.creado_en,
        views: video.total_views || 0,
        uniqueViewers: video.unique_viewers || 0
      },
      relatedVideos: relatedRows
    });

  } catch (error) {
    console.error('Error obteniendo video:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'API de GeoTube funcionando correctamente' });
});

// ==================== MANEJO DE RUTAS NO ENCONTRADAS ====================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    message: 'La ruta solicitada no existe en el servidor'
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`   Servidor corriendo en http://localhost:${port}`);
  console.log(`   API disponible en http://localhost:${port}/api`);
  console.log(`   Rutas de autenticación en http://localhost:${port}/api/auth`);
  console.log(`   Salud del servidor: http://localhost:${port}/api/health`);
  console.log(`   Rutas de historial:`);
  console.log(`   POST /api/register-video-access (PROTEGIDA)`);
  console.log(`   GET  /api/user-history/:userId (PROTEGIDA)`);
  console.log(`   DELETE /api/clear-history/:userId (PROTEGIDA)`);
});