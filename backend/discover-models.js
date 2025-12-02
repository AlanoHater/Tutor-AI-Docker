// discover-models.js - Descubrir modelos disponibles
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

async function discoverModels() {
  try {
    console.log("🔍 Descubriendo modelos disponibles...");
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log("✅ Modelos disponibles:");
    response.data.models.forEach(model => {
      console.log(`📦 ${model.name} - ${model.displayName}`);
      console.log(`   Descripción: ${model.description}`);
      console.log(`   Métodos soportados: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('---');
    });

  } catch (error) {
    console.error("❌ Error al obtener modelos:", error.message);
    if (error.response) {
      console.error("Detalles:", error.response.data);
    }
  }
}

discoverModels();