// ─── BOTTOM NAV (mobile) ─────────────────────────────────────
// Se inyecta automáticamente en todas las páginas

function renderBottomNav(activePage) {
  const items = [
    { id: 'index',   icon: '◈', label: 'Mercados', href: 'index.html' },
    { id: 'leagues', icon: '◆', label: 'Ligas',    href: 'leagues.html' },
    { id: 'create',  icon: '⊕', label: 'Crear',    href: 'create.html' },
    { id: 'profile', icon: '⊙', label: 'Perfil',   href: 'profile.html' },
  ];

  const html = items.map(i => `
    <button class="bottom-nav-item ${i.id === activePage ? 'active' : ''}"
            onclick="location.href='${i.href}'">
      <span class="bottom-nav-icon">${i.icon}</span>
      ${i.label}
    </button>
  `).join('');

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = html;
  document.body.appendChild(nav);
}
