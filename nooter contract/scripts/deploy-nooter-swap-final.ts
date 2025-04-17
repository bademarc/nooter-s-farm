import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying NooterSwap to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Deploy the contract
  const NooterSwapFactory = await ethers.getContractFactory("NooterSwap", wallet);
  const nooterSwap = await NooterSwapFactory.deploy();
  
  await nooterSwap.waitForDeployment();
  const nooterSwapAddress = await nooterSwap.getAddress();
  
  console.log(`NooterSwap deployed to: ${nooterSwapAddress}`);
  
  // Save contract address for verification
  fs.writeFileSync(".nooter-swap-address", nooterSwapAddress);
  
  // Add all farm tokens
  console.log("Adding all farm tokens to the swap contract...");
  const tx = await nooterSwap.addAllFarmTokens();
  await tx.wait();
  console.log("All farm tokens added successfully");
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: nooterSwapAddress,
      contract: "contracts/NooterSwap.sol:NooterSwap",
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