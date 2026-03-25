const hre = require("hardhat");

async function main() {
  const USDT_BASE = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";

  console.log("Desplegando ForesightMarket en Base...");

  const ForesightMarket = await hre.ethers.getContractFactory("ForesightMarket");
  const market = await ForesightMarket.deploy(USDT_BASE);

  await market.waitForDeployment();

  const address = await market.getAddress();
  console.log("ForesightMarket desplegado en:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});