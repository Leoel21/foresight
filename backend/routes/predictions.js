const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

// POST /api/predictions — hacer una predicción
router.post('/', async (req, res) => {
  const { user_id, market_id, side, amount } = req.body;

  if (!user_id || !market_id || !side || !amount) {
    return res.status(400).json({ error: 'Faltan campos' });
  }
  if (!['yes', 'no'].includes(side)) {
    return res.status(400).json({ error: 'side debe ser "yes" o "no"' });
  }
  if (amount < 0.1 || amount > 10) {
    return res.status(400).json({ error: 'Cantidad entre 0.1 y 10 USDC' });
  }

  // Comprobar que el mercado existe y está abierto
  const { data: market } = await supabase
    .from('markets')
    .select('id, resolved, closes_at, yes_pct, no_pct, pool, participants')
    .eq('id', market_id)
    .single();

  if (!market)          return res.status(404).json({ error: 'Mercado no encontrado' });
  if (market.resolved)  return res.status(400).json({ error: 'Mercado ya resuelto' });
  if (new Date(market.closes_at) < new Date()) {
    return res.status(400).json({ error: 'Mercado cerrado' });
  }

  // Comprobar que el usuario no ha apostado ya en este mercado
  const { data: existing } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', user_id)
    .eq('market_id', market_id)
    .single();

  if (existing) return res.status(400).json({ error: 'Ya has apostado en este mercado' });

  // Guardar predicción
  const { data: prediction, error } = await supabase
    .from('predictions')
    .insert([{ user_id, market_id, side, amount }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Actualizar pool y participantes del mercado
  const newPool    = parseFloat(market.pool) + parseFloat(amount);
  const newParts   = market.participants + 1;

  // Recalcular porcentajes (simplificado, sin weighting complejo)
  const totalYes = side === 'yes' ? (market.yes_pct / 100 * market.pool) + amount : (market.yes_pct / 100 * market.pool);
  const newYesPct = Math.round((totalYes / newPool) * 100);

  await supabase
    .from('markets')
    .update({ pool: newPool, participants: newParts, yes_pct: newYesPct, no_pct: 100 - newYesPct })
    .eq('id', market_id);

  // Actualizar racha y XP del usuario
  await updateStreak(user_id);

  res.status(201).json({ prediction, market_id, side, amount });
});

// GET /api/predictions/user/:user_id — historial de un usuario
router.get('/user/:user_id', async (req, res) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, markets(question, category, closes_at)')
    .eq('user_id', req.params.user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ─── HELPER ──────────────────────────────────────────────
async function updateStreak(user_id) {
  const { data: user } = await supabase
    .from('users')
    .select('streak, last_prediction_date, xp')
    .eq('id', user_id)
    .single();

  if (!user) return;

  const today     = new Date().toISOString().split('T')[0];
  const lastDate  = user.last_prediction_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = user.streak;
  if (lastDate === today) {
    // Ya predijo hoy, no cambia racha
    return;
  } else if (lastDate === yesterday) {
    newStreak += 1; // Racha continua
  } else {
    newStreak = 1;  // Racha rota
  }

  const bonusXP = 10 + (newStreak >= 7 ? 20 : 0) + (newStreak >= 30 ? 40 : 0);

  await supabase
    .from('users')
    .update({
      streak: newStreak,
      last_prediction_date: today,
      xp: user.xp + bonusXP,
    })
    .eq('id', user_id);
}

module.exports = router;
