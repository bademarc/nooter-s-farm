import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";

async function main() {
  console.log("Setting metadata URIs for NFTs...");

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Get the contract addresses
  const bearishAddress = fs.readFileSync(".bearish-address", "utf8").trim();
  const bit77Address = fs.readFileSync(".77bit-address", "utf8").trim();

  console.log(`Bearish NFT address: ${bearishAddress}`);
  console.log(`77-Bit NFT address: ${bit77Address}`);

  // CIDs from the user
  const bearishCID = "bafkreiekvt2a2jd5qlaowhkpgvrvdpecpp7u6iktb3ovkam2bsucvh6wj4";
  const bit77CID = "bafkreig5evonmduvlbbjwaw5jafhhkfsdmg5fxuine4jntebbee3h54byi";

  // Create base URIs with IPFS gateway URLs
  const bearishBaseURI = `ipfs://${bearishCID}/`;
  const bit77BaseURI = `ipfs://${bit77CID}/`;

  // NFT ABI (simplified to include only what we need)
  const nftABI = [
    "function setBaseURI(string memory baseURI) external",
    "function uri(uint256 tokenId) public view returns (string memory)"
  ];

  // Create contract instances
  const bearishContract = new ethers.Contract(bearishAddress, nftABI, wallet);
  const bit77Contract = new ethers.Contract(bit77Address, nftABI, wallet);

  // Set URI for Bearish NFT
  console.log(`Setting Bearish NFT base URI to: ${bearishBaseURI}`);
  try {
    const tx = await bearishContract.setBaseURI(bearishBaseURI, { gasLimit: 1000000 });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Bearish NFT base URI set successfully");

    // Verify the URI was set correctly
    const tokenURI = await bearishContract.uri(1);
    console.log(`Verified Bearish NFT URI: ${tokenURI}`);
  } catch (error) {
    console.error("❌ Error setting Bearish NFT base URI:", error);
  }

  // Set URI for 77-Bit NFT
  console.log(`Setting 77-Bit NFT base URI to: ${bit77BaseURI}`);
  try {
    const tx = await bit77Contract.setBaseURI(bit77BaseURI, { gasLimit: 1000000 });
    console.log(`Transaction submitted: ${tx.hash}`);
    await tx.wait();
    console.log("✅ 77-Bit NFT base URI set successfully");

    // Verify the URI was set correctly
    const tokenURI = await bit77Contract.uri(1);
    console.log(`Verified 77-Bit NFT URI: ${tokenURI}`);
  } catch (error) {
    console.error("❌ Error setting 77-Bit NFT base URI:", error);
  }

  console.log("NFT metadata setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 