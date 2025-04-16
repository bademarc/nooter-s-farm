const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require('dotenv').config();

async function main() {
  // Get the wallet address to check from command line args or .env
  let walletToCheck = process.env.WALLET_TO_CHECK;
  
  if (process.argv.length > 2) {
    walletToCheck = process.argv[2];
  }
  
  if (!walletToCheck) {
    console.error("Please provide a wallet address to check as an argument or set WALLET_TO_CHECK in .env");
    process.exit(1);
  }
  
  try {
    // Validate address format
    walletToCheck = ethers.getAddress(walletToCheck);
  } catch (error) {
    console.error("Invalid Ethereum address format:", error.message);
    process.exit(1);
  }
  
  console.log(`Checking cooldown status for wallet: ${walletToCheck}`);
  
  // Get deployment info
  const deploymentInfoPath = path.join(__dirname, "../.deployment-info.json");
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
  if (!farmSwapAddress) {
    console.error("FarmSwap address not found in deployment info");
    process.exit(1);
  }
  
  console.log(`FarmSwap address: ${farmSwapAddress}`);
  
  // Define the ABI for checking cooldown - we'll try both with and without the cooldown function
  // since the deployed contract might not have the cooldown functionality
  const SWAP_ABI = [
    "function lastClaimTime(address) view returns (uint256)",
    "function remainingCooldown(address) view returns (uint256)",
    "function cooldownPeriod() view returns (uint256)"
  ];
  
  // Connect to the contract
  const farmSwap = await ethers.getContractAt(SWAP_ABI, farmSwapAddress);
  
  // Get current block timestamp
  const currentBlock = await ethers.provider.getBlock("latest");
  const currentTimestamp = currentBlock.timestamp;
  const currentTime = new Date(currentTimestamp * 1000);
  console.log(`Current blockchain time: ${currentTime.toISOString()}`);
  
  // Check if the cooldown functions exist on the contract
  let hasCooldownFeatures = false;
  
  try {
    console.log(`Checking if contract has cooldown features...`);
    
    // Try to call the cooldownPeriod function
    // This is a simple way to check if the contract has the cooldown functionality
    const cooldownPeriod = await farmSwap.cooldownPeriod();
    
    hasCooldownFeatures = true;
    console.log(`✅ Contract has cooldown features with period: ${cooldownPeriod} seconds (${cooldownPeriod / 3600} hours)`);
    
    // Get the last claim time
    const lastClaimTime = await farmSwap.lastClaimTime(walletToCheck);
    
    if (lastClaimTime.toString() === "0") {
      console.log(`✅ User has never claimed tokens, they should be able to claim.`);
    } else {
      const lastClaimDate = new Date(Number(lastClaimTime) * 1000);
      console.log(`Last claim time: ${lastClaimDate.toISOString()}`);
      
      // Calculate time since last claim
      const timeSinceLastClaim = currentTimestamp - lastClaimTime;
      console.log(`Time since last claim: ${timeSinceLastClaim} seconds (${(timeSinceLastClaim / 3600).toFixed(2)} hours)`);
      
      // Check remaining cooldown
      const remainingTime = await farmSwap.remainingCooldown(walletToCheck);
      
      if (remainingTime.toString() === "0") {
        console.log(`✅ Cooldown period has elapsed, user can claim tokens now.`);
      } else {
        const cooldownEnds = new Date((currentTimestamp + Number(remainingTime)) * 1000);
        console.log(`❌ User is still in cooldown period.`);
        console.log(`Remaining cooldown: ${remainingTime} seconds (${(remainingTime / 3600).toFixed(2)} hours)`);
        console.log(`Cooldown ends at: ${cooldownEnds.toISOString()}`);
      }
    }
  } catch (error) {
    console.log(`❌ Contract does not have explicit cooldown features. Error: ${error.message}`);
    console.log(`It's possible there's a cooldown mechanism implemented without the explicit functions.`);
    
    // Now let's try to investigate the transaction history to determine potential cooldown issues
    console.log(`\nAnalyzing recent transactions...`);
    
    try {
      // This is a simplified approach since we don't have full transaction history tools in this script
      console.log(`To further diagnose this issue, check the following:`);
      console.log(`1. The contract may have a hardcoded time limit between claims`);
      console.log(`2. The transaction logs may reveal when the user last claimed tokens`);
      console.log(`3. The user might need to wait longer between claim attempts`);
      
      console.log(`\nRecommendations:`);
      console.log(`- Try claiming again after 24 hours from your last attempt`);
      console.log(`- Check for any logs in the failed transaction that might indicate the reason for failure`);
      console.log(`- If urgently needed, request the contract owner to fund an alternative distribution method`);
    } catch (analyzeError) {
      console.error("Error analyzing transactions:", analyzeError);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  }); 