import { useMemo } from 'react';

export const useAppData = () => {
  const restrictedCountries = useMemo(() => ['KP', 'IR', 'SY', 'SS', 'CU', 'CN', 'TM', 'UZ', 'TJ', 'ER', 'SD', 'RU', 'BY', 'MM'], []);
  
  const restrictedCities = useMemo(() => [
    'pyongyang', 'corea del norte', 'north korea', 'korea dpr',
    'teherán', 'tehran', 'iran', 'irán', 
    'damasco', 'damascus', 'siria', 'syria',
    'juba', 'sudán del sur', 'south sudan',
    'la habana', 'havana', 'cuba',
    'beijing', 'pekín', 'shanghai', 'cantón', 'guangzhou', 'shenzhen', 'china',
    'ashgabat', 'asjabad', 'turkmenistán', 'turkmenistan',
    'tashkent', 'taskent', 'uzbekistán', 'uzbekistan',
    'dushanbe', 'tayikistán', 'tajikistan',
    'asmara', 'eritrea',
    'jartum', 'khartoum', 'sudán', 'sudan',
    'moscú', 'moscow', 'rusia', 'russia',
    'minsk', 'bielorrusia', 'belarus',
    'yangon', 'myanmar', 'birmania'
  ], []);

  const regionConfig = useMemo(() => ({
    'MX': { 
      code: 'MX', 
      name: 'México',
      center: [23.6345, -102.5528],
      popularQueries: ['México', 'CDMX', 'Cancún', 'Guadalajara', 'Monterrey']
    },
    'US': { 
      code: 'US', 
      name: 'Estados Unidos',
      center: [39.8283, -98.5795],
      popularQueries: ['USA', 'New York', 'Los Angeles', 'Chicago', 'Miami']
    },
    'ES': { 
      code: 'ES', 
      name: 'España',
      center: [40.4637, -3.7492],
      popularQueries: ['España', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla']
    },
    'CN': { 
      code: 'CN', 
      name: 'China',
      center: [35.8617, 104.1954],
      popularQueries: ['China', 'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen']
    },
    'RU': { 
      code: 'RU', 
      name: 'Rusia',
      center: [61.5240, 105.3188],
      popularQueries: ['Rusia', 'Moscú', 'San Petersburgo', 'Novosibirsk', 'Ekaterimburgo']
    }
  }), []);

  const categories = useMemo(() => [
    {
      id: 'cultura',
      name: 'Cultura',
      keywords: [
        'Cultura', 'Tradiciones', 'Costumbres', 'Festividades', 'Arte local',
        'Música tradicional', 'Baile típico', 'Vestimenta tradicional', 'Idioma y dialectos'
      ],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      id: 'gastronomia',
      name: 'Gastronomía',
      keywords: [
        'Comida típica', 'Gastronomía', 'Platos regionales', 'Bebidas tradicionales',
        'Mercados locales', 'Estilo de vida', 'Cocina tradicional', 'Recetas típicas'
      ],
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 'naturaleza',
      name: 'Naturaleza',
      keywords: [
        'Turismo', 'Lugares turísticos', 'Monumentos históricos', 'Parques naturales',
        'Playas', 'Montañas', 'Arquitectura', 'Paisajes', 'Atracciones turísticas'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500'
    },
    {
      id: 'historia',
      name: 'Historia',
      keywords: [
        'Historia del lugar', 'Personajes históricos', 'Museos', 'Patrimonio mundial',
        'Arqueología', 'Antigüedades', 'Civilizaciones antiguas', 'Cultura prehispánica'
      ],
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-gradient-to-r from-amber-500 to-yellow-500'
    },
    {
      id: 'entretenimiento',
      name: 'Entretenimiento',
      keywords: [
        'Eventos culturales', 'Festivales', 'Música moderna', 'Vida nocturna',
        'Noticias del país', 'Entretenimiento', 'Festivales musicales', 'Eventos actuales'
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  ], []);

  return {
    restrictedCountries,
    restrictedCities,
    regionConfig,
    categories
  };
};