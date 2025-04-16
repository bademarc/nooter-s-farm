# MultiFarmSwap Token Funding

This directory contains scripts for managing the MultiFarmSwap contract's token liquidity. You can add tokens to the contract, check token balances, and fund the contract with tokens.

## Prerequisites

1. Make sure you have set up your environment variables in `.env` file:
   ```
   WALLET_PRIVATE_KEY=your_private_key_here
   ```

2. Ensure you have the necessary node modules installed:
   ```
   npm install
   ```

## Available Scripts

### 1. Add All Tokens to MultiFarmSwap

This script adds all ERC20 tokens to the MultiFarmSwap contract if they're not already supported.

```powershell
npx hardhat run scripts/add-all-tokens.ts --network abstractTestnet
```

### 2. Fund Faucet Address with Tokens

This script transfers 500,000 of each ERC20 token to the faucet address (0x324B6DA594145093b003Ec9b305e2A478A76Ba88).

```powershell
npx hardhat run scripts/fund-all-tokens.ts --network abstractTestnet
```

### 3. Fund MultiFarmSwap Contract with Tokens

This script uses the MultiFarmSwap contract's `fundToken` function to add 500,000 of each token to the contract's liquidity pool.

```powershell
npx hardhat run scripts/fund-multifarm.ts --network abstractTestnet
```

## Recommended Workflow

For optimal setup, follow these steps in order:

1. First, add all tokens to the MultiFarmSwap contract:
   ```powershell
   npx hardhat run scripts/add-all-tokens.ts --network abstractTestnet
   ```

2. Next, fund the MultiFarmSwap contract with tokens:
   ```powershell
   npx hardhat run scripts/fund-multifarm.ts --network abstractTestnet
   ```

3. Finally, fund the faucet address with tokens:
   ```powershell
   npx hardhat run scripts/fund-all-tokens.ts --network abstractTestnet
   ```

## Token List

These scripts handle the following ERC20 tokens:

- NOOT (Noot Noot)
- ABSTER
- PENGUIN 
- PAINGU
- YUP
- WOJACT
- RETSBA
- NUTZ
- MOP
- FEATHERS
- ABBY
- DOJO3
- CHESTER

## Troubleshooting

If you encounter any issues:

1. Ensure your wallet has enough tokens to fund the contract
2. Check that your wallet has enough NOOT for gas fees
3. Verify that the token addresses in the `.address` files are correct
4. Confirm that the MultiFarmSwap contract address in `.deployment-info.json` is correct

## Notes

- The scripts will automatically skip tokens for which you don't have sufficient balance
- Each script provides detailed logs about the operations being performed
- The scripts verify balances before and after transfers to confirm success 