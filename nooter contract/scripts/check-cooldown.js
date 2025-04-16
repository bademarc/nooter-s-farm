const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Checking cooldown status...");
  
  // Get user wallet address from command line if provided
  let userWallet = process.argv[2];
  if (!userWallet) {
    // Use a default address from the error message
    userWallet = "0xD138925168aD03fEe0Cca73cD949F1077C82c093";
    console.log(`No wallet address provided, using default: ${userWallet}`);
  }

  // Get deployment info
  const deploymentInfoPath = ".deployment-info.json";
  let deploymentInfo = {};
  
  try {
    if (fs.existsSync(deploymentInfoPath)) {
      const fileData = fs.readFileSync(deploymentInfoPath, "utf8");
      deploymentInfo = JSON.parse(fileData);
    } else {
      console.error("Deployment info file not found.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error reading deployment info:", error);
    process.exit(1);
  }

  const farmSwapAddress = deploymentInfo.farmSwapAddress;
  console.log(`FarmSwap address: ${farmSwapAddress}`);

  // Get transaction history for the user
  console.log(`Checking transaction history for ${userWallet}...`);
  
  // Get the latest block
  const latestBlock = await hre.ethers.provider.getBlock("latest");
  console.log(`Current block: ${latestBlock.number}`);
  console.log(`Current timestamp: ${new Date(latestBlock.timestamp * 1000).toISOString()}`);
  
  // Try to get the user's balance
  const nootTokenAddress = deploymentInfo.nootTokenAddress;
  const nootToken = await hre.ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)"],
    nootTokenAddress
  );
  
  const balance = await nootToken.balanceOf(userWallet);
  console.log(`User NOOT balance: ${hre.ethers.formatUnits(balance, 18)}`);
  
  // The contract doesn't have explicit cooldown tracking, so we'll display diagnostics
  console.log("\n======= DIAGNOSTICS =======");
  console.log("The transaction is failing with 'Contract execution reverted'. This usually means:");
  console.log("1. You've already claimed tokens recently and need to wait before claiming again");
  console.log("2. You're hitting an internal rate limit in the contract");
  console.log("3. There might be an issue with the contract configuration");
  
  console.log("\n======= RECOMMENDATIONS =======");
  console.log("1. Wait at least 24 hours since your last claim attempt before trying again");
  console.log("2. Try claiming a smaller amount of tokens");
  console.log("3. If you urgently need tokens, contact the contract owner");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 