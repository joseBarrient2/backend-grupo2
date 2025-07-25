// enviarcorreo.js

const nodemailer = require('nodemailer');

// Configuración del transporte de correo electrónico (transporter)
// Se utilizan las credenciales de Gmail proporcionadas.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'delgadosalcedojavier@gmail.com',
    pass: 'opxl iaeo fgwr nlll' // Contraseña de aplicación generada para Gmail
  }
});

/**
 * Función para enviar un correo electrónico con el código de validación.
 * @param {string} destinatario - La dirección de correo electrónico del destinatario.
 * @param {string} codigo - El código de validación de 5 dígitos a enviar.
 * @returns {Promise<void>}
 */
const enviarCorreoValidacion = async (destinatario, codigo) => {
  // Opciones del correo electrónico
  const mailOptions = {
    from: 'delgadosalcedojavier@gmail.com',
    to: destinatario,
    subject: 'Tu código de validación',
    // Cuerpo del correo en texto plano, simple y directo (KISS)
    text: `Tu código de validación es: ${codigo}`
  };

  try {
    // Envía el correo usando el transporter configurado
    await transporter.sendMail(mailOptions);
    console.log(`Correo de validación enviado a ${destinatario}`);
  } catch (error) {
    // Si hay un error, lo muestra en la consola y lo relanza
    console.error('Error al enviar el correo de validación:', error);
    throw new Error('No se pudo enviar el correo de validación.');
  }
};

// Exportar la función para que pueda ser utilizada en otros archivos
module.exports = {
  enviarCorreoValidacion
};