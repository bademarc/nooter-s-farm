// Global window.ethereum type declaration for wallet providers like MetaMask
interface Window {
  ethereum: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    selectedAddress?: string;
  };
}

// Ethereum provider error codes
declare const enum ProviderErrorCode {
  UserRejectedRequest = 4001,
  Unauthorized = 4100,
  UnsupportedMethod = 4200,
  Disconnected = 4900,
  ChainDisconnected = 4901,
  ChainNotAdded = 4902,
  RequestPending = -32002
} 