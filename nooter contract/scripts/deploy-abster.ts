import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying ABSTER Token to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Deploy the contract
  const ABSTERFactory = await ethers.getContractFactory("ABSTER", wallet);
  const abster = await ABSTERFactory.deploy();
  
  await abster.waitForDeployment();
  const absterAddress = await abster.getAddress();
  
  console.log(`ABSTER Token deployed to: ${absterAddress}`);
  
  // Save contract address for verification
  fs.writeFileSync(".abster-address", absterAddress);
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: absterAddress,
      contract: "contracts/ABSTER.sol:ABSTER",
      constructorArguments: [],
      network: "abstractTestnet",
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 