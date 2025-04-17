import { ethers, network } from "hardhat";
import { ContractFactory } from "ethers";
import fs from "fs";
import path from "path";

// Token information matching the list provided by the user
const TOKENS_TO_DEPLOY = [
  { key: "ABSTER", name: "ABSTER", symbol: "$ABSTER" },
  { key: "ABBY", name: "Abby Token", symbol: "ABBY" },
  { key: "CHESTER", name: "Chester Token", symbol: "CHESTER" },
  { key: "DOJO3", name: "Dojo3 Token", symbol: "DOJO3" },
  { key: "FEATHERS", name: "Feathers Token", symbol: "FEATHERS" },
  { key: "MOP", name: "MOP Token", symbol: "MOP" },
  { key: "NUTZ", name: "NUTZ Token", symbol: "NUTZ" },
  { key: "PAINGU", name: "Paingu Token", symbol: "PAINGU" },
  { key: "PENGUIN", name: "Penguin Token", symbol: "PENGUIN" },
  { key: "PUDGY", name: "Pudgy Penguins Token", symbol: "PUDGY" },
  { key: "RETSBA", name: "RETSBA Token", symbol: "RETSBA" },
  { key: "WOJACT", name: "Wojact Token", symbol: "WOJACT" },
  { key: "YUP", name: "YUP Token", symbol: "YUP" }
];

const INITIAL_SUPPLY = 1_000_000_000; // 1 Billion tokens

async function main() {
  console.log(`Deploying tokens on network: ${network.name}`);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const TokenFactory: ContractFactory = await ethers.getContractFactory("NooterToken");

  const deployedAddresses: { [key: string]: string } = {};

  for (const tokenInfo of TOKENS_TO_DEPLOY) {
    console.log(`\nDeploying ${tokenInfo.name} (${tokenInfo.symbol})...`);
    try {
      const tokenContract = await TokenFactory.deploy(
        tokenInfo.name,
        tokenInfo.symbol,
        INITIAL_SUPPLY
      );

      // Wait for deployment confirmation
      await tokenContract.waitForDeployment(); // Correct method for ethers v6+
      const tokenAddress = await tokenContract.getAddress(); // Correct method for ethers v6+

      console.log(`${tokenInfo.symbol} deployed to: ${tokenAddress}`);
      deployedAddresses[tokenInfo.key] = tokenAddress;

      // Optional: Verify contract on Etherscan/Blockscout if configured
      // try {
      //   await hre.run("verify:verify", {
      //     address: tokenAddress,
      //     constructorArguments: [tokenInfo.name, tokenInfo.symbol, INITIAL_SUPPLY],
      //   });
      //   console.log(`${tokenInfo.symbol} verified.`);
      // } catch (verifyError) {
      //   console.error(`Verification failed for ${tokenInfo.symbol}:`, verifyError);
      // }

    } catch (error) {
      console.error(`Failed to deploy ${tokenInfo.name}:`, error);
    }
     // Add a delay between deployments if needed to avoid rate limiting
     await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  }

  console.log("\n--- Deployment Summary ---");
  console.log("Network:", network.name);
  console.log("Deployer Address:", deployer.address);
  console.log("\nDeployed Token Addresses:");
  console.log(JSON.stringify(deployedAddresses, null, 2));

  // Optionally write addresses to a file
  const outputPath = path.join(__dirname, '..', 'deployed-token-addresses.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployedAddresses, null, 2));
  console.log(`\nDeployed addresses saved to: ${outputPath}`);

  console.log("\nUpdate your `components/token-swap.tsx` with these addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 