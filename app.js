// index.js (o el nombre de tu archivo principal de la API)

const express = require('express');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const pool = require('./conexiondb'); // Asegúrate que este archivo existe y la configuración es correcta.
const { verifyToken, generateToken } = require('./auth'); // Asegúrate que este archivo existe y la configuración es correcta
const { loginLimiter, apiLimiter } = require('./ratelimit'); // Asegúrate que este archivo existe y la configuración es correcta
const corsMiddleware = require('./cors'); // Importar la configuración de CORS
const {
  validarRegistro,
  validarLogin,
  validarCrearProducto,
  validarActualizarProducto,
  validarActualizarUsuario,
  validarIdEnParametro
} = require('./validacion'); // Este es el archivo que creamos en el paso anterior
const { enviarCorreoValidacion } = require('./enviarcorreo'); // Importar la función de envío de correo

const app = express();
const PORT = 3000;

// Almacenamiento temporal en memoria para los códigos de validación (KISS)
// En un entorno de producción, sería mejor usar una base de datos o Redis.
const codigosDeValidacion = []; // Formato: [{ email: 'user@example.com', codigo: '12345' }]

// Middleware global para CORS - DEBE IR ANTES que otros middlewares
app.use(corsMiddleware);

// Middleware global para parsear JSON
app.use(express.json());

// Aplicar rate limiting general a todas las rutas
app.use(apiLimiter);

// Middleware para manejar los errores de validación de express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ==================== RUTAS PÚBLICAS ====================
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Productos'); // Mensaje de bienvenida
});

// NUEVO ENDPOINT: POST /send-code - Enviar código de validación por correo (PÚBLICA)
app.post('/send-code', async (req, res) => {
  const { email } = req.body;

  // Validación simple para asegurar que se envió un email
  if (!email) {
    return res.status(400).json({ message: 'El campo email es requerido' });
  }

  try {
    // Generar un código de validación aleatorio de 5 dígitos
    const codigo = Math.floor(10000 + Math.random() * 90000).toString();

    // Guardar el correo y el código en el array en memoria
    // Si ya existe un código para ese email, se sobrescribe
    const existingEntryIndex = codigosDeValidacion.findIndex(entry => entry.email === email);
    if (existingEntryIndex > -1) {
      codigosDeValidacion[existingEntryIndex] = { email, codigo };
    } else {
      codigosDeValidacion.push({ email, codigo });
    }

    // Enviar el correo electrónico con el código
    await enviarCorreoValidacion(email, codigo);

    res.status(200).json({ message: 'Código de validación enviado exitosamente' });

  } catch (error) {
    // Manejo de errores, especialmente si el envío del correo falla
    res.status(500).json({ message: 'Error del servidor al enviar el código', error: error.message });
  }
});


// ENDPOINT MODIFICADO: POST /register - Registro de usuarios (PÚBLICA)
// El campo 'usuario' ahora es el email y se requiere el 'codigoValidacion'
app.post('/register', validarRegistro, handleValidationErrors, async (req, res) => {
  // Ahora el body debe incluir: usuario (email), pass, rol, y codigoValidacion
  const { usuario, pass, rol, codigoValidacion } = req.body;

  // 1. Verificar que el código de validación es correcto
  const registroCodigo = codigosDeValidacion.find(
    entry => entry.email === usuario && entry.codigo === codigoValidacion
  );

  if (!registroCodigo) {
    return res.status(400).json({ message: 'El código de validación es incorrecto o ha expirado.' });
  }

  try {
    // 2. Hashear la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltRounds);

    // 3. Insertar nuevo usuario en la base de datos
    // La base de datos no se modifica, sigue esperando 'usuario', 'pass', y 'rol'.
    const result = await pool.query(
      'INSERT INTO usuarios (usuario, pass, rol) VALUES ($1, $2, $3) RETURNING id, usuario, rol',
      [usuario, hashedPassword, rol]
    );
    
    // 4. Una vez registrado, eliminar el código de validación para que no se reutilice
    const indexToRemove = codigosDeValidacion.findIndex(entry => entry.email === usuario);
    if (indexToRemove > -1) {
        codigosDeValidacion.splice(indexToRemove, 1);
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    // Manejo de errores (ej: usuario duplicado en la DB)
    if (error.code === '23505') { // Código de error de PostgreSQL para violación de unicidad
      return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});


// POST /login - Autenticación (PÚBLICA) con rate limiting específico
app.post('/login', loginLimiter, validarLogin, handleValidationErrors, async (req, res) => {
  try {
    const { usuario, pass } = req.body;

    // Buscar usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    // Si no se encuentra el usuario, las credenciales son inválidas
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificar la contraseña usando bcrypt
    const isValidPassword = await bcrypt.compare(pass, user.pass);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT si las credenciales son correctas
    const token = generateToken(user);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /productos - Obtener todos los productos (PÚBLICA)
app.get('/productos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// ==================== RUTAS PRIVADAS (requieren token) ====================

// POST /productos - Crear un nuevo producto (PRIVADA)
app.post('/productos', verifyToken, validarCrearProducto, handleValidationErrors, async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *',
      [nombre, precio, stock]
    );

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PATCH /productos/:id - Actualizar un producto existente (PRIVADA)
app.patch('/productos/:id', verifyToken, validarActualizarProducto, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    // Primero, verificar que el producto existe
    const existingProduct = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCounter++}`);
      values.push(nombre);
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramCounter++}`);
      values.push(precio);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCounter++}`);
      values.push(stock);
    }

    // Si no hay campos para actualizar, retornar un error
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    values.push(id); // Añadir el ID al final del array de valores
    const query = `UPDATE productos SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({
      message: 'Producto actualizado exitosamente',
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /productos/:id - Eliminar un producto (PRIVADA)
app.delete('/productos/:id', verifyToken, validarIdEnParametro, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({
      message: 'Producto eliminado exitosamente',
      producto: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /usuarios - Obtener todos los usuarios (PRIVADA)
app.get('/usuarios', verifyToken, async (req, res) => {
  try {
    // Solo se devuelven campos no sensibles
    const result = await pool.query('SELECT id, usuario, rol FROM usuarios ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PATCH /usuarios/:id - Actualizar un usuario (PRIVADA)
app.patch('/usuarios/:id', verifyToken, validarActualizarUsuario, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, pass, rol } = req.body;

    // Verificar que el usuario a actualizar existe
    const existingUser = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (usuario !== undefined) {
      updates.push(`usuario = $${paramCounter++}`);
      values.push(usuario);
    }
    if (pass !== undefined) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(pass, saltRounds);
      updates.push(`pass = $${paramCounter++}`);
      values.push(hashedPassword);
    }
    if (rol !== undefined) {
      updates.push(`rol = $${paramCounter++}`);
      values.push(rol);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    values.push(id);
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING id, usuario, rol`;

    const result = await pool.query(query, values);

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /usuarios/:id - Eliminar un usuario (PRIVADA)
app.delete('/usuarios/:id', verifyToken, validarIdEnParametro, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, usuario, rol', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario eliminado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});