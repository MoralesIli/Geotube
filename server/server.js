require('dotenv').config(); // ← AGREGAR ESTO AL INICIO

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 3001;

// Verificar variables críticas al inicio
console.log('🔍 Verificando variables de entorno:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Definido' : '❌ No definido');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Definido' : '❌ No definido');
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? '✅ Definido' : '❌ No definido');
console.log('MAPBOX_TOKEN:', process.env.MAPBOX_TOKEN ? '✅ Definido' : '❌ No definido');

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'geotube_db',
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
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Keys - CORREGIDO: usar variables sin REACT_APP_
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Verificar que las variables críticas estén definidas
if (!JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}

if (!GOOGLE_CLIENT_ID) {
  console.error('❌ ERROR: GOOGLE_CLIENT_ID no está definido en las variables de entorno');
  process.exit(1);
}

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
      return res.status(403).json({ error: 'Token invalido' });
    }
    req.user = user;
    next();
  });
};

// Utilidades reutilizables
const executeQuery = (query, params = []) => db.promise().execute(query, params);

const handleServerError = (res, error, context) => {
  console.error(`Error en ${context}:`, error);
  res.status(500).json({ error: 'Error interno del servidor' });
};

// ==================== RUTAS DE SALUD ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    environment: {
      jwt_configured: !!JWT_SECRET,
      google_configured: !!GOOGLE_CLIENT_ID,
      youtube_configured: !!YOUTUBE_API_KEY,
      mapbox_configured: !!MAPBOX_TOKEN
    }
  });
});

// ==================== RUTAS DE AUTENTICACIÓN ====================

const validateAuthFields = (fields) => {
  const { nombre, email, password } = fields;
  if (!nombre || !email || !password) {
    throw new Error('Todos los campos son requeridos');
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    validateAuthFields({ nombre, email, password });

    const [existingUsers] = await executeQuery(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await executeQuery(
      'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    const token = generateToken({ id: result.insertId, email });
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.insertId, nombre, email }
    });

  } catch (error) {
    if (error.message === 'Todos los campos son requeridos') {
      return res.status(400).json({ error: error.message });
    }
    handleServerError(res, error, 'registro');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const [users] = await executeQuery(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Credenciales invalidas' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales invalidas' });
    }

    const token = generateToken({ id: user.id, email: user.email });

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
    handleServerError(res, error, 'login');
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }

    console.log('🔐 Verificando token de Google...');
    
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('✅ Token verificado, usuario:', email);

    const [existingUsers] = await executeQuery(
      'SELECT * FROM usuarios WHERE email = ? OR google_id = ?',
      [email, googleId]
    );

    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      console.log('🔄 Usuario existente encontrado:', user.id);
      
      if (!user.google_id || !user.foto) {
        await executeQuery(
          'UPDATE usuarios SET google_id = ?, foto = ? WHERE id = ?',
          [googleId, picture, user.id]
        );
        user.google_id = googleId;
        user.foto = picture;
        console.log('✅ Usuario actualizado con datos de Google');
      }
    } else {
      console.log('👤 Creando nuevo usuario con Google...');
      const [result] = await executeQuery(
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
      console.log('✅ Nuevo usuario creado:', user.id);
    }

    const jwtToken = generateToken({ 
      id: user.id, 
      email: user.email,
      googleId: googleId 
    });

    console.log('🎉 Autenticación exitosa, generando JWT...');

    res.json({
      message: 'Autenticacion con Google exitosa',
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
    console.error('❌ Error en autenticacion con Google:', error);
    res.status(500).json({ error: 'Error en autenticacion con Google: ' + error.message });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// ==================== RUTA PARA CAMBIAR CONTRASEÑA ====================

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validar campos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva contraseña son requeridas' });
    }

    // Validar longitud de nueva contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener usuario actual
    const [users] = await executeQuery(
      'SELECT id, password FROM usuarios WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verificar si el usuario tiene contraseña (no es usuario de Google sin contraseña)
    if (!user.password) {
      return res.status(400).json({ error: 'Los usuarios registrados con Google no pueden cambiar contraseña' });
    }

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña en la base de datos
    const [result] = await executeQuery(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }

    console.log(`✅ Contraseña actualizada para usuario ${userId}`);

    res.json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor al cambiar la contraseña' });
  }
});

