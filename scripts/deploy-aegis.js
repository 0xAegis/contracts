const { ethers } = require("hardhat");

const main = async () => {
  const aegisFactory = await ethers.getContractFactory("Aegis");
  const aegis = await aegisFactory.deploy();
  await aegis.deployed();
  console.log("Aegis contract deployed to:", aegis.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

runMain();
