"# nooter-s-farm" 

# Nooters Farm Wallet Integration

This repository includes an implementation of the token-swap component with support for multiple wallet providers, specifically:

1. Abstract Gaming Wallet (AGW)
2. Privy Cross-App Connect
3. MetaMask (default fallback)

## Current Status

The current implementation uses mock adapters for AGW and Privy Cross-App Connect. To implement the real wallet adapters, follow the instructions below.

## Implementation Steps

### 1. Install Required Dependencies

```bash
npm install @abstract-foundation/agw-client@^1.6.0 @abstract-foundation/agw-react@^1.6.0 @privy-io/cross-app-connect@^0.1.8
```

### 2. Replace Mock Implementations

After installing the dependencies, modify `lib/wallet-adapters/index.ts` to use the real implementations:

```typescript
// Replace the entire file with these exports
export { createClient } from '@abstract-foundation/agw-client';
export { AbstractWalletProvider, useLoginWithAbstract, useAbstractClient, useAGW } from '@abstract-foundation/agw-react';
export { getCrossAppClient, CrossAppConnect } from '@privy-io/cross-app-connect';
```

### 3. Wallet Icons

Add wallet icons to the `public/images/wallet-icons/` directory:
- `metamask-logo.svg`
- `agw-logo.svg`
- `privy-logo.svg`

### 4. Usage in Application

Make sure your application is wrapped with the `WalletContainer` component to provide wallet context to all components:

```tsx
// In your layout.tsx or equivalent
import { WalletContainer } from "@/components/wallet-container";

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <WalletContainer>
          {children}
        </WalletContainer>
      </body>
    </html>
  );
}
```

## Abstract Testnet Configuration

The wallet integration is configured to use Abstract Testnet by default with the following parameters:

- Chain ID: 11124 (0x2b74 in hex)
- RPC URL: https://api.testnet.abs.xyz
- Block Explorer: https://explorer.testnet.abs.xyz

## Credits

This implementation is based on patterns from the Abstract fullstack starterpack. 
