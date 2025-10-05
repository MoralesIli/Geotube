import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorMail, setErrorMail] = useState('');
  const [errorRepeat, setErrorRepeat] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRules = {
    length: (pwd) => pwd.length >= 8,
    uppercase: (pwd) => /[A-Z]/.test(pwd),
    number: (pwd) => /\d/.test(pwd),
    special: (pwd) => /[^A-Za-z0-9]/.test(pwd),
  };

  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "password") {
      setPasswordValidations({
        length: passwordRules.length(value),
        uppercase: passwordRules.uppercase(value),
        number: passwordRules.number(value),
        special: passwordRules.special(value),
      });
    }

    if (name === "confirmPassword") {
      if (value !== formData.password) {
        setErrorRepeat("Las contraseñas no coinciden");
      } else {
        setErrorRepeat("");
      }
    }

    if (name === 'email' && !isLogin) {
      if (!validarEmail(value)) {
        setErrorMail('Email no válido');
      } else {
        setErrorMail('');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLogin(true);

      // limpiar
      setFormData({ nombre: '', email: '', password: '', confirmPassword: '' });
      setError('');
      setErrorMail('');
      setErrorRepeat('');
      setPasswordValidations({ length: false, uppercase: false, number: false, special: false });
      setShowPassword(false);
      setShowConfirmPassword(false);

      if (!googleLoaded) {
        loadGoogleScript();
      }
    }
  }, [isOpen, googleLoaded]);

  const loadGoogleScript = () => {
    if (window.google) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log(' Google Auth script cargado correctamente');
      setGoogleLoaded(true);
    };
    script.onerror = () => {
      console.error(' Error cargando Google Auth script');
      setError('Error al cargar Google Auth');
      setGoogleLoaded(false);
    };
    document.body.appendChild(script);
  };

  if (!isOpen) return null;

  const handleGoogleAuth = () => {
    if (!window.google || !googleLoaded) {
      setError('Google Auth no está disponible. Intenta recargar la página.');
      return;
    }

    try {
      console.log(' Inicializando Google Auth...');
      
      window.google.accounts.id.initialize({
        client_id: '369281279205-i1b62ojhbhq6jel1oh8li22o1aklklqj.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        context: 'signin',
        ux_mode: 'popup',
        auto_prompt: false
      });

      // Lanzar el popup de Google directamente
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log(' Mostrando botón manual de Google');
          window.google.accounts.id.renderButton(
            document.getElementById('googleButton'),
            { 
              theme: 'outline', 
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            }
          );
        }
      });

    } catch (error) {
      console.error(' Error initializing Google Auth:', error);
      setError('Error al inicializar Google Auth');
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      setError('');

      console.log(' Google response received:', response);

      const backendResponse = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: response.credential }),
      });

      // Verificar si la respuesta es JSON
      const contentType = backendResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await backendResponse.text();
        console.error(' El servidor devolvió HTML:', textResponse.substring(0, 200));
        throw new Error('Error del servidor: la ruta /api/auth/google no existe');
      }

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        throw new Error(data.error || 'Error del servidor');
      }

      console.log(' Login exitoso con Google:', data.user);
      
      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Llamar onLogin con los datos del usuario
      onLogin(data.user);
      onClose();

    } catch (err) {
      console.error(' Google auth error:', err);
      
      if (err.message.includes('Failed to fetch')) {
        setError('No se pudo conectar al servidor. Verifica que esté corriendo en localhost:3001');
      } else if (err.message.includes('HTML')) {
        setError('Error del servidor: la ruta /api/auth/google no existe o hay un error');
      } else {
        setError(err.message || 'Error en autenticación con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar email
    if (!validarEmail(formData.email)) {
      setError('Email no válido');
      setLoading(false);
      return;
    }

    if (!isLogin) {
      const { password, confirmPassword } = formData;

      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      const isValidPassword =
        passwordRules.length(password) &&
        passwordRules.uppercase(password) &&
        passwordRules.number(password) &&
        passwordRules.special(password);

      if (!isValidPassword) {
        setError('La contraseña no cumple con los requisitos de seguridad');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { nombre: formData.nombre, email: formData.email, password: formData.password };

      console.log(' Enviando datos a:', endpoint, payload);

      const response = await fetch(`http://localhost:3001/api/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(' El servidor devolvió HTML:', textResponse.substring(0, 200));
        throw new Error('Error del servidor: verifica que las rutas de auth existan');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      console.log(' Login/Register exitoso:', data.user);
      
      // Guardar datos en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Llamar onLogin con los datos del usuario
      onLogin(data.user);
      onClose();

      // Limpiar formulario
      setFormData({ nombre: '', email: '', password: '', confirmPassword: '' });
      setError('');
      setPasswordValidations({ length: false, uppercase: false, number: false, special: false });
      setShowPassword(false);
      setShowConfirmPassword(false);

    } catch (err) {
      console.error(' Error en auth:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      nombre: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-content max-w-md bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Botón de Google */}
        <div className="mb-6">
          <div id="googleButton" className="flex justify-center">
            <button
              onClick={handleGoogleAuth}
              disabled={loading || !googleLoaded}
              className="w-full bg-white text-gray-800 hover:bg-gray-100 font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Cargando...' : 'Continuar con Google'}
            </button>
          </div>
          {!googleLoaded && (
            <p className="text-xs text-yellow-500 mt-2 text-center">
              Cargando Google Auth...
            </p>
          )}
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">o continuar con email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Nombre completo</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Tu nombre completo"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="tu@email.com"
              disabled={loading}
            />
            {errorMail && <p className="text-red-500 text-sm mt-1">{errorMail}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-gray-300">Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-gray-400 hover:text-white focus:outline-none transition-colors"
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>

            {/* Indicadores de validación */
              !isLogin && (
                <ul className="mt-2 text-sm space-y-1">
                  <li className={passwordValidations.length ? "text-green-400" : "text-red-400"}>
                    {passwordValidations.length ? "✔" : "✖"} Al menos 8 caracteres
                  </li>
                  <li className={passwordValidations.uppercase ? "text-green-400" : "text-red-400"}>
                    {passwordValidations.uppercase ? "✔" : "✖"} Una letra mayúscula
                  </li>
                  <li className={passwordValidations.number ? "text-green-400" : "text-red-400"}>
                    {passwordValidations.number ? "✔" : "✖"} Un número
                  </li>
                  <li className={passwordValidations.special ? "text-green-400" : "text-red-400"}>
                    {passwordValidations.special ? "✔" : "✖"} Un carácter especial
                  </li>
                </ul>
              )
            }
          </div>

          {!isLogin && (
            <div className="relative">
              <label className="block text-sm font-medium mb-2 text-gray-300">Confirmar contraseña</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-10 text-gray-400 hover:text-white focus:outline-none transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
              {errorRepeat && <p className="text-red-500 text-sm mt-1">{errorRepeat}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              onClick={switchMode}
              className="ml-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              disabled={loading}
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;