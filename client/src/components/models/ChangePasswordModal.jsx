import React, { useState } from 'react';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;
  if (!isOpen) return null;

  // Función para validar fortaleza de la contraseña
  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validar contraseña en tiempo real
    if (name === 'newPassword') {
      validatePassword(value);
    }

    // Limpiar mensajes cuando el usuario empiece a escribir
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  // Función para alternar visibilidad de contraseña
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // Validaciones básicas
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Todos los campos son requeridos');
      setLoading(false);
      return;
    }

    // Validar fortaleza de la nueva contraseña
    if (!validatePassword(formData.newPassword)) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Verificar que la nueva contraseña no sea igual a la actual
    if (formData.currentPassword === formData.newPassword) {
      setError('La nueva contraseña debe ser diferente a la actual');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(' ' + data.message);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false
        });
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(' ' + (data.error || 'Error al cambiar la contraseña'));
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      setError(' Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
    setMessage('');
    setError('');
    onClose();
  };

  // Función para obtener el color del indicador de requisito
  const getRequirementColor = (met) => met ? 'text-green-400' : 'text-red-400';

  // Función para obtener el ícono del requisito
  const getRequirementIcon = (met) => met ? '✓' : '✗';

  // Ícono de ojo para mostrar/ocultar contraseña
  const EyeIcon = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="password-toggle-btn"
      tabIndex={-1}
    >
      {show ? (
        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="eye-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="change-password-modal-overlay">
      <div className="change-password-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            Cambiar Contraseña
          </h2>
          <button
            onClick={handleCancel}
            className="close-button"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="password-form">
          <div className="input-group">
            <label className="input-label">
              Contraseña Actual
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="password-input"
                placeholder="Ingresa tu contraseña actual"
                disabled={loading}
              />
              <EyeIcon 
                show={showPasswords.current} 
                onClick={() => togglePasswordVisibility('current')} 
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              Nueva Contraseña
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="password-input"
                placeholder="Ingresa tu nueva contraseña"
                disabled={loading}
              />
              <EyeIcon 
                show={showPasswords.new} 
                onClick={() => togglePasswordVisibility('new')} 
              />
            </div>
            
            {/* Indicadores de requisitos de contraseña */}
            <div className="password-requirements">
              <p className="requirements-title">Requisitos de seguridad:</p>
              <div className="requirements-grid">
                <div className={`requirement-item ${getRequirementColor(passwordRequirements.length)}`}>
                  <span className="requirement-icon">{getRequirementIcon(passwordRequirements.length)}</span>
                  <span className="requirement-text">Mínimo 8 caracteres</span>
                </div>
                <div className={`requirement-item ${getRequirementColor(passwordRequirements.uppercase)}`}>
                  <span className="requirement-icon">{getRequirementIcon(passwordRequirements.uppercase)}</span>
                  <span className="requirement-text">Al menos una letra mayúscula (A-Z)</span>
                </div>
                <div className={`requirement-item ${getRequirementColor(passwordRequirements.lowercase)}`}>
                  <span className="requirement-icon">{getRequirementIcon(passwordRequirements.lowercase)}</span>
                  <span className="requirement-text">Al menos una letra minúscula (a-z)</span>
                </div>
                <div className={`requirement-item ${getRequirementColor(passwordRequirements.number)}`}>
                  <span className="requirement-icon">{getRequirementIcon(passwordRequirements.number)}</span>
                  <span className="requirement-text">Al menos un número (0-9)</span>
                </div>
                <div className={`requirement-item ${getRequirementColor(passwordRequirements.special)}`}>
                  <span className="requirement-icon">{getRequirementIcon(passwordRequirements.special)}</span>
                  <span className="requirement-text">Al menos un carácter especial (!@#$%^&* etc.)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">
              Confirmar Contraseña
            </label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="password-input"
                placeholder="Confirma tu nueva contraseña"
                disabled={loading}
              />
              <EyeIcon 
                show={showPasswords.confirm} 
                onClick={() => togglePasswordVisibility('confirm')} 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !Object.values(passwordRequirements).every(Boolean)}
            className="submit-button"
          >
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>

        <div className="cancel-section">
          <button
            onClick={handleCancel}
            className="cancel-button"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;