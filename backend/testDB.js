// backend/testDB-enhanced.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { openDB } = require('./config/database');

const testDatabase = async () => {
  try {
    console.log('🔧 Configuración DB_PATH:', process.env.DB_PATH);
    
    // Verificar si el archivo de base de datos existe
    const dbPath = path.resolve(process.env.DB_PATH);
    console.log('📁 Ruta absoluta de la BD:', dbPath);
    
    if (fs.existsSync(dbPath)) {
      console.log('✅ Archivo de base de datos EXISTE');
    } else {
      console.log('❌ Archivo de base de datos NO EXISTE');
      console.log('💡 Ejecuta: node database/initDB.js');
      return;
    }

    // Intentar conectar
    console.log('🔌 Conectando a la base de datos...');
    const db = await openDB();
    console.log('✅ Conexión exitosa');
    
    // Verificar tablas
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    console.log('📊 Tablas en la base de datos:', tables.map(t => t.name));
    
    // Ver usuarios
    const usuarios = await db.all('SELECT id, nombre, usuario, rol, activo FROM usuarios');
    console.log('👥 Usuarios encontrados:', usuarios.length);
    usuarios.forEach(user => {
      console.log(`   - ${user.nombre} (${user.usuario}) - ${user.rol} - ${user.activo ? 'Activo' : 'Inactivo'}`);
    });
    
    await db.close();
    console.log('✅ Test completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

testDatabase();