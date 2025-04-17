import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

// Custom Bearish ABI with mint function
const BEARISH_ABI = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address account, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external",
  "function mint(address to, uint256 id, uint256 amount, bytes calldata data) external",
  "function owner() external view returns (address)"
];

// NFT Handler ABI
const NFT_HANDLER_ABI = [
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function addNFT(address nftAddress) external",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)"
];

async function main() {
  console.log("Minting Bearish Premium NFTs (token ID 2) and transferring to NFT Handler...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const nftHandlerAddress = fs.readFileSync(".nft-handler-address", "utf8").trim();

  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`NFT Handler address: ${nftHandlerAddress}`);

  // Create contract instances
  const bearishContract = new ethers.Contract(bearishAddress, BEARISH_ABI, wallet);
  const nftHandlerContract = new ethers.Contract(nftHandlerAddress, NFT_HANDLER_ABI, wallet);

  // Number of NFTs to mint and transfer
  const nftCount = 10;
  const BEARISH_PREMIUM_TOKEN_ID = 2;

  // Step 1: Mint Bearish Premium NFTs
  console.log(`Minting ${nftCount} Bearish Premium NFTs (token ID ${BEARISH_PREMIUM_TOKEN_ID})...`);
  
  try {
    // Check if we own the contract first
    const ownerAddress = await bearishContract.owner();
    console.log(`Bearish contract owner: ${ownerAddress}`);
    
    if (ownerAddress.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error("❌ You are not the owner of the Bearish contract. Only the owner can mint new tokens.");
      return;
    }
    
    // Mint the token ID 2 NFTs
    const mintTx = await bearishContract.mint(
      wallet.address, 
      BEARISH_PREMIUM_TOKEN_ID, 
      nftCount, 
      "0x", // Empty data
      { gasLimit: 2000000 }
    );
    
    console.log(`Mint transaction submitted: ${mintTx.hash}`);
    await mintTx.wait();
    console.log(`✅ Successfully minted ${nftCount} Bearish Premium NFTs.`);
    
    // Check the new balance
    const newBalance = await bearishContract.balanceOf(wallet.address, BEARISH_PREMIUM_TOKEN_ID);
    console.log(`New Bearish Premium NFT balance: ${newBalance.toString()}`);
  } catch (error) {
    console.error("❌ Error minting Bearish Premium NFTs:", error);
    return;
  }

  // Step 2: Ensure NFT is supported by the handler
  console.log("Checking if Bearish NFT is supported by the handler...");
  try {
    const isSupported = await nftHandlerContract.isNFTSupported(bearishAddress);
    
    if (!isSupported) {
      console.log("Adding Bearish NFT to the handler...");
      const tx = await nftHandlerContract.addNFT(bearishAddress, { gasLimit: 1000000 });
      console.log(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Bearish NFT added to the handler.");
    } else {
      console.log("✅ Bearish NFT is already supported by the handler.");
    }
  } catch (error) {
    console.error("❌ Error checking/adding Bearish NFT:", error);
  }

  // Step 3: Approve the handler
  console.log("Approving NFT handler to transfer Bearish NFTs...");
  try {
    const isApproved = await bearishContract.isApprovedForAll(wallet.address, nftHandlerAddress);
    if (!isApproved) {
      const approveTx = await bearishContract.setApprovalForAll(nftHandlerAddress, true);
      console.log(`Approval transaction submitted: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("✅ Bearish NFT handler approval successful.");
    } else {
      console.log("✅ NFT handler is already approved for Bearish NFTs.");
    }
  } catch (error) {
    console.error("❌ Error approving Bearish NFTs:", error);
  }

  // Step 4: Transfer the NFTs to the handler
  console.log(`Transferring Bearish Premium NFTs (token ID ${BEARISH_PREMIUM_TOKEN_ID}) to NFT handler...`);
  try {
    // Check current balance in handler
    const handlerBalance = await nftHandlerContract.getNFTBalance(bearishAddress, BEARISH_PREMIUM_TOKEN_ID);
    console.log(`Current handler balance of Bearish Premium NFT: ${handlerBalance.toString()}`);
    
    // Check current wallet balance
    const walletBalance = await bearishContract.balanceOf(wallet.address, BEARISH_PREMIUM_TOKEN_ID);
    console.log(`Current wallet balance of Bearish Premium NFT: ${walletBalance.toString()}`);
    
    if (walletBalance >= nftCount) {
      // Transfer the NFTs to the handler
      const transferTx = await bearishContract.safeTransferFrom(
        wallet.address,
        nftHandlerAddress,
        BEARISH_PREMIUM_TOKEN_ID,
        nftCount,
        "0x", // Empty data
        { gasLimit: 2000000 }
      );
      
      console.log(`Transfer transaction submitted: ${transferTx.hash}`);
      await transferTx.wait();
      console.log(`✅ Successfully transferred ${nftCount} Bearish Premium NFTs to the NFT handler.`);
      
      // Check the new balance in handler
      const newHandlerBalance = await nftHandlerContract.getNFTBalance(bearishAddress, BEARISH_PREMIUM_TOKEN_ID);
      console.log(`New handler balance of Bearish Premium NFT: ${newHandlerBalance.toString()}`);
    } else {
      console.log(`❌ Not enough Bearish Premium NFTs available. Current balance: ${walletBalance.toString()}`);
    }
  } catch (error) {
    console.error("❌ Error transferring Bearish Premium NFTs:", error);
  }

  console.log("Bearish Premium NFT minting and transfer process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 