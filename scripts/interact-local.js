const hre = require("hardhat");

async function main() {
  // Získanie zoznamu účtov
  const [owner, player1] = await ethers.getSigners();
  
  // Načítanie nasadeného kontraktu
  const contractAddress = require("../frontend/src/contracts/contract-address.json").TetrisScore;
  const TetrisScore = await ethers.getContractFactory("TetrisScore");
  const tetrisScore = TetrisScore.attach(contractAddress);
  
  // Test submitting a score
  console.log("Submitting score from:", player1.address);
  const tx = await tetrisScore.connect(player1).submitScore(1000, 4);
  await tx.wait();
  console.log("Score submitted!");
  
  // Get player scores
  const scores = await tetrisScore.getPlayerScores(player1.address);
  console.log("Player scores:", scores);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});