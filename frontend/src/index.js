import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import { ethers } from 'ethers';

import TetrisScoreABI from './contracts/TetrisScore.json';
import contractAddress from './contracts/contract-address.json';

const BLOCK_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 20;

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

                    if (playerName.length > 20) {
                        alert('Player name must be at most 20 characters!');
                        return;
                      }

                    // Anti-spam: 1 minúta medzi submitmi
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
                    const scoresTable = document.querySelector('#scores-table tbody');
                    scoresTable.innerHTML = ''; // Clear existing rows

                    allScores.forEach((score, index) => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${index + 1}</td>
                            <td>${score.playerName}</td>
                            <td>${score.score}</td>
                            <td>${score.lines}</td>
                        `;
                        scoresTable.appendChild(row);
                    });
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

            // Skontrolujeme sieť
            const network = await this.provider.getNetwork();
            console.log('network:', network);

            // chainId môže byť BigInt -> prevedieme na number
            const chainId = Number(network.chainId);
            if (chainId !== 2442) {
                alert('Please switch to Polygon zkEVM testnet (chainId 2442)!');
                return;
            }

            this.contract = new ethers.Contract(
                contractAddress.TetrisScore,
                TetrisScoreABI.abi,
                this.signer
            );

            const address = await this.signer.getAddress();
            walletInfo.textContent = `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}`;

            connectBtn.textContent = 'Disconnect';
            this.isConnected = true;
            window.gameInstance = this;
        } catch (error) {
            console.error('Error connecting wallet:', error);
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

        alert('Disconnected from wallet.');
    }

    async submitScore(score, lines, playerName) {
        if (!this.isConnected || !this.contract) {
            throw new Error('Wallet not connected or contract unavailable');
        }

        try {
            const scoreValue = ethers.toBigInt(score);
            const linesValue = ethers.toBigInt(lines);

            const tx = await this.contract.submitScore(scoreValue, linesValue, playerName);
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

        // Kontrakt vracia ScoreEntry[] => BigInt/y v Ethers v6
        const scores = await this.contract.getAllScores();

        // Konverzia BigInt na number
        return scores.map((sc) => ({
            score: Number(sc.score),
            lines: Number(sc.lines),
            timestamp: Number(sc.timestamp),
            player: sc.player,
            playerName: sc.playerName,
        }));
    }
}

// Spusti hru
window.onload = () => {
    new Game();
};
