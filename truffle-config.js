module.exports = {
  contracts_build_directory: "./public/contracts",

  networks: {
    development: {
      host: "127.0.0.1", 
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
  },

  compilers: {
    solc: {
      module: "0.9.13",
      


      version: "0.8.13",
    },
  },
};
