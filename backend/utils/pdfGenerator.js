// utils/pdfGenerator.js - VERSIÓN CORREGIDA CON PIE DE PÁGINA FIXED

const PDFDocument = require('pdfkit');

const generarPDFExamen = (quiz, opciones = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const { incluirRespuestas = false } = opciones;

      // Encabezado
      doc.fontSize(16).font('Helvetica-Bold')
         .text('TUTOR INTELIGENTE - SISTEMA DE EVALUACIÓN', { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(12).font('Helvetica')
         .text(`Materia: ${quiz.materia_nombre || 'No especificada'}`, { align: 'center' });
      
      doc.moveDown();
      doc.fontSize(14).font('Helvetica-Bold')
         .text(quiz.titulo, { align: 'center' });
      
      if (incluirRespuestas) {
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('red')
           .text('VERSIÓN CON RESPUESTAS - SOLO PARA PROFESORES', { align: 'center' })
           .fillColor('black');
      }
      
      doc.moveDown(2);

      // Información del estudiante (solo para examen)
      if (!incluirRespuestas) {
        doc.fontSize(10)
           .text('Nombre: _________________________________________')
           .text('Matrícula: ______________________________________')
           .text('Fecha: __________________________________________');
        
        doc.moveDown(2);
      }
      
      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Preguntas
      const preguntas = typeof quiz.preguntas === 'string' 
        ? JSON.parse(quiz.preguntas) 
        : quiz.preguntas;

      preguntas.forEach((pregunta, index) => {
        // Nueva página si es necesario
        if (doc.y > 650) {
          doc.addPage();
          doc.fontSize(10).text(`Continuación - ${quiz.titulo}`, { align: 'center' });
          doc.moveDown();
        }

        // Número de pregunta
        doc.fontSize(12).font('Helvetica-Bold')
           .text(`${index + 1}. ${pregunta.texto}`);
        
        doc.moveDown(0.3);

        // Contenido según tipo
        if (pregunta.tipo === 'opcion_multiple' && pregunta.opciones) {
          pregunta.opciones.forEach((opcion, opcionIndex) => {
            const letra = String.fromCharCode(65 + opcionIndex);
            doc.fontSize(11).font('Helvetica')
               .text(`   ${letra}) ${opcion}`);
          });
        } else if (pregunta.tipo === 'verdadero_falso') {
          doc.fontSize(11).font('Helvetica')
             .text('   ( ) Verdadero      ( ) Falso');
        } else if (pregunta.tipo === 'preguntas_abiertas') {
          doc.fontSize(11).font('Helvetica')
             .text('   ______________________________________________________')
             .text('   ______________________________________________________')
             .text('   ______________________________________________________')
             .text('   ______________________________________________________');
        }

        // Respuestas (solo para PDF de respuestas)
        if (incluirRespuestas) {
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('blue');
          
          if (pregunta.tipo === 'opcion_multiple' && pregunta.respuesta) {
            doc.text(`   Respuesta: ${pregunta.respuesta}`);
            // Mostrar también la opción correcta
            const opcionIndex = pregunta.respuesta.charCodeAt(0) - 65;
            if (pregunta.opciones && pregunta.opciones[opcionIndex]) {
              doc.text(`   Opción correcta: ${pregunta.opciones[opcionIndex]}`);
            }
          } else if (pregunta.tipo === 'verdadero_falso' && pregunta.respuesta) {
            doc.text(`   Respuesta: ${pregunta.respuesta}`);
          } else if (pregunta.tipo === 'preguntas_abiertas') {
            // Para preguntas abiertas, mostrar la respuesta generada por Gemini
            if (pregunta.respuesta) {
              doc.text(`   Respuesta esperada:`);
              
              // FUNCIÓN SIMPLIFICADA PARA DIVIDIR TEXTO EN LÍNEAS
              const dividirTextoEnLineas = (texto, maxCaracteres = 80) => {
                if (!texto) return [];
                const palabras = texto.split(' ');
                const lineas = [];
                let lineaActual = '';
                
                for (const palabra of palabras) {
                  if ((lineaActual + ' ' + palabra).length > maxCaracteres) {
                    if (lineaActual !== '') {
                      lineas.push(lineaActual);
                    }
                    lineaActual = palabra;
                  } else {
                    lineaActual = lineaActual ? lineaActual + ' ' + palabra : palabra;
                  }
                }
                
                if (lineaActual !== '') {
                  lineas.push(lineaActual);
                }
                
                return lineas;
              };
              
              // Dividir respuesta en líneas
              const lineasRespuesta = dividirTextoEnLineas(pregunta.respuesta);
              
              // Mostrar cada línea
              lineasRespuesta.forEach(linea => {
                doc.text(`     ${linea}`);
              });
            } else {
              doc.text(`   [Respuesta no disponible - pregunta abierta]`);
            }
          }
          
          doc.fillColor('black');
        }

        doc.moveDown(1.5);
      });

      // === CORRECCIÓN DEL PIE DE PÁGINA ===
      // NO usar switchToPage con índice 0, pdfkit usa 1-based indexing para las páginas
      // Y solo agregar pie de página si hay contenido
      
      // Usar el evento 'pageAdded' para agregar pie de página a cada página
      let pageCount = 0;
      
      doc.on('pageAdded', () => {
        pageCount++;
      });
      
      // Agregar pie de página al final
      doc.on('pageAdded', () => {
        // Agregar pie de página a la última página
        const currentPage = doc.bufferedPageRange().count;
        doc.switchToPage(currentPage - 1); // Índice 0-based
        doc.fontSize(8).fillColor('gray')
           .text(`Página ${currentPage}`, 50, 800, { align: 'center' })
           .fillColor('black');
      });

      doc.end();

    } catch (error) {
      console.error('Error en PDF Generator:', error);
      console.error('Stack trace:', error.stack);
      reject(error);
    }
  });
};

const generarPDFRespuestas = (quiz) => {
  return generarPDFExamen(quiz, { incluirRespuestas: true });
};

module.exports = { generarPDFExamen, generarPDFRespuestas };