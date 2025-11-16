// components/modals/UserProfileModal.js
import React from 'react';

const UserProfileModal = ({
  user,
  isOpen,
  onClose,
  onChangePhoto,
  onChangePassword,
  onLogout
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="absolute right-0 top-16 w-80 glass-effect bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl z-50 border border-gray-600 overflow-hidden">
      <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center gap-4">
          {user.foto ? (
            <img 
              src={user.foto} 
              alt="Foto de perfil" 
              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500 shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-cyan-400 text-lg truncate">{user.nombre}</p>
            <p className="text-gray-300 text-sm truncate">{user.email}</p>
            {user.google_id && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <p className="text-xs text-green-400 font-medium">Cuenta Google</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-2">
        <button 
          onClick={onChangePhoto}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group"
        >
          <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Cambiar Foto de Perfil</span>
        </button>
        
        {!user.google_id && (
          <button 
            onClick={onChangePassword}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-gray-200 hover:text-white group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span className="font-medium">Cambiar Contraseña</span>
          </button>
        )}
        
        <div className="border-t border-gray-700 my-2"></div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 transition-all duration-200 text-red-400 hover:text-red-300 group"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfileModal;