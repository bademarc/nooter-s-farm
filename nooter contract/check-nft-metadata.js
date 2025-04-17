const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("Checking current NFT metadata URIs...");

  try {
    // Connect to Abstract testnet - using ethers v6 syntax
    const provider = new ethers.JsonRpcProvider('https://api.testnet.abs.xyz');
    
    // Get contract addresses
    const bearishAddress = fs.existsSync('.bearish-address')
      ? fs.readFileSync('.bearish-address', 'utf8').trim()
      : "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591";
    
    const bit77Address = fs.existsSync('.77bit-address')
      ? fs.readFileSync('.77bit-address', 'utf8').trim()
      : "0x2BE78875629607D1d982d59d9564dAd218d7Bf51";
    
    console.log(`Bearish NFT address: ${bearishAddress}`);
    console.log(`77-Bit NFT address: ${bit77Address}`);
    
    // NFT ABI (simplified to include only what we need)
    const nftABI = ["function uri(uint256 tokenId) public view returns (string memory)"];
    
    // Create contract instances (read-only, so no wallet needed)
    const bearishContract = new ethers.Contract(bearishAddress, nftABI, provider);
    const bit77Contract = new ethers.Contract(bit77Address, nftABI, provider);
    
    // Check URIs
    const bearishURI = await bearishContract.uri(1);
    const bit77URI = await bit77Contract.uri(1);
    
    console.log("\nCurrent URIs:");
    console.log(`Bearish NFT URI: ${bearishURI}`);
    console.log(`77-Bit NFT URI: ${bit77URI}`);
    
    // Try to fetch metadata
    console.log("\nAttempting to resolve IPFS URIs (this might not work if your node can't access IPFS):");
    if (bearishURI.startsWith('ipfs://')) {
      const bearishCID = bearishURI.replace('ipfs://', '').replace('/1.json', '');
      console.log(`Bearish metadata CID: ${bearishCID}`);
      console.log(`Try viewing it at: https://cloudflare-ipfs.com/ipfs/${bearishCID}/1.json`);
    }
    
    if (bit77URI.startsWith('ipfs://')) {
      const bit77CID = bit77URI.replace('ipfs://', '').replace('/1.json', '');
      console.log(`77-Bit metadata CID: ${bit77CID}`);
      console.log(`Try viewing it at: https://cloudflare-ipfs.com/ipfs/${bit77CID}/1.json`);
    }
    
  } catch (error) {
    console.error("❌ Error checking NFT metadata:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 