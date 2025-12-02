// backend/testPasswordChange.js
require('dotenv').config();
const { openDB } = require('./config/database');
const bcrypt = require('bcryptjs');

const testPasswordChange = async () => {
  try {
    console.log('🔐 Probando cambio de contraseña...');
    
    const db = await openDB();
    
    // Obtener un profesor activo para probar
    const profesor = await db.get(`
      SELECT id, nombre, usuario, contraseña_encriptada 
      FROM usuarios 
      WHERE rol = 'profesor' AND activo = 1 
      LIMIT 1
    `);
    
    if (!profesor) {
      console.log('❌ No hay profesores activos para probar');
      return;
    }
    
    console.log('👨‍🏫 Profesor seleccionado:', {
      id: profesor.id,
      nombre: profesor.nombre,
      usuario: profesor.usuario
    });
    
    // Nueva contraseña
    const nuevaContraseña = 'nueva123';
    const nuevaContraseñaEncriptada = await bcrypt.hash(nuevaContraseña, 10);
    
    console.log('🔄 Cambiando contraseña...');
    
    // Actualizar contraseña
    const result = await db.run(
      'UPDATE usuarios SET contraseña_encriptada = ? WHERE id = ?',
      [nuevaContraseñaEncriptada, profesor.id]
    );
    
    console.log('📝 Resultado de actualización:', result);
    
    if (result.changes > 0) {
      console.log('✅ Contraseña cambiada exitosamente');
      
      // Verificar que se cambió
      const profesorActualizado = await db.get(
        'SELECT contraseña_encriptada FROM usuarios WHERE id = ?',
        [profesor.id]
      );
      
      console.log('🔍 Verificando cambio...');
      const contraseñaValida = await bcrypt.compare(nuevaContraseña, profesorActualizado.contraseña_encriptada);
      console.log('✅ Contraseña verificada:', contraseñaValida);
    } else {
      console.log('❌ No se pudo cambiar la contraseña');
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

testPasswordChange();