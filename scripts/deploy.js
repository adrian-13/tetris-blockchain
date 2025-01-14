const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Získaj Signer (deployer)
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("Deploying contracts with account:", deployerAddress);

  // Vezmi si balance z provider-a
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", balance.toString());

  // Deploy kontraktu
  const TetrisScore = await hre.ethers.getContractFactory("TetrisScore");
  const tetrisScore = await TetrisScore.deploy();

  await tetrisScore.waitForDeployment();

  const address = await tetrisScore.getAddress();
  console.log("TetrisScore deployed to:", address);

  // Uloženie adresy do frontendu
  saveFrontendFiles(address);
}

function saveFrontendFiles(contractAddress) {
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ TetrisScore: contractAddress }, null, 2)
  );

  // Zapíš aj ABI
  const artifact = hre.artifacts.readArtifactSync("TetrisScore");
  fs.writeFileSync(
    path.join(contractsDir, "TetrisScore.json"),
    JSON.stringify(artifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
