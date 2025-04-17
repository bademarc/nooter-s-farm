# NooterSwap Deployment

## Deployment Information

The NooterSwap contract has been successfully deployed to the zkSync Era Abstract Testnet.

- **Contract Address**: 0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0
- **Network**: Abstract Testnet (Chain ID: 11124)
- **NOOT Token Address**: 0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56
- **Deployer Address**: 0x1F4429686522f89587fE72cBAC335d31F6b83D17

## Features

The NooterSwap contract enables:

1. Swapping NOOT tokens for other supported tokens at a 1:1 ratio
2. Swapping other supported tokens for NOOT at a 1:1 ratio
3. Direct swaps between any two supported tokens at a 1:1 ratio
4. Adding new tokens to be supported for swaps
5. Funding the contract with tokens
6. Claiming test tokens for testing

## Supported Tokens

The following tokens are supported for swapping:

1. NOOT Token: 0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56
2. ABSTER: 0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062
3. ABBY: 0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1
4. CHESTER: 0x2460a0068A154C7F2673417dA09f6AE81Ce70e56
5. DOJO3: 0x46BE8d4a214D6ddecE0b3251d76d42E186927781
6. FEATHERS: 0xb4e815813875366e2b4e65eA857278Ae5bEceDc3
7. MOP: 0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7
8. NUTZ: 0x77D29085727405340946919A88B0Ac6c9Ffb80BD
9. PAINGU: 0x8033d82e1e0f949C0986F9102a01C405831b784A
10. PENGUIN: 0x8814046950cDA7aee1B249C1689d070C0db6E58D
11. PUDGY: 0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336
12. RETSBA: 0x26707CE367C4758F73EF09fA9D8d730869a38e10
13. WOJACT: 0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c
14. YUP: 0xF5048aD4FB452f4E39472d085E29994f6088d96B

## Current Funding

The contract has been initially funded with 5 NOOT tokens.

## Command Reference

### Deployment Commands

To deploy the NooterSwap contract:
```
npm run deploy:nooter-swap
```

### Funding Commands

To fund the NooterSwap contract with NOOT tokens:
```
npm run fund:nooter-swap:win
```

### Adding Farm Tokens

To add all farm tokens to the NooterSwap contract:
```
npm run add-tokens:nooter-swap:win
```

## Using the Contract

### Swapping NOOT for Another Token

To swap NOOT for another token, call the `swapNOOTForToken` function:
```solidity
function swapNOOTForToken(address toTokenAddress, uint256 amount)
```

### Swapping Another Token for NOOT

To swap another token for NOOT, call the `swapTokenForNOOT` function:
```solidity
function swapTokenForNOOT(address fromTokenAddress, uint256 amount)
```

### Direct Token Swaps

To swap between any two supported tokens, call the `swapTokens` function:
```solidity
function swapTokens(address fromTokenAddress, address toTokenAddress, uint256 amount)
```

### Adding a New Token

To add a new token to be supported for swaps, call the `addToken` function:
```solidity
function addToken(address tokenAddress)
```

### Funding the Contract

To fund the contract with tokens, call the `fundToken` function:
```solidity
function fundToken(address tokenAddress, uint256 amount)
```

### Claiming Test Tokens

To claim test tokens for testing, call the `claimTestTokens` function:
```solidity
function claimTestTokens(address tokenAddress, uint256 amount)
```

## License

MIT 