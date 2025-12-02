// test-gemini.js - Archivo de prueba para Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

async function testGemini() {
  try {
    console.log("🧪 Iniciando prueba de Gemini...");
    
    // Verificar que tenemos API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ No se encontró GEMINI_API_KEY en el archivo .env");
    }
    
    console.log("✅ API Key encontrada");
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Probar diferentes modelos
    const modelos = ["gemini-pro", "gemini-1.0-pro", "models/gemini-pro"];
    
    for (const modeloNombre of modelos) {
      try {
        console.log(`\n🔍 Probando modelo: ${modeloNombre}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modeloNombre,
          generationConfig: {
            maxOutputTokens: 100,
          }
        });
        
        const result = await model.generateContent("Responde con la palabra 'FUNCIONA'");
        const response = await result.response;
        
        console.log(`✅ ${modeloNombre} funciona: ${response.text()}`);
        return; // Si uno funciona, salir
        
      } catch (error) {
        console.log(`❌ ${modeloNombre} falló: ${error.message}`);
      }
    }
    
    console.log("\n💡 Todos los modelos fallaron. Posibles soluciones:");
    console.log("1. Verifica que tu API key sea válida en https://aistudio.google.com/");
    console.log("2. Asegúrate de que la API key tenga permisos para Gemini");
    console.log("3. Verifica que no haya restricciones regionales en tu cuenta");
    console.log("4. Prueba con una versión diferente de la librería");
    
  } catch (error) {
    console.error("❌ Error general:", error.message);
  }
}

// Ejecutar la prueba
testGemini();