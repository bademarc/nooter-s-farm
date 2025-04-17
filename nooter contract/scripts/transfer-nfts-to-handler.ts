import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Transferring NFTs to NFTSwapHandler...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const bit77Address = fs.readFileSync(".77bit-address", "utf8").trim();
  const nftHandlerAddress = fs.readFileSync(".nft-handler-address", "utf8").trim();

  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`77-Bit NFT address: ${bit77Address}`);
  console.log(`NFT Handler address: ${nftHandlerAddress}`);

  // ERC1155 NFT ABI (simplified to include only what we need)
  const nftABI = [
    "function balanceOf(address account, uint256 id) external view returns (uint256)",
    "function setApprovalForAll(address operator, bool approved) external",
    "function isApprovedForAll(address account, address operator) external view returns (bool)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external"
  ];

  // Create contract instances
  const bearishContract = new ethers.Contract(bearishAddress, nftABI, wallet);
  const bit77Contract = new ethers.Contract(bit77Address, nftABI, wallet);

  // Number of NFTs to transfer to the handler
  const nftCount = 10;
  
  // Token IDs for each NFT contract
  const BEARISH_TOKEN_ID = 1;
  const BIT77_TOKEN_ID = 1;

  // First approve the handler to transfer NFTs
  console.log("Approving NFT handler to transfer Bearish NFTs...");
  try {
    // Check if already approved
    const isBearishApproved = await bearishContract.isApprovedForAll(wallet.address, nftHandlerAddress);
    if (!isBearishApproved) {
      // Approve handler for all tokens
      const approveBearishTx = await bearishContract.setApprovalForAll(nftHandlerAddress, true);
      console.log(`Approval transaction submitted: ${approveBearishTx.hash}`);
      await approveBearishTx.wait();
      console.log("✅ Bearish NFT handler approval successful.");
    } else {
      console.log("✅ NFT handler is already approved for Bearish NFTs.");
    }
  } catch (error) {
    console.error("❌ Error approving Bearish NFTs:", error);
  }

  console.log("Approving NFT handler to transfer 77-Bit NFTs...");
  try {
    // Check if already approved
    const isBit77Approved = await bit77Contract.isApprovedForAll(wallet.address, nftHandlerAddress);
    if (!isBit77Approved) {
      // Approve handler for all tokens
      const approveBit77Tx = await bit77Contract.setApprovalForAll(nftHandlerAddress, true);
      console.log(`Approval transaction submitted: ${approveBit77Tx.hash}`);
      await approveBit77Tx.wait();
      console.log("✅ 77-Bit NFT handler approval successful.");
    } else {
      console.log("✅ NFT handler is already approved for 77-Bit NFTs.");
    }
  } catch (error) {
    console.error("❌ Error approving 77-Bit NFTs:", error);
  }

  // Transfer Bearish NFTs
  console.log(`Transferring ${nftCount} Bearish NFTs to NFT handler...`);
  try {
    // Check current balance first
    const currentBearishBalance = await bearishContract.balanceOf(wallet.address, BEARISH_TOKEN_ID);
    console.log(`Current Bearish NFT balance: ${currentBearishBalance.toString()}`);

    if (currentBearishBalance >= nftCount) {
      // Transfer the NFTs to the handler
      const tx = await bearishContract.safeTransferFrom(
        wallet.address,
        nftHandlerAddress,
        BEARISH_TOKEN_ID,
        nftCount,
        "0x", // Empty data
        { gasLimit: 2000000 }
      );
      console.log(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Successfully transferred ${nftCount} Bearish NFTs to the NFT handler.`);
    } else {
      console.log(`❌ Not enough Bearish NFTs available. Current balance: ${currentBearishBalance.toString()}`);
    }
  } catch (error) {
    console.error("❌ Error transferring Bearish NFTs:", error);
  }

  // Transfer 77-Bit NFTs
  console.log(`Transferring ${nftCount} 77-Bit NFTs to NFT handler...`);
  try {
    // Check current balance first
    const currentBit77Balance = await bit77Contract.balanceOf(wallet.address, BIT77_TOKEN_ID);
    console.log(`Current 77-Bit NFT balance: ${currentBit77Balance.toString()}`);

    if (currentBit77Balance >= nftCount) {
      // Transfer the NFTs to the handler
      const tx = await bit77Contract.safeTransferFrom(
        wallet.address,
        nftHandlerAddress,
        BIT77_TOKEN_ID,
        nftCount,
        "0x", // Empty data
        { gasLimit: 2000000 }
      );
      console.log(`Transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Successfully transferred ${nftCount} 77-Bit NFTs to the NFT handler.`);
    } else {
      console.log(`❌ Not enough 77-Bit NFTs available. Current balance: ${currentBit77Balance.toString()}`);
    }
  } catch (error) {
    console.error("❌ Error transferring 77-Bit NFTs:", error);
  }

  console.log("NFT transfer process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 