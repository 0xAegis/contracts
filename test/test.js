const { expect } = require("chai");
const { ethers } = require("hardhat");
const { default: fetch } = require("node-fetch-cjs");

const arcanaPublicKey =
  "0x047a2b9f698aa78879603dfb29f84b0a501914076881eda98325ea98265433cc32114eda61d3aa0da7636937ca19fd5451fa0f8dd9b6fa02bf411168db05748944";

describe("Aegis", () => {
  let aegis, aegisSupporterTokenFactory;
  let addr1, addr2, addr3;

  beforeEach(async () => {
    [addr1, addr2, addr3] = await ethers.getSigners();
    aegisSupporterTokenFactory = await ethers.getContractFactory(
      "AegisSupporterToken"
    );
    const aegisFactory = await ethers.getContractFactory("Aegis");
    aegis = await aegisFactory.deploy();
    await aegis.deployed();
  });

  describe("Create User", () => {
    it("can create a new user", async () => {
      const newUserTx = await aegis.createUser("sample name", arcanaPublicKey);
      await newUserTx.wait();

      const user = await aegis.users(addr1.address);
      expect(user.name).to.equal("sample name");
      expect(user.publicKey).to.equal(addr1.address);
      expect(user.arcanaPublicKey).to.equal(arcanaPublicKey);
      expect(user.nftAddress).to.exist;
    });

    it("fails to create a new user when user already exists", async () => {
      try {
        //creating a new user first time
        const newUserTx1 = await aegis.createUser(
          "sample name 1",
          arcanaPublicKey
        );
        await newUserTx1.wait();

        //creating a new user second time from same address as before
        const newUserTx2 = await aegis.createUser(
          "sample name 2",
          arcanaPublicKey
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
  });

  describe("Follow User", () => {
    it("can follow user", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        arcanaPublicKey
      );
      await newUserTx1.wait();

      //get the NFT collection of the influencer user
      const user1 = await aegis.users(addr1.address);
      const aegisSupporterToken1 = aegisSupporterTokenFactory.attach(
        user1.nftAddress
      );

      //create follower user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower", arcanaPublicKey);
      await newUserTx2.wait();

      //follow user
      const followTx = await aegis.connect(addr2).followUser(addr1.address);
      await followTx.wait();

      //follower should hold an nft of the influencer now
      expect(await aegisSupporterToken1.balanceOf(addr2.address)).to.equal(1);

      //check event log for UserFollowed event
      const filter = aegis.filters.UserFollowed(addr2.addresss);
      const userFollowedEvents = await aegis.queryFilter(filter);
      const userFollowedEvent = userFollowedEvents[0].args;

      //assert event has the expected content
      expect(userFollowedEvent.followed).to.equal(addr1.address);

      //check AegisFollower NFT metadata
      const tokenMetadataUri = await aegisSupporterToken1.tokenURI(0);
      const tokenMetadata = await (await fetch(tokenMetadataUri)).json();
      console.log(tokenMetadata);
    });

    it("can follow user when follower already holds an NFT of the influencer", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        arcanaPublicKey
      );
      await newUserTx1.wait();

      //get the NFT collection of the influencer user
      const user1 = await aegis.users(addr1.address);
      const aegisSupporterToken1 = aegisSupporterTokenFactory.attach(
        user1.nftAddress
      );

      //create follower 1 user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower 1", arcanaPublicKey);
      await newUserTx2.wait();

      //create follower 2 user
      const newUserTx3 = await aegis
        .connect(addr3)
        .createUser("sample follower 2", arcanaPublicKey);
      await newUserTx3.wait();

      //follower 1 follows influencer
      const followTx1 = await aegis.connect(addr2).followUser(addr1.address);
      await followTx1.wait();

      //follower 1 should hold an nft of the influencer now
      expect(await aegisSupporterToken1.balanceOf(addr2.address)).to.equal(1);

      //follower 1 transfers NFT to follower 2
      const transferTx = await aegisSupporterToken1
        .connect(addr2)
        .transferFrom(addr2.address, addr3.address, 0);
      await transferTx.wait();

      //follower 2 should hold the nft influencer now
      expect(await aegisSupporterToken1.balanceOf(addr2.address)).to.equal(0);
      expect(await aegisSupporterToken1.balanceOf(addr3.address)).to.equal(1);

      //follower 2 follows influencer
      const followTx2 = await aegis.connect(addr3).followUser(addr1.address);
      await followTx2.wait();

      //follower 2 still should now hold 2 NFTs, because he needs his own unique one too
      expect(await aegisSupporterToken1.balanceOf(addr3.address)).to.equal(2);
    });

    it("following multiple times does not result in multiple follower NFTs", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        arcanaPublicKey
      );
      await newUserTx1.wait();

      //get the NFT collection of the influencer user
      const user1 = await aegis.users(addr1.address);
      const aegisSupporterToken1 = aegisSupporterTokenFactory.attach(
        user1.nftAddress
      );

      //create follower 1 user
      const newUserTx2 = await aegis
        .connect(addr2)
        .createUser("sample follower 1", arcanaPublicKey);
      await newUserTx2.wait();

      //follower 1 follows influencer
      const followTx1 = await aegis.connect(addr2).followUser(addr1.address);
      await followTx1.wait();

      //follower 1 should hold an nft of the influencer now
      expect(await aegisSupporterToken1.balanceOf(addr2.address)).to.equal(1);

      //follower 1 follows influencer again
      const followTx2 = await aegis.connect(addr2).followUser(addr1.address);
      await followTx2.wait();

      //follower 2 should still hold a single nft of the influencer
      expect(await aegisSupporterToken1.balanceOf(addr2.address)).to.equal(1);
    });

    it("fails to follow user when caller isn't an user", async () => {
      //create influencer user
      const newUserTx1 = await aegis.createUser(
        "sample influencer",
        arcanaPublicKey
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
      const newUserTx1 = await aegis.createUser("sample user", arcanaPublicKey);
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
      //create new user
      const newUserTx = await aegis.createUser("sample user", arcanaPublicKey);
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
      const txReceipt = await createPostTx.wait();

      //create a filter for filtering events: addr1.address should be the user
      const filter = aegis.filters.PostCreated(addr1.address);
      //get all the events that match the above filter
      const postCreatedEvents = await aegis.queryFilter(filter);
      //we know there will be only one, so get the first element of the array and get its events args
      const newPost = postCreatedEvents[0].args;

      //assert post has the expected content
      expect(newPost.text).to.equal("Hello world!");
      expect(newPost.isPaid).to.equal(true);
      expect(newPost.attachments).to.have.same.members([
        "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e5",
        "0xba643587c95dae76647e089b10142b07f1422203066290ce726a4f57bfa131e6",
      ]);
      expect(newPost.timestamp).to.exist;
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
