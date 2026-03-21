// ─── DATOS FICTICIOS ────────────────────────────────────────
// Semana 1: todo hardcodeado aquí.
// Semana 2: esto se sustituye por llamadas al backend.

var CURRENT_USER = {
  initials: 'AR',
  username: 'ariverol',
  streak: 14,
  xp: 4200,
  balance: 142.5,
  accuracy: 68,
  predictions: 89,
  league: 'Oro',
  leagueRank: 23,
  leagueTotal: 200,
  leagueProgress: 68, // porcentaje barra
};

const MARKETS = [
  {
    id: 1,
    question: '¿Superará Ethereum los $6,000 antes de fin de año?',
    category: 'crypto',
    pool: 14820,
    yes: 63,
    no: 37,
    closes: '8d 14h',
    participants: 2341,
    created_by: 'cryptoking',
    description: 'Mercado basado en el precio de ETH/USD en Binance al cierre del 31 de diciembre de 2026.',
    resolved: false,
  },
  {
    id: 2,
    question: '¿Ganará el partido conservador las elecciones alemanas de otoño?',
    category: 'politics',
    pool: 9440,
    yes: 51,
    no: 49,
    closes: '23d 6h',
    participants: 1892,
    created_by: 'politico_es',
    description: 'Se resuelve según el resultado oficial publicado por la Comisión Electoral Federal alemana.',
    resolved: false,
  },
  {
    id: 3,
    question: '¿Ganará el Real Madrid la próxima Champions League?',
    category: 'sports',
    pool: 22100,
    yes: 28,
    no: 72,
    closes: '45d',
    participants: 4210,
    created_by: 'futbol_data',
    description: 'Resuelto al finalizar la final de la UEFA Champions League 2026.',
    resolved: false,
  },
  {
    id: 4,
    question: '¿Publicará OpenAI un modelo GPT-5 antes de septiembre de 2026?',
    category: 'science',
    pool: 6780,
    yes: 74,
    no: 26,
    closes: '163d',
    participants: 987,
    created_by: 'aiwatch_',
    description: 'Se considera válido cualquier anuncio oficial de OpenAI con nombre GPT-5 o equivalente.',
    resolved: false,
  },
  {
    id: 5,
    question: '¿Alcanzará Bitcoin los $200,000 en 2026?',
    category: 'crypto',
    pool: 38400,
    yes: 41,
    no: 59,
    closes: '287d',
    participants: 6120,
    created_by: 'btcmaxi_99',
    description: 'Precio de BTC/USD en cualquier exchange top-5 por volumen.',
    resolved: false,
  },
  {
    id: 6,
    question: '¿Llegará Elon Musk a Marte antes de 2030?',
    category: 'science',
    pool: 3210,
    yes: 18,
    no: 82,
    closes: '1400d',
    participants: 445,
    created_by: 'ariverol', // el propio usuario
    description: 'Se resuelve si Elon Musk pisa físicamente suelo marciano antes del 1 enero 2030.',
    resolved: false,
  },
];

const LEADERBOARD = [
  { rank: 1, initials: 'CK', username: 'cryptoking',  xp: 12400, gradient: 'linear-gradient(135deg,#e8c547,#c9a93a)', textColor: '#0a0a0f' },
  { rank: 2, initials: 'EM', username: 'elisa.m',     xp: 11100, gradient: 'linear-gradient(135deg,#9b7ff4,#7c5ee0)', textColor: '#fff' },
  { rank: 3, initials: 'DV', username: 'datavibes',   xp: 9800,  gradient: 'linear-gradient(135deg,#3ecfb2,#2aaf96)', textColor: '#fff' },
  { rank: 23, initials: 'AR', username: 'ariverol',   xp: 4200,  gradient: 'linear-gradient(135deg,#9b7ff4,#3ecfb2)', textColor: '#fff', isMe: true },
  { rank: 24, initials: 'PG', username: 'pgomez_',    xp: 4000,  gradient: '#1f1f28', textColor: '#7a7880' },
];

const ACTIVITY = [
  { type: 'win',    text: 'Acertaste',  market: '¿Superará SOL los $300?',         amount: '+1.8 USDC',  xp: '+120 XP', time: '2h' },
  { type: 'lose',   text: 'Fallaste',   market: '¿Gana España el Eurobasket?',     amount: '-0.5 USDC',  xp: null,      time: '1d' },
  { type: 'win',    text: 'Acertaste',  market: '¿Baja la inflación EU en marzo?', amount: '+2.2 USDC',  xp: '+95 XP',  time: '2d' },
  { type: 'create', text: 'Creaste',    market: '¿Llega Musk a Marte en 2026?',    amount: null,         xp: null,      time: '3d', extra: '44 participantes' },
];

const DAILY_CHALLENGE = {
  question: '¿Superará Bitcoin los $120K antes del 1 de julio?',
  streakMultiplier: 2,
  bonusUsdc: 0.5,
  marketId: 5,
};
