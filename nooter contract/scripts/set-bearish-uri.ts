import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Setting metadata URI for Bearish NFT...");

  // The IPFS or other URI where the NFT metadata is hosted
  // Replace this with the actual URI after you upload the metadata
  const baseURI = "ipfs://bafkreiekvt2a2jd5qlaowhkpgvrvdpecpp7u6iktb3ovkam2bsucvh6wj4/"; // Update this with your actual IPFS CID after uploading metadata

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Read the NFT contract address
  const nftAddress = fs.readFileSync(".bearish-address", "utf8");
  
  // Get the contract
  const NFT = await ethers.getContractFactory("Bearish", wallet);
  const nft = await NFT.attach(nftAddress);
  
  // Set the base URI
  console.log(`Setting base URI to: ${baseURI}`);
  const tx = await nft.setBaseURI(baseURI);
  await tx.wait();
  
  console.log("Base URI set successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 