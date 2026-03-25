const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');
const { validateMarket } = require('../services/validator');

router.get('/', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('markets').select('*').eq('resolved', false).order('pool', { ascending: false });
  if (category && category !== 'all') query = query.eq('category', category);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('markets').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Mercado no encontrado' });
  res.json(data);
});

router.post('/validate', async (req, res) => {
  const { question, description } = req.body;
  if (!question) return res.status(400).json({ error: 'Pregunta requerida' });
  try {
    const result = await validateMarket(question, description);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Error al validar', valid: true });
  }
});

router.post('/', async (req, res) => {
  const { question, description, category, closes_at, created_by } = req.body;
  if (!question || !category || !closes_at) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const validation = await validateMarket(question, description);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason, suggestion: validation.suggestion, rejected: true });
    }
  } catch (e) {
    console.error('Error validador IA:', e.message);
  }
  const { data, error } = await supabase
    .from('markets')
    .insert([{ question, description, category, closes_at, created_by: created_by || null, yes_pct: 50, no_pct: 50, pool: 0, participants: 0, resolved: false }])
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
// POST /api/markets/:id/resolve — resolver un mercado
router.post('/:id/resolve', async (req, res) => {
  const { result, tx_hash } = req.body;
  if (!['yes', 'no'].includes(result)) {
    return res.status(400).json({ error: 'result debe ser yes o no' });
  }

  const { data: market } = await supabase
    .from('markets')
    .select('id, pool, yes_pct, no_pct')
    .eq('id', req.params.id)
    .single();

  if (!market) return res.status(404).json({ error: 'Mercado no encontrado' });

  // Marcar mercado como resuelto
  await supabase
    .from('markets')
    .update({ resolved: true, result })
    .eq('id', req.params.id);

  // Calcular payouts para los ganadores
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('market_id', req.params.id);

  if (predictions && predictions.length) {
    const winners = predictions.filter(p => p.side === result);
    const totalPool = parseFloat(market.pool);
    const netPool = totalPool * 0.97;
    const winningSideTotal = winners.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    for (const p of predictions) {
      const correct = p.side === result;
      const payout = correct && winningSideTotal > 0
        ? (parseFloat(p.amount) / winningSideTotal) * netPool
        : 0;

      await supabase
        .from('predictions')
        .update({ correct, payout: correct ? payout.toFixed(4) : 0 })
        .eq('id', p.id);

      // Actualizar accuracy del usuario
      if (correct) {
        await supabase.rpc('increment', { table: 'users', id: p.user_id, column: 'xp', amount: 50 });
      }
    }
  }

  res.json({ success: true, result, tx_hash });
});

module.exports = router;
