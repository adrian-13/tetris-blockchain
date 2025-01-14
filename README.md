# Blockchain Tetris

### [Live Demo](https://tetris-blockchain.vercel.app/)

Blockchain Tetris is a modern implementation of the classic Tetris game, designed with the goal of blockchain integration (Polygon). This game is built using:

- **Phaser.js**: For implementing game logic and visuals.
- **HTML/CSS**: For design and layout.
- **JavaScript**: For handling game rules and interactions.
- **Ethers.js**: For blockchain interaction (sending and reading data from the contract).
- **Solidity**: For the smart contract (storing top 10 scores on-chain).

## Features

- **Classic Tetris Mechanics**: Supports rotation, fast drop, scoring, and line clears.
- **Responsive Layout**: Optimized for desktop browsers.
- **Game Pause**: Press the `P` key to pause the game anytime.
- **Top 10 On-chain Leaderboard**:  
  - Scores are sent to a Solidity smart contract on Polygon zkEVM Cardona Testnet.  
  - Stores only the top 10 highest scores (with player name and lines cleared).  
  - Displays the top 10 scoreboard on the frontend via a simple table.  
  - Metamask integration for submitting and reading scores from the blockchain.

## Important Note

- The game is not optimized for mobile devices. For the best experience, play the game using a desktop browser.

## TO-DO

- **NFT/Crypto Rewards**: Implement a mechanism for rewarding high-scoring players.
- **Competitions and Tournaments**: Add features to organize events and leaderboards with prizes.
- **Further UI/UX Improvements**: Fine-tune visuals and responsiveness, especially for mobile.
  

## Instructions for Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adrian-13/tetris-blockchain.git
   ```
2. **Install dependencies**:
   In the main project directory, run:

   ```bash
   npm install
   ```

3. **Start a local server**:
   Use Webpack or another development server:

   ```bash
   npm start
   ```

4. **Open the game**:
   Open the `index.html` file in your browser or use the provided development server.

## Project Structure

- **contracts**: Smart contracts for the Polygon blockchain.
- **frontend**: The frontend application, including game logic and visuals.
- **scripts**: Scripts for interacting with the blockchain.
- **test**: Unit tests for smart contracts.
