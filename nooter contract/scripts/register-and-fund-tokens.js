// Script to register and fund all tokens in the NooterSwap contract
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Registering and funding tokens in the NooterSwap contract...");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // NooterSwap contract address
  const nooterSwapAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";
  console.log(`NooterSwap address: ${nooterSwapAddress}`);

  // Token addresses
  const tokenAddresses = {
    NOOT: "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56",
    ABSTER: "0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062",
    ABBY: "0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1",
    CHESTER: "0x2460a0068A154C7F2673417dA09f6AE81Ce70e56",
    DOJO3: "0x46BE8d4a214D6ddecE0b3251d76d42E186927781",
    FEATHERS: "0xb4e815813875366e2b4e65eA857278Ae5bEceDc3",
    MOP: "0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7",
    NUTZ: "0x77D29085727405340946919A88B0Ac6c9Ffb80BD",
    PAINGU: "0x8033d82e1e0f949C0986F9102a01C405831b784A",
    PENGUIN: "0x8814046950cDA7aee1B249C1689d070C0db6E58D",
    PUDGY: "0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336",
    RETSBA: "0x26707CE367C4758F73EF09fA9D8d730869a38e10",
    WOJACT: "0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c",
    YUP: "0xF5048aD4FB452f4E39472d085E29994f6088d96B"
  };

  // ABIs
  const tokenAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  const swapAbi = [
    "function addToken(address tokenAddress) external",
    "function fundToken(address tokenAddress, uint256 amount) external",
    "function supportedTokens(address) view returns (bool isSupported, uint256 balance)",
    "function getAllSupportedTokens() external view returns (address[])"
  ];

  // Create contract instances
  const nooterSwap = await ethers.getContractAt(swapAbi, nooterSwapAddress, signer);

  // 1. Get already supported tokens
  console.log("\nChecking currently supported tokens...");
  const supportedTokens = await nooterSwap.getAllSupportedTokens();
  console.log(`Number of supported tokens: ${supportedTokens.length}`);
  
  // Convert to lowercase for comparison
  const supportedTokenAddresses = supportedTokens.map(addr => addr.toLowerCase());

  // 2. Register all tokens
  console.log("\nRegistering tokens in NooterSwap contract...");
  
  for (const [tokenName, tokenAddress] of Object.entries(tokenAddresses)) {
    try {
      // Check if already supported
      if (supportedTokenAddresses.includes(tokenAddress.toLowerCase())) {
        console.log(`${tokenName} is already supported`);
        continue;
      }
      
      console.log(`Registering ${tokenName}...`);
      const addTx = await nooterSwap.addToken(tokenAddress);
      console.log(`Transaction hash: ${addTx.hash}`);
      await addTx.wait();
      console.log(`${tokenName} registered successfully`);
    } catch (error) {
      console.error(`Error registering ${tokenName}:`, error.message);
    }
  }

  // 3. Fund each token if user has balance
  console.log("\nFunding tokens in NooterSwap contract...");
  
  for (const [tokenName, tokenAddress] of Object.entries(tokenAddresses)) {
    try {
      const tokenContract = await ethers.getContractAt(tokenAbi, tokenAddress, signer);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      console.log(`\nProcessing ${symbol} (${tokenName})...`);
      
      // Check user balance
      const balance = await tokenContract.balanceOf(signer.address);
      const decimals = await tokenContract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      console.log(`User balance: ${formattedBalance} ${symbol}`);
      
      // If user has balance, fund the contract with 10% of their balance or 10 tokens, whichever is less
      if (balance > 0) {
        // Calculate 10% of balance
        const tenPercent = balance / 10n;
        
        // Convert 10 tokens to wei
        const tenTokens = ethers.parseUnits("10", decimals);
        
        // Use the smaller amount
        const amountToTransfer = tenPercent < tenTokens ? tenPercent : tenTokens;
        
        // Format for display
        const formattedTransfer = ethers.formatUnits(amountToTransfer, decimals);
        console.log(`Funding with ${formattedTransfer} ${symbol}`);
        
        // Approve tokens
        console.log("Approving tokens...");
        const approveTx = await tokenContract.approve(nooterSwapAddress, amountToTransfer);
        await approveTx.wait();
        
        // Fund contract
        console.log("Funding contract...");
        const fundTx = await nooterSwap.fundToken(tokenAddress, amountToTransfer);
        await fundTx.wait();
        
        console.log(`Successfully funded contract with ${formattedTransfer} ${symbol}`);
      } else {
        console.log(`No ${symbol} balance available for funding`);
      }
    } catch (error) {
      console.error(`Error funding ${tokenName}:`, error.message);
    }
  }

  console.log("\n✅ Token registration and funding completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 