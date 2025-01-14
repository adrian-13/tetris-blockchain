// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title TetrisScore
 * @dev Udržuje rebríček Top 10 skóre pre Tetris, s menom hráča, počtom lines a timestampom.
 */
contract TetrisScore {
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 lines;
        string playerName;
        uint256 timestamp;
    }

    // Max počet záznamov, ktoré držíme v rebríčku
    uint256 private constant MAX_TOP_SCORES = 10;

    // Pole topScore záznamov
    ScoreEntry[] public topScores;

    // Event, aby sme vedeli off-chain zachytiť, že pribudol/aktualizoval sa záznam
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 lines,
        string playerName,
        uint256 timestamp
    );

    /**
     * @notice Pridá (alebo aktualizuje) hráčove skóre do top 10, ak je dosť vysoké
     * @param _score Nové skóre
     * @param _lines Počet riadkov
     * @param _playerName Meno hráča (max. 20 znakov)
     */
    function submitScore(
        uint256 _score,
        uint256 _lines,
        string memory _playerName
    ) public {
        // Obmedzenie veľkosti mena, aby zabránilo extrémne dlhým stringom
        require(bytes(_playerName).length <= 20, "Name too long");

        // Voliteľne môžeš pridať stropy na _score a _lines
        // require(_score <= 10_000_000, "Score too high");
        // require(_lines <= 100_000, "Lines too high");

        // Skontroluj, či hráč (msg.sender) už je v rebríčku
        int256 existingIndex = _findIndexOfPlayer(msg.sender);

        if (existingIndex >= 0) {
            // Hráč už bol v topScores, pozri sa, či je nové skóre lepšie
            uint256 idx = uint256(existingIndex);

            // Ak je nové skore lepšie, update
            if (_score > topScores[idx].score) {
                topScores[idx].score = _score;
                topScores[idx].lines = _lines;
                topScores[idx].playerName = _playerName;
                topScores[idx].timestamp = block.timestamp;

                // Preusporiadaj
                _sortDescending();
            }
        } else {
            // Hráč ešte nie je v rebríčku
            ScoreEntry memory newEntry = ScoreEntry({
                player: msg.sender,
                score: _score,
                lines: _lines,
                playerName: _playerName,
                timestamp: block.timestamp
            });

            if (topScores.length < MAX_TOP_SCORES) {
                // Ešte nie je plných 10 záznamov
                topScores.push(newEntry);
                _sortDescending();
            } else {
                // Tabuľka je plná, tak pozri, či je nové skóre lepšie ako najnižšie
                if (_score > topScores[topScores.length - 1].score) {
                    topScores[topScores.length - 1] = newEntry;
                    _sortDescending();
                }
            }
        }

        // Emit event, aby off-chain mohli zachytiť, že došlo k submitu
        emit ScoreSubmitted(
            msg.sender,
            _score,
            _lines,
            _playerName,
            block.timestamp
        );
    }

    /**
     * @notice Vráti celé pole topScores (max. 10) v zostupnom poradí.
     */
    function getAllScores() public view returns (ScoreEntry[] memory) {
        return topScores;
    }

    /**
     * @dev Pomocná funkcia na zoradenie topScores od najväčšieho k najmenšiemu (podľa .score).
     */
    function _sortDescending() internal {
        uint256 length = topScores.length;
        // Jednoduchý bubble sort (pri malom poli do 10 prvkov OK)
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

    /**
     * @dev Nájde index hráča msg.sender v topScores, ak tam je.
     *      Vráti -1, ak sa nenašiel.
     */
    function _findIndexOfPlayer(
        address _player
    ) internal view returns (int256) {
        for (uint256 i = 0; i < topScores.length; i++) {
            if (topScores[i].player == _player) {
                return int256(i);
            }
        }
        return -1;
    }
}
