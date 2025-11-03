// HistoryModal.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const HistoryModal = ({ isOpen, onClose, userId, token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-history/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="modal-content max-w-2xl w-full bg-gray-800 rounded-2xl p-6 border border-gray-700 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">Historial de Videos Vistos</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Cargando historial...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay videos en tu historial
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                <p className="font-semibold text-white text-sm">{item.titulo}</p>
                <p className="text-cyan-400 text-xs">{item.location_name}</p>
                <p className="text-gray-400 text-xs">
                  Visto el: {new Date(item.fecha).toLocaleDateString('es-MX')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;