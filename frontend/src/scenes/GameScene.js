import Phaser from 'phaser';
import { ScoringSystem } from '../ScoringSystem.js';

const BLOCK_SIZE = 30;
const GRID_WIDTH = 15;
const GRID_HEIGHT = 25;

const TETROMINOS = {
    I: { shape: [[1,1,1,1]], color: 0x00b8b8 },
    O: { shape: [[1,1],[1,1]], color: 0xb8b800 },
    T: { shape: [[0,1,0],[1,1,1]], color: 0xb800b8 },
    L: { shape: [[1,0],[1,0],[1,1]], color: 0xb87400 },
    J: { shape: [[0,1],[0,1],[1,1]], color: 0x0000b8 },
    S: { shape: [[0,1,1],[1,1,0]], color: 0x00b800 },
    Z: { shape: [[1,1,0],[0,1,1]], color: 0xb80000 }
};

const TETROMINO_KEYS = Object.keys(TETROMINOS);

// Precomputed rotations for optimization
const PRECOMPUTED_ROTATIONS = {};
TETROMINO_KEYS.forEach(key => {
    const shapes = [TETROMINOS[key].shape];
    for (let i = 1; i < 4; i++) {
        const prevShape = shapes[shapes.length - 1];
        const rotatedShape = prevShape[0].map((_, colIndex) =>
            prevShape.map(row => row[colIndex]).reverse()
        );
        shapes.push(rotatedShape);
    }
    PRECOMPUTED_ROTATIONS[key] = shapes;
});

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.scoringSystem = new ScoringSystem();

        this.grid = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.currentPiecePosition = { x: 0, y: 0 };

        this.gameOver = false;
        this.gameStarted = false;
        this.paused = false;
        this.canMove = true;
        this.dropTimer = null; // Track the drop timer to avoid redundant resets
        this.currentRotationIndex = 0; // Track rotation index for precomputed shapes
        this.pauseText = null; // Text to display when the game is paused
    }

    create() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0xffffff, 0xffffff, 0x99ccff, 0x99ccff, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        this.resetGrid();

        this.gridStartX = 25; 
        this.gridStartY = 20;

        if (!this.graphics) {
            this.graphics = this.add.graphics({ lineStyle: { width: 0.25, color: 0x333333 } });
        }

        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.graphics.moveTo(this.gridStartX + x * BLOCK_SIZE, this.gridStartY);
            this.graphics.lineTo(this.gridStartX + x * BLOCK_SIZE, this.gridStartY + GRID_HEIGHT * BLOCK_SIZE);
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.graphics.moveTo(this.gridStartX, this.gridStartY + y * BLOCK_SIZE);
            this.graphics.lineTo(this.gridStartX + GRID_WIDTH * BLOCK_SIZE, this.gridStartY + y * BLOCK_SIZE);
        }
        this.graphics.strokePath();

        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        this.startButton = this.add.text(cx, cy, 'Start Game', {
            fontFamily: 'Arial', fontSize: '32px', color: '#fff',
            backgroundColor: '#008000',
            padding: { x: 20, y: 10 },
            borderRadius: 5
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
            this.startButton.visible = false;
            this.startGame();
        });

        this.createControls();
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keyup-LEFT',  () => { this.canMove = true; });
        this.input.keyboard.on('keyup-RIGHT', () => { this.canMove = true; });
        this.input.keyboard.on('keyup-DOWN',  () => { this.canMove = true; });

        this.input.keyboard.on('keydown-UP', () => {
            if (!this.paused && this.gameStarted && !this.gameOver) {
                this.rotatePiece();
            }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.paused && this.gameStarted && !this.gameOver) {
                let cellsDropped = 0;
                while (!this.checkCollision()) {
                    this.currentPiecePosition.y++;
                    cellsDropped++;
                }
                this.currentPiecePosition.y--;
                this.scoringSystem.addHardDropScore(cellsDropped);
                this.lockPiece();
                this.clearLines();
                this.spawnNewPiece();
            }
        });

        this.input.keyboard.on('keydown-P', () => {
            if (this.gameStarted && !this.gameOver) {
                this.togglePause();
            }
        });
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.dropTimer) {
            this.dropTimer.paused = this.paused;
        }

        if (this.paused) {
            this.showPauseText();
        } else {
            this.hidePauseText();
        }
    }

    showPauseText() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        if (!this.pauseText) {
            this.pauseText = this.add.text(cx, cy, 'Pause', {
                fontFamily: 'Arial', fontSize: '48px', color: '#ff0000',
                backgroundColor: '#000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
        } else {
            this.pauseText.setVisible(true);
        }
    }

    hidePauseText() {
        if (this.pauseText) {
            this.pauseText.setVisible(false);
        }
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.paused = false;
        this.scoringSystem.reset();
        this.resetGrid();
        this.updateScoreHTML();

        this.nextPiece = this.generateRandomPiece();
        this.showNextPieceInHTML();

        if (!this.dropTimer) {
            this.dropTimer = this.time.addEvent({
                delay: this.scoringSystem.getCurrentSpeed(),
                callback: this.moveDown,
                callbackScope: this,
                loop: true
            });
        } else {
            this.dropTimer.reset({ delay: this.scoringSystem.getCurrentSpeed(), loop: true });
        }

        this.spawnNewPiece();
    }

    resetGrid() {
        this.grid = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
    }

    generateRandomPiece() {
        const randKey = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
        this.currentRotationIndex = 0; // Reset rotation index for new piece
        return {
            shape: PRECOMPUTED_ROTATIONS[randKey][0],
            color: TETROMINOS[randKey].color,
            type: randKey // Track the type for rotations
        };
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generateRandomPiece();
        this.showNextPieceInHTML();

        this.currentPiecePosition = {
            x: Math.floor(GRID_WIDTH / 2) - Math.floor(this.currentPiece.shape[0].length / 2),
            y: 0
        };

        if (this.checkCollision()) {
            this.showGameOver();
        }
    }

    rotatePiece() {
        if (!this.currentPiece || this.gameOver) return;

        const type = this.currentPiece.type;
        const nextRotationIndex = (this.currentRotationIndex + 1) % 4;
        const nextShape = PRECOMPUTED_ROTATIONS[type][nextRotationIndex];

        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = nextShape;
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        } else {
            this.currentRotationIndex = nextRotationIndex;
        }
    }

    moveDown() {
        if (!this.gameStarted || this.gameOver || this.paused) return;
        this.currentPiecePosition.y++;
        if (this.checkCollision()) {
            this.currentPiecePosition.y--;
            this.lockPiece();
            this.clearLines();
            this.spawnNewPiece();
        }
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiecePosition.x + x;
                    const newY = this.currentPiecePosition.y + y;
                    if (
                        newX < 0 ||
                        newX >= GRID_WIDTH ||
                        newY >= GRID_HEIGHT ||
                        (newY >= 0 && this.grid[newY][newX] !== 0)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const gridY = this.currentPiecePosition.y + y;
                    if (gridY >= 0) {
                        this.grid[gridY][this.currentPiecePosition.x + x] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        const newGrid = this.grid.filter(row => row.some(cell => cell === 0));
        linesCleared = GRID_HEIGHT - newGrid.length;

        while (newGrid.length < GRID_HEIGHT) {
            newGrid.unshift(Array(GRID_WIDTH).fill(0));
        }

        this.grid = newGrid;

        if (linesCleared > 0) {
            const moveInfo = {
                isTSpin: false,
                isPerfectClear: this.grid.every(row => row.every(cell => cell === 0))
            };

            const result = this.scoringSystem.updateScore(linesCleared, moveInfo);

            this.score = result.score;
            this.lines = result.lines;
            this.level = result.level;

            this.updateScoreHTML();
            if (result.levelChanged) {
                this.updateDropTimer();
            }
        }
    }

        updateDropTimer() {
            if (this.dropTimer) {
                this.dropTimer.reset({
                    delay: this.scoringSystem.getCurrentSpeed(),
                    callback: this.moveDown,
                    callbackScope: this,
                    loop: true
                });
            }
        }

    showGameOver() {
        this.gameOver = true;
        if (this.dropTimer) this.dropTimer.remove();

        this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'GAME OVER',
            { fontFamily: 'Arial', fontSize: '48px', color: '#ff0000' }
        ).setOrigin(0.5);

        const restartButton = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            'Restart',
            { fontFamily: 'Arial', fontSize: '32px', color: '#fff', backgroundColor: '#ff0000' }
        ).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.scene.restart();
        });
    }

    updateScoreHTML() {
        const sc = document.getElementById('score-label');
        if (sc) sc.textContent = `Score: ${this.scoringSystem.score}`;
        const ln = document.getElementById('lines-label');
        if (ln) ln.textContent = `Lines: ${this.scoringSystem.lines}`;
        const lv = document.getElementById('level-label');
        if (lv) lv.textContent = `Level: ${this.scoringSystem.level}`;
    }

    showNextPieceInHTML() {
        const nextEl = document.getElementById('next-piece');
        if (!nextEl) return;

        nextEl.innerHTML = '';

        if (!this.nextPiece) return;

        const hex = this.nextPiece.color.toString(16).padStart(6, '0');
        const colorCSS = '#' + hex;

        const miniSize = 16;
        const shape = this.nextPiece.shape;
        const shapeHeightInBlocks = shape.length;
        const shapeWidthInBlocks = shape[0].length;

        const shapeWidthPx = shapeWidthInBlocks * miniSize;
        const shapeHeightPx = shapeHeightInBlocks * miniSize;

        const offsetX = (80 - shapeWidthPx) / 2;
        const offsetY = (80 - shapeHeightPx) / 2;

        for (let row = 0; row < shapeHeightInBlocks; row++) {
            for (let col = 0; col < shapeWidthInBlocks; col++) {
                if (shape[row][col]) {
                    const block = document.createElement('div');
                    block.style.position = 'absolute';
                    block.style.width = miniSize + 'px';
                    block.style.height = miniSize + 'px';
                    block.style.backgroundColor = colorCSS;
                    block.style.left = (offsetX + col * miniSize) + 'px';
                    block.style.top = (offsetY + row * miniSize) + 'px';
                    nextEl.appendChild(block);
                }
            }
        }
    }

    update() {
        if (!this.gameStarted || this.gameOver || this.paused) return;

        if (this.cursors.left.isDown && this.canMove) {
            this.currentPiecePosition.x--;
            if (this.checkCollision()) {
                this.currentPiecePosition.x++;
            }
            this.canMove = false;
        }
        else if (this.cursors.right.isDown && this.canMove) {
            this.currentPiecePosition.x++;
            if (this.checkCollision()) {
                this.currentPiecePosition.x--;
            }
            this.canMove = false;
        }
        else if (this.cursors.down.isDown && this.canMove) {
            this.moveDown();
            this.canMove = false;
        }

        this.drawGame();
    }

    drawGame() {
        this.graphics.clear();
        this.graphics.lineStyle(0.25, 0x333333);

        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.graphics.moveTo(this.gridStartX + x * BLOCK_SIZE, this.gridStartY);
            this.graphics.lineTo(this.gridStartX + x * BLOCK_SIZE, this.gridStartY + GRID_HEIGHT * BLOCK_SIZE);
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.graphics.moveTo(this.gridStartX, this.gridStartY + y * BLOCK_SIZE);
            this.graphics.lineTo(this.gridStartX + GRID_WIDTH * BLOCK_SIZE, this.gridStartY + y * BLOCK_SIZE);
        }
        this.graphics.strokePath();

        for (let row = 0; row < GRID_HEIGHT; row++) {
            for (let col = 0; col < GRID_WIDTH; col++) {
                if (this.grid[row][col]) {
                    this.graphics.fillStyle(this.grid[row][col]);
                    this.graphics.fillRect(
                        this.gridStartX + col * BLOCK_SIZE,
                        this.gridStartY + row * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }

        if (this.currentPiece) {
            this.graphics.fillStyle(this.currentPiece.color);
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {                   
                        this.graphics.fillRect(
                            this.gridStartX + (this.currentPiecePosition.x + c) * BLOCK_SIZE,
                            this.gridStartY + (this.currentPiecePosition.y + r) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
    }
}
