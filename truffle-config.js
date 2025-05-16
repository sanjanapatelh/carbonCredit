module.exports = {
  // See <https://trufflesuite.com/docs/truffle/reference/configuration/>
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545, // Ganache GUI or CLI default
      network_id: "*", // Match any network id
    },
  },
  compilers: {
    solc: {
      version: "0.8.30", // or ^0.8.0 to match your pragma
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
