import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Funding NFT Handler with all NFT types and token IDs...");

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

  // NFT Handler ABI
  const nftHandlerABI = [
    "function isNFTSupported(address nftAddress) external view returns (bool)",
    "function addNFT(address nftAddress) external",
    "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)"
  ];

  // Create contract instances
  const bearishContract = new ethers.Contract(bearishAddress, nftABI, wallet);
  const bit77Contract = new ethers.Contract(bit77Address, nftABI, wallet);
  const nftHandlerContract = new ethers.Contract(nftHandlerAddress, nftHandlerABI, wallet);

  // Number of each NFT to transfer to the handler
  const nftCount = 5;
  
  // Define NFT configurations to fund
  const nftsToFund = [
    { contract: bearishContract, address: bearishAddress, name: "Bearish", tokenIds: [1, 2] }, // Regular and Premium
    { contract: bit77Contract, address: bit77Address, name: "77-Bit", tokenIds: [1] }
  ];

  // First ensure NFTs are added to the handler
  for (const nft of nftsToFund) {
    console.log(`Checking if ${nft.name} NFT is supported by the handler...`);
    try {
      const isSupported = await nftHandlerContract.isNFTSupported(nft.address);
      
      if (!isSupported) {
        console.log(`Adding ${nft.name} NFT to the handler...`);
        const tx = await nftHandlerContract.addNFT(nft.address, { gasLimit: 1000000 });
        console.log(`Transaction submitted: ${tx.hash}`);
        await tx.wait();
        console.log(`✅ ${nft.name} NFT added to the handler.`);
      } else {
        console.log(`✅ ${nft.name} NFT is already supported by the handler.`);
      }
    } catch (error) {
      console.error(`❌ Error checking/adding ${nft.name} NFT:`, error);
    }
  }

  // Then approve and transfer NFTs
  for (const nft of nftsToFund) {
    console.log(`Approving NFT handler to transfer ${nft.name} NFTs...`);
    try {
      // Check if already approved
      const isApproved = await nft.contract.isApprovedForAll(wallet.address, nftHandlerAddress);
      if (!isApproved) {
        // Approve handler for all tokens
        const approveTx = await nft.contract.setApprovalForAll(nftHandlerAddress, true);
        console.log(`Approval transaction submitted: ${approveTx.hash}`);
        await approveTx.wait();
        console.log(`✅ ${nft.name} NFT handler approval successful.`);
      } else {
        console.log(`✅ NFT handler is already approved for ${nft.name} NFTs.`);
      }
    } catch (error) {
      console.error(`❌ Error approving ${nft.name} NFTs:`, error);
    }

    // Transfer each token ID
    for (const tokenId of nft.tokenIds) {
      console.log(`Transferring ${nft.name} NFTs with token ID ${tokenId}...`);
      try {
        // Check current balance of NFT in wallet
        const currentBalance = await nft.contract.balanceOf(wallet.address, tokenId);
        console.log(`Current balance of ${nft.name} NFT (ID ${tokenId}): ${currentBalance.toString()}`);

        // Check current balance in handler
        const handlerBalance = await nftHandlerContract.getNFTBalance(nft.address, tokenId);
        console.log(`Current handler balance of ${nft.name} NFT (ID ${tokenId}): ${handlerBalance.toString()}`);

        if (currentBalance >= nftCount) {
          // Only transfer if handler doesn't have enough
          if (handlerBalance < nftCount) {
            const amountToTransfer = nftCount - Number(handlerBalance);
            console.log(`Transferring ${amountToTransfer} NFTs with ID ${tokenId} to handler...`);
            
            // Transfer the NFTs to the handler
            const tx = await nft.contract.safeTransferFrom(
              wallet.address,
              nftHandlerAddress,
              tokenId,
              amountToTransfer,
              "0x", // Empty data
              { gasLimit: 2000000 }
            );
            console.log(`Transaction submitted: ${tx.hash}`);
            await tx.wait();
            console.log(`✅ Successfully transferred ${amountToTransfer} ${nft.name} NFTs (ID ${tokenId}) to the NFT handler.`);
          } else {
            console.log(`✅ Handler already has enough ${nft.name} NFTs (ID ${tokenId}).`);
          }
        } else {
          console.log(`❌ Not enough ${nft.name} NFTs available for ID ${tokenId}. Current balance: ${currentBalance.toString()}`);
        }
      } catch (error) {
        console.error(`❌ Error transferring ${nft.name} NFTs (ID ${tokenId}):`, error);
      }
    }
  }

  // Check final balances
  console.log("\nFinal NFT balances in the handler:");
  for (const nft of nftsToFund) {
    for (const tokenId of nft.tokenIds) {
      try {
        const balance = await nftHandlerContract.getNFTBalance(nft.address, tokenId);
        console.log(`${nft.name} NFT (ID ${tokenId}): ${balance.toString()}`);
      } catch (error) {
        console.error(`Error checking ${nft.name} NFT (ID ${tokenId}) balance:`, error);
      }
    }
  }

  console.log("\nNFT handler funding process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 