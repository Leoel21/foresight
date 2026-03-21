const express  = require('express');
const router   = express.Router();
const supabase = require('../db/supabase');

// GET /api/leagues/:tier — leaderboard de una liga
router.get('/:tier', async (req, res) => {
  const { tier } = req.params;
  const valid = ['bronze','silver','gold','diamond'];
  if (!valid.includes(tier)) return res.status(400).json({ error: 'Liga inválida' });

  const { data, error } = await supabase
    .from('users')
    .select('id, username, xp, streak, accuracy, predictions_count, league')
    .eq('league', tier)
    .order('xp', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  // Añadir rank
  const ranked = data.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(ranked);
});

// POST /api/leagues/promote — promueve/degrada usuarios al final de la semana
// (Se llamará desde un cron job en producción)
router.post('/promote', async (req, res) => {
  const TIERS    = ['bronze', 'silver', 'gold', 'diamond'];
  const SIZES    = { bronze: 150, silver: 75, gold: 50, diamond: 25 };
  const PROMO_PC = 0.2; // top 20% sube
  const DEMO_PC  = 0.2; // bottom 20% baja

  for (const tier of TIERS) {
    const { data: users } = await supabase
      .from('users')
      .select('id, xp')
      .eq('league', tier)
      .order('xp', { ascending: false });

    if (!users?.length) continue;

    const size      = users.length;
    const promoN    = Math.floor(size * PROMO_PC);
    const demoN     = Math.floor(size * DEMO_PC);
    const nextTier  = TIERS[TIERS.indexOf(tier) + 1];
    const prevTier  = TIERS[TIERS.indexOf(tier) - 1];

    // Subir top promoN (si no son ya Diamante)
    if (nextTier) {
      const toPromote = users.slice(0, promoN).map(u => u.id);
      await supabase.from('users').update({ league: nextTier }).in('id', toPromote);
    }

    // Bajar bottom demoN (si no son ya Bronce)
    if (prevTier) {
      const toDemote = users.slice(-demoN).map(u => u.id);
      await supabase.from('users').update({ league: prevTier }).in('id', toDemote);
    }

    // Resetear XP semanal (guardar en historial primero)
    await supabase
      .from('league_history')
      .insert(users.map((u, i) => ({ user_id: u.id, tier, xp: u.xp, rank: i + 1, week: new Date().toISOString().split('T')[0] })));

    await supabase.from('users').update({ xp: 0 }).eq('league', tier);
  }

  res.json({ ok: true, message: 'Promoción completada' });
});

module.exports = router;
