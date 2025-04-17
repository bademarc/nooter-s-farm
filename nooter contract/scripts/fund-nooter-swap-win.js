// fund-nooter-swap-win.js
const hre = require("hardhat");
const fs = require('fs');
const ethers = require("ethers");

async function main() {
  // Hard-coded funding amount (can be adjusted manually)
  const fundAmount = 5;
  
  // Read the contract address from the file
  let nooterSwapAddress;
  try {
    nooterSwapAddress = fs.readFileSync('.nooter-swap-address', 'utf8').trim();
  } catch (err) {
    console.error('Failed to read NooterSwap address. Make sure you have deployed the contract first.');
    process.exit(1);
  }
  
  console.log(`Funding NooterSwap contract at ${nooterSwapAddress} with ${fundAmount} NOOT tokens...`);
  
  // Get the signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // NOOT token address (as defined in the NooterSwap contract)
  const NOOT_TOKEN_ADDRESS = "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56";
  
  // Get the NOOT token contract instance
  const nootToken = await hre.ethers.getContractAt("IERC20", NOOT_TOKEN_ADDRESS);
  
  // Get the NooterSwap contract instance
  const nooterSwap = await hre.ethers.getContractAt("NooterSwap", nooterSwapAddress);
  
  // Check NOOT balance
  const balance = await nootToken.balanceOf(signer.address);
  const formattedBalance = ethers.formatUnits(balance, 18);
  console.log(`Your NOOT balance: ${formattedBalance}`);
  
  // Convert the fund amount to wei (assuming 18 decimals)
  const fundAmountWei = ethers.parseUnits(fundAmount.toString(), 18);
  
  if (balance < fundAmountWei) {
    console.error('Insufficient NOOT balance for funding the contract');
    process.exit(1);
  }
  
  // Approve the contract to spend the tokens
  console.log('Approving NooterSwap to spend NOOT tokens...');
  const approveTx = await nootToken.approve(nooterSwapAddress, fundAmountWei);
  await approveTx.wait();
  console.log('Approval successful');
  
  // Fund the contract using the fundToken function
  console.log('Funding the contract...');
  const fundTx = await nooterSwap.fundToken(NOOT_TOKEN_ADDRESS, fundAmountWei);
  await fundTx.wait();
  
  console.log(`Successfully funded NooterSwap contract with ${fundAmount} NOOT tokens`);
  
  // Get the updated contract balance
  const contractBalance = await nootToken.balanceOf(nooterSwapAddress);
  const formattedContractBalance = ethers.formatUnits(contractBalance, 18);
  console.log(`NooterSwap contract NOOT balance: ${formattedContractBalance}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 