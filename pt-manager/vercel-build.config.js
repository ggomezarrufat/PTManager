// Configuración de build para Vercel
module.exports = {
  // Configuración de webpack para optimizar el build
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones para producción
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Configuración de exportación
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/dashboard': { page: '/dashboard' },
      '/tournaments': { page: '/tournaments' },
      '/players': { page: '/players' },
      '/reports': { page: '/reports' },
      '/profile': { page: '/profile' },
      '/admin': { page: '/admin' },
    };
  },
};
