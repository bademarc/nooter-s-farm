// Script to verify that all NFTs are properly supported by the handler contract
const { ethers } = require('ethers');
const fs = require('fs');

// Load address constants
const bearishAddress = fs.existsSync('.bearish-address') 
  ? fs.readFileSync('.bearish-address', 'utf8').trim()
  : "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591";

const bit77Address = fs.existsSync('.77bit-address')
  ? fs.readFileSync('.77bit-address', 'utf8').trim()
  : "0x2BE78875629607D1d982d59d9564dAd218d7Bf51";

const nftHandlerAddress = fs.existsSync('.nft-handler-address')
  ? fs.readFileSync('.nft-handler-address', 'utf8').trim()
  : "0x96b927A5a1e54C8bfCbeb0574BC0A9bA61a13d5E";

// Handler ABI
const NFT_HANDLER_ABI = [
  "function transferNFT(address nftAddress, uint256 tokenId, address recipient, uint256 amount) external",
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function addSupportedNFT(address nftAddress) external",
  "function removeSupportedNFT(address nftAddress) external"
];

// NFT ABI
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function balanceOf(address owner, uint256 id) external view returns (uint256)",
  "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external"
];

// Mapping of NFT names to addresses
const NFT_ADDRESSES = {
  BEARISH: bearishAddress,
  BIT77: bit77Address
};

async function main() {
  try {
    // Correct RPC URL for Abstract Testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.rpc.abstract.xyz');
    
    console.log("Verifying NFT support on handler contract...");
    console.log("Handler address:", nftHandlerAddress);
    
    // Create handler contract instance
    const handlerContract = new ethers.Contract(
      nftHandlerAddress,
      NFT_HANDLER_ABI,
      provider
    );
    
    // Check if each NFT is supported
    for (const [name, address] of Object.entries(NFT_ADDRESSES)) {
      try {
        const isSupported = await handlerContract.isNFTSupported(address);
        console.log(`${name} (${address}): ${isSupported ? 'SUPPORTED ✅' : 'NOT SUPPORTED ❌'}`);
        
        if (isSupported) {
          // Check balance of Token ID 1 for each NFT
          const balance = await handlerContract.getNFTBalance(address, 1);
          console.log(`  - Balance of TokenID 1: ${balance.toString()}`);
          
          if (balance.toString() === '0') {
            console.log(`  - ⚠️ WARNING: No tokens available for claiming!`);
          }
        }
      } catch (error) {
        console.error(`Error checking support for ${name}:`, error.message);
      }
    }
    
    // Get contract owner for reference
    try {
      const owner = await handlerContract.owner();
      console.log("\nContract owner:", owner);
      console.log("If NFTs are not supported, the owner needs to call addSupportedNFT() for each NFT address.");
    } catch (error) {
      console.error("Error getting contract owner:", error.message);
    }
    
    console.log("\nIf any NFTs are not supported, you need to add them to the handler contract.");
    console.log("Instructions:");
    console.log("1. Connect to the blockchain with the owner's wallet");
    console.log("2. For each unsupported NFT, call the 'addSupportedNFT(address)' function");
    console.log("3. Then transfer some NFT tokens to the handler contract so they can be claimed");
    
  } catch (error) {
    console.error("Error running verification script:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 