// ScoringSystem.js
export class ScoringSystem {
  constructor() {
    // Immutable configuration objects
    Object.defineProperty(this, 'baseScores', {
      value: Object.freeze({
        singleLine: 100,    // 1 line
        doubleLine: 300,    // 2 lines at once
        tripleLine: 500,    // 3 lines at once
        tetris: 800,        // 4 lines at once
        softDrop: 1,        // Soft drop (arrow down) - per block
        hardDrop: 2,        // Hard drop (space) - per block
        tSpin: 400,         // T-spin without clearing lines
        tSpinSingle: 800,   // T-spin with 1 line
        tSpinDouble: 1200,  // T-spin with 2 lines
        tSpinTriple: 1600,  // T-spin with 3 lines
        perfectClear: 2000, // Clearing the board
        combo: 50           // Combo bonus (multiplied by combo count)
      }),
      writable: false,
    });

    Object.defineProperty(this, 'speeds', {
      value: Object.freeze({
        1: 1000,
        2: 925,
        3: 850,
        4: 775,
        5: 700,
        6: 625,
        7: 550,
        8: 475,
        9: 400,
        10: 350,
        11: 300,
        12: 250,
        13: 200,
        14: 175,
        15: 150,
        16: 125,
        17: 100,
        18: 75,
        19: 60,
        20: 50
      }),
      writable: false,
    });

    Object.defineProperty(this, 'levelThresholds', {
      value: Object.freeze({
        1: 0,
        2: 10,
        3: 20,
        4: 30,
        5: 40,
        6: 50,
        7: 60,
        8: 70,
        9: 80,
        10: 100,
        11: 120,
        12: 140,
        13: 160,
        14: 180,
        15: 200
      }),
      writable: false,
    });

    // Initialize current state
    this.reset();
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = 0;
    this.lastMoveWasRotation = false;
    this.backToBackTetris = false;
    this.backToBackTSpin = false;
  }

  getCurrentSpeed() {
    return this.speeds[this.level] || 1000;
  }

  calculateLinesClearedScore(lineCount, isTSpin = false, isPerfectClear = false) {
    if (typeof lineCount !== 'number' || lineCount < 0 || lineCount > 4) {
      throw new Error('Invalid line count. Must be a number between 0 and 4.');
    }
    if (typeof isTSpin !== 'boolean' || typeof isPerfectClear !== 'boolean') {
      throw new Error('Invalid flags. `isTSpin` and `isPerfectClear` must be boolean.');
    }

    let score = 0;

    // Base scores for cleared lines
    if (isTSpin) {
      switch (lineCount) {
        case 1: score = this.baseScores.tSpinSingle; break;
        case 2: score = this.baseScores.tSpinDouble; break;
        case 3: score = this.baseScores.tSpinTriple; break;
        default: score = this.baseScores.tSpin;
      }
    } else {
      switch (lineCount) {
        case 1: score = this.baseScores.singleLine; break;
        case 2: score = this.baseScores.doubleLine; break;
        case 3: score = this.baseScores.tripleLine; break;
        case 4: score = this.baseScores.tetris; break;
      }
    }

    // Multiply by level
    score *= this.level;

    // Back-to-back bonus (30% extra)
    if ((lineCount === 4 || isTSpin) &&
        (this.backToBackTetris || this.backToBackTSpin)) {
      score = Math.floor(score * 1.3);
    }

    // Combo bonus
    if (lineCount > 0) {
      this.combo++;
      score += (this.baseScores.combo * this.combo * this.level);
    } else {
      this.combo = 0;
    }

    // Perfect clear bonus
    if (isPerfectClear) {
      score += (this.baseScores.perfectClear * this.level);
    }

    return score;
  }

  updateLevel() {
    let newLevel = 1;
    for (const [level, threshold] of Object.entries(this.levelThresholds)) {
      if (this.lines >= threshold) {
        newLevel = Math.max(newLevel, parseInt(level));
      }
    }

    // Beyond predefined levels
    if (this.lines >= this.levelThresholds[15]) {
      newLevel = Math.floor((this.lines - this.levelThresholds[15]) / 30) + 15;
    }

    if (newLevel !== this.level) {
      this.level = newLevel;
      return true;
    }
    return false;
  }

  addSoftDropScore(cellCount) {
    if (typeof cellCount !== 'number' || cellCount < 0) {
      throw new Error('Invalid cell count for soft drop.');
    }
    const points = this.baseScores.softDrop * cellCount;
    this.score += points;
    return points;
  }

  addHardDropScore(cellCount) {
    if (typeof cellCount !== 'number' || cellCount < 0) {
      throw new Error('Invalid cell count for hard drop.');
    }
    const points = this.baseScores.hardDrop * cellCount;
    this.score += points;
    return points;
  }

  updateScore(lineCount, moveInfo = {}) {
    const {
      isTSpin = false,
      isPerfectClear = false,
      softDropCells = 0,
      hardDropCells = 0
    } = moveInfo;

    if (softDropCells > 0) this.addSoftDropScore(softDropCells);
    if (hardDropCells > 0) this.addHardDropScore(hardDropCells);

    if (lineCount === 4 || isTSpin) {
      this.backToBackTetris = true;
    } else if (lineCount > 0) {
      this.backToBackTetris = false;
    }

    const lineScore = this.calculateLinesClearedScore(lineCount, isTSpin, isPerfectClear);
    this.score += lineScore;
    this.lines += lineCount;

    const levelChanged = this.updateLevel();

    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
      levelChanged,
      lastMoveScore: lineScore,
      combo: this.combo
    };
  }
}
