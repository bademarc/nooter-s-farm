import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { Wallet } from "zksync-ethers";
import { IERC20Artifact } from "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Assuming OpenZeppelin is installed

// --- CONFIGURATION ---
// Address of the OLD MultiFarmSwap contract holding the stuck NOOT tokens
const OLD_SWAP_ADDRESS = "0x324B6DA594145093b003Ec9b305e2A478A76Ba88"; 

// Address of the NEW MultiFarmSwap contract to receive the funds
// Read from deployment info to ensure it's the latest
let NEW_SWAP_ADDRESS = "";
const deploymentInfoPath = ".deployment-info.json";

// Address of the actual NOOT token
let NOOT_TOKEN_ADDRESS = "";

// --- SCRIPT LOGIC ---
async function main() {
  console.log("Starting fund transfer script...");

  // Read addresses from deployment info
  try {
    if (fs.existsSync(deploymentInfoPath)) {
      const fileData = fs.readFileSync(deploymentInfoPath, "utf8");
      const deploymentInfo = JSON.parse(fileData);
      NEW_SWAP_ADDRESS = deploymentInfo.multiFarmSwapAddress;
      NOOT_TOKEN_ADDRESS = deploymentInfo.nootTokenAddress;
    } else {
      throw new Error(".deployment-info.json not found!");
    }
  } catch (error) {
    console.error("Error reading deployment info:", error);
    process.exit(1);
  }

  if (!NEW_SWAP_ADDRESS || !NOOT_TOKEN_ADDRESS) {
    console.error("Required addresses not found in deployment info.");
    process.exit(1);
  }

  console.log(`Old Swap Contract: ${OLD_SWAP_ADDRESS}`);
  console.log(`New Swap Contract: ${NEW_SWAP_ADDRESS}`);
  console.log(`NOOT Token:        ${NOOT_TOKEN_ADDRESS}`);

  // Get the provider and wallet (owner/deployer)
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using wallet: ${wallet.address}`);

  // Get contract instances
  const nootToken = await ethers.getContractAt("IERC20", NOOT_TOKEN_ADDRESS, wallet);
  
  const MultiFarmSwapFactory = await ethers.getContractFactory("MultiFarmSwap", wallet);
  const oldSwapContract = MultiFarmSwapFactory.attach(OLD_SWAP_ADDRESS);
  const newSwapContract = MultiFarmSwapFactory.attach(NEW_SWAP_ADDRESS);

  // 1. Check NOOT balance of the old contract
  console.log(`Checking NOOT balance of old contract (${OLD_SWAP_ADDRESS})...`);
  const balanceWei = await nootToken.balanceOf(OLD_SWAP_ADDRESS);
  const balanceFormatted = ethers.formatUnits(balanceWei, 18); // NOOT has 18 decimals
  console.log(`Old contract NOOT balance: ${balanceFormatted}`);

  if (balanceWei === 0n) {
    console.log("Old contract has no NOOT tokens. Nothing to transfer.");
    process.exit(0);
  }

  const amountToTransfer = balanceWei;

  // 2. Claim NOOT from the old contract to the wallet
  console.log(`Attempting to claim ${balanceFormatted} NOOT from old contract to wallet ${wallet.address}...`);
  try {
    // Use claimTestTokens as it's public. It will transfer NOOT_TOKEN_ADDRESS tokens.
    const claimTx = await oldSwapContract.claimTestTokens(NOOT_TOKEN_ADDRESS, amountToTransfer, { gasLimit: 500000 }); // Increased gas limit
    console.log(`Claim transaction sent: ${claimTx.hash}`);
    await claimTx.wait();
    console.log(`Successfully claimed NOOT tokens from old contract.`);
  } catch (error) {
    console.error("Error claiming tokens from old contract:", error);
    console.error("Ensure the old contract exists at the specified address and has the claimTestTokens function.");
    process.exit(1);
  }

  // Verify wallet balance (optional)
  const walletBalanceAfterClaim = await nootToken.balanceOf(wallet.address);
  console.log(`Wallet NOOT balance after claim: ${ethers.formatUnits(walletBalanceAfterClaim, 18)}`);

  // 3. Approve the NEW contract to spend NOOT from the wallet
  console.log(`Approving new contract (${NEW_SWAP_ADDRESS}) to spend ${balanceFormatted} NOOT from wallet...`);
  try {
    const approveTx = await nootToken.approve(NEW_SWAP_ADDRESS, amountToTransfer, { gasLimit: 150000 });
    console.log(`Approval transaction sent: ${approveTx.hash}`);
    await approveTx.wait();
    console.log(`Successfully approved new contract.`);
  } catch (error) {
    console.error("Error approving new contract:", error);
    process.exit(1);
  }

  // 4. Fund the NEW contract with the claimed NOOT
  console.log(`Funding new contract (${NEW_SWAP_ADDRESS}) with ${balanceFormatted} NOOT...`);
  try {
    // Use fundNOOT which internally calls fundToken
    const fundTx = await newSwapContract.fundNOOT(amountToTransfer, { gasLimit: 500000 }); // Increased gas limit
    console.log(`Funding transaction sent: ${fundTx.hash}`);
    await fundTx.wait();
    console.log(`Successfully funded new contract.`);
  } catch (error) {
    console.error("Error funding new contract:", error);
    process.exit(1);
  }

  // Final balance check (optional)
  const newContractBalance = await nootToken.balanceOf(NEW_SWAP_ADDRESS);
  console.log(`New contract NOOT balance after transfer: ${ethers.formatUnits(newContractBalance, 18)}`);
  const walletBalanceFinal = await nootToken.balanceOf(wallet.address);
  console.log(`Wallet NOOT balance after transfer: ${ethers.formatUnits(walletBalanceFinal, 18)}`);

  console.log("Fund transfer completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 