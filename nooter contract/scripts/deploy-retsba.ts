import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying RETSBA Token to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Deploy the contract
  const RETSBAFactory = await ethers.getContractFactory("RETSBA", wallet);
  const retsba = await RETSBAFactory.deploy();
  
  await retsba.waitForDeployment();
  const retsbaAddress = await retsba.getAddress();
  
  console.log(`RETSBA Token deployed to: ${retsbaAddress}`);
  
  // Save contract address for verification
  fs.writeFileSync(".retsba-address", retsbaAddress);
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: retsbaAddress,
      contract: "contracts/RETSBA.sol:RETSBA",
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