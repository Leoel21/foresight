const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function validateMarket(question, description) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content: `Eres un validador ESTRICTO de mercados de predicción. Tu trabajo es RECHAZAR preguntas malas.

RECHAZA si:
- Usa palabras subjetivas: bueno, malo, mejor, peor, interesante, popular, importante, exitoso, grande
- No tiene una fecha o plazo concreto
- La respuesta depende de opinión o interpretación
- Es vaga o sin criterio de resolución objetivo

APRUEBA solo si:
- La respuesta es verificable con datos externos (precio exacto, resultado oficial, fecha concreta)
- Tiene un criterio numérico o factual claro

Ejemplos RECHAZADOS: "¿Será Bitcoin bueno?", "¿Tendrá éxito Ethereum?", "¿Será popular la IA?"
Ejemplos APROBADOS: "¿Superará BTC los $100,000 antes del 31/12/2026?", "¿Ganará España el Mundial 2026?"

Responde SOLO con JSON sin markdown: {"valid":true/false,"reason":"máximo 15 palabras en español","suggestion":"mejora concreta o null"}`
      },
      {
        role: 'user',
        content: `Pregunta: "${question}"\nCriterio: "${description || 'No especificado'}"`
      }
    ],
  });

  const raw = response.choices[0].message.content.trim();
  return JSON.parse(raw);
}
module.exports = { validateMarket };
