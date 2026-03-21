// ─── ORÁCULO DE RESOLUCIÓN ────────────────────────────────
// Comprueba mercados cerrados y los resuelve automáticamente.
// Semana 2: lógica básica con APIs externas.
// Semana 3: añadir Chainlink o API3 para resolución onchain.

const supabase = require('../db/supabase');

// Llama a esto con un cron job cada hora
// o manualmente con: node services/oracle.js
async function resolveExpiredMarkets() {
  const now = new Date().toISOString();

  // Buscar mercados cerrados no resueltos
  const { data: markets } = await supabase
    .from('markets')
    .select('*')
    .eq('resolved', false)
    .lt('closes_at', now);

  if (!markets?.length) {
    console.log('No hay mercados pendientes de resolver');
    return;
  }

  for (const market of markets) {
    console.log(`Resolviendo mercado ${market.id}: ${market.question}`);

    const result = await fetchResult(market);
    if (result === null) {
      console.log(`  → Sin datos disponibles aún, saltando`);
      continue;
    }

    await settleMarket(market, result);
  }
}

// ─── FETCH RESULT ─────────────────────────────────────────
// En producción: conectar APIs reales según la categoría
async function fetchResult(market) {
  if (market.category === 'crypto') {
    return await fetchCryptoResult(market);
  }
  // Política, deportes, ciencia: resolver manualmente por ahora
  // Semana 4: integrar con Polymarket API o Kleros para arbitraje
  return null;
}

async function fetchCryptoResult(market) {
  try {
    // Extrae el símbolo de la pregunta (básico)
    const symbols = { bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL' };
    const q = market.question.toLowerCase();
    const symbol = Object.entries(symbols).find(([k]) => q.includes(k))?.[1];
    if (!symbol) return null;

    // CoinGecko API (gratis, sin key)
    const ids = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana' };
    const res  = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids[symbol]}&vs_currencies=usd`);
    const data = await res.json();
    const price = data[ids[symbol]]?.usd;
    if (!price) return null;

    // Extrae el umbral de precio de la pregunta con regex
    const match = market.question.match(/\$?([\d,]+(?:\.\d+)?)\s*[Kk]?/);
    if (!match) return null;

    let threshold = parseFloat(match[1].replace(',', ''));
    if (market.question.toLowerCase().includes('k')) threshold *= 1000;

    console.log(`  → ${symbol}: $${price} | Umbral: $${threshold}`);
    return price >= threshold; // true = SÍ ganó
  } catch (e) {
    console.error('Error fetch crypto:', e.message);
    return null;
  }
}

// ─── SETTLE ───────────────────────────────────────────────
async function settleMarket(market, yesWon) {
  // Marcar mercado como resuelto
  await supabase
    .from('markets')
    .update({ resolved: true, result: yesWon ? 'yes' : 'no' })
    .eq('id', market.id);

  // Buscar todas las predicciones de este mercado
  const { data: preds } = await supabase
    .from('predictions')
    .select('id, user_id, side, amount')
    .eq('market_id', market.id);

  if (!preds?.length) return;

  const winningSide = yesWon ? 'yes' : 'no';
  const winners     = preds.filter(p => p.side === winningSide);
  const totalPool   = preds.reduce((s, p) => s + parseFloat(p.amount), 0);
  const netPool     = totalPool * 0.97; // 3% fees

  // Calcular payout proporcional
  const winnerTotal = winners.reduce((s, p) => s + parseFloat(p.amount), 0);

  for (const pred of preds) {
    const won    = pred.side === winningSide;
    const payout = won ? (parseFloat(pred.amount) / winnerTotal) * netPool : 0;

    // Actualizar predicción
    await supabase
      .from('predictions')
      .update({ correct: won, payout: payout.toFixed(4) })
      .eq('id', pred.id);

    // Actualizar balance y XP del usuario
    const xpGain = won ? 100 + Math.floor(payout * 10) : 0;
    const { data: user } = await supabase
      .from('users')
      .select('balance, xp, accuracy, predictions_count')
      .eq('id', pred.user_id)
      .single();

    if (!user) continue;

    const newPredCount = user.predictions_count + 1;
    // Recalcular accuracy acumulado
    const newAccuracy = Math.round(
      ((user.accuracy / 100 * user.predictions_count) + (won ? 1 : 0)) / newPredCount * 100
    );

    await supabase
      .from('users')
      .update({
        balance:           (parseFloat(user.balance) + payout).toFixed(4),
        xp:                user.xp + xpGain,
        accuracy:          newAccuracy,
        predictions_count: newPredCount,
      })
      .eq('id', pred.user_id);
  }

  console.log(`  → Mercado ${market.id} resuelto. Resultado: ${winningSide}. ${winners.length} ganadores.`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resolveExpiredMarkets().then(() => process.exit(0));
}

module.exports = { resolveExpiredMarkets };
