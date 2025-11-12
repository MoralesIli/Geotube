// src/utils/restrictions.js

// Países restringidos
export const restrictedCountries = ['KP', 'IR', 'SY', 'SS', 'CU', 'CN', 'TM', 'UZ', 'TJ', 'ER', 'SD', 'RU', 'BY', 'MM'];

// Ciudades restringidas
export const restrictedCities = [
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
  ];

// Configuración por región
export const regionConfig ={
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
  };

// 🗂️ Categorías de búsqueda
export const categories = [
  {
    id: 'cultura',
    name: 'Cultura',
    keywords: ['Cultura', 'Tradiciones', 'Costumbres', 'Festividades', 'Arte local'],
    color: 'from-purple-500 to-pink-500',
    icon: '🎭'
  },
  {
    id: 'gastronomia',
    name: 'Gastronomía',
    keywords: ['Comida típica', 'Gastronomía', 'Platos regionales', 'Bebidas tradicionales'],
    color: 'from-orange-500 to-red-500',
    icon: '🍽️'
  },
  {
    id: 'naturaleza',
    name: 'Naturaleza',
    keywords: ['Turismo', 'Lugares turísticos', 'Parques naturales', 'Playas', 'Montañas'],
    color: 'from-green-500 to-emerald-500',
    icon: '🌳'
  },
  {
    id: 'historia',
    name: 'Historia',
    keywords: ['Historia del lugar', 'Museos', 'Patrimonio mundial'],
    color: 'from-yellow-500 to-amber-500',
    icon: '🏛️'
  },
  {
    id: 'entretenimiento',
    name: 'Entretenimiento',
    keywords: ['Eventos culturales', 'Festivales', 'Música moderna', 'Vida nocturna'],
    color: 'from-blue-500 to-cyan-500',
    icon: '🎪'
  }
];
