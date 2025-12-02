// database/initDB.js - VERSIÓN CORREGIDA
require('dotenv').config(); // ¡AGREGAR ESTA LÍNEA AL INICIO!
const fs = require('fs');
const path = require('path');
const { openDB } = require('../config/database');

const initDatabase = async () => {
  try {
    console.log('🔧 Inicializando base de datos...');
    console.log('📁 DB_PATH:', process.env.DB_PATH);
    
    // Crear la carpeta database si no existe
    const dbDir = path.dirname(process.env.DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('📂 Carpeta database creada:', dbDir);
    }

    const db = await openDB();
    
    // Leer y ejecutar el schema SQL
    const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
    console.log('📄 Schema path:', schemaPath);
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Ejecutar cada sentencia SQL por separado
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }

    console.log('✅ BASE DE DATOS SQLITE INICIALIZADA CORRECTAMENTE');
    await db.close();
  } catch (error) {
    // Si el error es por datos duplicados, es normal después del primer inicio
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')) {
      console.log('ℹ️ La base de datos ya estaba inicializada (datos duplicados ignorados)');
    } else {
      console.error('❌ ERROR AL INICIALIZAR LA BASE DE DATOS:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
};

// Ejecutar la inicialización si este archivo se ejecuta directamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;