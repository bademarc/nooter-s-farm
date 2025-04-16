// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Bearish is ERC1155Supply, Ownable {
    using Strings for uint256;

    string public name = "Bearish";
    string public symbol = "BEAR";
    
    // NFT Token ID (only 1 type)
    uint256 public constant BEARISH = 1;
    
    // Base URI for metadata
    string private _baseURI = "";
    
    constructor() ERC1155("") Ownable(msg.sender) {
        // Mint 1000 tokens with ID 1 to the deployer
        _mint(msg.sender, BEARISH, 1000, "");
    }
    
    /**
     * @dev Sets a new base URI for all token metadata
     */
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseURI = baseURI;
    }
    
    /**
     * @dev Returns the URI for token metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "URI query for nonexistent token");
        
        return bytes(_baseURI).length > 0 
            ? string(abi.encodePacked(_baseURI, tokenId.toString(), ".json"))
            : "";
    }
} 