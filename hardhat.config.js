require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  defaultNetwork: "localPolygon",
  networks: {
    localPolygon: {
      url: "http://127.0.0.1:8545",
      chainId: 80001,           // you can pick any unused chain ID
      gasPrice: 20000000000
    }
  }
};
