const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

// GET /api/users/:id — perfil completo
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
});

// POST /api/users — crear usuario (primera vez que conecta wallet)
router.post('/', async (req, res) => {
  const { wallet_address, username } = req.body;

  if (!wallet_address) return res.status(400).json({ error: 'wallet_address requerida' });

  // ¿Ya existe?
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single();

  if (existing) return res.json(existing);

  // Crear nuevo usuario
  const { data, error } = await supabase
    .from('users')
    .insert([{
      wallet_address,
      username: username || `user_${wallet_address.slice(2, 8)}`,
      xp:       0,
      streak:   0,
      balance:  0,
      accuracy: 0,
      predictions_count: 0,
      league:   'bronze',
      last_prediction_date: null,
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// GET /api/users/:id/stats — stats calculadas del usuario
router.get('/:id/stats', async (req, res) => {
  const { data: preds } = await supabase
    .from('predictions')
    .select('side, amount, correct, payout')
    .eq('user_id', req.params.id);

  if (!preds) return res.status(404).json({ error: 'No encontrado' });

  const resolved  = preds.filter(p => p.correct !== null);
  const correct   = resolved.filter(p => p.correct).length;
  const accuracy  = resolved.length ? Math.round((correct / resolved.length) * 100) : 0;
  const totalPnl  = preds.reduce((sum, p) => sum + (parseFloat(p.payout || 0) - parseFloat(p.amount)), 0);

  // Por categoría
  const { data: catPreds } = await supabase
    .from('predictions')
    .select('side, correct, markets(category)')
    .eq('user_id', req.params.id);

  const byCategory = {};
  (catPreds || []).forEach(p => {
    const cat = p.markets?.category;
    if (!cat) return;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, correct: 0 };
    byCategory[cat].total++;
    if (p.correct) byCategory[cat].correct++;
  });

  const categoryStats = Object.entries(byCategory).map(([cat, v]) => ({
    category: cat,
    predictions: v.total,
    accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }));

  res.json({ accuracy, totalPnl: totalPnl.toFixed(2), totalPredictions: preds.length, categoryStats });
});

module.exports = router;
