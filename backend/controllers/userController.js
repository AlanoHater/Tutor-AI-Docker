// controllers/userController.js - Gestión de usuarios (VERSIÓN CORREGIDA)

const bcrypt = require('bcryptjs');
const { openDB } = require('../config/database');

// Obtener todos los profesores (solo coordinador)
const getProfesores = async (req, res) => {
  try {
    const db = await openDB();
    
    const profesores = await db.all(`
      SELECT id, nombre, usuario, correo, rol, carrera, activo, fecha_creacion 
      FROM usuarios 
      WHERE rol = 'profesor'
      ORDER BY nombre
    `);
    
    await db.close();
    
    res.json({ profesores });
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo profesor (solo coordinador)
const crearProfesor = async (req, res) => {
  try {
    const { nombre, usuario, correo, contraseña, carrera } = req.body;

    // Validaciones básicas
    if (!nombre || !usuario || !correo || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (contraseña.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const db = await openDB();

    // Verificar si el usuario o correo ya existen
    const usuarioExistente = await db.get(
      'SELECT id FROM usuarios WHERE usuario = ? OR correo = ?',
      [usuario, correo]
    );

    if (usuarioExistente) {
      await db.close();
      return res.status(400).json({ error: 'El usuario o correo ya existen' });
    }

    // Encriptar contraseña
    const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);

    // Insertar nuevo profesor
    const result = await db.run(
      `INSERT INTO usuarios (nombre, usuario, correo, contraseña_encriptada, rol, carrera) 
       VALUES (?, ?, ?, ?, 'profesor', ?)`,
      [nombre, usuario, correo, contraseñaEncriptada, carrera]
    );

    await db.close();

    res.status(201).json({
      mensaje: 'Profesor creado exitosamente',
      profesor: {
        id: result.lastID,
        nombre,
        usuario,
        correo,
        rol: 'profesor',
        carrera
      }
    });

  } catch (error) {
    console.error('Error creando profesor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Desactivar/activar profesor (solo coordinador)
const toggleProfesorActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const db = await openDB();
    
    const result = await db.run(
      'UPDATE usuarios SET activo = ? WHERE id = ? AND rol = ?',
      [activo ? 1 : 0, id, 'profesor']
    );

    await db.close();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    res.json({ 
      mensaje: `Profesor ${activo ? 'activado' : 'desactivado'} exitosamente` 
    });

  } catch (error) {
    console.error('Error actualizando profesor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar perfil de usuario
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, correo, carrera } = req.body;
    const usuarioId = req.user.id;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }

    const db = await openDB();

    // Verificar si el correo ya existe en otro usuario
    const correoExistente = await db.get(
      'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
      [correo, usuarioId]
    );

    if (correoExistente) {
      await db.close();
      return res.status(400).json({ error: 'El correo electrónico ya está en uso' });
    }

    // Actualizar perfil
    const result = await db.run(
      'UPDATE usuarios SET nombre = ?, correo = ?, carrera = ? WHERE id = ?',
      [nombre, correo, carrera, usuarioId]
    );

    if (result.changes === 0) {
      await db.close();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener usuario actualizado
    const usuarioActualizado = await db.get(
      'SELECT id, nombre, usuario, correo, rol, carrera, activo, fecha_creacion FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    await db.close();

    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Cambiar contraseña (VERSIÓN CORREGIDA)
const cambiarContraseña = async (req, res) => {
  try {
    const { contraseñaActual, nuevaContraseña } = req.body;
    const usuarioId = req.user.id;

    console.log('🔐 Intentando cambiar contraseña para usuario:', usuarioId);

    if (!contraseñaActual || !nuevaContraseña) {
      return res.status(400).json({ error: 'La contraseña actual y nueva son obligatorias' });
    }

    if (nuevaContraseña.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const db = await openDB();

    // Obtener usuario actual con la contraseña encriptada
    const usuario = await db.get(
      'SELECT id, contraseña_encriptada FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (!usuario) {
      await db.close();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('📋 Usuario encontrado, verificando contraseña...');

    // Verificar contraseña actual
    const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña_encriptada);
    
    console.log('🔑 Resultado de verificación de contraseña:', contraseñaValida);

    if (!contraseñaValida) {
      await db.close();
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Encriptar nueva contraseña
    const nuevaContraseñaEncriptada = await bcrypt.hash(nuevaContraseña, 10);

    console.log('🔄 Actualizando contraseña en la base de datos...');

    // Actualizar contraseña
    const result = await db.run(
      'UPDATE usuarios SET contraseña_encriptada = ? WHERE id = ?',
      [nuevaContraseñaEncriptada, usuarioId]
    );

    await db.close();

    if (result.changes === 0) {
      return res.status(500).json({ error: 'No se pudo actualizar la contraseña' });
    }

    console.log('✅ Contraseña cambiada exitosamente');

    res.json({ 
      mensaje: 'Contraseña cambiada exitosamente',
      success: true 
    });

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al cambiar la contraseña',
      detalle: error.message 
    });
  }
};

// En userController.js, modifica la función cambiarContraseñaProfesor:

// Cambiar contraseña de profesor (solo coordinador) - VERSIÓN CON MEJOR DEBUGGING
const cambiarContraseñaProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContraseña } = req.body;
    const coordinadorId = req.user.id;

    console.log('🔐 Coordinador intentando cambiar contraseña de profesor:', { 
      coordinadorId, 
      profesorId: id,
      nuevaContraseña: nuevaContraseña ? '***' : 'undefined' 
    });

    if (!id || !nuevaContraseña) {
      return res.status(400).json({ 
        error: 'ID del profesor y nueva contraseña son obligatorios' 
      });
    }

    if (nuevaContraseña.length < 6) {
      return res.status(400).json({ 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      });
    }

    const db = await openDB();

    // Verificar que el coordinador existe y es coordinador
    const coordinador = await db.get(
      'SELECT id, rol FROM usuarios WHERE id = ? AND rol = ?',
      [coordinadorId, 'coordinador']
    );

    if (!coordinador) {
      await db.close();
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    console.log('✅ Coordinador verificado:', coordinador.id);

    // Verificar que el profesor existe y es profesor - CON MÁS DETALLES
    const profesor = await db.get(
      'SELECT id, nombre, usuario, rol, activo FROM usuarios WHERE id = ?',
      [id]
    );

    console.log('🔍 Resultado de búsqueda del profesor:', {
      idBuscado: id,
      profesorEncontrado: profesor,
      tipo: typeof id
    });

    if (!profesor) {
      await db.close();
      return res.status(404).json({ 
        error: `Profesor no encontrado (ID: ${id})` 
      });
    }

    if (profesor.rol !== 'profesor') {
      await db.close();
      return res.status(400).json({ 
        error: `El usuario encontrado no es un profesor (rol: ${profesor.rol})` 
      });
    }

    if (!profesor.activo) {
      await db.close();
      return res.status(400).json({ 
        error: 'El profesor está inactivo' 
      });
    }

    console.log('📋 Profesor encontrado:', profesor.nombre);

    // Encriptar nueva contraseña
    const nuevaContraseñaEncriptada = await bcrypt.hash(nuevaContraseña, 10);

    console.log('🔄 Actualizando contraseña del profesor en la base de datos...');

    // Actualizar contraseña del profesor
    const result = await db.run(
      'UPDATE usuarios SET contraseña_encriptada = ? WHERE id = ?',
      [nuevaContraseñaEncriptada, id]
    );

    await db.close();

    if (result.changes === 0) {
      return res.status(500).json({ 
        error: 'No se pudo actualizar la contraseña del profesor' 
      });
    }

    console.log('✅ Contraseña del profesor cambiada exitosamente');

    res.json({ 
      mensaje: `Contraseña cambiada exitosamente para el profesor ${profesor.nombre}`,
      success: true,
      profesor: {
        id: profesor.id,
        nombre: profesor.nombre,
        usuario: profesor.usuario
      }
    });

  } catch (error) {
    console.error('❌ Error cambiando contraseña del profesor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al cambiar la contraseña del profesor',
      detalle: error.message 
    });
  }
};

// Exportar datos del usuario en CSV (VERSIÓN MEJORADA CON ENCODING CORRECTO)
const exportarDatos = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const db = await openDB();

    // Obtener datos del usuario
    const usuario = await db.get(
      'SELECT * FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (!usuario) {
      await db.close();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener archivos del usuario
    const archivos = await db.all(`
      SELECT a.*, m.nombre as materia_nombre 
      FROM archivos_subidos a 
      LEFT JOIN materias m ON a.materia_id = m.id 
      WHERE a.usuario_id = ?
      ORDER BY a.fecha_subida DESC
    `, [usuarioId]);

    // Obtener quizzes del usuario
    const quizzes = await db.all(`
      SELECT q.*, m.nombre as materia_nombre, a.nombre_original as archivo_nombre
      FROM quizzes q
      LEFT JOIN archivos_subidos a ON q.archivo_id = a.id
      LEFT JOIN materias m ON a.materia_id = m.id
      WHERE q.usuario_id = ?
      ORDER BY q.fecha_creacion DESC
    `, [usuarioId]);

    await db.close();

    // Generar CSV con formato mejorado y encoding correcto
    const headers = [
      '\uFEFF' // BOM para UTF-8 en Excel
    ];
    
    headers.push('Tutor Inteligente - Exportación de Datos\n');
    headers.push('\n');
    headers.push(`Usuario: ${usuario.nombre} (${usuario.usuario})\n`);
    headers.push(`Correo: ${usuario.correo}\n`);
    headers.push(`Rol: ${usuario.rol}\n`);
    headers.push(`Fecha de exportación: ${new Date().toLocaleString('es-ES')}\n`);
    headers.push('\n');

    // Información del perfil
    headers.push('INFORMACIÓN DEL PERFIL\n');
    headers.push('Campo,Valor\n');
    headers.push(`ID,${usuario.id}\n`);
    headers.push(`Nombre,${usuario.nombre}\n`);
    headers.push(`Usuario,${usuario.usuario}\n`);
    headers.push(`Correo,${usuario.correo}\n`);
    headers.push(`Rol,${usuario.rol}\n`);
    headers.push(`Formación,${usuario.carrera || 'No especificada'}\n`);
    headers.push(`Estado,${usuario.activo ? 'Activo' : 'Inactivo'}\n`);
    headers.push(`Fecha de registro,${usuario.fecha_creacion}\n`);
    headers.push('\n');

    // Archivos subidos
    headers.push('ARCHIVOS SUBIDOS\n');
    headers.push(`Total de archivos: ${archivos.length}\n`);
    headers.push('ID,Nombre Original,Materia,Tipo Archivo,Fecha Subida\n');
    archivos.forEach(archivo => {
      const tipoArchivo = archivo.nombre_original.split('.').pop()?.toUpperCase() || 'DESCONOCIDO';
      const fechaFormateada = new Date(archivo.fecha_subida).toLocaleDateString('es-ES');
      headers.push(`${archivo.id},"${archivo.nombre_original}","${archivo.materia_nombre || 'No asignada'}","${tipoArchivo}","${fechaFormateada}"\n`);
    });
    headers.push('\n');

    // Quizzes generados
    headers.push('QUIZZES GENERADOS\n');
    headers.push(`Total de quizzes: ${quizzes.length}\n`);
    headers.push('ID,Título,Materia,Tipo,Preguntas,Fecha Creación,Archivo Origen\n');
    quizzes.forEach(quiz => {
      const fechaFormateada = new Date(quiz.fecha_creacion).toLocaleDateString('es-ES');
      const tipoFormateado = quiz.tipo_preguntas === 'opcion_multiple' ? 'Opción Múltiple' : 
                           quiz.tipo_preguntas === 'verdadero_falso' ? 'Verdadero/Falso' : 
                           'Preguntas Abiertas';
      headers.push(`${quiz.id},"${quiz.titulo}","${quiz.materia_nombre || 'No asignada'}","${tipoFormateado}",${quiz.cantidad_preguntas},"${fechaFormateada}","${quiz.archivo_nombre || 'N/A'}"\n`);
    });

    headers.push('\n');
    headers.push('RESUMEN ESTADÍSTICO\n');
    headers.push('Métrica,Valor\n');
    headers.push(`Total Archivos Subidos,${archivos.length}\n`);
    headers.push(`Total Quizzes Generados,${quizzes.length}\n`);
    headers.push(`Total Preguntas Generadas,${quizzes.reduce((sum, quiz) => sum + quiz.cantidad_preguntas, 0)}\n`);
    headers.push(`Promedio Preguntas por Quiz,${quizzes.length > 0 ? (quizzes.reduce((sum, quiz) => sum + quiz.cantidad_preguntas, 0) / quizzes.length).toFixed(1) : 0}\n`);

    const csvContent = headers.join('');

    // Configurar headers para descarga CSV con encoding correcto
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=datos-${usuario.usuario}-${new Date().toISOString().split('T')[0]}.csv`);
    
    // Enviar el contenido directamente
    res.send(csvContent);

  } catch (error) {
    console.error('Error exportando datos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al exportar datos',
      detalle: error.message 
    });
  }
};

module.exports = { 
  getProfesores, 
  crearProfesor, 
  toggleProfesorActivo,
  actualizarPerfil,
  cambiarContraseña,
  exportarDatos,
  cambiarContraseñaProfesor
};