const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Checking FarmSwap contract status...");
  
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

  const nootTokenAddress = deploymentInfo.nootTokenAddress;
  const farmSwapAddress = deploymentInfo.farmSwapAddress;

  console.log(`NOOT token address: ${nootTokenAddress}`);
  console.log(`FarmSwap address: ${farmSwapAddress}`);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to network: ${network.name} (chain ID: ${network.chainId})`);

  // Create contract instances
  const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
  ];

  const SWAP_ABI = [
    "function nootToken() view returns (address)"
  ];

  // Connect to contracts
  const nootToken = await ethers.getContractAt(TOKEN_ABI, nootTokenAddress);
  const farmSwap = await ethers.getContractAt(SWAP_ABI, farmSwapAddress);
  
  // Get token info
  const decimals = await nootToken.decimals();
  const symbol = await nootToken.symbol();
  const name = await nootToken.name();
  
  console.log(`Token info: ${name} (${symbol}), decimals: ${decimals}`);
  
  // Get contract NOOT balance
  const contractBalance = await nootToken.balanceOf(farmSwapAddress);
  console.log(`FarmSwap contract NOOT balance: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);
  
  // Verify NOOT token connection
  const configuredNootToken = await farmSwap.nootToken();
  console.log(`FarmSwap is configured to use NOOT token at: ${configuredNootToken}`);
  console.log(`Matches expected token? ${configuredNootToken.toLowerCase() === nootTokenAddress.toLowerCase() ? "YES ✓" : "NO ✗"}`);

  // Get current time and format it
  const currentTime = new Date();
  console.log(`Current time: ${currentTime.toISOString()}`);

  if (contractBalance === 0n) {
    console.log("\n⚠️ WARNING: The FarmSwap contract has NO NOOT tokens! ⚠️");
    console.log("This is likely why token claims are failing - the contract needs to be funded.");
    console.log("Run the fund-noot-contract.ts script to add NOOT tokens to the contract.");
  } else if (contractBalance < ethers.parseUnits("100", decimals)) {
    console.log("\n⚠️ WARNING: The FarmSwap contract has LOW NOOT balance! ⚠️");
    console.log(`There is only ${ethers.formatUnits(contractBalance, decimals)} ${symbol} left.`);
    console.log("Consider running the fund-noot-contract.ts script to add more NOOT tokens.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 