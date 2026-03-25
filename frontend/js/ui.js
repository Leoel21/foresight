// ─── UI HELPERS ─────────────────────────────────────────────

function renderNav(activePage) {
  const pages = [
    { id: 'index',   label: 'Mercados',     href: 'index.html' },
    { id: 'create',  label: 'Crear mercado', href: 'create.html' },
    { id: 'profile', label: 'Mi perfil',     href: 'profile.html' },
    { id: 'leagues', label: 'Ligas',         href: 'leagues.html' },
  ];

  const links = pages.map(p => `
    <button class="nav-link ${p.id === activePage ? 'active' : ''}"
            onclick="location.href='${p.href}'">${p.label}</button>
  `).join('');

  document.getElementById('nav-placeholder').innerHTML = `
    <nav class="nav">
      <div class="nav-logo">fore<span>sight</span></div>
      <div class="nav-links">${links}</div>
      <div class="nav-right">
        <div class="streak-badge" id="streak-nav">
          <div class="streak-dot"></div>
          <span id="streak-nav-count">${CURRENT_USER.streak}</span> días
        </div>
        <button id="wallet-btn" class="btn-secondary" style="font-size:12px;padding:6px 14px;border-radius:20px"
                onclick="handleConnectClick()">
          Conectar wallet
        </button>
        <button id="logout-btn" onclick="disconnectWallet()"
                style="background:none;border:none;color:var(--muted);font-size:12px;cursor:pointer;padding:6px 8px;display:none">
          Salir
        </button>
        <div class="avatar" id="nav-avatar" onclick="location.href='profile.html'">${CURRENT_USER.initials}</div>
      </div>
    </nav>
  `;
  if (typeof restoreSession === 'function') {
    restoreSession().then(w => {
      if (w) {
        updateNavWallet(w);
        updateNavUser(w.user);
      }
    });
  }
}

function updateNavUser(user) {
  if (!user) return;
  const streakEl = document.getElementById('streak-nav-count');
  if (streakEl) streakEl.textContent = user.streak || 0;
  const avatarEl = document.getElementById('nav-avatar');
  if (avatarEl) avatarEl.textContent = (user.username || 'U').slice(0,2).toUpperCase();
}

