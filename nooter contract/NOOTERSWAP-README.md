# NooterSwap Contract

A smart contract that allows users to swap NOOT tokens (0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56) with other supported tokens at a 1:1 ratio.

## Features

- Swap NOOT tokens to any supported token (1:1 ratio)
- Swap any supported token to NOOT tokens (1:1 ratio)
- Direct swap between any two supported tokens (1:1 ratio)
- Pre-configured with all Nooter's Farm tokens
- Transparent token balances and tracking
- Emergency withdrawal functionality for contract owner

## Supported Tokens

The contract automatically supports the following tokens:

- NOOT (0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56)
- ABSTER (0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062)
- ABBY (0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1)
- CHESTER (0x2460a0068A154C7F2673417dA09f6AE81Ce70e56)
- DOJO3 (0x46BE8d4a214D6ddecE0b3251d76d42E186927781)
- FEATHERS (0xb4e815813875366e2b4e65eA857278Ae5bEceDc3)
- MOP (0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7)
- NUTZ (0x77D29085727405340946919A88B0Ac6c9Ffb80BD)
- PAINGU (0x8033d82e1e0f949C0986F9102a01C405831b784A)
- PENGUIN (0x8814046950cDA7aee1B249C1689d070C0db6E58D)
- PUDGY (0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336)
- RETSBA (0x26707CE367C4758F73EF09fA9D8d730869a38e10)
- WOJACT (0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c)
- YUP (0xF5048aD4FB452f4E39472d085E29994f6088d96B)

## How to Deploy

1. Install dependencies:
   ```
   npm install
   ```

2. Deploy the contract:
   ```
   npx hardhat run scripts/deploy-nooter-swap.js --network [network-name]
   ```

3. Verify the contract on Etherscan (optional):
   ```
   npx hardhat verify --network [network-name] [contract-address]
   ```

## Contract Initialization

After deployment, the contract is automatically initialized with NOOT token support. The deployment script also calls `addAllFarmTokens()` which adds all the farm tokens listed above.

## How to Fund the Contract

For the swap to work, the contract needs to be funded with tokens. As the contract owner, you can send tokens to the contract using the `fundToken` function:

```solidity
function fundToken(address tokenAddress, uint256 amount) external;
```

## Performing Swaps

Users can perform token swaps through the following functions:

1. Swap NOOT for another token:
   ```solidity
   function swapNOOTForToken(address toTokenAddress, uint256 amount) external;
   ```

2. Swap another token for NOOT:
   ```solidity
   function swapTokenForNOOT(address fromTokenAddress, uint256 amount) external;
   ```

3. Direct swap between any two tokens:
   ```solidity
   function swapTokens(address fromTokenAddress, address toTokenAddress, uint256 amount) external;
   ```

## Testing

Run the contract tests:
```
npx hardhat test
```

## Management Functions (Owner Only)

The contract owner has access to the following management functions:

- `addToken(address tokenAddress)` - Add a new token to be supported
- `addMultipleTokens(address[] calldata tokenAddresses)` - Add multiple tokens at once
- `removeToken(address tokenAddress)` - Remove a token from being supported
- `emergencyWithdraw(address tokenAddress, uint256 amount, address recipient)` - Withdraw tokens in case of emergency

## Viewing Contract Information

Users can query the contract for information using the following view functions:

- `getAllSupportedTokens()` - Get a list of all supported token addresses
- `getTokenInfo(address tokenAddress)` - Get detailed information about a specific token 