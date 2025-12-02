// controllers/quizController.js - VERSIÓN CON DEBUGGING

const { openDB } = require('../config/database');
const { generarPreguntasConOpenAI } = require('../config/openaiConfig');
const { generarPDFExamen, generarPDFRespuestas } = require('../utils/pdfGenerator');

// Generar quiz a partir de un archivo
const generarQuiz = async (req, res) => {
  console.log("=== INICIANDO GENERACIÓN DE QUIZ ===");
  console.log("Body recibido:", req.body);
  console.log("Usuario ID:", req.user.id);

  try {
    const { archivoId, tipoPreguntas, cantidadPreguntas } = req.body;
    const usuarioId = req.user.id;

    // Validaciones básicas
    if (!archivoId || !tipoPreguntas) {
      console.log("ERROR: Faltan datos requeridos");
      return res.status(400).json({ 
        error: 'archivoId y tipoPreguntas son requeridos' 
      });
    }

    const db = await openDB();

    // Obtener el archivo
    console.log("Buscando archivo ID:", archivoId);
    const archivo = await db.get(`
      SELECT a.*, m.nombre as materia_nombre 
      FROM archivos_subidos a
      INNER JOIN materias m ON a.materia_id = m.id
      WHERE a.id = ? AND a.usuario_id = ?
    `, [archivoId, usuarioId]);

    if (!archivo) {
      await db.close();
      console.log("ERROR: Archivo no encontrado");
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    console.log("Archivo encontrado:", archivo.nombre_original);
    console.log("Materia:", archivo.materia_nombre);
    console.log("Longitud contenido:", archivo.contenido_extraido?.length || 0);

    let preguntas;
    try {
      console.log("Llamando a Gemini para tipo:", tipoPreguntas, "cantidad:", cantidadPreguntas || 5);
      
      // Llamar DIRECTAMENTE a la función sin modificaciones
      preguntas = await generarPreguntasConOpenAI(
        archivo.contenido_extraido,
        tipoPreguntas,
        cantidadPreguntas || 5,
        archivo.materia_nombre
      );
      
      console.log("Preguntas generadas:", preguntas?.length || 0);
      if (preguntas && preguntas.length > 0) {
        console.log("Primera pregunta:", JSON.stringify(preguntas[0], null, 2));
      }
    } catch (iaError) {
      await db.close();
      console.error("ERROR en Gemini:", iaError.message);
      console.error("Stack trace:", iaError.stack);
      
      // Enviar error específico al frontend
      return res.status(500).json({ 
        error: `Error con el servicio de IA: ${iaError.message}`,
        detalles: "No se pudieron generar las preguntas automáticamente"
      });
    }

    // Generar título
    const tituloNatural = `Evaluación de ${archivo.materia_nombre} - ${tipoPreguntas === 'opcion_multiple' ? 'Opción Múltiple' : tipoPreguntas === 'verdadero_falso' ? 'Verdadero/Falso' : 'Preguntas Abiertas'} (${preguntas.length} preguntas)`;

    console.log("Guardando quiz en BD con título:", tituloNatural);

    // Guardar el quiz
    const quizResult = await db.run(
      `INSERT INTO quizzes 
       (usuario_id, archivo_id, titulo, tipo_preguntas, cantidad_preguntas, preguntas) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        archivoId,
        tituloNatural,
        tipoPreguntas,
        preguntas.length,
        JSON.stringify(preguntas)
      ]
    );

    await db.close();

    console.log("Quiz guardado con ID:", quizResult.lastID);
    console.log("=== GENERACIÓN EXITOSA ===");

    // Responder con éxito
    res.status(201).json({
      mensaje: 'Quiz generado exitosamente',
      quiz: {
        id: quizResult.lastID,
        titulo: tituloNatural,
        tipoPreguntas,
        cantidadPreguntas: preguntas.length,
        preguntas: preguntas,
        materia: archivo.materia_nombre
      }
    });

  } catch (error) {
    console.error("=== ERROR GENERAL EN GENERACIÓN ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    // Verificar si ya se envió respuesta
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error interno del servidor al generar quiz',
        detalles: error.message 
      });
    }
  }
};

// Las otras funciones permanecen igual...
const getQuizzesUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const db = await openDB();
    
    const quizzes = await db.all(`
      SELECT q.id, q.titulo, q.tipo_preguntas, q.cantidad_preguntas, q.fecha_creacion,
             m.nombre as materia_nombre, a.nombre_original as archivo_nombre
      FROM quizzes q
      INNER JOIN archivos_subidos a ON q.archivo_id = a.id
      INNER JOIN materias m ON a.materia_id = m.id
      WHERE q.usuario_id = ?
      ORDER BY q.fecha_creacion DESC
    `, [usuarioId]);
    
    await db.close();
    
    res.json({ quizzes });
  } catch (error) {
    console.error('Error obteniendo quizzes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    
    const db = await openDB();
    
    const quiz = await db.get(`
      SELECT q.*, m.nombre as materia_nombre, a.nombre_original as archivo_nombre
      FROM quizzes q
      INNER JOIN archivos_subidos a ON q.archivo_id = a.id
      INNER JOIN materias m ON a.materia_id = m.id
      WHERE q.id = ? AND q.usuario_id = ?
    `, [id, usuarioId]);
    
    await db.close();
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }

    quiz.preguntas = typeof quiz.preguntas === 'string' 
      ? JSON.parse(quiz.preguntas) 
      : quiz.preguntas;
    
    res.json({ quiz });
  } catch (error) {
    console.error('Error obteniendo quiz:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const generarPDFExamenController = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    
    const db = await openDB();
    
    const quiz = await db.get(`
      SELECT q.*, m.nombre as materia_nombre
      FROM quizzes q
      INNER JOIN archivos_subidos a ON q.archivo_id = a.id
      INNER JOIN materias m ON a.materia_id = m.id
      WHERE q.id = ? AND q.usuario_id = ?
    `, [id, usuarioId]);
    
    await db.close();
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }

    quiz.preguntas = typeof quiz.preguntas === 'string' 
      ? JSON.parse(quiz.preguntas) 
      : quiz.preguntas;

    const pdfBuffer = await generarPDFExamen(quiz);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=examen-${quiz.titulo}.pdf`);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF de examen:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
};

// En controllers/quizController.js, en la función generarPDFRespuestasController:

const generarPDFRespuestasController = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    
    console.log(`📄 Generando PDF de respuestas para quiz ID: ${id}`);
    
    const db = await openDB();
    
    const quiz = await db.get(`
      SELECT q.*, m.nombre as materia_nombre
      FROM quizzes q
      INNER JOIN archivos_subidos a ON q.archivo_id = a.id
      INNER JOIN materias m ON a.materia_id = m.id
      WHERE q.id = ? AND q.usuario_id = ?
    `, [id, usuarioId]);
    
    await db.close();
    
    if (!quiz) {
      console.log(`❌ Quiz no encontrado: ${id}`);
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }

    // Parsear preguntas
    quiz.preguntas = typeof quiz.preguntas === 'string' 
      ? JSON.parse(quiz.preguntas) 
      : quiz.preguntas;

    console.log(`📝 Quiz encontrado: ${quiz.titulo}, ${quiz.preguntas.length} preguntas`);
    console.log('Primeras preguntas:', JSON.stringify(quiz.preguntas.slice(0, 2), null, 2));

    // Generar PDF
    console.log('🎨 Generando PDF...');
    const pdfBuffer = await generarPDFRespuestas(quiz);
    console.log(`✅ PDF generado exitosamente, tamaño: ${pdfBuffer.length} bytes`);
    
    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="respuestas-${quiz.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error generando PDF de respuestas:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error generando PDF',
      detalle: error.message 
    });
  }
};

module.exports = { 
  generarQuiz, 
  getQuizzesUsuario, 
  getQuiz, 
  generarPDFExamenController, 
  generarPDFRespuestasController 
};