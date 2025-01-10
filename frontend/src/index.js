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

    this.initialize();
  }

  async initialize() {
    this.setupWalletConnectionUI();
    this.setupScoreUI();

    // Phaser config
    const config = {
      type: Phaser.AUTO,
      parent: 'tetris-area',
      width: 500,
      height: 800,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: GameScene,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
      }
    };

    this.game = new Phaser.Game(config);
  }

  /**
   * Napojenie logiky na tlačidlo "Connect Wallet"
   */
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

  /**
   * Napojenie logiky na tlačidlá "Save Score" a "Show High Scores"
   */
  setupScoreUI() {
    const saveScoreBtn = document.getElementById('save-score');
    const showScoresBtn = document.getElementById('show-highscores');

    if (saveScoreBtn) {
      saveScoreBtn.addEventListener('click', async () => {
        // Príklad: nahraj skóre z Tetrisu
        // Môžeš si to získať napr. zo scény: 
        //   let scene = this.game.scene.keys['GameScene'];
        //   let currentScore = scene.score; 
        //   let currentLines = scene.lines; 
        //   let playerName = 'Player1'; // Alebo pýtať od užívateľa

        if (!this.isConnected || !this.contract) {
          alert('Wallet not connected!');
          return;
        }

        try {
          let scene = this.game.scene.keys['GameScene'];
          const currentScore = scene.score;
          const currentLines = scene.lines;
          const playerName = prompt('Enter player name:', 'Anonymous');

          await this.submitScore(currentScore, currentLines, playerName || 'Anonymous');

          alert('Score submitted to blockchain!');
        } catch (err) {
          console.error('Error saving score:', err);
          alert(`Error saving score: ${err.message}`);
        }
      });
    }

    if (showScoresBtn) {
      showScoresBtn.addEventListener('click', async () => {
        // Zobrazíme všetky skóre z blockchainu
        if (!this.isConnected || !this.contract) {
          alert('Wallet not connected!');
          return;
        }
        try {
          const allScores = await this.getAllScores();
          console.log('All Scores:', allScores);

          // Možno zobrazíš vo vlastnom HTML elemente
          let txt = 'All Scores:\n\n';
          allScores.forEach((sc, idx) => {
            // sc je objekt s shape: 
            // {
            //   score: BigNumber,
            //   lines: BigNumber,
            //   timestamp: BigNumber,
            //   player: "0x...",
            //   playerName: "string"
            // }
            // V JSON to bude polia
            txt += `${idx+1}) PlayerName: ${sc.playerName}, Score: ${sc.score}, Lines: ${sc.lines}, Player: ${sc.player}\n`;
          });
          alert(txt);
        } catch (err) {
          console.error('Error fetching all scores:', err);
          alert(`Error fetching all scores: ${err.message}`);
        }
      });
    }
  }

  /**
   * CONNECT WALLET + zmena stavu
   */
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

  /**
   * DISCONNECT WALLET
   */
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

  /**
   * Volanie solidity funkcie: submitScore(_score, _lines, _playerName)
   */
async submitScore(score, lines, playerName) {
    if (!this.isConnected || !this.contract) {
        throw new Error('Wallet not connected or contract unavailable');
    }
    
    try {
        // Convert score and lines to BigInt using ethers v6 method
        const scoreValue = ethers.toBigInt(score);
        const linesValue = ethers.toBigInt(lines);
        
        // Debug log
        console.log('Submitting score:', {
            score: scoreValue,
            lines: linesValue,
            playerName: playerName,
            contractAddress: this.contract.target  // v6 uses .target instead of .address
        });
        
        // Call the contract method with proper types
        const tx = await this.contract.submitScore(
            scoreValue,
            linesValue,
            playerName
        );
        
        // Wait for transaction confirmation
        await tx.wait();
        
        return tx;
    } catch (error) {
        console.error('Submit score error details:', error);
        throw error;
    }
}

  /**
   * Vráti všetky skóre z kontraktu (pole Score[])
   */
  async getAllScores() {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected or contract unavailable');
    }
    const scores = await this.contract.getAllScores();

    // scores je array of Score
    // Score {
    //   score: BigNumber,
    //   lines: BigNumber,
    //   timestamp: BigNumber,
    //   player: address,
    //   playerName: string
    // }
    // Môžeme ich troška zkonvertovať na JS (napr. number)
    return scores.map((sc) => {
      return {
        score: sc.score.toNumber(),
        lines: sc.lines.toNumber(),
        timestamp: sc.timestamp.toNumber(),
        player: sc.player,
        playerName: sc.playerName
      };
    });
  }

  /**
   * Vráti všetky skóre daného hráča
   */
  async getPlayerScores(playerAddress) {
    if (!this.isConnected || !this.contract) {
      throw new Error('Wallet not connected or contract unavailable');
    }
    const scores = await this.contract.getPlayerScores(playerAddress);
    return scores.map((sc) => {
      return {
        score: sc.score.toNumber(),
        lines: sc.lines.toNumber(),
        timestamp: sc.timestamp.toNumber(),
        player: sc.player,
        playerName: sc.playerName
      };
    });
  }
}

window.onload = () => {
  new Game();
};