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
app.use(express.json({ limit: '10mb' })); // Aumentar límite para imágenes base64

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

    // Verificar si el usuario ya existe
    const [existingUsers] = await db.promise().execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    const [result] = await db.promise().execute(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    // Generar token
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

    // Buscar usuario
    const [users] = await db.promise().execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
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

    console.log('🔑 Verificando token de Google...');

    // Verificar el token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('✅ Token de Google verificado para:', email);

    // Verificar si el usuario ya existe en la base de datos
    const [existingUsers] = await db.promise().execute(
      'SELECT * FROM usuarios WHERE email = ? OR google_id = ?',
      [email, googleId]
    );

    let user;

    if (existingUsers.length > 0) {
      // Usuario existe, actualizar información de Google si es necesario
      user = existingUsers[0];
      console.log('🔄 Usuario existente encontrado:', user.email);
      
      if (!user.google_id || !user.foto) {
        await db.promise().execute(
          'UPDATE usuarios SET google_id = ?, foto = ? WHERE id = ?',
          [googleId, picture, user.id]
        );
        user.google_id = googleId;
        user.foto = picture;
      }
    } else {
      // Crear nuevo usuario
      console.log('👤 Creando nuevo usuario para:', email);
      const [result] = await db.promise().execute(
        'INSERT INTO usuarios (nombre, email, google_id, foto, password) VALUES (?, ?, ?, ?, ?)',
        [name, email, googleId, picture, ''] // Password vacío para usuarios de Google
      );

      user = {
        id: result.insertId,
        nombre: name,
        email: email,
        google_id: googleId,
        foto: picture
      };
    }

    // Generar token JWT
    const jwtToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        googleId: googleId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(' Autenticación con Google exitosa para:', user.email);

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
    console.error(' Error en autenticación con Google:', error);
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

    // Obtener estadísticas del usuario
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

// Ruta para actualizar perfil
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { nombre, email } = req.body;
    
    await db.promise().execute(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, req.user.id]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para cambiar contraseña
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verificar contraseña actual
    const [users] = await db.promise().execute(
      'SELECT password FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    const validPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.promise().execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para actualizar foto de perfil
app.put('/api/auth/profile-photo', authenticateToken, async (req, res) => {
  try {
    const { foto } = req.body;
    
    console.log('📸 Actualizando foto de perfil para usuario:', req.user.id);

    await db.promise().execute(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, req.user.id]
    );

    // Obtener el usuario actualizado
    const [users] = await db.promise().execute(
      'SELECT id, nombre, email, foto, google_id FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    console.log('✅ Foto de perfil actualizada correctamente');

    res.json({ 
      message: 'Foto de perfil actualizada correctamente',
      user: users[0]
    });

  } catch (error) {
    console.error(' Error actualizando foto de perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para obtener usuario por Google ID
app.get('/api/auth/google/:googleId', async (req, res) => {
  try {
    const { googleId } = req.params;

    const [users] = await db.promise().execute(
      'SELECT id, nombre, email, foto FROM usuarios WHERE google_id = ?',
      [googleId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error obteniendo usuario de Google:', error);
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

    // Registrar acceso (sin información de usuario por ahora)
    const ip_origen = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    
    try {
      await db.promise().execute(
        'CALL registrar_acceso(?, ?, NULL, NULL, ?, ?, ?)',
        [null, videoId, 1, ip_origen, user_agent]
      );
    } catch (error) {
      console.error('Error registrando acceso:', error);
    }

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

    // Obtener estadísticas de accesos
    const [statsRows] = await db.promise().execute(
      `SELECT 
         COUNT(*) as total_plays,
         SUM(es_valido) as valid_plays,
         DATE(fecha) as play_date
       FROM accesos 
       WHERE video_id = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(fecha)
       ORDER BY play_date DESC`,
      [video.id]
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
      relatedVideos: relatedRows,
      statistics: statsRows
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

// Manejo de rutas no encontradas - DEBE IR AL FINAL, DESPUÉS DE TODAS LAS RUTAS
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
  console.log(`   Rutas disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/google`);
  console.log(`   PUT  /api/auth/profile-photo`);
  console.log(`   GET  /api/search?q=ubicacion`);
  console.log(`   GET  /api/video/:videoId`);
});