const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("Updating Bearish NFT metadata URI...");

  // Get the private key from .env file
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("WALLET_PRIVATE_KEY not found in .env file");
  }

  // Connect to Abstract testnet - using ethers v6 syntax
  const provider = new ethers.JsonRpcProvider('https://api.testnet.abs.xyz');
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the Bearish contract address
  const bearishAddress = fs.existsSync('.bearish-address')
    ? fs.readFileSync('.bearish-address', 'utf8').trim()
    : "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591";

  console.log(`Bearish NFT address: ${bearishAddress}`);

  // Replace this with your new CID after uploading the updated metadata
  // Note: This should be the CID of the directory containing the 1.json file
  const newCID = "bafkreiekvt2a2jd5qlaowhkpgvrvdpecpp7u6iktb3ovkam2bsucvh6wj4"; // <-- REPLACE THIS

  // Create base URI with IPFS protocol
  const bearishBaseURI = `ipfs://${newCID}/`;
  console.log(`Setting new Bearish NFT base URI to: ${bearishBaseURI}`);

  // NFT ABI (simplified to include only what we need)
  const nftABI = [
    "function setBaseURI(string memory baseURI) external",
    "function uri(uint256 tokenId) public view returns (string memory)"
  ];

  // Create contract instance
  const bearishContract = new ethers.Contract(bearishAddress, nftABI, wallet);

  // Set URI for Bearish NFT
  try {
    const tx = await bearishContract.setBaseURI(bearishBaseURI);
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Bearish NFT base URI updated successfully");

    // Verify the URI was set correctly
    const tokenURI = await bearishContract.uri(1);
    console.log(`Verified Bearish NFT URI: ${tokenURI}`);
  } catch (error) {
    console.error("❌ Error updating Bearish NFT base URI:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 