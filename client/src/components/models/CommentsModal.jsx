import React, { useState, useEffect, useCallback } from 'react';

const ProjectCommentsModal = ({ isOpen, onClose, user }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // Cargar comentarios existentes del proyecto
  const fetchComments = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/comentarios-proyecto`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error cargando comentarios del proyecto:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, API_BASE_URL]);

  // Enviar nuevo comentario del proyecto
  const submitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Debes iniciar sesión para comentar');
      return;
    }

    if (!newComment.trim()) {
      alert('Por favor escribe un comentario');
      return;
    }

    if (rating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/comentarios-proyecto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comentario: newComment.trim(),
          calificacion: rating,
          usuario_id: user.id
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        setRating(0);
      } else {
        throw new Error('Error al enviar comentario');
      }
    } catch (error) {
      console.error('Error enviando comentario:', error);
      alert('Error al enviar el comentario');
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular promedio de calificaciones del proyecto
  const averageRating = comments.length > 0 
    ? (comments.reduce((sum, comment) => sum + comment.calificacion, 0) / comments.length).toFixed(1)
    : 0;

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-content w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Comentarios del Proyecto
              </h2>
              <p className="text-cyan-300/80 text-sm mt-1">
                Califica y comenta sobre VideoMap Pro
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-cyan-400 hover:text-cyan-300 text-xl w-8 h-8 rounded-full hover:bg-cyan-400/10 transition-all duration-300 flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Resumen de calificaciones */}
          <div className="flex items-center gap-4 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{averageRating}</div>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= averageRating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1">{comments.length} evaluación{comments.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-200px)]">
          {/* Formulario de comentario */}
          {user && (
            <div className="p-6 border-b border-gray-700">
              <form onSubmit={submitComment} className="space-y-4">
                {/* Sistema de calificación con estrellas */}
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">
                    Tu calificación:
                  </label>
                  <div className="flex gap-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-3xl transition-transform hover:scale-110"
                      >
                        <span className={star <= rating ? 'text-yellow-400' : 'text-gray-400'}>
                          {star <= rating ? '★' : '☆'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo de comentario */}
                <div>
                  <label className="block text-sm font-medium text-cyan-300 mb-2">
                    Tu comentario sobre el proyecto:
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Comparte tu opinión sobre VideoMap Pro, sugerencias, o tu experiencia..."
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    rows="3"
                    maxLength="500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !newComment.trim() || rating === 0}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  {submitting ? 'Enviando...' : 'Publicar Evaluación'}
                </button>
              </form>
            </div>
          )}

          {/* Lista de comentarios */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-cyan-400 mt-2">Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-2">Sin comentarios aún</h3>
                <p className="text-gray-400">
                  {user ? 'Sé el primero en comentar sobre el proyecto' : 'Inicia sesión para dejar tu comentario'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      {comment.usuario_foto ? (
                        <img 
                          src={comment.usuario_foto} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {comment.usuario_nombre?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-cyan-300 text-sm">
                          {comment.usuario_nombre}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= comment.calificacion 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-400'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.creado_en).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-200 text-sm">
                      {comment.comentario}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCommentsModal;