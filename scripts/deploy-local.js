const hre = require("hardhat");

async function main() {
  // Získanie zoznamu účtov
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const TetrisScore = await hre.ethers.getContractFactory("TetrisScore");
  const tetrisScore = await TetrisScore.deploy();

  await tetrisScore.waitForDeployment();

  const address = await tetrisScore.getAddress();
  console.log("TetrisScore deployed to:", address);
  
  // Uloženie adresy kontraktu pre frontend
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ TetrisScore: address }, undefined, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});