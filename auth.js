const jwt = require('jsonwebtoken');

const SECRET_KEY = 'mi_clave_secreta_jwt';

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  // Remover 'Bearer ' si está presente
  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;

  try {
    const decoded = jwt.verify(tokenWithoutBearer, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Función para generar JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, usuario: user.usuario, rol: user.rol },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
};

module.exports = { 
  verifyToken, 
  generateToken, 
  SECRET_KEY 
};