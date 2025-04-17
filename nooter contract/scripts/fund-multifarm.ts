import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import { Wallet } from "zksync-ethers";

// Target MultiFarmSwap contract address
const MULTISWAP_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";

// Token addresses to fund (ensure these are registered first)
const TOKENS_TO_FUND = {
  ABSTER: "0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062",
  ABBY: "0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1",
  CHESTER: "0x2460a0068A154C7F2673417dA09f6AE81Ce70e56",
  DOJO3: "0x46BE8d4a214D6ddecE0b3251d76d42E186927781",
  FEATHERS: "0xb4e815813875366e2b4e65eA857278Ae5bEceDc3",
  MOP: "0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7",
  NUTZ: "0x77D29085727405340946919A88B0Ac6c9Ffb80BD",
  PAINGU: "0x8033d82e1e0f949C0986F9102a01C405831b784A",
  PENGUIN: "0x8814046950cDA7aee1B249C1689d070C0db6E58D",
  PUDGY: "0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336",
  RETSBA: "0x26707CE367C4758F73EF09fA9D8d730869a38e10",
  WOJACT: "0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c",
  YUP: "0xF5048aD4FB452f4E39472d085E29994f6088d96B"
};

async function main() {
  console.log(`Starting funding script for MultiFarmSwap at ${MULTISWAP_ADDRESS} using fundToken...`);

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Amount to fund for each token (e.g., 500,000 - adjust if needed)
  const fundAmount = ethers.parseUnits("500000", 18);
  console.log(`Funding amount per token: ${ethers.formatUnits(fundAmount, 18)} tokens`);

  // Token ABI for ERC20 interactions
  const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  // MultiFarmSwap ABI for funding
  const MULTIFARM_ABI = [
    "function fundToken(address tokenAddress, uint256 amount) external",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 exchangeRate, uint256 balance, uint256 actualBalance)"
  ];

  // Create MultiFarmSwap contract instance
  const multiFarmSwap = await ethers.getContractAt(MULTIFARM_ABI, MULTISWAP_ADDRESS, wallet);

  // Process each token to fund
  for (const [tokenName, tokenAddress] of Object.entries(TOKENS_TO_FUND)) {
    try {
      console.log(`\nProcessing ${tokenName} at address: ${tokenAddress}...`);

      // Create token contract instance
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, tokenAddress, wallet);

      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`Token symbol: ${symbol}, Decimals: ${decimals}`);

      // Get token info from MultiFarmSwap before funding
      const [, , , balanceBefore] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`Contract actual balance before: ${ethers.formatUnits(balanceBefore, decimals)} ${symbol}`);

      // Check sender balance
      const senderBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`Sender balance: ${ethers.formatUnits(senderBalance, decimals)} ${symbol}`);

      // Ensure sender has enough tokens
      if (senderBalance < fundAmount) {
        console.warn(`⚠️ Insufficient balance for ${symbol}. Skipping funding...`);
        console.log(`Required: ${ethers.formatUnits(fundAmount, decimals)}, Available: ${ethers.formatUnits(senderBalance, decimals)}`);
        continue;
      }

      // --- Approval Step --- 
      // Check current allowance
      const currentAllowance = await tokenContract.allowance(wallet.address, MULTISWAP_ADDRESS);
      console.log(`Current allowance for MultiFarmSwap: ${ethers.formatUnits(currentAllowance, decimals)}`);

      if (currentAllowance < fundAmount) {
          console.log(`Approving ${ethers.formatUnits(fundAmount, decimals)} ${symbol} for MultiFarmSwap...`);
          // Approve the exact amount or slightly more. Approving max is also an option but less specific.
          const approveTx = await tokenContract.approve(MULTISWAP_ADDRESS, fundAmount); 
          console.log(`Approval transaction hash: ${approveTx.hash}`);
          await approveTx.wait();
          console.log(`Approval successful.`);
      } else {
          console.log(`Sufficient allowance already granted.`);
      }
      // --- End Approval Step --- 

      // Fund the contract using fundToken
      console.log(`Funding MultiFarmSwap with ${ethers.formatUnits(fundAmount, decimals)} ${symbol} using fundToken...`);
      const fundTx = await multiFarmSwap.fundToken(tokenAddress, fundAmount);
      console.log(`Funding transaction hash: ${fundTx.hash}`);
      await fundTx.wait();

      // Verify new balance
      const [, , newTrackedBalance, newActualBalance] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`✅ Funding complete!`);
      console.log(`New contract actual balance: ${ethers.formatUnits(newActualBalance, decimals)} ${symbol}`);
      console.log(`New contract tracked balance: ${ethers.formatUnits(newTrackedBalance, decimals)} ${symbol}`); // Important for calc

    } catch (error) {
      console.error(`❌ Error processing token ${tokenName} at ${tokenAddress}:`, error);
    }
  }

  console.log("\n📊 Summary of token balances in MultiFarmSwap (post-funding):");
  for (const [tokenName, tokenAddress] of Object.entries(TOKENS_TO_FUND)) {
    try {
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, tokenAddress, wallet);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const [, , trackedBalance, actualBalance] = await multiFarmSwap.getTokenInfo(tokenAddress);
      console.log(`${symbol} (${tokenName}): Actual=${ethers.formatUnits(actualBalance, decimals)}, Tracked=${ethers.formatUnits(trackedBalance, decimals)}`);
    } catch (error) {
      console.error(`Failed to get final balance for token ${tokenName} at ${tokenAddress}`);
    }
  }

  console.log("\n✅ MultiFarmSwap funding process via fundToken completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 