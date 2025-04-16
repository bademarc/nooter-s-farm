import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Funding MultiFarmSwap contract with 500,000 of each token using fundToken...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get MultiFarmSwap address from deployment info
  const deploymentInfoPath = ".deployment-info.json";
  let multiFarmSwapAddress = "";
  
  try {
    if (fs.existsSync(deploymentInfoPath)) {
      const fileData = fs.readFileSync(deploymentInfoPath, "utf8");
      const deploymentInfo = JSON.parse(fileData);
      multiFarmSwapAddress = deploymentInfo.multiFarmSwapAddress;
    }
  } catch (error) {
    console.error("Error reading existing deployment info:", error);
  }
  
  if (!multiFarmSwapAddress) {
    console.error("MultiFarmSwap address not found in deployment info.");
    process.exit(1);
  }
  
  console.log(`MultiFarmSwap contract address: ${multiFarmSwapAddress}`);

  // Amount to fund for each token (500,000)
  const fundAmount = ethers.parseUnits("500000", 18);
  console.log(`Funding amount per token: 500,000 tokens`);

  // Token ABI for ERC20 interactions
  const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  // MultiFarmSwap ABI for funding
  const MULTIFARM_ABI = [
    "function fundToken(address tokenAddress, uint256 amount) public",
    "function getAllSupportedTokens() external view returns (address[] memory)",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 exchangeRate, uint256 balance, uint256 actualBalance)"
  ];

  // Create MultiFarmSwap contract instance
  const multiFarmSwap = await ethers.getContractAt(MULTIFARM_ABI, multiFarmSwapAddress, wallet);
  
  // Get all supported tokens from the contract
  const supportedTokens = await multiFarmSwap.getAllSupportedTokens();
  console.log(`Number of supported tokens in MultiFarmSwap: ${supportedTokens.length}`);

  // Process each supported token
  for (const tokenAddress of supportedTokens) {
    try {
      console.log(`\nProcessing token at address: ${tokenAddress}...`);
      
      // Create token contract instance
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, tokenAddress, wallet);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`Token symbol: ${symbol}, Decimals: ${decimals}`);
      
      // Get token info from MultiFarmSwap
      const [isSupported, exchangeRate, balance, actualBalance] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`Current contract balance: ${ethers.formatUnits(actualBalance, decimals)} ${symbol}`);
      console.log(`Tracked balance in contract: ${ethers.formatUnits(balance, decimals)} ${symbol}`);
      
      // Check sender balance
      const senderBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`Sender balance: ${ethers.formatUnits(senderBalance, decimals)} ${symbol}`);
      
      // Ensure sender has enough tokens
      if (senderBalance < fundAmount) {
        console.warn(`⚠️ Insufficient balance for ${symbol}. Skipping...`);
        console.log(`Required: ${ethers.formatUnits(fundAmount, decimals)}, Available: ${ethers.formatUnits(senderBalance, decimals)}`);
        continue;
      }
      
      // Approve tokens for the contract
      console.log(`Approving 500,000 ${symbol} for MultiFarmSwap...`);
      const approveTx = await tokenContract.approve(multiFarmSwapAddress, fundAmount);
      console.log(`Approval transaction hash: ${approveTx.hash}`);
      await approveTx.wait();
      
      // Fund the contract using fundToken
      console.log(`Funding MultiFarmSwap with 500,000 ${symbol}...`);
      const fundTx = await multiFarmSwap.fundToken(tokenAddress, fundAmount);
      console.log(`Funding transaction hash: ${fundTx.hash}`);
      await fundTx.wait();
      
      // Verify new balance
      const [, , newBalance, newActualBalance] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`✅ Funding complete!`);
      console.log(`New contract balance: ${ethers.formatUnits(newActualBalance, decimals)} ${symbol}`);
      console.log(`New tracked balance in contract: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);
      
    } catch (error) {
      console.error(`❌ Error processing token at ${tokenAddress}:`, error);
    }
  }
  
  console.log("\n📊 Summary of token balances in MultiFarmSwap:");
  for (const tokenAddress of supportedTokens) {
    try {
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, tokenAddress, wallet);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const [, , balance, actualBalance] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`${symbol}: ${ethers.formatUnits(actualBalance, decimals)} (tracked: ${ethers.formatUnits(balance, decimals)})`);
    } catch (error) {
      console.error(`Failed to get balance for token at ${tokenAddress}`);
    }
  }
  
  console.log("\n✅ MultiFarmSwap funding process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 