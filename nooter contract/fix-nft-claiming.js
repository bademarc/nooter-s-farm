const fs = require('fs');
const path = require('path');

// Set the correct NFT addresses based on the README documentation
const bearishAddress = "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591";
const bit77Address = "0x2BE78875629607D1d982d59d9564dAd218d7Bf51";
const nftHandlerAddress = "0x96b927A5a1e54C8bfCbeb0574BC0A9bA61a13d5E";

// Save addresses to files for future reference
fs.writeFileSync('.bearish-address', bearishAddress, 'utf8');
fs.writeFileSync('.77bit-address', bit77Address, 'utf8');
fs.writeFileSync('.nft-handler-address', nftHandlerAddress, 'utf8');

console.log(`Setting NFT addresses to these values:
- Bearish NFT: ${bearishAddress}
- 77-Bit NFT: ${bit77Address}
- NFT Handler: ${nftHandlerAddress}`);

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
  let updatedNftAddressesStr = 
`const NFT_ADDRESSES = {
  BEARISH: "${bearishAddress}", // Regular Bearish
  BEARISH_PREMIUM: "0xc636074F3CdD281092F09934E71e179Fa1042374", // Premium Bearish (separate contract)
  BIT77: "${bit77Address}"    // Updated address from redeployment
}`;
  
  // Replace the old NFT_ADDRESSES with updated version
  content = content.replace(nftAddressesRegex, updatedNftAddressesStr);
  
  console.log('NFT_ADDRESSES object updated successfully');
} else {
  console.error('Could not find NFT_ADDRESSES object in the file');
}

// Update handler address
const handlerAddressRegex = /const NFT_HANDLER_ADDRESS = "0x[a-fA-F0-9]{40}"/;
if (content.match(handlerAddressRegex)) {
  content = content.replace(
    handlerAddressRegex,
    `const NFT_HANDLER_ADDRESS = "${nftHandlerAddress}"`
  );
  console.log('NFT_HANDLER_ADDRESS updated successfully');
} else {
  console.error('Could not find NFT_HANDLER_ADDRESS in the file');
}

// Add NFT_ABI if it doesn't exist or is incorrect
const nftAbiRegex = /const NFT_ABI = \[[^\]]+\]/s;
const correctNftAbi = `const NFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function balanceOf(address owner, uint256 id) external view returns (uint256)",
  "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external"
]`;

if (content.match(nftAbiRegex)) {
  content = content.replace(nftAbiRegex, correctNftAbi);
} else {
  // Insert NFT_ABI before NFT_HANDLER_ABI
  const handlerAbiPos = content.indexOf('const NFT_HANDLER_ABI = [');
  if (handlerAbiPos !== -1) {
    content = content.slice(0, handlerAbiPos) + correctNftAbi + '\n\n' + content.slice(handlerAbiPos);
  }
}
console.log('NFT_ABI updated successfully');

// Fix the debug logging for NFT claims to be more detailed
const claimingDebugRegex = /console\.log\(\`\[DEBUG\] NFT claim details:[^`]+\`\);/s;
const improvedDebugging = `console.log(\`[DEBUG] NFT claim details:
        - NFT name: \${item.name}
        - Token Key: \${item.tokenKey}
        - Item NFT address: \${item.nftAddress}
        - Selected NFT address: \${nftAddress}
        - Token ID: \${item.tokenId}
        - Recipient: \${walletAddress}
        - Handler Address: \${NFT_HANDLER_ADDRESS}
      \`);
      
      // Verify handler contract supports this NFT
      try {
        const isNFTSupported = await nftHandlerContract.isNFTSupported(nftAddress);
        console.log(\`[DEBUG] Is NFT \${nftAddress} supported by handler? \${isNFTSupported}\`);
        
        if (!isNFTSupported) {
          console.error(\`NFT \${nftAddress} is not supported by the handler contract\`);
          toast.error("This NFT is not supported by the handler contract. Please contact support.", { id: "claim-toast" });
          setIsClaimingToken(false);
          return;
        }
      } catch (error) {
        console.error("Error checking if NFT is supported:", error);
      }`;

if (content.match(claimingDebugRegex)) {
  content = content.replace(claimingDebugRegex, improvedDebugging);
  console.log('Added improved debug logging for NFT claims');
}

// Write updated content back to file
try {
  fs.writeFileSync(pageFilePath, content);
  console.log('Frontend file updated successfully!');
  
  // Also log a summary of the addresses for reference
  console.log('\nContract Address Summary:');
  console.log(`Bearish NFT: ${bearishAddress}`);
  console.log(`77-Bit NFT: ${bit77Address}`);
  console.log(`NFT Handler: ${nftHandlerAddress}`);
  
  // Create a deployments.json file for future reference
  const deploymentInfo = {
    bearishNft: bearishAddress,
    bit77Nft: bit77Address,
    nftHandler: nftHandlerAddress,
    deploymentDate: new Date().toISOString()
  };
  
  fs.writeFileSync('nft-deployments.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to nft-deployments.json');
} catch (error) {
  console.error('Error writing to file:', error);
} 