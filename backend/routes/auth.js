const express = require('express');
const router  = express.Router();
const { ethers } = require('ethers');
const supabase = require('../db/supabase');

// GET /api/auth/nonce/:address — genera un nonce para firmar
router.get('/nonce/:address', async (req, res) => {
  const address = req.params.address.toLowerCase();
  const nonce   = Math.floor(Math.random() * 1000000).toString();
  const message = `Bienvenido a Foresight!\n\nFirma este mensaje para verificar tu wallet.\n\nNonce: ${nonce}`;

  // Guardar nonce en Supabase temporalmente
  await supabase.from('nonces').upsert({ address, nonce, created_at: new Date().toISOString() });

  res.json({ message, nonce });
});

// POST /api/auth/verify — verifica la firma y devuelve el usuario
router.post('/verify', async (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature) return res.status(400).json({ error: 'Faltan campos' });

  const addr = address.toLowerCase();

  // Recuperar nonce
  const { data: nonceRow } = await supabase
    .from('nonces')
    .select('nonce')
    .eq('address', addr)
    .single();

  if (!nonceRow) return res.status(400).json({ error: 'Nonce no encontrado. Reintenta.' });

  const message = `Bienvenido a Foresight!\n\nFirma este mensaje para verificar tu wallet.\n\nNonce: ${nonceRow.nonce}`;

  // Verificar que la firma corresponde a la address
  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== addr) {
      return res.status(401).json({ error: 'Firma inválida' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'Error verificando firma' });
  }

  // Borrar nonce usado
  await supabase.from('nonces').delete().eq('address', addr);

  // Buscar o crear usuario
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', addr)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from('users')
      .insert([{
        wallet_address: addr,
        username: `user_${addr.slice(2, 8)}`,
        xp: 0, streak: 0, balance: 0,
        accuracy: 0, predictions_count: 0,
        league: 'bronze',
      }])
      .select()
      .single();
    user = newUser;
  }

  res.json({ user });
});

module.exports = router;
