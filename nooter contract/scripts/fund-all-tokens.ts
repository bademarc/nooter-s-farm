import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Transferring full balance of specified tokens to the new contract...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Target new contract address
  const newContractAddress = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"; // UPDATED ADDRESS
  console.log(`Target contract address: ${newContractAddress}`);

  // Token ABI for ERC20 interactions
  const TOKEN_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)"
  ];

  // Collect the 13 specific ERC20 token addresses from the .address files
  const tokenAddresses = [
    { name: "ABSTER", address: fs.readFileSync(".abster-address", "utf8").trim() },
    { name: "ABBY", address: fs.readFileSync(".abby-address", "utf8").trim() },
    { name: "CHESTER", address: fs.readFileSync(".chester-address", "utf8").trim() },
    { name: "DOJO3", address: fs.readFileSync(".dojo3-address", "utf8").trim() },
    { name: "FEATHERS", address: fs.readFileSync(".feathers-address", "utf8").trim() },
    { name: "MOP", address: fs.readFileSync(".mop-address", "utf8").trim() },
    { name: "NUTZ", address: fs.readFileSync(".nutz-address", "utf8").trim() },
    { name: "PAINGU", address: fs.readFileSync(".paingu-address", "utf8").trim() },
    { name: "PENGUIN", address: fs.readFileSync(".penguin-address", "utf8").trim() },
    { name: "PUDGY", address: fs.readFileSync(".pudgy-penguins-address", "utf8").trim() }, // Added PUDGY
    { name: "RETSBA", address: fs.readFileSync(".retsba-address", "utf8").trim() },
    { name: "WOJACT", address: fs.readFileSync(".wojact-address", "utf8").trim() },
    { name: "YUP", address: fs.readFileSync(".yup-address", "utf8").trim() }
    // NOOT is excluded as requested
  ];

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

      // Get sender balance
      const senderBalance = await tokenContract.balanceOf(wallet.address);
      const formattedSenderBalance = ethers.formatUnits(senderBalance, decimals);
      console.log(`Sender balance: ${formattedSenderBalance} ${symbol}`);

      // Check the new contract's current balance
      const contractBalance = await tokenContract.balanceOf(newContractAddress);
      console.log(`Target contract current balance: ${ethers.formatUnits(contractBalance, decimals)} ${symbol}`);

      // Only transfer if sender has a balance greater than 0
      if (senderBalance > 0) {
        console.log(`Transferring full balance (${formattedSenderBalance} ${symbol}) to new contract...`);
        const tx = await tokenContract.transfer(newContractAddress, senderBalance); // Transfer full balance
        console.log(`Transaction hash: ${tx.hash}`);
        await tx.wait();

        // Verify new balances
        const newSenderBalance = await tokenContract.balanceOf(wallet.address);
        const newContractBalance = await tokenContract.balanceOf(newContractAddress);
        console.log(`✅ Transfer complete!`);
        console.log(`   New sender balance: ${ethers.formatUnits(newSenderBalance, decimals)} ${symbol}`);
        console.log(`   New contract balance: ${ethers.formatUnits(newContractBalance, decimals)} ${symbol}`);
      } else {
        console.log(`Sender has 0 ${symbol}. Skipping transfer.`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${token.name}:`, error);
    }
  }

  console.log("\n📊 Summary of final contract balances:");
  for (const token of tokenAddresses) {
    try {
      const tokenContract = await ethers.getContractAt(TOKEN_ABI, token.address, wallet);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const contractBalance = await tokenContract.balanceOf(newContractAddress);
      console.log(`${symbol}: ${ethers.formatUnits(contractBalance, decimals)}`);
    } catch (error) {
      console.error(`Failed to get final balance for ${token.name}`);
    }
  }

  console.log("\n✅ Token transfer process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 