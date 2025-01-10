# Blockchain Tetris

### [Live Demo](https://vercel.com/adrians-projects-82e917e5/tetris-blockchain/2o2mhVJ9TvRWw5gKxQ2vTpGY1qYJ)

Blockchain Tetris is a modern implementation of the classic Tetris game, designed with the goal of blockchain integration (Polygon). This game is built using:

- **Phaser.js**: For implementing game logic and visuals.
- **HTML/CSS**: For design and layout.
- **JavaScript**: For handling game rules and interactions.

## Features

- **Game Rules**: Supports classic Tetris rules, including rotation, fast drop, and a scoring system.
- **Responsive Layout**: The game is optimized for desktop browsers.
- **Game Pause**: Players can pause the game anytime by pressing the `P` key.

## Important Note

- The game is not optimized for mobile devices. For the best experience, play the game using a desktop browser.

## TO-DO

- **Blockchain Integration**: Plans include leveraging the Polygon blockchain for:
  - Storing scores on the blockchain.
  - Organizing competitions and tournaments.
  - Rewarding players with NFTs and cryptocurrency.

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
