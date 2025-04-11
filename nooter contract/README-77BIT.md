# 77-Bit NFT Setup

This README contains instructions for finalizing the setup of your 77-Bit NFT on Abstract Testnet.

## Deployed Contract

The 77-Bit NFT has been deployed to Abstract Testnet at address:
`0x4A8AcEEe2D8767B6c3037FA9c130b11C1f2fF1e3`

You can view it on the Abstract Testnet explorer:
https://sepolia.abscan.org/address/0x4A8AcEEe2D8767B6c3037FA9c130b11C1f2fF1e3#code

## Next Steps

To fully configure your NFT with metadata and images, follow these steps:

### 1. Upload image to IPFS

Upload the image file from `nft-data/77-Bit.jpg` to an IPFS service like:
- Pinata (https://www.pinata.cloud/)
- NFT.Storage (https://nft.storage/)
- Infura IPFS (https://www.infura.io/product/ipfs)

After uploading, you'll get a CID (Content Identifier) for your image.

### 2. Update metadata with image CID

Edit the file at `nft-data/metadata/1.json` and replace `YOUR_IMAGE_CID_HERE` with the actual CID you got from step 1.

### 3. Upload metadata to IPFS

Upload the entire `nft-data/metadata` directory to IPFS. After uploading, you'll get a CID for the metadata directory.

### 4. Update contract with metadata URI

Edit the file at `scripts/set-77bit-uri.ts` and replace `YOUR_CID_HERE` with the metadata CID you got from step 3.

### 5. Set the base URI

Run the following command to set the base URI:

```
npx hardhat run scripts/set-77bit-uri.ts --network abstractTestnet
```

## Interacting with the NFT

Once fully set up, your NFT will be visible on compatible NFT marketplaces and wallets that support Abstract Testnet.

The NFT has the following properties:
- Name: 77-Bit
- Symbol: 77BIT
- Total Supply: 1000
- Token ID: 1

As the deployer of the contract, you own all 1000 tokens initially. You can transfer them to other addresses using standard ERC-1155 functionality. 