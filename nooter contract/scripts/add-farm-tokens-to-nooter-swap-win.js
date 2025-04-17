// add-farm-tokens-to-nooter-swap-win.js
const hre = require("hardhat");
const fs = require('fs');
const ethers = require("ethers");

async function main() {
  // Read the contract address from the file
  let nooterSwapAddress;
  try {
    nooterSwapAddress = fs.readFileSync('.nooter-swap-address', 'utf8').trim();
  } catch (err) {
    console.error('Failed to read NooterSwap address. Make sure you have deployed the contract first.');
    process.exit(1);
  }
  
  console.log(`Adding farm tokens to NooterSwap contract at ${nooterSwapAddress}...`);
  
  // Get the signer
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Get the NooterSwap contract instance
  const nooterSwap = await hre.ethers.getContractAt("NooterSwap", nooterSwapAddress);
  
  // Add all farm tokens
  console.log('Adding all farm tokens...');
  const tx = await nooterSwap.addAllFarmTokens();
  await tx.wait();
  
  console.log('Successfully added all farm tokens to the NooterSwap contract');
  
  // List all supported tokens
  const tokenList = await nooterSwap.getAllSupportedTokens();
  console.log(`Total supported tokens: ${tokenList.length}`);
  console.log('Supported tokens:');
  for (let i = 0; i < tokenList.length; i++) {
    console.log(`  ${i+1}. ${tokenList[i]}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 