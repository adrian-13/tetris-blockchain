import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import { ethers } from 'ethers';
import TetrisScoreABI from './contracts/TetrisScore.json';
import contractAddress from './contracts/contract-address.json';

const BLOCK_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 20;

const canvasWidth = GRID_WIDTH * BLOCK_SIZE + 50;
const canvasHeight = GRID_HEIGHT * BLOCK_SIZE + 150;

class Game {
  constructor() {
    this.game = null;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
    this.lastScoreSubmission = 0;

    this.initialize();
  }

  async initialize() {
    this.setupWalletConnectionUI();
    this.setupScoreUI();

    const config = {
      type: Phaser.AUTO,
      parent: 'tetris-area',
      width: 500,
      height: 800,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: GameScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } },
      },
    };

    this.game = new Phaser.Game(config);
  }

  setupWalletConnectionUI() {
    const connectBtn = document.getElementById('connect-wallet');
    const walletInfo = document.getElementById('wallet-address');
    if (!connectBtn || !walletInfo) return;

    connectBtn.addEventListener('click', async () => {
      if (!this.isConnected) {
        await this.connectWallet(connectBtn, walletInfo);
      } else {
        this.disconnectWallet(connectBtn, walletInfo);
      }
    });
  }

  setupScoreUI() {
    const saveScoreBtn = document.getElementById('save-score');
    const showScoresBtn = document.getElementById('show-highscores');

    if (saveScoreBtn) {
      saveScoreBtn.addEventListener('click', async () => {
        if (!this.isConnected || !this.contract) {
          alert('Wallet not connected!');
          return;
        }

        try {
          const scene = this.game.scene.keys['GameScene'];
          const currentScore = scene.score;
          const currentLines = scene.lines;
          const playerName = prompt('Enter player name:', 'Anonymous');

          if (!playerName || playerName.trim() === '') {
            alert('Player name cannot be empty!');
            return;
          }

          if (Date.now() - this.lastScoreSubmission < 60000) {
            alert('You can only submit a score once per minute!');
            return;
          }

          this.lastScoreSubmission = Date.now();

          await this.submitScore(currentScore, currentLines, playerName);

          alert('Score submitted to blockchain!');
        } catch (err) {
          console.error('Error saving score:', err);
          alert(`Error saving score: ${err.message}`);
        }
      });
    }

    if (showScoresBtn) {
      showScoresBtn.addEventListener('click', async () => {
        if (!this.isConnected || !this.contract) {
          alert('Wallet not connected!');
          return;
        }

        try {
          const allScores = await this.getAllScores();
          const scoresDisplay = allScores
            .map((sc, idx) => `${idx + 1}) Player: ${sc.playerName}, Score: ${sc.score}, Lines: ${sc.lines}`)
            .join('\n');

          alert(`All Scores:\n\n${scoresDisplay}`);
        } catch (err) {
          console.error('Error fetching all scores:', err);
          alert(`Error fetching all scores: ${err.message}`);
        }
      });
    }
  }

  async connectWallet(connectBtn, walletInfo) {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet!');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      this.contract = new ethers.Contract(
        contractAddress.TetrisScore,
        TetrisScoreABI.abi,
        this.signer
      );

      const address = await this.signer.getAddress();
      walletInfo.textContent = `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`;

      connectBtn.textContent = 'Disconnect';
      connectBtn.disabled = false;

      this.isConnected = true;
      window.gameInstance = this;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      walletInfo.textContent = 'Error connecting wallet';
      alert(`Error connecting wallet: ${error.message}`);
    }
  }

  disconnectWallet(connectBtn, walletInfo) {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    window.gameInstance = null;
    this.isConnected = false;

    walletInfo.textContent = 'Wallet: Not Connected';
    connectBtn.textContent = 'Connect Wallet';
    connectBtn.disabled = false;

    alert('Disconnected from wallet.');
  }

  async submitScore(score, lines, playerName) {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected or contract unavailable');
    }

    try {
      const scoreValue = ethers.toBigInt(score);
      const linesValue = ethers.toBigInt(lines);

      console.log('Submitting score:', {
        score: scoreValue,
        lines: linesValue,
        playerName: playerName,
        contractAddress: this.contract.target,
      });

      const tx = await this.contract.submitScore(
        scoreValue,
        linesValue,
        playerName
      );

      await tx.wait();

      return tx;
    } catch (error) {
      console.error('Submit score error details:', error);
      throw error;
    }
  }

  async getAllScores() {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected or contract unavailable');
    }

    const scores = await this.contract.getAllScores();

    return scores.map((sc) => ({
      score: sc.score.toNumber(),
      lines: sc.lines.toNumber(),
      timestamp: sc.timestamp.toNumber(),
      player: sc.player,
      playerName: sc.playerName,
    }));
  }

  async getPlayerScores(playerAddress) {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected or contract unavailable');
    }

    const scores = await this.contract.getPlayerScores(playerAddress);

    return scores.map((sc) => ({
      score: sc.score.toNumber(),
      lines: sc.lines.toNumber(),
      timestamp: sc.timestamp.toNumber(),
      player: sc.player,
      playerName: sc.playerName,
    }));
  }
}

window.onload = () => {
  new Game();
};
