import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";
dotenv.config();

// Function to ensure a directory exists
const ensureDirExists = (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// Function to save contract address to a file
const saveAddressToFile = (fileName: string, address: string) => {
  writeFileSync(fileName, address);
  console.log(`Address saved to ${fileName}`);
};

// IPFS CIDs for NFT metadata
const BEARISH_CID = "bafkreiekvt2a2jd5qlaowhkpgvrvdpecpp7u6iktb3ovkam2bsucvh6wj4";
const BIT77_CID = "bafkreig5evonmduvlbbjwaw5jafhhkfsdmg5fxuine4jntebbee3h54byi";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log("Running NFT deployment script");

  // Initialize the wallet using environment variable
  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error("WALLET_PRIVATE_KEY environment variable is not set");
  }
  
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY);
  console.log(`Deployer address: ${wallet.address}`);

  // Create deployer object
  const deployer = new Deployer(hre, wallet);

  // Deploy Bearish NFT
  console.log("Deploying Bearish NFT...");
  const bearishArtifact = await deployer.loadArtifact("Bearish");
  const bearishContract = await deployer.deploy(bearishArtifact);
  const bearishAddress = await bearishContract.getAddress();
  console.log(`Bearish NFT deployed to ${bearishAddress}`);
  saveAddressToFile(".bearish-address", bearishAddress);

  // Set Bearish base URI
  const bearishBaseURI = `ipfs://${BEARISH_CID}/`;
  const bearishSetURITx = await bearishContract.setBaseURI(bearishBaseURI);
  await bearishSetURITx.wait();
  console.log(`Bearish base URI set to ${bearishBaseURI}`);

  // Deploy 77-Bit NFT
  console.log("Deploying 77-Bit NFT...");
  const bit77Artifact = await deployer.loadArtifact("SeventySevenBit");
  const bit77Contract = await deployer.deploy(bit77Artifact);
  const bit77Address = await bit77Contract.getAddress();
  console.log(`77-Bit NFT deployed to ${bit77Address}`);
  saveAddressToFile(".77bit-address", bit77Address);

  // Set 77-Bit base URI
  const bit77BaseURI = `ipfs://${BIT77_CID}/`;
  const bit77SetURITx = await bit77Contract.setBaseURI(bit77BaseURI);
  await bit77SetURITx.wait();
  console.log(`77-Bit base URI set to ${bit77BaseURI}`);

  // Deploy NFT Swap Handler
  console.log("Deploying NFT Swap Handler...");
  const handlerArtifact = await deployer.loadArtifact("NFTSwapHandler");
  const handlerContract = await deployer.deploy(handlerArtifact);
  const handlerAddress = await handlerContract.getAddress();
  console.log(`NFT Swap Handler deployed to ${handlerAddress}`);
  saveAddressToFile(".nft-handler-address", handlerAddress);

  // Add NFTs to handler
  console.log("Adding NFTs to handler...");
  const addBearishTx = await handlerContract.addNFT(bearishAddress);
  await addBearishTx.wait();
  console.log("Bearish NFT added to handler");

  const addBit77Tx = await handlerContract.addNFT(bit77Address);
  await addBit77Tx.wait();
  console.log("77-Bit NFT added to handler");

  // Transfer NFTs to handler
  console.log("Transferring NFTs to handler...");
  const transferBearishTx = await bearishContract.safeTransferFrom(
    wallet.address,
    handlerAddress,
    1, // BEARISH token ID
    1000, // Amount to transfer
    "0x"
  );
  await transferBearishTx.wait();
  console.log("Bearish NFTs transferred to handler");

  const transferBit77Tx = await bit77Contract.safeTransferFrom(
    wallet.address,
    handlerAddress,
    1, // 77BIT token ID
    1000, // Amount to transfer
    "0x"
  );
  await transferBit77Tx.wait();
  console.log("77-Bit NFTs transferred to handler");

  // Log deployment summary
  console.log("\nDeployment Summary:");
  console.log(`Bearish NFT: ${bearishAddress}`);
  console.log(`77-Bit NFT: ${bit77Address}`);
  console.log(`NFT Swap Handler: ${handlerAddress}`);
  console.log("\nVerify contracts with:");
  console.log(`npx hardhat verify --network abstractTestnet ${bearishAddress}`);
  console.log(`npx hardhat verify --network abstractTestnet ${bit77Address}`);
  console.log(`npx hardhat verify --network abstractTestnet ${handlerAddress}`);
} 