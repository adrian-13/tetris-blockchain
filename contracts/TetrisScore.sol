// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TetrisScore {
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 lines;
        string playerName;
        uint256 timestamp;
    }

    // Pole, kde budeme držať top 10 skóre
    ScoreEntry[] public topScores;

    /**
     * @dev Funkcia na pridanie/aktualizovanie skóre v top 10.
     * @param _score Skóre hráča.
     * @param _lines Počet riadkov, ktoré hráč odstránil (voliteľné, môžeš to ľubovoľne využiť).
     * @param _playerName Meno (nick) hráča.
     */
    function submitScore(
        uint256 _score,
        uint256 _lines,
        string memory _playerName
    ) public {
        // Vytvoríme novú štruktúru skóre
        ScoreEntry memory newEntry = ScoreEntry({
            player: msg.sender,
            score: _score,
            lines: _lines,
            playerName: _playerName,
            timestamp: block.timestamp
        });

        // Ak máme menej ako 10 záznamov, priamo pridáme a zoraďíme
        if (topScores.length < 10) {
            topScores.push(newEntry);
            _sortDescending();
        } else {
            // Ak je nové skóre väčšie než posledné (najmenšie) v poli, nahradíme ho a zoraďíme
            if (_score > topScores[topScores.length - 1].score) {
                topScores[topScores.length - 1] = newEntry;
                _sortDescending();
            }
        }
    }

    /**
     * @dev Vráti celé pole topScores (max. 10 záznamov).
     */
    function getAllScores() public view returns (ScoreEntry[] memory) {
        return topScores;
    }

    /**
     * @dev Interná funkcia na zoraďovanie pomocou jednoduchého bubble sortu.
     *  Pre 10 položiek to úplne stačí.
     */
    function _sortDescending() internal {
        uint256 length = topScores.length;
        for (uint256 i = 0; i < length; i++) {
            for (uint256 j = 0; j < length - 1; j++) {
                if (topScores[j].score < topScores[j + 1].score) {
                    ScoreEntry memory temp = topScores[j];
                    topScores[j] = topScores[j + 1];
                    topScores[j + 1] = temp;
                }
            }
        }
    }
}
