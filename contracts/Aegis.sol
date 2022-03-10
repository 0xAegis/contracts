//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "hardhat/console.sol";

interface AegisFollowers is IERC721Enumerable {
    function owner() external view returns (address);

    function safeMint(address to) external;
}

contract Aegis {
    using Counters for Counters.Counter;

    address public manager;

    struct User {
        string username;
        address payable publicKey;
        address tokenAddress;
    }

    event UserCreated(
        string username,
        address payable publicKey,
        address tokenAddress
    );
    event UserFollowed(address follower, address followed);

    // User [] public users;
    mapping(address => User) public users;

    constructor() {
        manager = msg.sender;
    }

    //checks if the caller is an user
    modifier callerIsUser() {
        require(
            users[msg.sender].publicKey != address(0),
            "User does not exist."
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

    function createUser(string memory username, address tokenAddress) public {
        AegisFollowers token = AegisFollowers(tokenAddress);

        //user should not already exist
        require(
            users[msg.sender].publicKey == address(0),
            "User already exists."
        );
        //the owner of the collection should be this contract, so that only it can mint new NFTs
        require(
            token.owner() == address(this),
            "Token contract is not owned by Aegis"
        );
        //the NFT collection should be new, with zero existing minted NFTs
        require(token.totalSupply() == 0, "Token's total supply is not zero.");

        User memory newUser = User({
            username: username,
            publicKey: payable(msg.sender),
            tokenAddress: tokenAddress
        });
        users[msg.sender] = newUser;

        //emit new event
        emit UserCreated({
            username: username,
            publicKey: payable(msg.sender),
            tokenAddress: tokenAddress
        });
    }

    function followUser(address publicKey)
        public
        callerIsUser
        isUser(publicKey)
    {
        User memory user = users[publicKey];
        AegisFollowers token = AegisFollowers(user.tokenAddress);
        token.safeMint(publicKey);

        emit UserFollowed({follower: msg.sender, followed: publicKey});
    }
}