// ==================== RUTAS DE PERFIL ====================

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await executeQuery(
      'SELECT id, nombre, email, foto, google_id, creado_en FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Obtener estadísticas del usuario
    const [stats] = await executeQuery(
      `SELECT COUNT(*) as total_videos, 
              COUNT(DISTINCT video_id) as videos_unicos,
              MAX(fecha) as ultimo_acceso
       FROM accesos 
       WHERE usuario_id = ?`,
      [req.user.id]
    );

    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        foto: user.foto,
        google_id: user.google_id,
        creado_en: user.creado_en
      },
      statistics: stats[0]
    });

  } catch (error) {
    handleServerError(res, error, 'obteniendo perfil');
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { nombre, email, foto } = req.body;
    const userId = req.user.id;

    // Validar que al menos un campo sea proporcionado
    if (!nombre && !email && !foto) {
      return res.status(400).json({ error: 'Al menos un campo debe ser proporcionado para actualizar' });
    }

    // Construir la consulta dinámicamente
    let updateFields = [];
    let updateValues = [];

    if (nombre) {
      updateFields.push('nombre = ?');
      updateValues.push(nombre);
    }

    if (email) {
      // Verificar si el email ya existe para otro usuario
      const [existingEmail] = await executeQuery(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
      }

      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (foto) {
      updateFields.push('foto = ?');
      updateValues.push(foto);
    }

    updateValues.push(userId);

    const query = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const [result] = await executeQuery(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener el usuario actualizado
    const [users] = await executeQuery(
      'SELECT id, nombre, email, foto, creado_en FROM usuarios WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: users[0]
    });

  } catch (error) {
    handleServerError(res, error, 'actualizando perfil');
  }
});

// Ruta específica para actualizar solo la foto de perfil
app.put('/api/auth/profile/photo', authenticateToken, async (req, res) => {
  try {
    const { foto } = req.body;
    const userId = req.user.id;

    if (!foto) {
      return res.status(400).json({ error: 'La foto es requerida' });
    }

    const [result] = await executeQuery(
      'UPDATE usuarios SET foto = ? WHERE id = ?',
      [foto, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener el usuario actualizado
    const [users] = await executeQuery(
      'SELECT id, nombre, email, foto, creado_en FROM usuarios WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Foto de perfil actualizada exitosamente',
      user: users[0]
    });

  } catch (error) {
    handleServerError(res, error, 'actualizando foto de perfil');
  }
});

// ==================== RUTAS DE HISTORIAL ====================

app.post('/api/register-video-access', authenticateToken, async (req, res) => {
  const { youtube_video_id, titulo, location_name, latitude, longitude, duracion_reproduccion = 0 } = req.body;

  try {
    console.log('Registrando acceso a video para usuario:', req.user.id);

    const [videos] = await executeQuery(
      'SELECT id FROM videos WHERE youtube_video_id = ?', 
      [youtube_video_id]
    );

    let videoId;
    
    if (videos.length === 0) {
      console.log('Creando nuevo video en BD');
      const [result] = await executeQuery(
        'INSERT INTO videos (youtube_video_id, location_name, latitude, longitude, titulo) VALUES (?, ?, ?, ?, ?)',
        [youtube_video_id, location_name, latitude, longitude, titulo || 'Video de YouTube']
      );
      videoId = result.insertId;
    } else {
      videoId = videos[0].id;
    }

    const ip_origen = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent') || 'Unknown';
    
    const [accessResult] = await executeQuery(
      'INSERT INTO accesos (usuario_id, video_id, es_valido, ip_origen, user_agent, duracion_reproduccion) VALUES (?, ?, 1, ?, ?, ?)',
      [req.user.id, videoId, ip_origen, user_agent, duracion_reproduccion]
    );

    await executeQuery(
      'UPDATE videos SET vistas_totales = COALESCE(vistas_totales, 0) + 1 WHERE id = ?',
      [videoId]
    );

    res.json({ 
      success: true, 
      message: 'Acceso registrado correctamente',
      accessId: accessResult.insertId,
      videoId: videoId
    });

  } catch (error) {
    console.error('Error registrando acceso:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

app.get('/api/user-history/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [history] = await executeQuery(`
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
    
    res.json(history);

  } catch (error) {
    handleServerError(res, error, 'obteniendo historial');
  }
});

app.delete('/api/clear-history/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [result] = await executeQuery(
      'DELETE FROM accesos WHERE usuario_id = ?',
      [userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Historial limpiado correctamente',
      deletedRows: result.affectedRows 
    });

  } catch (error) {
    handleServerError(res, error, 'limpiando historial');
  }
});

