//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./AegisSupporterToken.sol";

contract Aegis {
    using Counters for Counters.Counter;

    address public manager;
    uint256 public constant maxPostLength = 1024;
    uint256 public constant maxNumAttachments = 10;

    struct User {
        string name;
        address publicKey;
        string arcanaPublicKey;
        address nftAddress;
    }

    event UserCreated(
        string name,
        address publicKey,
        string arcanaPublicKey,
        address nftAddress
    );
    event UserFollowed(address follower, address followed);
    // The PostCreated event is the only place where the posts are stored
    event PostCreated(
        address indexed author,
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

    function createUser(string calldata name, string calldata arcanaPublicKey)
        public
    {
        //user should not already exist
        require(
            users[msg.sender].publicKey == address(0),
            "User already exists."
        );
        //deploy new NFT collection for this user
        AegisSupporterToken nftContract = new AegisSupporterToken(msg.sender);

        User memory newUser = User({
            name: name,
            publicKey: msg.sender,
            arcanaPublicKey: arcanaPublicKey,
            nftAddress: address(nftContract)
        });
        users[msg.sender] = newUser;

        //emit new event
        emit UserCreated({
            name: name,
            publicKey: msg.sender,
            nftAddress: address(nftContract),
            arcanaPublicKey: arcanaPublicKey
        });
    }

    function followUser(address publicKey)
        public
        callerIsUser
        isUser(publicKey)
    {
        User memory user = users[publicKey];

        //mint an AegisSupporterToken NFT for the user if he doesn't have his own yet
        if (!userHasFollowerNft[publicKey][msg.sender]) {
            AegisSupporterToken token = AegisSupporterToken(user.nftAddress);
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
            author: msg.sender,
            isPaid: isPaid,
            text: text,
            attachments: attachments,
            timestamp: block.timestamp
        });
    }
}
