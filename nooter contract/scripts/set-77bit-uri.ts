import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Setting metadata URI for 77-Bit NFT...");

  // The IPFS or other URI where the NFT metadata is hosted
  // Replace this with the actual URI after you upload the metadata
  const baseURI = "ipfs://bafybeidwb5vt3dnxui5h5dii7zgisrym2vkavghpfawi4o6dxia7bk3f24/"; // Update this with your actual IPFS CID

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);

  // Read the NFT contract address
  const nftAddress = fs.readFileSync(".77bit-address", "utf8");
  
  // Get the contract
  const NFT = await ethers.getContractFactory("SeventySevenBit", wallet);
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