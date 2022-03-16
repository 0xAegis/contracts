//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./AegisFollowers.sol";

contract Aegis {
    using Counters for Counters.Counter;

    address public manager;
    uint256 public constant maxPostLength = 1024;
    uint256 public constant maxNumAttachments = 10;

    struct User {
        string username;
        address payable publicKey;
        address nftAddress;
    }

    struct Post {
        string text;
        string[] attachments;
        bool isPaid;
    }

    event UserCreated(
        string username,
        address payable publicKey,
        address nftAddress
    );
    event UserFollowed(address follower, address followed);
    event PostCreated(
        address user,
        string text,
        string[] attachments,
        bool isPaid
    );

    // User [] public users;
    mapping(address => User) public users;
    mapping(address => Post[]) public posts;

    //if the user has minted his own follower NFT or not, (followedAddress => (followerAddress => bool))
    mapping(address => mapping(address => bool)) public userHasFollowerNft;

    constructor() {
        manager = msg.sender;
    }

    //checks if the caller is an user
    modifier callerIsUser() {
        require(
            users[msg.sender].publicKey != address(0),
            "Caller is not an user."
        );
        _;
    }

    //checks if the public key is an user
    modifier isUser(address publicKey) {
        require(
            users[publicKey].publicKey != address(0),
            "User does not exist."
        );
        _;
    }

    function createUser(string memory username, address nftAddress) public {
        AegisFollowers token = AegisFollowers(nftAddress);

        //user should not already exist
        require(
            users[msg.sender].publicKey == address(0),
            "User already exists."
        );
        //the owner of the collection should be this contract, so that only it can mint new NFTs
        require(
            token.owner() == address(this),
            "NFT collection is not owned by Aegis."
        );
        //the NFT collection should be new, with zero existing minted NFTs
        require(
            token.totalSupply() == 0,
            "NFT collection's total supply is not zero."
        );

        User memory newUser = User({
            username: username,
            publicKey: payable(msg.sender),
            nftAddress: nftAddress
        });
        users[msg.sender] = newUser;

        //emit new event
        emit UserCreated({
            username: username,
            publicKey: payable(msg.sender),
            nftAddress: nftAddress
        });
    }

    function followUser(address publicKey)
        public
        callerIsUser
        isUser(publicKey)
    {
        User memory user = users[publicKey];

        //mint an AegisFollowers NFT for the user if he doesn't have his own yet
        if (!userHasFollowerNft[publicKey][msg.sender]) {
            AegisFollowers token = AegisFollowers(user.nftAddress);
            token.safeMint(msg.sender);
            userHasFollowerNft[publicKey][msg.sender] = true;
        }

        emit UserFollowed({follower: msg.sender, followed: publicKey});
    }

    function createPost(
        string calldata text,
        string[] calldata attachments,
        bool isPaid
    ) public callerIsUser {
        //make sure post is not too big or doesn't have too many attachments
        require(bytes(text).length <= maxPostLength, "Post text is too long.");
        require(
            attachments.length <= maxNumAttachments,
            "Too many attachments."
        );

        //create post and push it to the posts array of the user
        Post memory newPost = Post({
            text: text,
            attachments: attachments,
            isPaid: isPaid
        });
        posts[msg.sender].push(newPost);

        //emit PostCreated event
        emit PostCreated({
            user: msg.sender,
            text: text,
            attachments: attachments,
            isPaid: isPaid
        });
    }

    //get the number of posts of an user
    function getPostCount(address user) public view returns (uint256) {
        return posts[user].length;
    }

    //get post of an user by index
    function getPost(address user, uint256 postIndex)
        public
        view
        returns (Post memory)
    {
        return posts[user][postIndex];
    }
}
