// ─── API CLIENT ──────────────────────────────────────────────
// Sustituye las llamadas a data.js por llamadas reales al backend.
// Cambia BASE_URL si despliegas el backend a otro servidor.

var API = BASE_URL;

// Usuario activo (en Semana 4 vendrá de la wallet conectada)
// Por ahora usamos el usuario de prueba creado en schema.sql
const TEST_USER_ID = null; // se rellena al cargar

// ─── MARKETS ────────────────────────────────────────────────

async function getMarkets(category = 'all') {
  const url = category === 'all'
    ? `${API}/markets`
    : `${API}/markets?category=${category}`;
  const res  = await fetch(url);
  const data = await res.json();
  return data;
}

async function getMarket(id) {
  const res  = await fetch(`${API}/markets/${id}`);
  const data = await res.json();
  return data;
}

async function createMarket(payload) {
  const res = await fetch(`${API}/markets`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  return res.json();
}

// ─── PREDICTIONS ────────────────────────────────────────────

async function placePrediction(market_id, side, amount) {
  const user_id = getCurrentUserId();
  if (!user_id) return { error: 'No hay usuario activo' };

  const res = await fetch(`${API}/predictions`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ user_id, market_id, side, amount }),
  });
  return res.json();
}

async function getUserPredictions(user_id) {
  const res  = await fetch(`${API}/predictions/user/${user_id}`);
  return res.json();
}

// ─── USERS ──────────────────────────────────────────────────

async function getUser(id) {
  const res = await fetch(`${API}/users/${id}`);
  return res.json();
}

async function getUserStats(id) {
  const res = await fetch(`${API}/users/${id}/stats`);
  return res.json();
}

// Crea o recupera usuario por wallet (Semana 4: llamar tras conectar wallet)
async function loginWithWallet(wallet_address) {
  const res = await fetch(`${API}/users`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ wallet_address }),
  });
  const user = await res.json();
  localStorage.setItem('foresight_user_id', user.id);
  return user;
}

// ─── LEAGUES ────────────────────────────────────────────────

async function getLeague(tier) {
  const res = await fetch(`${API}/leagues/${tier}`);
  return res.json();
}

// ─── UTILS ──────────────────────────────────────────────────

function getCurrentUserId() {
  return localStorage.getItem('foresight_user_id');
}

// Carga el usuario guardado en localStorage
async function loadCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUser(id);
}
