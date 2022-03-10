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

    it("fails to create a new user when user already exists", async function () {
      try {
        //creating a new user first time
        const newUserTx1 = await aegis.createAccount("sample username 1");
        await newUserTx1.wait();

        //creating a new user second time from same address as before
        const newUserTx2 = await aegis.createAccount("sample username 2");
      } catch (error) {
        expect(error.message).to.include("User already exists.");
        return;
      }
      //If no error is thrown in the try block
      expect.fail(
        "Did not fail to create a new user while user already exists"
      );
    });
  });
});
