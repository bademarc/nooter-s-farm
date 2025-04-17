// deploy-nooter-swap-zksync.ts
import { Wallet, utils } from "zksync-ethers";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";
import fs from "fs";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Main deployment function
async function main(hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for the NooterSwap contract`);

  // Initialize the wallet
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "");
  console.log(`Deploying from account: ${wallet.address}`);

  // Create deployer
  const deployer = new Deployer(hre, wallet);

  // Load the artifact
  const artifact = await deployer.loadArtifact("NooterSwap");

  // Deploy the contract
  console.log(`Deploying NooterSwap...`);
  const nooterSwap = await deployer.deploy(artifact, []);

  // Show the contract info
  const contractAddress = nooterSwap.address;
  console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

  // Save the contract address to a file
  fs.writeFileSync(".nooter-swap-address", contractAddress);
  console.log("Contract address saved to .nooter-swap-address");

  // Add all farm tokens
  console.log("Adding all farm tokens to the swap contract...");
  const addTokensTx = await nooterSwap.addAllFarmTokens();
  await addTokensTx.wait();
  console.log("All farm tokens added successfully");

  console.log("Deployment completed successfully!");
}

// Execute the deployment
module.exports = (hre: HardhatRuntimeEnvironment) => main(hre);
module.exports.tags = ["NooterSwap"]; 