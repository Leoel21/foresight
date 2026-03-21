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

module.exports = router;
