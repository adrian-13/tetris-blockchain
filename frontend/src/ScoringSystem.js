// ScoringSystem.js
export class ScoringSystem {
  constructor() {
    // Základné skóre
    this.baseScores = {
      singleLine: 100,    // 1 riadok
      doubleLine: 300,    // 2 riadky naraz
      tripleLine: 500,    // 3 riadky naraz
      tetris: 800,        // 4 riadky naraz
      softDrop: 1,        // Bodovanie za mäkký pád (šípka dole) - za každý blok
      hardDrop: 2,        // Bodovanie za tvrdý pád (medzerník) - za každý blok
      tSpin: 400,         // T-spin bez riadkov
      tSpinSingle: 800,   // T-spin s jedným riadkom
      tSpinDouble: 1200,  // T-spin s dvoma riadkami
      tSpinTriple: 1600,  // T-spin s troma riadkami
      perfectClear: 2000, // Vyčistenie celej obrazovky
      combo: 50,          // Bonus za combo (násobí sa počtom combo)
    };

    // Rýchlosti padania pre každý level (v ms)
    this.speeds = {
      1: 1000,
      2: 900,
      3: 800,
      4: 700,
      5: 600,
      6: 500,
      7: 400,
      8: 300,
      9: 200,
      10: 100,
      // Od levelu 11 až 15 sa rýchlosť znižuje o 10ms
      15: 50,
      // Maximum speed od levelu 16
      16: 30
    };

    // Počet riadkov potrebných na každý level
    this.levelThresholds = {
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
      15: 200,
      // Od levelu 16 každých 30 riadkov
    };

    // Aktuálny stav
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
    if (this.level >= 16) return this.speeds[16];
    if (this.level >= 15) return this.speeds[15];
    return this.speeds[this.level] || 1000;
  }

  // Výpočet skóre za vymazanie riadkov
  calculateLinesClearedScore(lineCount, isTSpin = false, isPerfectClear = false) {
    let score = 0;
    
    // Základné skóre za riadky
    if (isTSpin) {
      switch(lineCount) {
        case 1: score = this.baseScores.tSpinSingle; break;
        case 2: score = this.baseScores.tSpinDouble; break;
        case 3: score = this.baseScores.tSpinTriple; break;
        default: score = this.baseScores.tSpin;
      }
    } else {
      switch(lineCount) {
        case 1: score = this.baseScores.singleLine; break;
        case 2: score = this.baseScores.doubleLine; break;
        case 3: score = this.baseScores.tripleLine; break;
        case 4: score = this.baseScores.tetris; break;
      }
    }

    // Násobenie levelom
    score *= this.level;

    // Back-to-back bonus (30% navyše)
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

  // Aktualizácia levelu na základe počtu riadkov
  updateLevel() {
    // Nájdeme najvyšší threshold, ktorý sme prekročili
    let newLevel = 1;
    for (const [level, threshold] of Object.entries(this.levelThresholds)) {
      if (this.lines >= threshold) {
        newLevel = Math.max(newLevel, parseInt(level));
      }
    }

    // Pre levely nad 15 používame vzorec
    if (this.lines >= this.levelThresholds[15]) {
      newLevel = Math.floor((this.lines - this.levelThresholds[15]) / 30) + 15;
    }

    // Aktualizujeme level ak sa zmenil
    if (newLevel !== this.level) {
      this.level = newLevel;
      return true;
    }
    return false;
  }

  // Pridanie skóre za soft drop (manuálne urýchlenie pádu)
  addSoftDropScore(cellCount) {
    const points = this.baseScores.softDrop * cellCount;
    this.score += points;
    return points;
  }

  // Pridanie skóre za hard drop (okamžitý pád)
  addHardDropScore(cellCount) {
    const points = this.baseScores.hardDrop * cellCount;
    this.score += points;
    return points;
  }

  // Hlavná metóda pre aktualizáciu skóre
  updateScore(lineCount, moveInfo) {
    const {
      isTSpin = false,
      isPerfectClear = false,
      softDropCells = 0,
      hardDropCells = 0
    } = moveInfo;

    // Pripočítame body za drop
    if (softDropCells > 0) this.addSoftDropScore(softDropCells);
    if (hardDropCells > 0) this.addHardDropScore(hardDropCells);

    // Aktualizujeme back-to-back stav
    if (lineCount === 4 || isTSpin) {
      this.backToBackTetris = true;
    } else if (lineCount > 0) {
      this.backToBackTetris = false;
    }

    // Vypočítame a pridáme body za riadky
    const lineScore = this.calculateLinesClearedScore(lineCount, isTSpin, isPerfectClear);
    this.score += lineScore;

    // Aktualizujeme počet riadkov
    this.lines += lineCount;

    // Skontrolujeme či sa zvýšil level
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