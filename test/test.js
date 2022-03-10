const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aegis", function () {
  let aegis;
  let accounts;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const Aegis = await ethers.getContractFactory("Aegis");
    aegis = await Aegis.deploy();
    await aegis.deployed();
  });

  it("can create a new user", async function () {
    try {
      const newUserTx = await aegis.createAccount("sample username");
      await newUserTx.wait();
    } catch (error) {
      console.log("Error: ", error);
    }
    const user = await aegis.users(accounts[0].address);
    expect(user.username).to.equal("sample username");
    expect(user.publicKey).to.equal(accounts[0].address);
  });
});
