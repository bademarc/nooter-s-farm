#!/bin/bash

# Clean artifacts
echo "Cleaning existing artifacts..."
npx hardhat clean

# Compile contracts
echo "Compiling contracts..."
npx hardhat compile --network abstractTestnet

# Deploy NFTs and handlers
echo "Deploying NFTs and handler..."
npx hardhat deploy-zksync --script deploy/deploy-nfts.ts --network abstractTestnet

# Wait for a moment to ensure blockchain sync
echo "Waiting for blockchain synchronization..."
sleep 10

# Verify contracts on Abscan
echo "Verifying contracts on Abscan..."
BEARISH_ADDRESS=$(cat .bearish-address)
BIT77_ADDRESS=$(cat .77bit-address)
HANDLER_ADDRESS=$(cat .nft-handler-address)

npx hardhat verify --network abstractTestnet $BEARISH_ADDRESS
npx hardhat verify --network abstractTestnet $BIT77_ADDRESS
npx hardhat verify --network abstractTestnet $HANDLER_ADDRESS

echo "Deployment complete!"
echo "Bearish NFT Address: $BEARISH_ADDRESS"
echo "77-Bit NFT Address: $BIT77_ADDRESS"
echo "NFT Handler Address: $HANDLER_ADDRESS"

# Add a script to update the frontend constants
echo "Updating frontend constants..."
cat > update-frontend.js << EOL
const fs = require('fs');
const path = require('path');

// Read deployed addresses
const bearishAddress = fs.readFileSync('.bearish-address', 'utf8').trim();
const bit77Address = fs.readFileSync('.77bit-address', 'utf8').trim();
const handlerAddress = fs.readFileSync('.nft-handler-address', 'utf8').trim();

// Path to the frontend page file
const pageFilePath = '../app/farm-cases/noot-case/page.tsx';

// Read current file content
let content = fs.readFileSync(pageFilePath, 'utf8');

// Update NFT addresses
content = content.replace(
  /BEARISH: "0x[a-fA-F0-9]{40}"/,
  `BEARISH: "${bearishAddress}"`
);
content = content.replace(
  /BIT77: "0x[a-fA-F0-9]{40}"/,
  `BIT77: "${bit77Address}"`
);

// Update handler address
content = content.replace(
  /NFT_HANDLER_ADDRESS = "0x[a-fA-F0-9]{40}"/,
  `NFT_HANDLER_ADDRESS = "${handlerAddress}"`
);

// Write updated content back to file
fs.writeFileSync(pageFilePath, content);
console.log('Frontend constants updated successfully!');
EOL

# Run the update script
node update-frontend.js

echo "All done! The NFTs are deployed and frontend is updated." 