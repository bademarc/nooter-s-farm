# NFT Deployment Guide for Nooters Farm

This README provides instructions for deploying the NFT contracts used in Nooters Farm on the Abstract network.

## Deployed Contracts

The following contracts have been deployed to the Abstract Testnet:

| Contract | Address | Description |
|----------|---------|-------------|
| Bearish NFT | `0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591` | ERC1155 NFT with Bearish tokens |
| 77-Bit NFT | `0x2BE78875629607D1d982d59d9564dAd218d7Bf51` | ERC1155 NFT with 77-Bit tokens |
| NFT Swap Handler | `0x96b927A5a1e54C8bfCbeb0574BC0A9bA61a13d5E` | Handles NFT transfers to users |

## Metadata

The NFT metadata is hosted on IPFS with the following CIDs:

- Bearish: `bafkreiekvt2a2jd5qlaowhkpgvrvdpecpp7u6iktb3ovkam2bsucvh6wj4`
- 77-Bit: `bafkreig5evonmduvlbbjwaw5jafhhkfsdmg5fxuine4jntebbee3h54byi`

## Contract Features

### NFT Contracts (Bearish and 77-Bit)

Both NFT contracts have the following features:
- ERC1155 standard implementation
- Support for metadata URI
- 100,000 tokens minted to the contract owner
- Token ID 1 for each NFT

### NFT Swap Handler

The NFT Swap Handler contract has these key features:
- Acts as a central point for managing NFT transfers
- Stores NFTs until claimed by users
- Public `transferNFT` function that anyone can call to claim NFTs
- Supports multiple NFT contracts

## Deployment Process

1. Compile the contracts:
   ```
   npx hardhat clean
   npx hardhat compile --network abstractTestnet
   ```

2. Deploy the contracts:
   ```
   npx hardhat deploy-zksync --script deploy-nfts.ts --network abstractTestnet
   ```

3. Verify the contracts on Abscan:
   ```
   npx hardhat verify --network abstractTestnet <contract-address>
   ```

4. Update the frontend constants with the new contract addresses.

## Claim Process

Users can claim NFTs through the frontend by following these steps:

1. Connect a wallet (AbstractGW or MetaMask)
2. Open cases to potentially win an NFT
3. Click "Claim to Wallet" on the NFT in their inventory
4. Confirm the transaction in their wallet

## Frontend Integration

The frontend uses the following constants:
- `NFT_ADDRESSES` - Contains the addresses of the NFT contracts
- `NFT_HANDLER_ADDRESS` - The address of the NFT Swap Handler
- `NFT_HANDLER_ABI` - ABI for interacting with the handler contract

## Re-deployment Instructions

If you need to redeploy the contracts, follow these steps:

1. Update the metadata CIDs in `deploy-nfts.ts` if needed
2. Run the deployment script:
   ```
   npx hardhat deploy-zksync --script deploy-nfts.ts --network abstractTestnet
   ```

3. Update the frontend with the new addresses by running:
   ```
   node update-frontend.js
   ```

4. Verify the contracts on Abscan.

## Troubleshooting

- If users can't claim NFTs, check that the NFT handler has enough tokens
- Verify the NFT contracts have been added to the handler's supported NFTs list
- Check that the frontend is using the correct contract addresses 