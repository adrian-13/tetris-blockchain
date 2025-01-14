export const contractAddress = "0x9809d9D94b0B3380db38b1e1a06047a2964e0041";
export const contractABI = [
    {
      "inputs": [],
      "name": "getAllScores",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "score",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "lines",
              "type": "uint256"
            },
            {
              "internalType": "string",
              "name": "playerName",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "internalType": "struct TetrisScore.ScoreEntry[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_score",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "_lines",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_playerName",
          "type": "string"
        }
      ],
      "name": "submitScore",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "topScores",
      "outputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "score",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "lines",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "playerName",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];