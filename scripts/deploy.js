const hre = require("hardhat");

async function main() {
  const TetrisScore = await hre.ethers.getContractFactory("TetrisScore");
  const tetrisScore = await TetrisScore.deploy();

  await tetrisScore.waitForDeployment();

  console.log("TetrisScore deployed to:", await tetrisScore.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});