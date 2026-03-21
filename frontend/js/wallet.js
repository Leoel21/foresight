// ─── WALLET.JS ───────────────────────────────────────────────
// Gestiona la conexión con MetaMask y la autenticación onchain.

var SEPOLIA_CHAIN_ID = '0xaa36a7';
var currentWallet = null;


function getWallet() {
  return currentWallet;
}

function isConnected() {
  return !!currentWallet;
}

// ─── CONECTAR ────────────────────────────────────────────────
async function connectWallet() {
  if (!window.ethereum) {
    alert('MetaMask no está instalado.\nInstálalo en metamask.io');
    return null;
  }

  try {
    // 1. Pedir acceso a las cuentas
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address  = accounts[0];

    // 2. Cambiar a Sepolia testnet
    await switchToSepolia();

    // 3. Obtener nonce del backend
    const nonceRes = await fetch(`${API}/auth/nonce/${address}`);
    const { message } = await nonceRes.json();

    // 4. Pedir firma al usuario (abre MetaMask)
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    // 5. Verificar firma en el backend y obtener usuario
    const verifyRes = await fetch(`${API}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature }),
    });

    const { user, error } = await verifyRes.json();
    if (error) throw new Error(error);

    // 6. Guardar sesión
    currentWallet = { address, user };
    localStorage.setItem('foresight_user_id',      user.id);
    localStorage.setItem('foresight_wallet_address', address);

    return currentWallet;

  } catch (e) {
    if (e.code === 4001) {
      console.log('Usuario rechazó la conexión');
    } else {
      console.error('Error conectando wallet:', e.message);
    }
    return null;
  }
}

// ─── SEPOLIA ─────────────────────────────────────────────────
async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (e) {
    // Si Sepolia no está añadida, la añadimos
    if (e.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      });
    }
  }
}

// ─── DESCONECTAR ─────────────────────────────────────────────
function disconnectWallet() {
  currentWallet = null;
  localStorage.removeItem('foresight_user_id');
  localStorage.removeItem('foresight_wallet_address');
  updateNavWallet(null);
}

// ─── RESTAURAR SESIÓN ────────────────────────────────────────
async function restoreSession() {
  const savedAddress = localStorage.getItem('foresight_wallet_address');
  const savedUserId  = localStorage.getItem('foresight_user_id');
  if (!savedAddress || !savedUserId) return null;

  // Comprobar que MetaMask sigue conectado a la misma cuenta
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts[0] || accounts[0].toLowerCase() !== savedAddress.toLowerCase()) {
    disconnectWallet();
    return null;
  }

  // Recuperar usuario del backend
  const res  = await fetch(`${API}/users/${savedUserId}`);
  const user = await res.json();
  if (user.error) { disconnectWallet(); return null; }

  currentWallet = { address: savedAddress, user };
  return currentWallet;
}

// ─── ACTUALIZAR NAV ──────────────────────────────────────────
function updateNavWallet(wallet) {
  const btn = document.getElementById('wallet-btn');
  if (!btn) return;

  if (wallet) {
    const short = `${wallet.address.slice(0,6)}...${wallet.address.slice(-4)}`;
    btn.textContent = short;
    btn.style.background = 'rgba(62,207,178,0.1)';
    btn.style.borderColor = 'rgba(62,207,178,0.3)';
    btn.style.color = 'var(--teal)';
    btn.onclick = disconnectWallet;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'inline';
  } else {
    btn.textContent = 'Conectar wallet';
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.onclick = handleConnectClick;
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

async function handleConnectClick() {
  const btn = document.getElementById('wallet-btn');
  if (btn) { btn.textContent = 'Conectando...'; btn.disabled = true; }

  const wallet = await connectWallet();
  updateNavWallet(wallet);

  if (btn) btn.disabled = false;
  if (wallet) location.reload();
}

// ─── ESCUCHAR CAMBIOS DE CUENTA ──────────────────────────────
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (!accounts.length) disconnectWallet();
    else location.reload();
  });

  window.ethereum.on('chainChanged', () => location.reload());
}
