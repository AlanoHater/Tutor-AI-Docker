// config/openaiConfig.js - VERSIÓN CON RESPUESTAS PARA PREGUNTAS ABIERTAS

const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const limpiarTexto = (texto) => {
  if (!texto) return "";
  return texto.replace(/\s+/g, " ").trim().substring(0, 30000);
};

const crearPromptPreguntas = (textoDocumento, tipo, cantidad, materia) => {
  const tipoTexto = {
    'opcion_multiple': 'opción múltiple',
    'verdadero_falso': 'verdadero/falso', 
    'preguntas_abiertas': 'preguntas abiertas'
  }[tipo] || 'opción múltiple';

  return `
Eres un experto en crear evaluaciones educativas. Crea ${cantidad} preguntas de ${tipoTexto} sobre "${materia}" basándote EXCLUSIVAMENTE en este contenido:

CONTENIDO DEL DOCUMENTO:
"""
${textoDocumento}
"""

INSTRUCCIONES ESTRICTAS:
1. Usa SOLO información del contenido proporcionado
2. Crea EXACTAMENTE ${cantidad} preguntas
3. Tipo: ${tipoTexto}
4. Las preguntas deben ser variadas y cubrir diferentes partes del contenido
5. Para cada pregunta, DEBES incluir una RESPUESTA CORRECTA basada en el contenido
6. NO inventes información que no esté en el documento

${tipo === 'opcion_multiple' ? `
PARA OPCIÓN MÚLTIPLE:
- 4 opciones por pregunta (A, B, C, D)
- Solo UNA opción correcta
- Las opciones incorrectas deben ser plausibles pero incorrectas
- La respuesta correcta debe estar en diferentes posiciones (A, B, C, D)
- Formato: {"texto": "pregunta", "tipo": "opcion_multiple", "opciones": ["opción A", "opción B", "opción C", "opción D"], "respuesta": "A"}
` : ''}

${tipo === 'verdadero_falso' ? `
PARA VERDADERO/FALSO:
- Crea afirmaciones basadas en el contenido
- Mezcla afirmaciones verdaderas y falsas de forma balanceada
- Las afirmaciones falsas deben ser creíbles pero incorrectas
- Formato: {"texto": "afirmación", "tipo": "verdadero_falso", "respuesta": "Verdadero"}
` : ''}

${tipo === 'preguntas_abiertas' ? `
PARA PREGUNTAS ABIERTAS:
- Crea preguntas que requieran análisis y reflexión
- Las preguntas deben motivar respuestas elaboradas
- Para CADA pregunta, incluye una RESPUESTA CORRECTA basada en el contenido
- La respuesta debe ser concisa pero completa (2-4 oraciones)
- La respuesta DEBE usar información específica del contenido
- Formato: {"texto": "pregunta", "tipo": "preguntas_abiertas", "respuesta": "respuesta correcta basada en el contenido"}
` : ''}

IMPORTANTE: Devuelve SOLAMENTE un array JSON válido con ${cantidad} preguntas. No incluyas texto adicional, explicaciones, ni comentarios.

EJEMPLO DE RESPUESTA CORRECTA PARA PREGUNTAS ABIERTAS:
[
  {
    "texto": "Explique la diferencia entre IA débil e IA fuerte según el contenido.",
    "tipo": "preguntas_abiertas",
    "respuesta": "Según el contenido, la IA débil está diseñada para realizar tareas específicas como el reconocimiento de voz, mientras que la IA fuerte busca crear máquinas capaces de entender y aprender cualquier tarea intelectual humana, imitando completamente la inteligencia humana."
  }
]
`;
};

// Modelos disponibles
const MODELOS_DISPONIBLES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-001", 
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
];

async function generarPreguntasConOpenAI(textoDocumento, tipo, cantidad, materia) {
  console.log("=== INICIANDO GEMINI ===");
  console.log("Parámetros:", { tipo, cantidad, materia });
  console.log("Longitud texto:", textoDocumento?.length || 0);

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: No hay API key de Gemini");
    throw new Error("API key de Gemini no configurada en .env");
  }

  const textoLimpio = limpiarTexto(textoDocumento);
  
  if (!textoLimpio || textoLimpio.length < 100) {
    console.error("ERROR: Texto insuficiente");
    throw new Error("El contenido del archivo es insuficiente para generar preguntas");
  }

  console.log(`Generando ${cantidad} preguntas de ${tipo} para ${materia}`);

  const prompt = crearPromptPreguntas(textoLimpio, tipo, cantidad, materia);
  console.log("Prompt creado (primeros 500 chars):", prompt.substring(0, 500) + "...");

  let ultimoError = null;

  // Probar cada modelo
  for (const modelo of MODELOS_DISPONIBLES) {
    try {
      console.log(`🔍 Probando modelo: ${modelo}`);
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]) {
        const raw = response.data.candidates[0].content.parts[0].text.trim();
        console.log(`✅ ${modelo} funcionó`);
        console.log("Respuesta completa:", raw);

        let jsonText = raw;
        
        // Limpiar markdown
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Buscar array JSON
        const inicio = jsonText.indexOf("[");
        const fin = jsonText.lastIndexOf("]");

        if (inicio === -1 || fin === -1) {
          console.error("❌ No se encontró JSON válido en la respuesta");
          console.error("Respuesta recibida:", raw.substring(0, 500));
          throw new Error("La IA no devolvió un formato JSON válido");
        }

        const json = jsonText.substring(inicio, fin + 1);
        console.log("JSON extraído:", json);
        
        const preguntas = JSON.parse(json);

        // Validar preguntas
        if (!Array.isArray(preguntas) || preguntas.length === 0) {
          throw new Error("La IA devolvió un array vacío de preguntas");
        }

        // Validar que las preguntas abiertas tengan respuesta
        if (tipo === 'preguntas_abiertas') {
          for (let i = 0; i < preguntas.length; i++) {
            if (!preguntas[i].respuesta) {
              console.warn(`⚠️ Pregunta ${i + 1} no tiene respuesta. Agregando respuesta por defecto.`);
              preguntas[i].respuesta = "Respuesta basada en el análisis del contenido proporcionado.";
            }
          }
        }

        console.log(`🎉 Éxito: ${preguntas.length} preguntas generadas con ${modelo}`);
        
        return preguntas;
      } else {
        throw new Error("Respuesta vacía de la IA");
      }
    } catch (error) {
      ultimoError = error;
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.log(`❌ ${modelo} falló: ${errorMsg}`);
      // Continuar con siguiente modelo
    }
  }

  // Si llegamos aquí, todos los modelos fallaron
  console.error("❌ Todos los modelos fallaron");
  throw new Error(`Todos los modelos de Gemini fallaron. Último error: ${ultimoError?.response?.data?.error?.message || ultimoError?.message}`);
}

module.exports = { 
  generarPreguntasConOpenAI 
};