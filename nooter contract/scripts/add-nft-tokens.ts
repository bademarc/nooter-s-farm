import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Adding NFT tokens to MultiFarmSwap contract...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const bit77Address = fs.readFileSync(".77bit-address", "utf8").trim();
  const swapContractAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"; // Update with the correct swap contract address

  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`77-Bit NFT address: ${bit77Address}`);
  console.log(`Swap contract address: ${swapContractAddress}`);

  // MultiFarmSwap contract ABI (simplified to include only what we need)
  const swapContractABI = [
    "function addToken(address tokenAddress) external returns (bool)"
  ];

  // Create contract instance
  const swapContract = new ethers.Contract(swapContractAddress, swapContractABI, wallet);

  // Add Bearish NFT
  console.log("Adding Bearish NFT to swap contract...");
  try {
    const tx = await swapContract.addToken(bearishAddress, { gasLimit: 1000000 });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Bearish NFT added to MultiFarmSwap successfully!");
  } catch (error) {
    console.error("❌ Error adding Bearish NFT:", error);
  }

  // Add 77-Bit NFT
  console.log("Adding 77-Bit NFT to swap contract...");
  try {
    const tx = await swapContract.addToken(bit77Address, { gasLimit: 1000000 });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ 77-Bit NFT added to MultiFarmSwap successfully!");
  } catch (error) {
    console.error("❌ Error adding 77-Bit NFT:", error);
  }

  console.log("NFT token addition process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 