function renderSidebar(marketCounts) {
  const counts = marketCounts || { all: MARKETS.length, crypto: 0, politics: 0, sports: 0, science: 0 };
  const cats = [
    { id: 'all',      label: 'Todos los mercados', icon: '◈', count: counts.all },
    { id: 'crypto',   label: 'Crypto',             icon: '◆', count: counts.crypto },
    { id: 'politics', label: 'Política',           icon: '◇', count: counts.politics },
    { id: 'sports',   label: 'Deportes',           icon: '◎', count: counts.sports },
    { id: 'science',  label: 'Ciencia & Tech',     icon: '○', count: counts.science },
  ];

  const catItems = cats.map(c => `
    <div class="sidebar-item ${c.id === 'all' ? 'active' : ''}"
         onclick="filterByCategory('${c.id}', this)">
      <span>${c.icon}</span>
      ${c.label}
      <span class="sidebar-count">${c.count}</span>
    </div>
  `).join('');

  document.getElementById('sidebar-placeholder').innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-label">Explorar</div>
      ${catItems}
      <div class="sidebar-divider"></div>
      <div class="sidebar-label">Cuenta</div>
      <div class="sidebar-item" onclick="location.href='profile.html'">
        <span>⊞</span> Mi perfil
      </div>
      <div class="sidebar-item" onclick="location.href='create.html'">
        <span>⊕</span> Crear mercado
      </div>
      <div class="sidebar-divider"></div>
      <div class="league-card" id="sidebar-league-card">
        <div class="league-header">
          <div class="league-name">◆ Liga ${CURRENT_USER.league}</div>
          <div class="league-rank" id="sidebar-rank">#${CURRENT_USER.leagueRank} / ${CURRENT_USER.leagueTotal}</div>
        </div>
        <div class="league-bar-bg">
          <div class="league-bar-fill" style="width:${CURRENT_USER.leagueProgress}%"></div>
        </div>
        <div class="league-info">Asciende top 10%</div>
      </div>
    </aside>
  `;
}

async function renderRightPanel() {
  const userId = localStorage.getItem('foresight_user_id');
  let user = CURRENT_USER;
  let stats = null;
  let lbData = LEADERBOARD;

  if (userId) {
    try {
      const [userRes, statsRes, lbRes] = await Promise.all([
        fetch(`${BASE_URL}/users/${userId}`),
        fetch(`${BASE_URL}/users/${userId}/stats`),
        fetch(`${BASE_URL}/leagues/gold`),
      ]);
      const userData  = await userRes.json();
      const statsData = await statsRes.json();
      const lb        = await lbRes.json();
      if (!userData.error)  user  = { ...CURRENT_USER, ...userData, initials: (userData.username||'U').slice(0,2).toUpperCase() };
      if (!statsData.error) stats = statsData;
      if (Array.isArray(lb) && lb.length) lbData = lb.map(u => ({
        rank: u.rank, initials: (u.username||'U').slice(0,2).toUpperCase(),
        username: u.username, xp: u.xp,
        isMe: u.id === userId,
        gradient: u.id === userId ? 'linear-gradient(135deg,var(--purple),var(--teal))' : 'var(--surface3)',
        textColor: u.id === userId ? '#fff' : 'var(--muted)',
      }));
    } catch(e) { console.warn('Usando datos locales:', e.message); }
  }

  const accuracy = stats ? stats.accuracy : user.accuracy;
  let balance = 0;
  try {
    const walletAddr = localStorage.getItem('foresight_wallet_address');
    if (walletAddr && typeof getUSDTBalance === 'function') {
      balance = await getUSDTBalance(walletAddr);
    }
  } catch(e) {
    balance = user.balance || 0;
  }
  const xp       = user.xp || 0;
  const preds    = stats ? stats.totalPredictions : user.predictions_count || 0;

  const statsHtml = `
    <div>
      <div class="panel-title">Mis stats</div>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Aciertos</div>
          <div class="stat-value">${accuracy}<span style="font-size:14px;color:var(--muted)">%</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Balance</div>
          <div class="stat-value">${parseFloat(balance).toFixed(1)}</div>
          <div class="stat-sub muted">USDC</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">XP total</div>
          <div class="stat-value">${xp >= 1000 ? (xp/1000).toFixed(1)+'k' : xp}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Predicciones</div>
          <div class="stat-value">${preds}</div>
        </div>
      </div>
    </div>
  `;

  const lbHtml = lbData.slice(0,8).map(u => `
    <div class="lb-item ${u.isMe ? 'me' : ''}">
      <div class="lb-rank ${u.rank <= 3 ? 'top' : ''}">${u.rank}</div>
      <div class="lb-avatar" style="background:${u.gradient};color:${u.textColor}">${u.initials}</div>
      <div class="lb-name ${u.isMe ? 'accent' : ''}">${u.isMe ? 'tú' : u.username}</div>
      <div class="lb-score">+${u.xp >= 1000 ? (u.xp/1000).toFixed(1)+'k' : u.xp} XP</div>
    </div>
  `).join('');

  let activityHtml = '<div style="font-size:12px;color:var(--muted);padding:8px 0">Conecta tu wallet para ver tu actividad</div>';
  if (userId) {
    try {
      const predRes = await fetch(`${BASE_URL}/predictions/user/${userId}`);
      const preds = await predRes.json();
      if (Array.isArray(preds) && preds.length) {
        activityHtml = preds.slice(0,4).map(p => {
          const won = p.correct === true;
          const lost = p.correct === false;
          const dotColor = won ? 'var(--teal)' : lost ? 'var(--coral)' : 'var(--accent)';
          const label = won ? 'Acertaste' : lost ? 'Fallaste' : 'Predicción';
          const extra = won ? `<span class="activity-win">+${parseFloat(p.payout).toFixed(2)} USDC</span>`
                       : lost ? `<span class="activity-lose">-${parseFloat(p.amount).toFixed(2)} USDC</span>`
                       : `<span class="muted">Pendiente</span>`;
          const q = p.markets?.question || 'Mercado';
          return `
            <div class="activity-item">
              <div class="activity-dot" style="background:${dotColor}"></div>
              <div class="activity-text"><strong>${label}</strong> — "${q.slice(0,40)}..." ${extra}</div>
            </div>`;
        }).join('');
      }
    } catch(e) {}
  }

  document.getElementById('right-panel-placeholder').innerHTML = `
    <aside class="right-panel">
      ${statsHtml}
      <div>
        <div class="panel-title">Leaderboard · Liga Oro</div>
        ${lbHtml}
      </div>
      <div>
        <div class="panel-title">Actividad reciente</div>
        ${activityHtml}
      </div>
    </aside>
  `;
}

function createMarketCard(market) {
  const card = document.createElement('div');
  card.className = `market-card ${market.category} fade-up`;
  card.onclick = () => location.href = `market.html?id=${market.id}`;
  const yes = market.yes_pct ?? market.yes ?? 50;
  const no  = market.no_pct  ?? market.no  ?? 50;
  const closes = market.closes_at ? formatDate(market.closes_at) : market.closes || '—';
  card.innerHTML = `
    <div class="market-top">
      <div class="market-question">${market.question}</div>
      <div><span class="cat-tag ${market.category}">${market.category}</span></div>
    </div>
    <div class="market-pool">Pool total: <strong>${Number(market.pool).toLocaleString()} USDC</strong></div>
    <div class="bet-row">
      <button class="bet-btn bet-yes" onclick="event.stopPropagation(); placeBet(this, 'yes')">
        <span class="bet-label">SÍ</span>
        <span class="bet-pct">${yes}%</span>
      </button>
      <button class="bet-btn bet-no" onclick="event.stopPropagation(); placeBet(this, 'no')">
        <span class="bet-label">NO</span>
        <span class="bet-pct">${no}%</span>
      </button>
    </div>
    <div class="bet-bar">
      <div class="bet-bar-yes" style="width:${yes}%"></div>
      <div class="bet-bar-no"  style="width:${no}%"></div>
    </div>
    <div class="market-footer">
      <div class="market-time"><div class="time-dot"></div>Cierra en ${closes}</div>
      <div class="market-participants">${Number(market.participants).toLocaleString()} participantes</div>
    </div>
  `;
  return card;
}

function formatDate(isoString) {
  const diff = new Date(isoString) - new Date();
  if (diff < 0) return 'Cerrado';
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function placeBet(btn, side) {
  const card = btn.closest('.market-card');
  card.querySelectorAll('.bet-btn').forEach(b => { b.style.opacity = '0.45'; b.onclick = null; });
  btn.style.opacity = '1';
  btn.style.background = side === 'yes' ? 'rgba(62,207,178,0.12)' : 'rgba(242,107,80,0.12)';
  btn.style.borderColor = side === 'yes' ? 'rgba(62,207,178,0.45)' : 'rgba(242,107,80,0.45)';
}

function filterByCategory(cat, clickedItem) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  clickedItem.classList.add('active');
  const grid = document.getElementById('markets-grid');
  if (!grid) return;
  getMarkets(cat === 'all' ? undefined : cat).then(markets => {
    grid.innerHTML = '';
    markets.forEach((m, i) => {
      const card = createMarketCard(m);
      card.style.animationDelay = `${i * 0.05}s`;
      grid.appendChild(card);
    });
  });
}
function updateNavWalletLogout(show) {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.style.display = show ? 'inline' : 'none';
}