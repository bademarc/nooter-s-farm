// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTSwapHandler
 * @dev Contract to handle ERC1155 NFT transfers for the Nooter's Farm ecosystem
 */
contract NFTSwapHandler is ERC1155Holder, Ownable {
    // Mapping of NFT addresses to supported status
    mapping(address => bool) public supportedNFTs;
    
    // List of supported NFT addresses for enumeration
    address[] public nftList;
    
    // Events
    event NFTAdded(address indexed nftAddress);
    event NFTRemoved(address indexed nftAddress);
    event NFTTransferred(address indexed nftAddress, uint256 indexed tokenId, address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Add a new NFT to be supported
     * @param nftAddress The address of the NFT contract to add
     */
    function addNFT(address nftAddress) external onlyOwner {
        require(nftAddress != address(0), "Invalid NFT address");
        require(!supportedNFTs[nftAddress], "NFT already supported");
        
        supportedNFTs[nftAddress] = true;
        nftList.push(nftAddress);
        
        emit NFTAdded(nftAddress);
    }
    
    /**
     * @dev Remove an NFT from being supported
     * @param nftAddress The address of the NFT contract to remove
     */
    function removeNFT(address nftAddress) external onlyOwner {
        require(supportedNFTs[nftAddress], "NFT not supported");
        
        // Find and remove NFT from the list
        for (uint256 i = 0; i < nftList.length; i++) {
            if (nftList[i] == nftAddress) {
                nftList[i] = nftList[nftList.length - 1];
                nftList.pop();
                break;
            }
        }
        
        supportedNFTs[nftAddress] = false;
        
        emit NFTRemoved(nftAddress);
    }
    
    /**
     * @dev Transfer an NFT to a recipient
     * @param nftAddress The address of the NFT contract
     * @param tokenId The token ID to transfer
     * @param recipient The address to receive the NFT
     * @param amount The amount of NFTs to transfer
     */
    function transferNFT(address nftAddress, uint256 tokenId, address recipient, uint256 amount) external {
        require(supportedNFTs[nftAddress], "NFT not supported");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        
        IERC1155 nft = IERC1155(nftAddress);
        
        // Check if contract has enough NFTs
        uint256 balance = nft.balanceOf(address(this), tokenId);
        require(balance >= amount, "Insufficient NFT balance");
        
        // Transfer the NFT to the recipient
        nft.safeTransferFrom(address(this), recipient, tokenId, amount, "");
        
        emit NFTTransferred(nftAddress, tokenId, recipient, amount);
    }
    
    /**
     * @dev Get all supported NFTs
     * @return Array of NFT addresses
     */
    function getAllSupportedNFTs() external view returns (address[] memory) {
        return nftList;
    }
    
    /**
     * @dev Check if an NFT is supported
     * @param nftAddress The address of the NFT contract
     * @return Whether the NFT is supported
     */
    function isNFTSupported(address nftAddress) external view returns (bool) {
        return supportedNFTs[nftAddress];
    }
    
    /**
     * @dev Get balance of an NFT
     * @param nftAddress The address of the NFT contract
     * @param tokenId The token ID to check
     * @return The balance of the NFT
     */
    function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256) {
        IERC1155 nft = IERC1155(nftAddress);
        return nft.balanceOf(address(this), tokenId);
    }
} 