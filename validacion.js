const { body, param } = require('express-validator');
const pool = require('./conexiondb'); // Asegúrate de que la ruta a tu conexión de base de datos sea correcta

const validarRegistro = [
  body('usuario')
    .notEmpty().withMessage('El nombre de usuario es requerido.')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres.')
    .custom(async (value) => {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [value]);
      if (rows.length) {
        return Promise.reject('El nombre de usuario ya está en uso.');
      }
    }),
  body('pass')
    .notEmpty().withMessage('La contraseña es requerida.')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('rol')
    .notEmpty().withMessage('El rol es requerido.')
    .isIn(['admin', 'usuario']).withMessage('El rol debe ser "admin" o "usuario".') // Ajusta los roles según tus necesidades
];

const validarLogin = [
  body('usuario').notEmpty().withMessage('El nombre de usuario es requerido.'),
  body('pass').notEmpty().withMessage('La contraseña es requerida.')
];

const validarCrearProducto = [
  body('nombre').notEmpty().withMessage('El nombre del producto es requerido.'),
  body('precio')
    .notEmpty().withMessage('El precio es requerido.')
    .isDecimal({ decimal_digits: '2' }).withMessage('El precio debe ser un número decimal con hasta 2 decimales.'),
  body('stock')
    .notEmpty().withMessage('El stock es requerido.')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.')
];

const validarActualizarProducto = [
  param('id').isInt().withMessage('El ID debe ser un entero.'),
  body('nombre').optional().notEmpty().withMessage('El nombre del producto no puede estar vacío.'),
  body('precio')
    .optional()
    .isDecimal({ decimal_digits: '2' }).withMessage('El precio debe ser un número decimal con hasta 2 decimales.'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero no negativo.')
];

const validarActualizarUsuario = [
    param('id').isInt().withMessage('El ID debe ser un entero.'),
    body('usuario')
        .optional()
        .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres.')
        .custom(async (value, { req }) => {
            const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario = $1 AND id != $2', [value, req.params.id]);
            if (rows.length) {
                return Promise.reject('El nombre de usuario ya está en uso.');
            }
        }),
    body('pass')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('rol')
        .optional()
        .isIn(['admin', 'usuario']).withMessage('El rol debe ser "admin" o "usuario".')
];

const validarIdEnParametro = [
  param('id').isInt().withMessage('El ID debe ser un entero.')
];


module.exports = {
  validarRegistro,
  validarLogin,
  validarCrearProducto,
  validarActualizarProducto,
  validarActualizarUsuario,
  validarIdEnParametro
};