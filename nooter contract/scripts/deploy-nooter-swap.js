// deploy-nooter-swap.js
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying NooterSwap contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);

  // Deploy the NooterSwap contract
  const NooterSwap = await hre.ethers.getContractFactory("NooterSwap");
  const nooterSwap = await NooterSwap.deploy();
  
  // Wait for the deployment transaction receipt
  console.log("Waiting for deployment transaction confirmation...");
  
  // Get the deployment receipt/address
  const address = nooterSwap.address;
  console.log(`NooterSwap deployed to: ${address}`);
  
  // Save the address to a file
  fs.writeFileSync('.nooter-swap-address', address);
  console.log('Contract address saved to .nooter-swap-address');
  
  // Optional: Add all farm tokens
  console.log("Adding all farm tokens to the swap contract...");
  const tx = await nooterSwap.addAllFarmTokens();
  await tx.wait();
  console.log("All farm tokens added successfully");
  
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 