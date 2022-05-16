require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // defaultNetwork: "rinkeby",
  // networks: {
  //   hardhat: {
  //   },
  //   rinkeby: {
  //     url: "https://eth-rinkeby.alchemyapi.io/v2/VmxWigXMpDjAERj9JssUE_MNmC_NnbMX",
  //     accounts: ["13a707960952402c26fe2fd464ff7e1e2d112338b616048b0a0619327156ee9c"]
  //   }
  // },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  // paths: {
  //   sources: "./contracts",
  //   tests: "./test",
  //   cache: "./cache",
  //   artifacts: "./artifacts"
  // },
  // mocha: {
  //   timeout: 40000
  // }
}