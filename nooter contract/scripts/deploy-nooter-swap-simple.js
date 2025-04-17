// deploy-nooter-swap-simple.js
const { ethers } = require("hardhat");
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("Starting simple NooterSwap deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);

  // Deploy the contract
  console.log("Deploying the NooterSwap contract...");
  const NooterSwap = await ethers.getContractFactory("NooterSwap");
  console.log("Contract factory created, initiating deployment...");
  
  // Use lower-level deployment method
  const deployTx = await deployer.sendTransaction({
    data: NooterSwap.bytecode,
    gasLimit: 6000000 // Adjust as needed
  });
  
  console.log(`Deployment transaction sent. Hash: ${deployTx.hash}`);
  console.log("Waiting for transaction to be mined...");
  const receipt = await deployTx.wait();
  
  if (!receipt.status) {
    throw new Error("Deployment transaction failed");
  }
  
  const contractAddress = receipt.contractAddress;
  console.log(`NooterSwap contract deployed at address: ${contractAddress}`);
  
  // Save the address to a file
  fs.writeFileSync('.nooter-swap-address', contractAddress);
  console.log("Contract address saved to .nooter-swap-address");
  
  // Get an instance of the deployed contract
  const nooterSwap = await ethers.getContractAt("NooterSwap", contractAddress);
  
  // Add all farm tokens
  console.log("Adding all farm tokens to the contract...");
  const tx = await nooterSwap.addAllFarmTokens();
  console.log(`Transaction hash: ${tx.hash}`);
  console.log("Waiting for transaction to be mined...");
  await tx.wait();
  console.log("All farm tokens added successfully");
  
  console.log("Deployment and setup completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed with error:");
    console.error(error);
    process.exit(1);
  }); 