import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Adding all ERC20 tokens to MultiFarmSwap contract...");

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

  // Token ABI for ERC20 interactions
  const TOKEN_ABI = [
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  // MultiFarmSwap ABI for managing tokens
  const MULTIFARM_ABI = [
    "function addToken(address tokenAddress, uint256 exchangeRate) external",
    "function getAllSupportedTokens() external view returns (address[] memory)",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 exchangeRate, uint256 balance, uint256 actualBalance)",
    "function nootTokenAddress() external view returns (address)"
  ];

  // Collect all ERC20 token addresses from the .address files
  // These are known ERC20 tokens, not ERC1155 NFTs
  const tokenAddresses = [
    { name: "NOOT", address: fs.readFileSync(".noot-address", "utf8").trim() },
    { name: "ABSTER", address: fs.readFileSync(".abster-address", "utf8").trim() },
    { name: "PENGUIN", address: fs.readFileSync(".penguin-address", "utf8").trim() },
    { name: "PAINGU", address: fs.readFileSync(".paingu-address", "utf8").trim() },
    { name: "YUP", address: fs.readFileSync(".yup-address", "utf8").trim() },
    { name: "WOJACT", address: fs.readFileSync(".wojact-address", "utf8").trim() },
    { name: "RETSBA", address: fs.readFileSync(".retsba-address", "utf8").trim() },
    { name: "NUTZ", address: fs.readFileSync(".nutz-address", "utf8").trim() },
    { name: "MOP", address: fs.readFileSync(".mop-address", "utf8").trim() },
    { name: "FEATHERS", address: fs.readFileSync(".feathers-address", "utf8").trim() },
    { name: "ABBY", address: fs.readFileSync(".abby-address", "utf8").trim() },
    { name: "DOJO3", address: fs.readFileSync(".dojo3-address", "utf8").trim() },
    { name: "CHESTER", address: fs.readFileSync(".chester-address", "utf8").trim() }
  ];

  // Create MultiFarmSwap contract instance
  const multiFarmSwap = await ethers.getContractAt(MULTIFARM_ABI, multiFarmSwapAddress, wallet);
  
  // Get all currently supported tokens from the contract
  const supportedTokens = await multiFarmSwap.getAllSupportedTokens();
  console.log(`Currently supported tokens in MultiFarmSwap: ${supportedTokens.length}`);
  
  // Convert to lowercase for comparison
  const supportedTokenAddresses = supportedTokens.map(addr => addr.toLowerCase());
  
  // Default exchange rate (same as NOOT which is 1000, meaning 1.0 with 3 decimal places)
  const defaultExchangeRate = 1000;
  
  // Custom exchange rates for specific tokens (if needed)
  const exchangeRates: {[key: string]: number} = {
    // Key is token symbol, value is exchange rate * 1000
    "ABSTER": 1200,   // 1.2
    "PENGUIN": 1500,  // 1.5
    "FEATHERS": 800,  // 0.8
    "NUTZ": 1100      // 1.1
    // Add more custom rates as needed
  };
  
  // Process each token
  for (const token of tokenAddresses) {
    try {
      console.log(`\nProcessing ${token.name} (${token.address})...`);
      
      // Check if token is already supported
      if (supportedTokenAddresses.includes(token.address.toLowerCase())) {
        console.log(`✅ ${token.name} is already supported in MultiFarmSwap.`);
        continue;
      }
      
      // Create token contract instance
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, token.address, wallet);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`Token symbol: ${symbol}, Decimals: ${decimals}`);
      
      // Determine exchange rate for this token
      const exchangeRate = exchangeRates[symbol] || defaultExchangeRate;
      console.log(`Using exchange rate: ${exchangeRate/1000} (${exchangeRate})`);
      
      // Add the token to MultiFarmSwap
      console.log(`Adding ${symbol} to MultiFarmSwap...`);
      const tx = await multiFarmSwap.addToken(token.address, exchangeRate);
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      
      console.log(`✅ Successfully added ${symbol} to MultiFarmSwap!`);
      
    } catch (error) {
      console.error(`❌ Error processing ${token.name}:`, error);
    }
  }
  
  // Get updated list of supported tokens
  const updatedTokens = await multiFarmSwap.getAllSupportedTokens();
  console.log(`\n📊 Updated number of supported tokens: ${updatedTokens.length}`);
  
  console.log("\nSummary of all supported tokens:");
  for (const tokenAddress of updatedTokens) {
    try {
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, tokenAddress, wallet);
      const symbol = await tokenContract.symbol();
      const [isSupported, exchangeRate] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`${symbol}: Exchange Rate = ${exchangeRate/1000} (${exchangeRate})`);
    } catch (error) {
      console.error(`Failed to get info for token at ${tokenAddress}`);
    }
  }
  
  console.log("\n✅ Token addition process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 