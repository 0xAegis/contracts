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
        address publicKey;
        address nftAddress;
        Counters.Counter numPosts;
    }

    event UserCreated(string username, address publicKey, address nftAddress);
    event UserFollowed(address follower, address followed);
    // The PostCreated event is the only place where the posts are stored
    event PostCreated(
        address indexed user,
        uint256 indexed postIndex,
        bool indexed isPaid,
        string text,
        string[] attachments,
        uint256 timestamp
    );

    // User [] public users;
    mapping(address => User) public users;

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

    function createUser(string calldata username) public {
        //user should not already exist
        require(
            users[msg.sender].publicKey == address(0),
            "User already exists."
        );
        //deploy new NFT collection for this user
        AegisFollowers nftContract = new AegisFollowers();

        Counters.Counter memory numPosts;
        User memory newUser = User({
            username: username,
            publicKey: msg.sender,
            nftAddress: address(nftContract),
            numPosts: numPosts
        });
        users[msg.sender] = newUser;

        //emit new event
        emit UserCreated({
            username: username,
            publicKey: msg.sender,
            nftAddress: address(nftContract)
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

        //emit PostCreated event
        emit PostCreated({
            user: msg.sender,
            postIndex: users[msg.sender].numPosts.current(),
            isPaid: isPaid,
            text: text,
            attachments: attachments,
            timestamp: block.timestamp
        });

        //increment the numPosts counter
        users[msg.sender].numPosts.increment();
    }
}
