// utils/fileUtils.js - Utilidades para manejo de archivos

const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Crear la carpeta de uploads si no existe
const ensureUploadsDir = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

// Validar tipos de archivo permitidos
const isValidFileType = (mimetype, originalname) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.oasis.opendocument.text'
  ];
  
  const allowedExtensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.txt', '.rtf', '.odt'];
  const fileExtension = path.extname(originalname).toLowerCase();
  
  return allowedTypes.includes(mimetype) && allowedExtensions.includes(fileExtension);
};

// Verificar si el archivo tiene contenido
const hasContent = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > 0;
  } catch (error) {
    console.error('Error verificando contenido del archivo:', error);
    return false;
  }
};

// Extraer texto de diferentes tipos de archivo
const extractTextFromFile = async (filePath, mimetype) => {
  try {
    // Verificar que el archivo tenga contenido
    if (!hasContent(filePath)) {
      throw new Error('El archivo está vacío o no tiene contenido procesable');
    }

    let extractedText = '';

    if (mimetype === 'application/pdf') {
      console.log('📄 Procesando PDF con pdf-parse...');
      try {
        // Extraer texto de PDF usando pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        console.log(`📊 Buffer cargado, tamaño: ${dataBuffer.length} bytes`);

        const data = await pdfParse(dataBuffer);
        extractedText = data.text.trim();

        console.log(`✅ PDF procesado exitosamente. Texto extraído: ${extractedText.length} caracteres`);

        // Verificar si se extrajo texto válido
        if (extractedText.length < 50) {
          console.warn('⚠️ Texto extraído muy corto, puede que el PDF no tenga texto extraíble');
          extractedText = `[PDF procesado pero sin texto extraíble]
Este PDF parece no contener texto que se pueda extraer automáticamente.
Posibles causas:
- El PDF es un escaneo/imagen sin OCR
- Contiene principalmente imágenes o gráficos
- Tiene protección contra copia
- Formato complejo de PDF

Para usar este contenido, considera:
1. Convertir el PDF a documento Word
2. Usar un archivo de texto con el contenido
3. Proporcionar el contenido manualmente

Nombre del archivo: ${path.basename(filePath)}
Tamaño: ${dataBuffer.length} bytes
Páginas detectadas: ${data.numpages || 'desconocido'}`;
        } else {
          // Log primeros 200 caracteres para verificar
          console.log(`📝 Primeros 200 chars del PDF: "${extractedText.substring(0, 200)}..."`);
        }

      } catch (pdfError) {
        console.error('❌ Error procesando PDF:', pdfError.message);

        // Intentar leer como texto plano por si acaso
        try {
          const textFallback = fs.readFileSync(filePath, 'utf8');
          if (textFallback && textFallback.length > 100) {
            console.log('📝 PDF leído como texto plano alternativo');
            extractedText = textFallback;
          } else {
            throw new Error('No es texto válido');
          }
        } catch (fallbackError) {
          extractedText = `[Error procesando PDF]
No se pudo extraer texto del archivo PDF.
Error técnico: ${pdfError.message}

Soluciones recomendadas:
1. Convierte el PDF a formato Word (.docx)
2. Usa un archivo de texto plano (.txt) con el contenido
3. Asegúrate de que el PDF contenga texto (no solo imágenes)

Archivo: ${path.basename(filePath)}`;
        }
      }

    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               mimetype === 'application/msword') {
      // Extraer texto de documentos Word usando mammoth
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;

    } else if (mimetype === 'text/plain') {
      // Leer archivo de texto plano
      extractedText = fs.readFileSync(filePath, 'utf8');
      if (extractedText.trim().length === 0) {
        throw new Error('El archivo de texto está vacío');
      }

    } else if (mimetype === 'application/vnd.ms-powerpoint' ||
               mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // Para presentaciones, por ahora devolver mensaje informativo
      // En una implementación completa, se usaría una librería como pptx-parser
      extractedText = `[CONTENIDO DE PRESENTACIÓN]
Este archivo es una presentación de PowerPoint. Para extraer el contenido completo, sería necesario implementar un parser específico para presentaciones. Por favor, convierte tu presentación a PDF o documento de Word para una mejor extracción de contenido.

Contenido detectado: ${path.basename(filePath)}`;

    } else if (mimetype === 'application/rtf' ||
               mimetype === 'application/vnd.oasis.opendocument.text') {
      // Para RTF y ODT, intentar leer como texto plano por ahora
      try {
        extractedText = fs.readFileSync(filePath, 'utf8');
      } catch (encodingError) {
        throw new Error(`Tipo de archivo no soportado completamente: ${mimetype}. Intenta convertirlo a PDF, Word o texto plano.`);
      }

    } else {
      throw new Error(`Tipo de archivo no soportado: ${mimetype}. Archivos permitidos: PDF, Word (.docx/.doc), PowerPoint (.pptx/.ppt), Texto plano (.txt), RTF, ODT.`);
    }

    // Limpiar y validar el texto extraído
    extractedText = extractedText.trim();

    if (extractedText.length < 100) {
      throw new Error('El archivo no contiene suficiente contenido para generar preguntas. Asegúrate de que el archivo tenga al menos 100 caracteres de texto legible.');
    }

    // Limitar el contenido para evitar problemas de procesamiento
    // Gemini tiene límites de tokens, así que limitamos a aproximadamente 30000 caracteres
    if (extractedText.length > 30000) {
      extractedText = extractedText.substring(0, 30000) + '\n\n[Contenido truncado para optimizar el procesamiento...]';
    }

    return extractedText;

  } catch (error) {
    console.error('Error extrayendo texto del archivo:', error.message);

    // Si el error es por archivo vacío o falta de contenido, propagarlo
    if (error.message.includes('vacío') || error.message.includes('contenido') || error.message.includes('suficiente')) {
      throw error;
    }

    // Si es un error de tipo de archivo no soportado, propagarlo
    if (error.message.includes('Tipo de archivo no soportado') || error.message.includes('no soportado')) {
      throw error;
    }

    // Para otros errores de procesamiento, devolver un mensaje informativo
    throw new Error(`Error procesando el archivo: ${error.message}. Asegúrate de que el archivo no esté corrupto y sea de un formato soportado.`);
  }
};

module.exports = { 
  ensureUploadsDir, 
  isValidFileType, 
  extractTextFromFile,
  hasContent 
};