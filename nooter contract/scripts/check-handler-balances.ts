import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

// NFT Handler ABI
const NFT_HANDLER_ABI = [
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function addNFT(address nftAddress) external",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)",
  "function getAllSupportedNFTs() external view returns (address[])"
];

async function main() {
  console.log("Checking NFT Handler balances...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const bit77Address = fs.readFileSync(".77bit-address", "utf8").trim();
  const nftHandlerAddress = fs.readFileSync(".nft-handler-address", "utf8").trim();
  
  // Try to read Bearish Premium address if it exists
  let bearishPremiumAddress = "";
  try {
    bearishPremiumAddress = fs.readFileSync(".bearish-premium-address", "utf8").trim();
    console.log(`Bearish Premium address found: ${bearishPremiumAddress}`);
  } catch (error) {
    console.log("No Bearish Premium address file found.");
  }

  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`77-Bit NFT address: ${bit77Address}`);
  console.log(`NFT Handler address: ${nftHandlerAddress}`);

  // Create NFT handler contract instance
  const nftHandlerContract = new ethers.Contract(nftHandlerAddress, NFT_HANDLER_ABI, wallet);

  // Get all supported NFT addresses
  console.log("Getting all supported NFTs...");
  const supportedNFTAddresses = await nftHandlerContract.getAllSupportedNFTs();
  console.log(`Found ${supportedNFTAddresses.length} supported NFTs:`);
  
  for (let i = 0; i < supportedNFTAddresses.length; i++) {
    console.log(`NFT ${i+1}: ${supportedNFTAddresses[i]}`);
  }

  // Check balances for each token ID in each NFT
  console.log("\nChecking balances for each NFT:");
  
  // List of NFTs to check (address, name, tokenIds)
  const nftsToCheck = [
    { address: bearishAddress, name: "Bearish", tokenIds: [1, 2] },
    { address: bit77Address, name: "77-Bit", tokenIds: [1] }
  ];
  
  // Add Bearish Premium if it exists
  if (bearishPremiumAddress) {
    nftsToCheck.push({ address: bearishPremiumAddress, name: "Bearish Premium", tokenIds: [1] });
  }

  for (const nft of nftsToCheck) {
    console.log(`\nChecking ${nft.name} NFT (${nft.address}):`);

    // First check if the NFT is supported
    try {
      const isSupported = await nftHandlerContract.isNFTSupported(nft.address);
      if (isSupported) {
        console.log(`✅ ${nft.name} NFT is supported by the handler.`);
        
        // Check balances for each token ID
        for (const tokenId of nft.tokenIds) {
          try {
            const balance = await nftHandlerContract.getNFTBalance(nft.address, tokenId);
            console.log(`Token ID ${tokenId}: ${balance.toString()} NFTs available`);
          } catch (error) {
            console.error(`❌ Error checking balance for ${nft.name} NFT (ID ${tokenId}):`, error);
          }
        }
      } else {
        console.log(`❌ ${nft.name} NFT is NOT supported by the handler.`);
      }
    } catch (error) {
      console.error(`❌ Error checking support for ${nft.name} NFT:`, error);
    }
  }

  console.log("\nNFT Handler balance check completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 