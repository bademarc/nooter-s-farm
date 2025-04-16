import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying Dojo3 Token to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Deploy the contract
  const Dojo3Factory = await ethers.getContractFactory("Dojo3", wallet);
  const dojo3 = await Dojo3Factory.deploy();
  
  await dojo3.waitForDeployment();
  const dojo3Address = await dojo3.getAddress();
  
  console.log(`Dojo3 Token deployed to: ${dojo3Address}`);
  
  // Save contract address for verification
  fs.writeFileSync(".dojo3-address", dojo3Address);
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: dojo3Address,
      contract: "contracts/Dojo3.sol:Dojo3",
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