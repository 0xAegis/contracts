const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aegis", function () {
  describe("User Acount", function () {
    let aegis;
    let addr1, addr2;

    beforeEach(async () => {
      [addr1, addr2] = await ethers.getSigners();
      const Aegis = await ethers.getContractFactory("Aegis");
      aegis = await Aegis.deploy();
      await aegis.deployed();
    });

    it("can create a new user", async function () {
      try {
        const newUserTx = await aegis.createAccount("sample username");
        await newUserTx.wait();
      } catch (error) {
        console.log(error.message);
      }
      const user = await aegis.users(addr1.address);
      expect(user.username).to.equal("sample username");
      expect(user.publicKey).to.equal(addr1.address);
    });
  });
});
