const fs = require('fs');
const path = require('path');

// Read deployed addresses
const bearishAddress = fs.readFileSync('.bearish-address', 'utf8').trim();
const bit77Address = fs.readFileSync('.77bit-address', 'utf8').trim();
const handlerAddress = fs.readFileSync('.nft-handler-address', 'utf8').trim();

console.log(`Updating frontend constants with the following addresses:
- Bearish NFT: ${bearishAddress}
- 77-Bit NFT: ${bit77Address}
- NFT Handler: ${handlerAddress}`);

// Path to the frontend page file
const pageFilePath = '../app/farm-cases/noot-case/page.tsx';

// Read current file content
let content = fs.readFileSync(pageFilePath, 'utf8');

// Find and update the NFT_ADDRESSES object
const nftAddressesRegex = /const NFT_ADDRESSES = {[^}]+}/s;
const nftAddressesMatch = content.match(nftAddressesRegex);

if (nftAddressesMatch) {
  // Extract the NFT_ADDRESSES object
  const nftAddressesStr = nftAddressesMatch[0];
  
  // Update the addresses in the object
  let updatedNftAddressesStr = nftAddressesStr
    .replace(/BEARISH: "0x[a-fA-F0-9]{40}"/, `BEARISH: "${bearishAddress}"`)
    .replace(/BIT77: "0x[a-fA-F0-9]{40}"/, `BIT77: "${bit77Address}"`);
  
  // Replace the old NFT_ADDRESSES with updated version
  content = content.replace(nftAddressesRegex, updatedNftAddressesStr);
  
  console.log('NFT_ADDRESSES object updated successfully');
} else {
  console.error('Could not find NFT_ADDRESSES object in the file');
}

// Update handler address separately
const handlerAddressRegex = /NFT_HANDLER_ADDRESS = "0x[a-fA-F0-9]{40}"/;
if (content.match(handlerAddressRegex)) {
  content = content.replace(
    handlerAddressRegex,
    `NFT_HANDLER_ADDRESS = "${handlerAddress}"`
  );
  console.log('NFT_HANDLER_ADDRESS updated successfully');
} else {
  console.error('Could not find NFT_HANDLER_ADDRESS in the file');
}

// Check and update TOKEN_ADDRESSES if needed
const tokenAddressesRegex = /const TOKEN_ADDRESSES = {[^}]+}/s;
const tokenAddressesMatch = content.match(tokenAddressesRegex);

if (tokenAddressesMatch) {
  // Extract the TOKEN_ADDRESSES object
  const tokenAddressesStr = tokenAddressesMatch[0];
  
  // Update the addresses in the object if they represent the same NFTs
  let updatedTokenAddressesStr = tokenAddressesStr
    .replace(/BEARISH: "0x[a-fA-F0-9]{40}"/, `BEARISH: "${bearishAddress}"`)
    .replace(/BIT77: "0x[a-fA-F0-9]{40}"/, `BIT77: "${bit77Address}"`);
  
  // Replace the old TOKEN_ADDRESSES with updated version
  content = content.replace(tokenAddressesRegex, updatedTokenAddressesStr);
  
  console.log('TOKEN_ADDRESSES object updated successfully');
} else {
  console.error('Could not find TOKEN_ADDRESSES object in the file');
}

// Write updated content back to file
try {
  fs.writeFileSync(pageFilePath, content);
  console.log('Frontend file updated successfully!');
  
  // Also log a summary of the addresses for reference
  console.log('\nContract Address Summary:');
  console.log(`Bearish NFT: ${bearishAddress}`);
  console.log(`77-Bit NFT: ${bit77Address}`);
  console.log(`NFT Handler: ${handlerAddress}`);
  
  // Create a deployments.json file for future reference
  const deploymentInfo = {
    bearishNft: bearishAddress,
    bit77Nft: bit77Address,
    nftHandler: handlerAddress,
    deploymentDate: new Date().toISOString()
  };
  
  fs.writeFileSync('nft-deployments.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to nft-deployments.json');
} catch (error) {
  console.error('Error writing to file:', error);
} 