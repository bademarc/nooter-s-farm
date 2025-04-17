import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

// NFT Handler ABI
const NFT_HANDLER_ABI = [
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function addNFT(address nftAddress) external",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)"
];

// Simplified ERC1155 ABI
const ERC1155_ABI = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external"
];

async function main() {
  console.log("Creating Bearish Premium NFTs and adding to handler...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the NFT handler address
  const nftHandlerAddress = fs.readFileSync(".nft-handler-address", "utf8").trim();
  console.log(`NFT Handler address: ${nftHandlerAddress}`);

  // Step 1: Deploy the Bearish Premium contract
  console.log("Deploying Bearish Premium contract...");
  const ContractFactory = await ethers.getContractFactory("Bearish");
  const bearishPremium = await ContractFactory.deploy();
  await bearishPremium.waitForDeployment();
  
  const bearishPremiumAddress = await bearishPremium.getAddress();
  console.log(`Bearish Premium contract deployed at: ${bearishPremiumAddress}`);

  // Save the address to a file
  fs.writeFileSync(".bearish-premium-address", bearishPremiumAddress);
  console.log("Bearish Premium address saved to .bearish-premium-address");

  // Step 2: Add the new NFT to the handler
  console.log("Adding Bearish Premium NFT to handler...");
  const nftHandlerContract = new ethers.Contract(nftHandlerAddress, NFT_HANDLER_ABI, wallet);
  
  try {
    const isSupported = await nftHandlerContract.isNFTSupported(bearishPremiumAddress);
    
    if (!isSupported) {
      const tx = await nftHandlerContract.addNFT(bearishPremiumAddress, { gasLimit: 1000000 });
      console.log(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Bearish Premium NFT added to the handler.");
    } else {
      console.log("✅ Bearish Premium NFT is already supported by the handler.");
    }
  } catch (error) {
    console.error("❌ Error adding Bearish Premium NFT to handler:", error);
  }
  
  // Step 3: Approve and transfer NFTs to the handler
  console.log("Approving handler to transfer Bearish Premium NFTs...");
  
  try {
    // Create contract instance with the ERC1155 ABI
    const bearishContract = new ethers.Contract(bearishPremiumAddress, ERC1155_ABI, wallet);
    
    // Check if already approved
    const isApproved = await bearishContract.isApprovedForAll(wallet.address, nftHandlerAddress);
    if (!isApproved) {
      // Approve handler for all tokens
      const approveTx = await bearishContract.setApprovalForAll(nftHandlerAddress, true);
      console.log(`Approval transaction submitted: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("✅ Bearish Premium NFT handler approval successful.");
    } else {
      console.log("✅ NFT handler is already approved for Bearish Premium NFTs.");
    }
    
    // Check our balance of token ID 1 (the default one minted in constructor)
    const tokenId = 1; // The Bearish contract mints token ID 1 by default
    const balance = await bearishContract.balanceOf(wallet.address, tokenId);
    console.log(`Current balance of Bearish Premium NFT (ID ${tokenId}): ${balance.toString()}`);
    
    // Transfer 10 NFTs to the handler
    const nftCount = 10;
    
    if (balance >= nftCount) {
      const tx = await bearishContract.safeTransferFrom(
        wallet.address,
        nftHandlerAddress,
        tokenId,
        nftCount,
        "0x", // Empty data
        { gasLimit: 2000000 }
      );
      console.log(`Transfer transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Successfully transferred ${nftCount} Bearish Premium NFTs to the NFT handler.`);
      
      // Check the handler's balance now
      const handlerBalance = await nftHandlerContract.getNFTBalance(bearishPremiumAddress, tokenId);
      console.log(`Handler balance of Bearish Premium NFT: ${handlerBalance.toString()}`);
    } else {
      console.log(`❌ Not enough Bearish Premium NFTs available. Current balance: ${balance.toString()}`);
    }
  } catch (error) {
    console.error("❌ Error approving/transferring Bearish Premium NFTs:", error);
  }

  // Step 4: Update app configuration
  console.log("\nIMPORTANT: Update your app with the following changes:");
  console.log("1. In your app/farm-cases/noot-case/page.tsx file, update NFT_ADDRESSES:");
  console.log(`   NFT_ADDRESSES = {`);
  console.log(`     BEARISH: "${bearishPremiumAddress}", // Updated Bearish Premium address`);
  console.log(`     BIT77: "0xFDEC061cDe2DcfbA7713d2692B373692faF57451"`);
  console.log(`   };`);
  
  console.log("\n2. Update the itemDetails entry for legendary6:");
  console.log(`   legendary6: {`);
  console.log(`     name: 'Bearish NFT Premium',`);
  console.log(`     price: prices.legendary * 2.5,`);
  console.log(`     image: '/case%20items/golden/bearish.jpg',`);
  console.log(`     isNFT: true,`);
  console.log(`     nftAddress: "${bearishPremiumAddress}", // Updated Bearish Premium address`);
  console.log(`     tokenId: 1 // The token ID in the new contract is 1 (not 2)`);
  console.log(`   }`);
  
  console.log("\nBearish Premium NFT setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 