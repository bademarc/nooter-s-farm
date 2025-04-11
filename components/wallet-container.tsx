"use client";

import { AbstractWalletProvider } from "@/lib/wallet-adapters";

// Define the Abstract Testnet chain object
const abstractTestnet = {
  id: 11124, // 0x2b74 in decimal
  name: "Abstract Testnet",
  nativeCurrency: {
    name: "Abstract ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: { http: ["https://api.testnet.abs.xyz"] }
  },
  blockExplorers: {
    default: { url: "https://explorer.testnet.abs.xyz" }
  }
};

export const WalletContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <AbstractWalletProvider chain={abstractTestnet}>
      {children}
    </AbstractWalletProvider>
  );
}; 