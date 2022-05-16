const { poseidonContract } = require("circomlibjs");
const { ethers } = require('hardhat');

async function main() {
  // We get the contract to deploy

  const PoseidonT3 = await ethers.getContractFactory(
    poseidonContract.generateABI(2),
    poseidonContract.createCode(2)
  )
  const poseidonT3 = await PoseidonT3.deploy();
  await poseidonT3.deployed();
  const MerkleTree = await ethers.getContractFactory("MerkleTree", {
    libraries: {
      PoseidonT3: poseidonT3.address
    },
  });
  merkleTree = await MerkleTree.deploy();
  
  await merkleTree.deployed();

  console.log(merkleTree.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });