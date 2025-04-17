import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying NFTSwapHandler to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Deploy the contract
  const NFTSwapHandlerFactory = await ethers.getContractFactory("NFTSwapHandler", wallet);
  const nftHandler = await NFTSwapHandlerFactory.deploy();
  
  await nftHandler.waitForDeployment();
  const nftHandlerAddress = await nftHandler.getAddress();
  
  console.log(`NFTSwapHandler deployed to: ${nftHandlerAddress}`);
  
  // Save contract address for verification
  fs.writeFileSync(".nft-handler-address", nftHandlerAddress);

  // Get the contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const bit77Address = fs.readFileSync(".77bit-address", "utf8").trim();
  
  console.log(`Adding NFTs to the handler...`);
  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`77-Bit NFT address: ${bit77Address}`);
  
  // Add the NFTs to the handler
  try {
    // Add Bearish NFT
    const addBearishTx = await nftHandler.addNFT(bearishAddress);
    console.log(`Adding Bearish NFT transaction: ${addBearishTx.hash}`);
    await addBearishTx.wait();
    console.log(`✅ Bearish NFT added to handler successfully`);
    
    // Add 77-Bit NFT
    const add77BitTx = await nftHandler.addNFT(bit77Address);
    console.log(`Adding 77-Bit NFT transaction: ${add77BitTx.hash}`);
    await add77BitTx.wait();
    console.log(`✅ 77-Bit NFT added to handler successfully`);
  } catch (error) {
    console.error("Error adding NFTs to handler:", error);
  }
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: nftHandlerAddress,
      contract: "contracts/NFTSwapHandler.sol:NFTSwapHandler",
      constructorArguments: [],
      network: "abstractTestnet",
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }

  console.log("Deployment process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 