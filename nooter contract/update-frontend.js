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