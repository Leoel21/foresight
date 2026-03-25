const FORESIGHT_ABI = [
  "function createMarket(string calldata question, uint256 closesAt) external returns (uint256)",
  "function predict(uint256 marketId, uint8 side, uint256 amount) external",
  "function resolveMarket(uint256 marketId, uint8 result) external",
  "function claimWinnings(uint256 marketId) external",
  "function claimRefund(uint256 marketId) external",
  "function getMarket(uint256 marketId) external view returns (string memory, address, uint256, uint256, uint256, uint8, bool, uint8)",
  "function getPrediction(uint256 marketId, address user) external view returns (uint8, uint256, bool)",
  "function marketCount() external view returns (uint256)",
];

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
];

async function getContracts() {
  if (!window.ethereum) throw new Error("MetaMask no instalado");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  const foresight = new ethers.Contract(CONTRACT_ADDRESS, FORESIGHT_ABI, signer);
  const usdt      = new ethers.Contract(USDT_SEPOLIA, USDT_ABI, signer);
  return { foresight, usdt, signer, provider };
}

async function waitForTx(txHash, provider) {
  let receipt = null;
  while (!receipt) {
    await new Promise(r => setTimeout(r, 2000));
    receipt = await provider.getTransactionReceipt(txHash);
  }
  return receipt;
}

async function getUSDTBalance(address) {
  const { usdt } = await getContracts();
  const balance = await usdt.balanceOf(address);
  return parseFloat(ethers.formatUnits(balance, 6)).toFixed(2);
}

async function placePredictionOnChain(marketId, side, amount) {
  try {
    const { foresight, usdt, provider } = await getContracts();
    const amountInUnits = ethers.parseUnits(amount.toString(), 6);
    const address = await (await getContracts()).signer.getAddress();

    const balance = await usdt.balanceOf(address);
    if (balance < amountInUnits) {
      return { error: `Balance insuficiente. Tienes ${ethers.formatUnits(balance, 6)} USDT` };
    }

    const allowance = await usdt.allowance(address, CONTRACT_ADDRESS);
    if (allowance < amountInUnits) {
      const approveTx = await usdt.approve(CONTRACT_ADDRESS, amountInUnits);
      await waitForTx(approveTx.hash, provider);
    }

    const sideInt = side === 'yes' ? 0 : 1;
    const marketIdInt = typeof marketId === 'string' && marketId.includes('-') ? 0 : parseInt(marketId);
    const tx = await foresight.predict(marketIdInt, sideInt, amountInUnits);
    await waitForTx(tx.hash, provider);

    return { success: true, txHash: tx.hash };
  } catch (e) {
    return { error: e.message || 'Error en la transacción' };
  }
}

async function claimWinningsOnChain(marketId) {
  try {
    const { foresight, provider } = await getContracts();
    const tx = await foresight.claimWinnings(marketId);
    await waitForTx(tx.hash, provider);
    return { success: true, txHash: tx.hash };
  } catch (e) {
    return { error: e.message || 'Error reclamando ganancias' };
  }
}