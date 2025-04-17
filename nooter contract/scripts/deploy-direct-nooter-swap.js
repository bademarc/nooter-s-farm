// deploy-direct-nooter-swap.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying DirectNooterSwap contract...");

  // Deploy the DirectNooterSwap contract
  const DirectNooterSwap = await hre.ethers.getContractFactory("DirectNooterSwap");
  const directNooterSwap = await DirectNooterSwap.deploy();

  await directNooterSwap.deployed();

  console.log(`DirectNooterSwap deployed to: ${directNooterSwap.address}`);
  
  // Initialize by adding all farm tokens
  console.log("Adding all farm tokens to the swap contract...");
  const tx = await directNooterSwap.addAllFarmTokens();
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