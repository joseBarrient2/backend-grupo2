const cors = require('cors');

// Configuración de CORS - Solo para www.curacao.com
const corsOptions = {
  origin: ['https://enmat.pockethost.io'], 
  //origin: true,  // Permitir cualquier origen
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true, // Permitir cookies y headers de autenticación
  optionsSuccessStatus: 200 // Para navegadores legacy
};

module.exports = cors(corsOptions);