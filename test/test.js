const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aegis", () => {
  let aegis, aegisFollowersFactory;
  let addr1, addr2, addr3;

  beforeEach(async () => {
    [addr1, addr2, addr3] = await ethers.getSigners();
    aegisFollowersFactory = await ethers.getContractFactory(
      "contracts/AegisFollowers.sol:AegisFollowers"
    );
    const aegisFactory = await ethers.getContractFactory("Aegis");
    aegis = await aegisFactory.deploy();
    await aegis.deployed();
  });

  describe("Create User", () => {
    it("can create a new user", async () => {
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
      expect(user.nftAddress).to.equal(aegisFollowers.address);
    });

    it("fails to create a new user when user already exists", async () => {
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

    it("fails to create a new user when NFT collection is not owned by the Aegis contract", async () => {
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

    it("fails to create a new user when there are existing minted NFTs for the given collection", async () => {
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

  describe("Follow User", () => {
    let aegisFollowers1, aegisFollowers2;

    beforeEach(async () => {
      // deploy an AegisFollowers NFT collection
      aegisFollowers1 = await aegisFollowersFactory.deploy();
      await aegisFollowers1.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx1 = await aegisFollowers1.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx1.wait();

      // deploy an AegisFollowers NFT collection
      aegisFollowers2 = await aegisFollowersFactory.deploy();
      await aegisFollowers2.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx2 = await aegisFollowers2.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx2.wait();
    });

    it("can follow user", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        aegisFollowers1.address
      );
      await newUserTx1.wait();

      //create follower user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower", aegisFollowers2.address);
      await newUserTx2.wait();

      //follow user
      const followTx = await aegis.connect(addr2).followUser(addr1.address);
      await followTx.wait();

      //follower should hold an nft of the influencer now
      expect(await aegisFollowers1.balanceOf(addr2.address)).to.equal(1);
    });

    it("can follow user when follower already holds an NFT of the influencer", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        aegisFollowers1.address
      );
      await newUserTx1.wait();

      //create follower 1 user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower 1", aegisFollowers2.address);
      await newUserTx2.wait();

      // deploy an AegisFollowers NFT collection
      aegisFollowers3 = await aegisFollowersFactory.deploy();
      await aegisFollowers3.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx3 = await aegisFollowers3.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx3.wait();
      //create follower 2 user
      const newUserTx3 = await aegis
        .connect(addr3)
        .createUser("sample follower 2", aegisFollowers3.address);
      await newUserTx3.wait();

      //follower 1 follows influencer
      const followTx1 = await aegis.connect(addr2).followUser(addr1.address);
      await followTx1.wait();

      //follower 1 should hold an nft of the influencer now
      expect(await aegisFollowers1.balanceOf(addr2.address)).to.equal(1);

      //follower 1 transfers NFT to follower 2
      const transferTx = await aegisFollowers1
        .connect(addr2)
        .transferFrom(addr2.address, addr3.address, 0);
      await transferTx.wait();

      //follower 2 should hold the nft influencer now
      expect(await aegisFollowers1.balanceOf(addr2.address)).to.equal(0);
      expect(await aegisFollowers1.balanceOf(addr3.address)).to.equal(1);

      //follower 2 follows influencer
      const followTx2 = await aegis.connect(addr3).followUser(addr1.address);
      await followTx2.wait();

      //follower 2 still should hold 1 NFT
      expect(await aegisFollowers1.balanceOf(addr3.address)).to.equal(1);
    });

    it("returns isFollower as true when follower holds multiple NFTs of the influencer", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        aegisFollowers1.address
      );
      await newUserTx1.wait();

      //create follower 1 user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower 1", aegisFollowers2.address);
      await newUserTx2.wait();

      // deploy an AegisFollowers NFT collection
      aegisFollowers3 = await aegisFollowersFactory.deploy();
      await aegisFollowers3.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx3 = await aegisFollowers3.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx3.wait();
      //create follower 2 user
      const newUserTx3 = await aegis
        .connect(addr3)
        .createUser("sample follower 2", aegisFollowers3.address);
      await newUserTx3.wait();

      //follower 1 follows influencer
      const followTx1 = await aegis.connect(addr2).followUser(addr1.address);
      await followTx1.wait();

      //follower 2 follows influencer
      const followTx2 = await aegis.connect(addr3).followUser(addr1.address);
      await followTx1.wait();

      //follower 1 transfers NFT to follower 2
      const transferTx = await aegisFollowers1
        .connect(addr2)
        .transferFrom(addr2.address, addr3.address, 0);
      await transferTx.wait();

      //follower 2 should hold 2 NFTs of the influencer now
      expect(await aegisFollowers1.balanceOf(addr3.address)).to.equal(2);
    });

    it("fails to follow user when caller isn't an user", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        aegisFollowers1.address
      );
      await newUserTx1.wait();

      //follow user
      try {
        const followTx = await aegis.connect(addr2).followUser(addr1.address);
      } catch (error) {
        expect(error.message).to.include("Caller is not an user.");
        return;
      }

      expect.fail("Did not fail to follow user when caller isn't an user");
    });

    it("fails to follow user when the user to be followed doesn't exist", async () => {
      //create user
      const newUserTx1 = await aegis.createUser(
        "sample user",
        aegisFollowers1.address
      );
      await newUserTx1.wait();

      //follow user
      try {
        const followTx = await aegis.followUser(addr2.address);
      } catch (error) {
        expect(error.message).to.include("User does not exist.");
        return;
      }

      expect.fail(
        "Did not fail to follow user when the user to be followed doesn't exist"
      );
    });
  });

  describe("Create Post", () => {
    let user;

    beforeEach(async () => {
      // deploy an AegisFollowers NFT collection
      aegisFollowers = await aegisFollowersFactory.deploy();
      await aegisFollowers.deployed();
      //transfer ownership to Aegis
      const transferOwnershipTx = await aegisFollowers.transferOwnership(
        aegis.address
      );
      await transferOwnershipTx.wait();

      //create new user
      const newUserTx = await aegis.createUser(
        "sample user",
        aegisFollowers.address
      );
      await newUserTx.wait();
    });

    it("can create a new post", async () => {
      // Create post
      const createPostTx = await aegis.createPost(
        "Hello world!",
        [
          "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e5",
          "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e6",
        ],
        true
      );
      await createPostTx.wait();

      //post count of the user should be 1
      expect(await aegis.getPostCount(addr1.address)).to.equal(1);

      //assert post has the expected content
      const newPost = await aegis.getPost(addr1.address, 0);
      expect(newPost.text).to.equal("Hello world!");
      expect(newPost.isPaid).to.equal(true);
      expect(newPost.attachments).to.have.same.members([
        "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e5",
        "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e6",
      ]);
    });

    it("fails to create a post when post text is too long", async () => {
      const maxPostLength = (await aegis.maxPostLength()).toNumber();
      try {
        // Create post with string length greater than maxPostLength
        const createPostTx = await aegis.createPost(
          "x".repeat(maxPostLength + 1),
          [
            "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e5",
            "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e6",
          ],
          true
        );
      } catch (error) {
        expect(error.message).to.include("Post text is too long.");
        return;
      }

      expect.fail("Did not fail to create post when post text is too long.");
    });

    it("fails to create a post when post has too many attachments", async () => {
      const maxNumAttachments = (await aegis.maxNumAttachments()).toNumber();
      try {
        // Create post with no. of attachments greater than maxNumAttachments
        const createPostTx = await aegis.createPost(
          "Hello world!",
          Array(maxNumAttachments + 1).fill(
            "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e5"
          ),
          true
        );
      } catch (error) {
        expect(error.message).to.include("Too many attachments.");
        return;
      }

      expect.fail(
        "Did not fail to create post when post has too many attachments"
      );
    });
  });
});
