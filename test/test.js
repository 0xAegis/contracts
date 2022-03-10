const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aegis", function () {
  describe("User Account", function () {
    let aegis, aegisFollowersFactory;
    let addr1, addr2;

    beforeEach(async () => {
      [addr1, addr2] = await ethers.getSigners();
      aegisFollowersFactory = await ethers.getContractFactory(
        "contracts/AegisFollowers.sol:AegisFollowers"
      );
      const aegisFactory = await ethers.getContractFactory("Aegis");
      aegis = await aegisFactory.deploy();
      await aegis.deployed();
    });

    it("can create a new user", async function () {
      // deploy an AegisFollowers NFT collection
      const aegisFollowers = await aegisFollowersFactory.deploy();
      await aegisFollowers.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx = await aegisFollowers.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx.wait();

      const newUserTx = await aegis.createUser(
        "sample username",
        aegisFollowers.address
      );
      await newUserTx.wait();

      const user = await aegis.users(addr1.address);
      expect(user.username).to.equal("sample username");
      expect(user.publicKey).to.equal(addr1.address);
      expect(user.tokenAddress).to.equal(aegisFollowers.address);
    });

    it("fails to create a new user when user already exists", async function () {
      // deploy an AegisFollowers NFT collection and transfer ownership to Aegis
      const aegisFollowers = await aegisFollowersFactory.deploy();
      await aegisFollowers.deployed();
      const transferOwnershipTx = await aegisFollowers.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx.wait();

      try {
        //creating a new user first time
        const newUserTx1 = await aegis.createUser(
          "sample username 1",
          aegisFollowers.address
        );
        await newUserTx1.wait();

        //creating a new user second time from same address as before
        const newUserTx2 = await aegis.createUser(
          "sample username 2",
          aegisFollowers.address
        );
      } catch (error) {
        expect(error.message).to.include("User already exists.");
        return;
      }

      //If no error is thrown in the try block
      expect.fail(
        "Did not fail to create a new user while user already exists"
      );
    });

    it("fails to create a new user when NFT collection is not owned by the Aegis contract", async function () {
      // deploy an AegisFollowers NFT collection
      const aegisFollowers = await aegisFollowersFactory.deploy();
      await aegisFollowers.deployed();

      try {
        //creating a new user first time
        const newUserTx = await aegis.createUser(
          "sample username",
          aegisFollowers.address
        );
        await newUserTx1.wait();
      } catch (error) {
        expect(error.message).to.include(
          "NFT collection is not owned by Aegis."
        );
        return;
      }

      //If no error is thrown in the try block
      expect.fail(
        "Did not fail to create a new user when token contract is not owned by Aegis."
      );
    });

    it("fails to create a new user when there are existing minted NFTs for the given collection", async function () {
      // deploy an AegisFollowers NFT collection
      const aegisFollowers = await aegisFollowersFactory.deploy();
      await aegisFollowers.deployed();
      //mint an NFT
      const mintNftTx = await aegisFollowers.safeMint(addr2.address);
      await mintNftTx.wait();
      //transfer ownership to Aegis
      const transferOwnershipTx = await aegisFollowers.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx.wait();

      try {
        //creating a new user first time
        const newUserTx = await aegis.createUser(
          "sample username",
          aegisFollowers.address
        );
        await newUserTx1.wait();
      } catch (error) {
        expect(error.message).to.include(
          "NFT collection's total supply is not zero."
        );
        return;
      }

      //If no error is thrown in the try block
      expect.fail(
        "Did not fail to create a new user when there are existing minted NFTs for the given collection"
      );
    });
  });
});
