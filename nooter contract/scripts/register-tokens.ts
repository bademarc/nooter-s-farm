import { ethers } from "hardhat";
import * as zk from "zksync-ethers";
import * as hre from "hardhat";
import { Wallet } from "zksync-ethers";

// Target MultiFarmSwap contract address
const MULTISWAP_ADDRESS = "0x3bbBEC7538e18E45210880CF4866f97f2990Dfa3";

// Token addresses to register (excluding NOOT itself)
const TOKENS_TO_REGISTER = {
  ABSTER: "0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062",
  ABBY: "0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1",
  CHESTER: "0x2460a0068A154C7F2673417dA09f6AE81Ce70e56",
  DOJO3: "0x46BE8d4a214D6ddecE0b3251d76d42E186927781",
  FEATHERS: "0xb4e815813875366e2b4e65eA857278Ae5bEceDc3",
  MOP: "0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7",
  NUTZ: "0x77D29085727405340946919A88B0Ac6c9Ffb80BD",
  PAINGU: "0x8033d82e1e0f949C0986F9102a01C405831b784A",
  PENGUIN: "0x8814046950cDA7aee1B249C1689d070C0db6E58D",
  PUDGY: "0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336",
  RETSBA: "0x26707CE367C4758F73EF09fA9D8d730869a38e10",
  WOJACT: "0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c",
  YUP: "0xF5048aD4FB452f4E39472d085E29994f6088d96B"
};

// Default exchange rate (1 Token = 1 NOOT) - ADJUST AS NEEDED
const DEFAULT_EXCHANGE_RATE_WEI = ethers.parseUnits("1", 18);

// MultiFarmSwap ABI subset needed for registration
const MULTIFARM_ABI = [
  "function addToken(address tokenAddress, uint256 exchangeRate) external",
  "function supportedTokens(address) view returns (bool isSupported, uint256 exchangeRate, uint256 balance)" // To check if already added
];

async function main() {
  console.log(`Starting token registration script for MultiFarmSwap at ${MULTISWAP_ADDRESS}...`);

  // Get the provider and wallet
  const provider = new zk.Provider((hre.network.config as any).url);
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  console.log(`Using account: ${wallet.address}`);

  // Create MultiFarmSwap contract instance
  const multiFarmSwap = await ethers.getContractAt(MULTIFARM_ABI, MULTISWAP_ADDRESS, wallet);

  // Process each token to register
  for (const [tokenName, tokenAddress] of Object.entries(TOKENS_TO_REGISTER)) {
    try {
      console.log(`\nChecking registration status for ${tokenName} (${tokenAddress})...`);

      // Check if the token is already supported
      const tokenInfo = await multiFarmSwap.supportedTokens(tokenAddress);
      const isAlreadySupported = tokenInfo.isSupported;

      if (isAlreadySupported) {
        console.log(`  ✅ ${tokenName} is already registered/supported.`);
        // Optional: Check if the exchange rate needs updating
        const currentRate = tokenInfo.exchangeRate;
        if (currentRate !== DEFAULT_EXCHANGE_RATE_WEI) {
          console.warn(`  ⚠️ Current rate (${ethers.formatUnits(currentRate, 18)}) differs from default (${ethers.formatUnits(DEFAULT_EXCHANGE_RATE_WEI, 18)}). Consider updating if needed.`);
        }
        continue; // Skip registration if already supported
      }

      // Register the token
      console.log(`  Registering ${tokenName} with exchange rate: ${ethers.formatUnits(DEFAULT_EXCHANGE_RATE_WEI, 18)} NOOT per Token...`);
      const addTx = await multiFarmSwap.addToken(tokenAddress, DEFAULT_EXCHANGE_RATE_WEI);
      console.log(`  Add token transaction hash: ${addTx.hash}`);
      await addTx.wait();
      console.log(`  ✅ ${tokenName} successfully registered!`);

    } catch (error: any) {
      // Check if error is due to already being added (might depend on contract implementation)
      if (error.message?.includes("Token already added")) { // Adjust error message check if needed
         console.log(`  ℹ️ ${tokenName} was likely already registered (caught error).`);
      } else {
        console.error(`  ❌ Error registering token ${tokenName} at ${tokenAddress}:`, error);
      }
    }
  }

  console.log("\n✅ Token registration process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 