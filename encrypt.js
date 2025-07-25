const bcrypt = require('bcrypt');

// Número de rounds para el salt (10 es un buen balance entre seguridad y velocidad)
const SALT_ROUNDS = 10;

/**
 * Hashea una contraseña
 * @param {string} password - La contraseña en texto plano
 * @returns {Promise<string>} - La contraseña hasheada
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara una contraseña con su hash
 * @param {string} password - La contraseña en texto plano
 * @param {string} hash - El hash almacenado
 * @returns {Promise<boolean>} - true si coinciden, false si no
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Valida que la contraseña tenga al menos 6 caracteres
 * @param {string} password - La contraseña a validar
 * @returns {boolean} - true si es válida, false si no
 */
function isValidPassword(password) {
  return password && password.length >= 6;
}

module.exports = {
  hashPassword,
  comparePassword,
  isValidPassword
};