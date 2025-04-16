import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Deploying YUP Token to Abstract Testnet...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Deploy the contract
  const YUPFactory = await ethers.getContractFactory("YUP", wallet);
  const yup = await YUPFactory.deploy();
  
  await yup.waitForDeployment();
  const yupAddress = await yup.getAddress();
  
  console.log(`YUP Token deployed to: ${yupAddress}`);
  
  // Save contract address for verification
  fs.writeFileSync(".yup-address", yupAddress);
  
  // Wait for some confirmations before verification
  console.log("Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

  // Verify the contract
  console.log("Verifying contract on Abstract Testnet...");
  try {
    await hre.run("verify:verify", {
      address: yupAddress,
      contract: "contracts/YUP.sol:YUP",
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