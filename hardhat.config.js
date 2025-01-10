require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    },
    //sepolia: {
    //  url: process.env.SEPOLIA_URL,
    //  accounts: [process.env.PRIVATE_KEY],
    //},
    /** sepolia: {
      url: 'https://sepolia.infura.io/v3/<key>',
      accounts: ['<private key 1>', '<private key 2>'],
    }, **/
  }
};
