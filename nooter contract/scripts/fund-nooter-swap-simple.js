// Simple script to fund the NooterSwap contract with NOOT tokens
const { ethers } = require("hardhat");

async function main() {
  console.log("Funding NooterSwap contract with NOOT tokens...");

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);

  // Token and contract addresses
  const nootAddress = "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56";
  const nooterSwapAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";

  console.log(`NOOT token address: ${nootAddress}`);
  console.log(`NooterSwap address: ${nooterSwapAddress}`);
  
  // Amount of NOOT to fund (change this as needed)
  const fundAmount = 20; // 20 NOOT
  console.log(`Funding amount: ${fundAmount} NOOT`);

  // Create contract instances
  const nootAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)",
    "function transferFrom(address, address, uint256) returns (bool)"
  ];
  
  const swapAbi = [
    "function fundToken(address tokenAddress, uint256 amount) external"
  ];

  const nootToken = await ethers.getContractAt(nootAbi, nootAddress, signer);
  const nooterSwap = await ethers.getContractAt(swapAbi, nooterSwapAddress, signer);

  // Check current balance of the wallet and contract
  const walletBalance = await nootToken.balanceOf(signer.address);
  const contractBalance = await nootToken.balanceOf(nooterSwapAddress);
  
  const walletBalanceFormatted = ethers.formatUnits(walletBalance, 18);
  const contractBalanceFormatted = ethers.formatUnits(contractBalance, 18);
  
  console.log(`Current wallet NOOT balance: ${walletBalanceFormatted}`);
  console.log(`Current contract NOOT balance: ${contractBalanceFormatted}`);

  // Convert fund amount to wei
  const fundAmountWei = ethers.parseUnits(fundAmount.toString(), 18);

  if (walletBalance < fundAmountWei) {
    console.log(`Not enough NOOT tokens in wallet.\nRequired: ${fundAmount}, Available: ${walletBalanceFormatted}`);
    return;
  }

  // Approve tokens for transfer
  console.log("Approving tokens for transfer...");
  const approveTx = await nootToken.approve(nooterSwapAddress, fundAmountWei);
  console.log(`Approval transaction hash: ${approveTx.hash}`);
  await approveTx.wait();

  // Fund the contract
  console.log("\nFunding NooterSwap contract...");
  const fundTx = await nooterSwap.fundToken(nootAddress, fundAmountWei);
  console.log(`Funding transaction hash: ${fundTx.hash}`);
  await fundTx.wait();

  // Verify the new contract balance
  const newContractBalance = await nootToken.balanceOf(nooterSwapAddress);
  const newContractBalanceFormatted = ethers.formatUnits(newContractBalance, 18);
  console.log(`\nUpdated contract NOOT balance: ${newContractBalanceFormatted}`);

  console.log("✅ NooterSwap contract funded successfully!");
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 