// Wallet adapters for AGW, Privy Cross-App Connect

// Export actual implementations now that we have the required packages installed
// Using the correct exports from the packages based on the documentation
export { AbstractWalletProvider, useLoginWithAbstract, useAbstractClient } from '@abstract-foundation/agw-react';
export { toPrivyWallet } from '@privy-io/cross-app-connect/rainbow-kit';

// Type definitions - keeping these for reference and type safety
export interface WalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
}

export interface WalletClient {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnected: () => boolean;
  getAccounts: () => Promise<string[]>;
  provider: WalletProvider | null;
} 