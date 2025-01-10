// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TetrisScore {
    struct Score {
        uint256 score;
        uint256 lines;
        uint256 timestamp;
        address player;
        string playerName;
    }

    // Pole pre všetky skóre (globálne)
    Score[] public allScores;

    // Mapping od adresy hráča k zoznamu jeho skóre
    mapping(address => Score[]) public playerScores;

    // Udalosť emitovaná pri uložení nového skóre
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 lines,
        uint256 timestamp,
        string playerName
    );

    /**
     * Uloží skóre pre volajúcu adresu (msg.sender).
     * @param _score       Počet bodov (uint256)
     * @param _lines       Počet zmazaných riadkov (uint256)
     * @param _playerName  Meno hráča (string)
     */
    function submitScore(
        uint256 _score,
        uint256 _lines,
        string memory _playerName
    ) public {
        Score memory newScore = Score({
            score: _score,
            lines: _lines,
            timestamp: block.timestamp,
            player: msg.sender,
            playerName: _playerName
        });

        // Uložíme do "globálneho" poľa všetkých skóre
        allScores.push(newScore);

        // Uložíme do zoznamu pre danú adresu
        playerScores[msg.sender].push(newScore);

        // Emitneme udalosť
        emit ScoreSubmitted(
            msg.sender,
            _score,
            _lines,
            block.timestamp,
            _playerName
        );
    }

    /**
     * Vráti všetky skóre konkrétneho hráča.
     */
    function getPlayerScores(
        address _player
    ) public view returns (Score[] memory) {
        return playerScores[_player];
    }

    /**
     * Vráti všetky skóre, ktoré boli doteraz uložené (aj rôznymi hráčmi).
     */
    function getAllScores() public view returns (Score[] memory) {
        return allScores;
    }
}
