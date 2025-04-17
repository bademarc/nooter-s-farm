const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("Updating 77-Bit NFT metadata URI...");

  // Get the private key from .env file
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WALLET_PRIVATE_KEY not found in .env file");
  }

  // Connect to Abstract testnet - using ethers v6 syntax
  const provider = new ethers.JsonRpcProvider('https://api.testnet.abs.xyz');
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the 77-Bit contract address
  const bit77Address = fs.existsSync('.77bit-address')
    ? fs.readFileSync('.77bit-address', 'utf8').trim()
    : "0x2BE78875629607D1d982d59d9564dAd218d7Bf51";

  console.log(`77-Bit NFT address: ${bit77Address}`);

  // Use the CID provided by the user
  const newCID = "bafkreig5evonmduvlbbjwaw5jafhhkfsdmg5fxuine4jntebbee3h54byi";

  // Create base URI with IPFS protocol
  const bit77BaseURI = `ipfs://${newCID}/`;
  console.log(`Setting 77-Bit NFT base URI to: ${bit77BaseURI}`);

  // NFT ABI (simplified to include only what we need)
  const nftABI = [
    "function setBaseURI(string memory baseURI) external",
    "function uri(uint256 tokenId) public view returns (string memory)"
  ];

  // Create contract instance
  const bit77Contract = new ethers.Contract(bit77Address, nftABI, wallet);

  // Set URI for 77-Bit NFT
  try {
    const tx = await bit77Contract.setBaseURI(bit77BaseURI);
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ 77-Bit NFT base URI updated successfully");

    // Verify the URI was set correctly
    const tokenURI = await bit77Contract.uri(1);
    console.log(`Verified 77-Bit NFT URI: ${tokenURI}`);
  } catch (error) {
    console.error("❌ Error updating 77-Bit NFT base URI:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 