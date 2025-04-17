// deploy-nooter-swap-standard.js
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Deploying NooterSwap contract (standard method)...");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);

  // Compile the contract (just to be sure)
  await hre.run('compile');

  // Deploy the contract using a more explicit approach
  console.log('Deploying contract...');
  const NooterSwap = await hre.ethers.getContractFactory("NooterSwap");
  const nooterSwap = await NooterSwap.connect(deployer).deploy();
  
  console.log(`Contract deployment transaction hash: ${nooterSwap.hash}`);
  console.log('Waiting for deployment transaction confirmation...');
  
  // Wait for deployment confirmation
  const receipt = await nooterSwap.wait();
  
  if (!receipt.status) {
    throw new Error('Deployment failed');
  }
  
  // Get deployed contract address from receipt
  const contractAddress = receipt.contractAddress;
  console.log(`NooterSwap deployed to: ${contractAddress}`);
  
  // Save the address to a file
  fs.writeFileSync('.nooter-swap-address', contractAddress);
  console.log('Contract address saved to .nooter-swap-address');
  
  // Get an instance of the deployed contract
  const deployedContract = await hre.ethers.getContractAt("NooterSwap", contractAddress);
  
  // Add all farm tokens
  console.log("Adding all farm tokens to the swap contract...");
  const tx = await deployedContract.addAllFarmTokens();
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