// ==================== RUTAS PRINCIPALES ====================

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
    console.error('Error searching YouTube videos:', error.response?.data || error.message);
    return null;
  }
};

const geocodeLocation = async (query) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: MAPBOX_TOKEN, // CORREGIDO: usar MAPBOX_TOKEN
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
    console.error('Error geocoding location:', error.response?.data || error.message);
    return null;
  }
};

const saveVideosToDatabase = async (videos) => {
  const insertPromises = videos.map(({ videoId, location_name, latitude, longitude }) => {
    return executeQuery(
      "INSERT INTO videos (location_name, latitude, longitude, youtube_video_id) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE location_name = VALUES(location_name)",
      [location_name, latitude, longitude, videoId]
    );
  });

  await Promise.all(insertPromises);
  return videos.map(({ videoId, location_name, latitude, longitude }) => ({
    location_name,
    latitude,
    longitude,
    youtube_video_id: videoId,
  }));
};

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Falta el termino de busqueda.' });
  }

  try {
    const location = await geocodeLocation(q);
    if (!location) {
      return res.status(404).json({ error: 'No se pudo encontrar la ubicacion en Mexico.' });
    }

    const youtubeVideos = await searchYouTubeVideos(location.latitude, location.longitude, q);
    if (!youtubeVideos || youtubeVideos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron videos de YouTube para esta ubicacion.' });
    }

    const videosToSave = youtubeVideos.map(item => ({
      videoId: item.id.videoId,
      location_name: location.location_name,
      latitude: location.latitude,
      longitude: location.longitude,
    }));

    const savedVideos = await saveVideosToDatabase(videosToSave);
    res.json(savedVideos);

  } catch (error) {
    handleServerError(res, error, 'busqueda de videos');
  }
});

app.get('/api/searchByCoords', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Faltan coordenadas (lat, lng).' });
  }

  try {
    const youtubeVideos = await searchYouTubeVideos(lat, lng, 'Mexico');
    if (!youtubeVideos || youtubeVideos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron videos en esta ubicacion.' });
    }

    const videosToSave = youtubeVideos.map(item => ({
      videoId: item.id.videoId,
      location_name: "Ubicacion actual",
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    }));

    const savedVideos = await saveVideosToDatabase(videosToSave);
    res.json(savedVideos);

  } catch (error) {
    handleServerError(res, error, 'busqueda por coordenadas');
  }
});

app.get('/api/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    const [videoRows] = await executeQuery(
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

    const [relatedRows] = await executeQuery(
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
        coordinates: { lat: video.latitude, lng: video.longitude },
        uploadDate: video.creado_en,
        views: video.total_views || 0,
        uniqueViewers: video.unique_viewers || 0
      },
      relatedVideos: relatedRows
    });

  } catch (error) {
    handleServerError(res, error, 'obteniendo video');
  }
});

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

app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`API disponible en http://localhost:${port}/api`);
  console.log(`✅ Ruta Google Auth: POST http://localhost:${port}/api/auth/google`);
  console.log(`✅ Ruta Perfil: GET/PUT http://localhost:${port}/api/auth/profile`);
  console.log(`✅ Ruta Foto Perfil: PUT http://localhost:${port}/api/auth/profile/photo`);
  console.log(`✅ Ruta Cambiar Contraseña: POST http://localhost:${port}/api/auth/change-password`);
  console.log(`🔑 JWT Configurado: ${JWT_SECRET ? '✅' : '❌'}`);
  console.log(`🔑 Google Client ID Configurado: ${GOOGLE_CLIENT_ID ? '✅' : '❌'}`);
});