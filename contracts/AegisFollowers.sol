// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract AegisFollowers is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using Strings for address;

    Counters.Counter private _tokenIdCounter;
    address public user;

    constructor(address publicKey) ERC721("AegisFollowers", "AGF") {
        user = publicKey;
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        // Get string representation of user address
        string memory userPublicKey = Strings.toHexString(
            uint256(uint160(user)),
            20
        );
        // Create the SVG to be used as image
        bytes memory imageSvg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base{fill:#fff;font-family:monospace;font-size:10px}</style><rect width="100%" height="100%"/><text x="50%" y="20%" class="base" dominant-baseline="middle" text-anchor="middle">Aegis Follower Token</text><text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">of User ',
            userPublicKey,
            '</text><text x="50%" y="80%" class="base" dominant-baseline="middle" text-anchor="middle"># ',
            tokenId.toString(),
            "</text></svg>"
        );
        // Create the JSON metadata
        bytes memory metadataJson = abi.encodePacked(
            "{",
            '"name": "Aegis: Follower Token # ',
            tokenId.toString(),
            " of User ",
            userPublicKey,
            '",',
            '"description": "This token represents follow number ',
            tokenId.toString(),
            " of user ",
            userPublicKey,
            '",',
            // In the image field, we put Base64 encoded SVG in form of a data URI
            '"image": "data:image/svg+xml;base64,',
            Base64.encode(imageSvg),
            '"}'
        );
        // Return NFT metadata URI
        return
            string(
                abi.encodePacked(
                    // Again, we use Base64 encoded JSON in form of a data URI
                    "data:application/json;base64,",
                    Base64.encode(metadataJson)
                )
            );
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
