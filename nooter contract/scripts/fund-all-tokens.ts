import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Funding MultiFarmSwap contract with 500,000 of each token...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Target faucet address
  const faucetAddress = "0x324B6DA594145093b003Ec9b305e2A478A76Ba88";
  console.log(`Target faucet address: ${faucetAddress}`);

  // Amount to fund for each token (500,000)
  const fundAmount = ethers.parseUnits("500000", 18);
  console.log(`Funding amount per token: 500,000 tokens`);

  // Token ABI for ERC20 interactions
  const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  // Collect all ERC20 token addresses from the .address files
  // These are known ERC20 tokens, not ERC1155 NFTs
  const tokenAddresses = [
    { name: "NOOT", address: fs.readFileSync(".noot-address", "utf8").trim() },
    { name: "ABSTER", address: fs.readFileSync(".abster-address", "utf8").trim() },
    { name: "PENGUIN", address: fs.readFileSync(".penguin-address", "utf8").trim() },
    { name: "PAINGU", address: fs.readFileSync(".paingu-address", "utf8").trim() },
    { name: "YUP", address: fs.readFileSync(".yup-address", "utf8").trim() },
    { name: "WOJACT", address: fs.readFileSync(".wojact-address", "utf8").trim() },
    { name: "RETSBA", address: fs.readFileSync(".retsba-address", "utf8").trim() },
    { name: "NUTZ", address: fs.readFileSync(".nutz-address", "utf8").trim() },
    { name: "MOP", address: fs.readFileSync(".mop-address", "utf8").trim() },
    { name: "FEATHERS", address: fs.readFileSync(".feathers-address", "utf8").trim() },
    { name: "ABBY", address: fs.readFileSync(".abby-address", "utf8").trim() },
    { name: "DOJO3", address: fs.readFileSync(".dojo3-address", "utf8").trim() },
    { name: "CHESTER", address: fs.readFileSync(".chester-address", "utf8").trim() }
  ];

  // Don't include these as they're ERC1155 NFTs, not ERC20 tokens
  // { name: "BEARISH", address: fs.readFileSync(".bearish-address", "utf8").trim() },
  // { name: "77BIT", address: fs.readFileSync(".77bit-address", "utf8").trim() },

  // Process each token
  for (const token of tokenAddresses) {
    try {
      console.log(`\nProcessing ${token.name} (${token.address})...`);
      
      // Create contract instance
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, token.address, wallet);
      
      // Check token symbol and decimals to confirm it's the right token
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log(`Token symbol: ${symbol}, Decimals: ${decimals}`);
      
      // Check sender balance
      const senderBalance = await tokenContract.balanceOf(wallet.address);
      console.log(`Sender balance: ${ethers.formatUnits(senderBalance, decimals)} ${symbol}`);
      
      // Check faucet's current balance
      const faucetBalance = await tokenContract.balanceOf(faucetAddress);
      console.log(`Faucet current balance: ${ethers.formatUnits(faucetBalance, decimals)} ${symbol}`);
      
      // Ensure sender has enough tokens
      if (senderBalance < fundAmount) {
        console.warn(`⚠️ Insufficient balance for ${symbol}. Skipping...`);
        console.log(`Required: ${ethers.formatUnits(fundAmount, decimals)}, Available: ${ethers.formatUnits(senderBalance, decimals)}`);
        continue;
      }
      
      // Transfer tokens to faucet
      console.log(`Transferring 500,000 ${symbol} to faucet...`);
      const tx = await tokenContract.transfer(faucetAddress, fundAmount);
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      
      // Verify new balance
      const newFaucetBalance = await tokenContract.balanceOf(faucetAddress);
      console.log(`✅ Transfer complete! New faucet balance: ${ethers.formatUnits(newFaucetBalance, decimals)} ${symbol}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${token.name}:`, error);
    }
  }
  
  console.log("\n📊 Summary of token transfers:");
  for (const token of tokenAddresses) {
    try {
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, token.address, wallet);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const faucetBalance = await tokenContract.balanceOf(faucetAddress);
      console.log(`${symbol}: ${ethers.formatUnits(faucetBalance, decimals)}`);
    } catch (error) {
      console.error(`Failed to get balance for ${token.name}`);
    }
  }
  
  console.log("\n✅ Token funding process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 