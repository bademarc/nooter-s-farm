// Script to fund 1 million of each token to the NooterSwap contract
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Funding NooterSwap contract with 1 million of each token (skipping NOOT)...");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // NooterSwap contract address
  const nooterSwapAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";
  console.log(`NooterSwap address: ${nooterSwapAddress}`);

  // Token addresses (excluding NOOT)
  const tokenAddresses = {
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
    "function fundToken(address tokenAddress, uint256 amount) external",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 balance, uint256 actualBalance)"
  ];

  // Create contract instances
  const nooterSwap = await ethers.getContractAt(swapAbi, nooterSwapAddress, signer);

  // Fund 1 million of each token
  console.log("\nFunding 1 million of each token to NooterSwap contract...");
  
  for (const [tokenName, tokenAddress] of Object.entries(tokenAddresses)) {
    try {
      const tokenContract = await ethers.getContractAt(tokenAbi, tokenAddress, signer);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`\nProcessing ${symbol} (${tokenName})...`);
      
      // Check user balance
      const balance = await tokenContract.balanceOf(signer.address);
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      console.log(`User balance: ${formattedBalance} ${symbol}`);
      
      // Amount to transfer (1 million)
      const millionTokens = ethers.parseUnits("1000000", decimals);
      
      // Check if user has enough balance
      if (balance < millionTokens) {
        console.log(`⚠️ Not enough ${symbol} balance to fund 1 million. Available: ${formattedBalance}`);
        continue;
      }
      
      // Check current contract balance
      try {
        const [isSupported, _, actualBalance] = await nooterSwap.getTokenInfo(tokenAddress);
        const formattedContractBalance = ethers.formatUnits(actualBalance, decimals);
        console.log(`Current contract balance: ${formattedContractBalance} ${symbol}`);
        
        if (!isSupported) {
          console.log(`⚠️ ${symbol} is not supported in the contract. Skipping...`);
          continue;
        }
      } catch (error) {
        console.log(`Error checking token info: ${error.message}`);
      }
      
      // Approve tokens
      console.log(`Approving 1,000,000 ${symbol}...`);
      const approveTx = await tokenContract.approve(nooterSwapAddress, millionTokens);
      await approveTx.wait();
      
      // Fund contract
      console.log(`Funding contract with 1,000,000 ${symbol}...`);
      const fundTx = await nooterSwap.fundToken(tokenAddress, millionTokens);
      await fundTx.wait();
      console.log(`Transaction hash: ${fundTx.hash}`);
      
      // Verify the updated balance
      const newBalance = await tokenContract.balanceOf(nooterSwapAddress);
      const formattedNewBalance = ethers.formatUnits(newBalance, decimals);
      console.log(`✅ Successfully funded contract. New balance: ${formattedNewBalance} ${symbol}`);
      
    } catch (error) {
      console.error(`❌ Error funding ${tokenName}:`, error.message);
    }
  }

  console.log("\n✅ Token funding completed!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 