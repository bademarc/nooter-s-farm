import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Claiming test tokens from the MultiFarmSwap contract...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address} to claim tokens`);

  // Target MultiFarmSwap contract address
  const multiFarmSwapAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";
  console.log(`Target MultiFarmSwap contract: ${multiFarmSwapAddress}`);

  // Amount to claim for each token (e.g., 1,000,000)
  const claimAmount = ethers.parseUnits("1000000", 18);
  const formattedClaimAmount = ethers.formatUnits(claimAmount, 18);
  console.log(`Claiming ${formattedClaimAmount} of each token`);

  // ABI snippet for claimTestTokens and balanceOf
  const MULTIFARM_ABI = [
    "function claimTestTokens(address tokenAddress, uint256 tokenAmount) external",
    "function balanceOf(address owner) view returns (uint256)" // Assuming standard ERC20 for balance check
  ];
   const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];


  // List of the 13 token addresses to claim
  const tokenAddressesToClaim = [
    { name: "ABSTER", address: fs.readFileSync(".abster-address", "utf8").trim() },
    { name: "ABBY", address: fs.readFileSync(".abby-address", "utf8").trim() },
    { name: "CHESTER", address: fs.readFileSync(".chester-address", "utf8").trim() },
    { name: "DOJO3", address: fs.readFileSync(".dojo3-address", "utf8").trim() },
    { name: "FEATHERS", address: fs.readFileSync(".feathers-address", "utf8").trim() },
    { name: "MOP", address: fs.readFileSync(".mop-address", "utf8").trim() },
    { name: "NUTZ", address: fs.readFileSync(".nutz-address", "utf8").trim() },
    { name: "PAINGU", address: fs.readFileSync(".paingu-address", "utf8").trim() },
    { name: "PENGUIN", address: fs.readFileSync(".penguin-address", "utf8").trim() },
    { name: "PUDGY", address: fs.readFileSync(".pudgy-penguins-address", "utf8").trim() },
    { name: "RETSBA", address: fs.readFileSync(".retsba-address", "utf8").trim() },
    { name: "WOJACT", address: fs.readFileSync(".wojact-address", "utf8").trim() },
    { name: "YUP", address: fs.readFileSync(".yup-address", "utf8").trim() }
  ];

  // Get the MultiFarmSwap contract instance
  const swapContract = await ethers.getContractAt(MULTIFARM_ABI, multiFarmSwapAddress, wallet);

  // Process each token claim
  for (const token of tokenAddressesToClaim) {
    try {
      console.log(`\nAttempting to claim ${formattedClaimAmount} ${token.name} (${token.address})...`);

      // Get token contract for balance check
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, token.address, wallet);
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();

      // Check initial balance
      const initialBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`Initial balance: ${ethers.formatUnits(initialBalance, decimals)} ${symbol}`);

      // Call the claimTestTokens function
      console.log(`Calling claimTestTokens for ${symbol}...`);
      const tx = await swapContract.claimTestTokens(token.address, claimAmount, {
        // Add a gas limit just in case
        gasLimit: 500000
      });
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();

      // Verify new balance
      const newBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`✅ Claim successful! New balance: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);

    } catch (error: any) {
       // Log more detailed error
        console.error(`❌ Error claiming ${token.name}:`);
        if (error.reason) {
            console.error(`   Reason: ${error.reason}`);
        }
        if (error.code) {
            console.error(`   Code: ${error.code}`);
        }
        if (error.transactionHash) {
            console.error(`   Tx Hash: ${error.transactionHash}`);
        }
        console.error(`   Message: ${error.message}`);
        // If there's a receipt, log status
        if (error.receipt) {
           console.error(`   Receipt Status: ${error.receipt.status}`);
        }
       // You might want to log the full error object for complex cases
       // console.error("   Full Error:", error);
    }
  }
}

main();
