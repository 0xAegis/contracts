//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Aegis {
    address public manager;

    struct User {
        string username;
        address payable publicKey;
    }

    event UserCreated(string username, address payable publicKey);

    // User [] public users;
    mapping(address => User) public users;

    constructor() {
        manager = msg.sender;
    }

    //checking if an user already exists
    modifier isNotAnExistingUser() {
        require(
            users[msg.sender].publicKey == address(0),
            "User already exists."
        );
        _;
    }

    function createUser(string memory username) public isNotAnExistingUser {
        User memory newUser = User({
            username: username,
            publicKey: payable(msg.sender)
        });
        users[msg.sender] = newUser;

        //emit new event
        emit UserCreated({username: username, publicKey: payable(msg.sender)});
    }
}
