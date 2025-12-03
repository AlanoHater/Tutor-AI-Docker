require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs'); // NECESARIO: Importar bcrypt
const { openDB } = require('../config/database');

const initDatabase = async () => {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // 1. Crear carpeta si no existe
    const dbDir = path.dirname(process.env.DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('📂 Carpeta database creada:', dbDir);
    }

    const db = await openDB();
    
    // 2. Ejecutar Schema
    const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }

    // 3. CORRECCIÓN AUTOMÁTICA DE ADMIN (Lo que faltaba en Docker)
    console.log('🔑 Asegurando credenciales de admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Actualiza la contraseña del admin insertado por el schema
    await db.run(
      "UPDATE usuarios SET contraseña_encriptada = ? WHERE usuario = 'admin'",
      [hashedPassword]
    );
    console.log('✅ Admin actualizado: admin / admin123');

    console.log('✅ BASE DE DATOS SQLITE INICIALIZADA CORRECTAMENTE');
    await db.close();

  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      console.log('ℹ️ Base de datos ya existente (Warnings ignorados)');
    } else {
      console.error('❌ ERROR CRÍTICO EN INIT DB:', error);
    }
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
