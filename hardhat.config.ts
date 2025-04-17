import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox"; // Includes ethers, waffle, etc.
import "dotenv/config"; // To load environment variables

// Ensure you have a .env file with these variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE"; // Replace with fallback or error handling
const ABSTRACT_TESTNET_RPC_URL = process.env.ABSTRACT_TESTNET_RPC_URL || "https://rpc.testnet.abs.xyz";
// Optional: Etherscan API key for verification
// const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {}, // Default local network
    abstractTestnet: {
      url: ABSTRACT_TESTNET_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11124, // Abstract Testnet Chain ID 0x2b74
    },
    // Add other networks like mainnet if needed
  },
  // Optional: Etherscan configuration for verification
  // etherscan: {
  //   apiKey: ETHERSCAN_API_KEY,
  // },
};

export default config; 