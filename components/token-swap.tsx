"use client"

import { useState, useContext, useEffect } from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownUp, RefreshCw, ArrowRightLeft, AlertCircle, Coins, ArrowDown, Loader, ExternalLink, CheckCircle2, Plus } from "lucide-react"
// Import specific functions from ethers v6
import { ethers, Contract, formatUnits, parseUnits, BrowserProvider, JsonRpcProvider, getAddress, id, zeroPadValue } from "ethers"
import toast from "react-hot-toast"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// Import official AGW packages 
import { 
  useLoginWithAbstract, 
  useAbstractClient 
} from "@abstract-foundation/agw-react"
import { useAccount } from "wagmi"

// Create compatibility layer for ethers v5/v6
const etherUtils = {
  formatUnits: (value: bigint | string | number, decimals: number | string): string => {
    try {
      // Use the imported formatUnits
      return formatUnits(value, decimals);
    } catch (err) {
      // Last resort fallback
      return String(Number(value) / Math.pow(10, Number(decimals)));
    }
  },
  parseUnits: (value: string, decimals: number | string): bigint => {
    try {
      // Use the imported parseUnits
      return parseUnits(value, decimals);
    } catch (err) {
      // Last resort fallback (not ideal but better than crashing)
      return BigInt(Math.floor(Number(value) * Math.pow(10, Number(decimals))));
    }
  }
};

// Create provider compatibility layer
const getProvider = (ethereum: any) => {
  try {
    // Use proper ethers v6 BrowserProvider
    return new BrowserProvider(ethereum);
  } catch (err) {
    // If all else fails, throw an error
    throw new Error("Cannot create provider with current ethers version");
  }
};

// Update with actual deployed token address - with correct checksum
// This is our official NOOT token contract - DO NOT change to a different address
const NOOT_TOKEN_ADDRESS = "0xBe4A56850cb822dD322190C15Bd2c66781007CBc";
// Replace with the actual deployed FarmSwap address
const FARM_SWAP_ADDRESS = "0xF811e93AAc587F89B32c6d59421268c433B970a6";
// Block explorer URL
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Token ABI - minimal for ERC-20 interactions
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

// Updated Swap ABI to match the deployed contract
const SWAP_ABI = [
  "function nootToken() view returns (address)",
  "function claimTestNOOT(uint256 amount) external",
  "function swapNOOTForFarmCoins(uint256 nootAmount) external",
  "function fundNOOT(uint256 amount) external",
  "event NOOTDeposited(address indexed player, uint256 amount)"
];

// Add a helper function to properly format addresses for ethers v6
const getChecksumAddress = (address: string): string => {
  try {
    // Ensure the address is lowercase first to avoid checksum errors
    const lowercaseAddress = address.toLowerCase();
    return getAddress(lowercaseAddress);
  } catch (error) {
    console.error("Error formatting address:", error);
    return address.toLowerCase(); // Return lowercase address as fallback
  }
};

const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";

// Add wallet connection options
const WALLET_OPTIONS = {
  AGW: "agw",
  METAMASK: "metamask" 
}

export const TokenSwap = () => {
  const { farmCoins, addFarmCoins, setFarmCoins } = useContext(GameContext)
  const [swapAmount, setSwapAmount] = useState<number>(100)
  const [farmToNootAmount, setFarmToNootAmount] = useState<number>(100)
  const [nootBalance, setNootBalance] = useState<number>(0)
  const [actualNootBalance, setActualNootBalance] = useState<string>("0")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isFarmToNootLoading, setIsFarmToNootLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [farmToNootError, setFarmToNootError] = useState<string>("")
  const [showTxDetails, setShowTxDetails] = useState<boolean>(false)
  const [currentTx, setCurrentTx] = useState<{hash: string, status: string}>({ hash: "", status: "pending" })
  
  // New wallet connection states
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  const [activeWallet, setActiveWallet] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false)
  
  const [contractNootBalance, setContractNootBalance] = useState("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // AGW wallet hooks
  const { login: loginWithAbstract, logout: logoutAbstract } = useLoginWithAbstract();
  const { data: abstractClient } = useAbstractClient();
  const { address, isConnected } = useAccount();
  
  // Initialize wallet providers
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  
  useEffect(() => {
    // Check if AGW wallet is connected
    if (isConnected && address) {
      setIsWalletConnected(true);
      setActiveWallet(WALLET_OPTIONS.AGW);
      setWalletAddress(address);
      fetchNootBalance(address);
    }
    
    // Check if MetaMask is connected
    const checkMetaMaskConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && !isConnected) {
            setIsWalletConnected(true);
            setActiveWallet(WALLET_OPTIONS.METAMASK);
            setWalletAddress(accounts[0]);
            setMetamaskProvider(window.ethereum);
            fetchNootBalance(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking MetaMask connection:", error);
        }
      }
    };
    
    checkMetaMaskConnection();
    
    // Set up event listeners for wallet changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isConnected, address]);
  
  // Handle account changes
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length > 0) {
      setIsWalletConnected(true);
      setWalletAddress(accounts[0]);
      fetchNootBalance(accounts[0]);
    } else {
      // If MetaMask is active wallet and disconnected
      if (activeWallet === WALLET_OPTIONS.METAMASK) {
        handleDisconnect();
      }
    }
  };
  
  // Get current provider based on active wallet
  const getCurrentProvider = () => {
    switch (activeWallet) {
      case WALLET_OPTIONS.AGW:
        // AbstractClient doesn't directly expose provider property
        return abstractClient ? abstractClient : null;
      case WALLET_OPTIONS.METAMASK:
        return metamaskProvider;
      default:
        return window.ethereum || null;
    }
  };
  
  // Connect wallet
  const connectWallet = async (walletType: string) => {
    try {
      setIsLoading(true);
      
      switch (walletType) {
        case WALLET_OPTIONS.AGW:
          await connectAGW();
          break;
        case WALLET_OPTIONS.METAMASK:
          await connectMetaMask();
          break;
        default:
          console.error("Unknown wallet type");
      }
      
      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      toast.error(`Failed to connect to ${walletType}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect to AGW
  const connectAGW = async () => {
    try {
      await loginWithAbstract();
      toast.success("Connected to Abstract Gaming Wallet");
    } catch (error) {
      console.error("AGW connection error:", error);
      throw error;
    }
  };
  
  // Connect to MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask extension.");
      throw new Error("MetaMask not available");
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.METAMASK);
        setWalletAddress(accounts[0]);
        setMetamaskProvider(window.ethereum);
        
        // Switch to Abstract Testnet
        await switchToAbstractTestnet(window.ethereum);
        
        // Fetch NOOT balance
        fetchNootBalance(accounts[0]);
        toast.success("Connected to MetaMask");
      } else {
        throw new Error("No accounts found after connecting MetaMask");
      }
    } catch (error) {
      console.error("MetaMask connection error:", error);
      throw error;
    }
  };
  
  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      switch (activeWallet) {
        case WALLET_OPTIONS.AGW:
          await logoutAbstract();
          break;
        case WALLET_OPTIONS.METAMASK:
          // MetaMask doesn't have a disconnect method in its API
          // We just reset the state
          break;
      }
      
      // Reset connection state
      setIsWalletConnected(false);
      setActiveWallet(null);
      setWalletAddress(null);
      setActualNootBalance("0");
      
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };
  
  // Update switchToAbstractTestnet to support multiple providers
  const switchToAbstractTestnet = async (provider: any = null) => {
    // Use provided provider or get current provider
    const targetProvider = provider || getCurrentProvider();
    
    if (!targetProvider) {
      toast.error("No wallet provider detected");
      return false;
    }
    
    // If using AGW, no need to switch networks - it's already on Abstract Testnet
    if (activeWallet === WALLET_OPTIONS.AGW && targetProvider === abstractClient) {
      toast.success("AGW is already on Abstract Testnet");
      return true;
    }
    
    try {
      // Check current network
      const chainId = await targetProvider.request({ method: 'eth_chainId' });
      console.log("Current chain ID:", chainId);
      
      // Already on Abstract Testnet
      if (chainId === ABSTRACT_TESTNET_CHAIN_ID) {
        toast.success("Already connected to Abstract Testnet");
        return true;
      }
      
      // Try to switch to Abstract Testnet
      await targetProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ABSTRACT_TESTNET_CHAIN_ID }], // Abstract Testnet
      });
      
      toast.success("Successfully switched to Abstract Testnet");
      return true;
    } catch (switchError: any) {
      // This error code indicates the chain has not been added to the wallet
      if (switchError.code === 4902 || (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902)) {
        try {
          console.log("Chain not added to wallet. Attempting to add it now...");
          await targetProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ABSTRACT_TESTNET_CHAIN_ID,
              chainName: 'Abstract Testnet',
              nativeCurrency: {
                name: 'Abstract ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://api.testnet.abs.xyz', 'https://rpc.testnet.abs.xyz'],
              blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER],
              iconUrls: []
            }]
          });
          toast.success("Abstract Testnet added to your wallet");
          return true;
        } catch (addError) {
          console.error("Error adding chain:", JSON.stringify(addError, Object.getOwnPropertyNames(addError)));
          toast.error("Could not add Abstract Testnet to your wallet");
          return false;
        }
      } else {
        console.error("Error switching network:", switchError);
        toast.error("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
        return false;
      }
    }
  };
  
  // Update fetchNootBalance to support multiple providers
  const fetchNootBalance = async (address: string) => {
    try {
      console.log("Fetching NOOT balance for address:", address);
      
      const provider = getCurrentProvider();
      if (!provider) {
        console.log("No provider found");
        setActualNootBalance("0");
        return;
      }

      // Handle AbstractClient vs direct provider
      let ethersProvider;
      let chainId;

      // If it's AGW client
      if (activeWallet === WALLET_OPTIONS.AGW && abstractClient) {
        // Use the abstractClient's chain info
        chainId = ABSTRACT_TESTNET_CHAIN_ID; // AGW should always be on the Abstract Testnet
        // For AGW, we need to make a different approach since it doesn't have a provider property
        console.log("Using AGW client for balance check");
        
        try {
          // Directly query token balance using AGW client if possible
          // For demonstration, still use ethers with window.ethereum as fallback
          if (window.ethereum) {
            ethersProvider = getProvider(window.ethereum);
          } else {
            console.error("No fallback provider available for AGW");
            setActualNootBalance("0");
            return;
          }
        } catch (err) {
          console.error("Error getting provider for AGW:", err);
          setActualNootBalance("0");
          return;
        }
      } else {
        // For MetaMask or other direct providers
        // Check current network first
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Current chain ID when fetching balance:", chainId);
        
        // Get ethers provider based on current wallet
        ethersProvider = getProvider(provider);
      }
      
      // For debugging - use checksummed addresses
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      console.log("NOOT token address (checksummed):", checksummedNOOTAddress);
      
      // Ensure wallet address is properly checksummed
      const checksummedWalletAddress = getChecksumAddress(address);
      console.log("Wallet address (checksummed):", checksummedWalletAddress);
      
      // If we're not on Abstract Testnet, show placeholder balance
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) { 
        console.log("Not on Abstract Testnet, showing placeholder balance");
        setActualNootBalance("0");
        return;
      }
      
      try {
        let nootContract;
        
        // Create the contract instance
        if (ethersProvider) {
          nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, ethersProvider);
          
          // Try to get token name first as a test
          const tokenName = await nootContract.name().catch((e: any) => {
            console.log("Error getting token name:", e);
            return "Unknown";
          });
          console.log("Token name:", tokenName);
          
          // Now try to get balance
          const balance = await nootContract.balanceOf(checksummedWalletAddress).catch((e: any) => {
            console.error("Error getting balance:", e);
            return 0; // Return 0 on error
          });
          console.log("Raw balance result:", balance.toString());
          
          // Use our etherUtils compatibility layer
          const formattedBalance = etherUtils.formatUnits(balance, 18);
          console.log("Formatted balance:", formattedBalance);
          setActualNootBalance(formattedBalance);

          // Also check contract's NOOT balance for UI display
          const contractBalance = await nootContract.balanceOf(getChecksumAddress(FARM_SWAP_ADDRESS)).catch((e: any) => {
            console.error("Error getting contract balance:", e);
            return 0; // Return 0 on error
          });

          // Use our etherUtils compatibility layer
          const formattedContractBalance = etherUtils.formatUnits(contractBalance, 18);
          console.log("Contract balance:", formattedContractBalance);
          
          // Update both balances
          setContractNootBalance(formattedContractBalance);
        } else {
          console.error("No ethers provider available");
          setActualNootBalance("0");
        }
      } catch (error) {
        console.error("Error accessing contract:", error);
        // Don't update the state on error - keeps previous valid balance
      }
    } catch (error) {
      console.error("Error fetching NOOT balance:", error);
      // Set fallback values on complete error
      setActualNootBalance("0");  
    }
  };
  
  // Force refresh all balances
  const forceRefreshAllBalances = async () => {
    console.log("Force refreshing all balances");
    
    if (!isWalletConnected || !walletAddress) {
      console.log("No connected wallet, skipping balance refresh");
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      // Try multiple times with short delays for reliability
      let retryCount = 0;
      let nootSuccess = false;
      let contractSuccess = false;
      
      while ((retryCount < 3) && (!nootSuccess || !contractSuccess)) {
        console.log(`Balance refresh attempt ${retryCount + 1}/3`);
        
        if (!nootSuccess) {
          try {
            // Update NOOT balance
            await fetchNootBalance(walletAddress);
            nootSuccess = true;
            console.log("NOOT balance refresh successful");
          } catch (error) {
            console.error(`NOOT balance refresh attempt ${retryCount + 1} failed:`, error);
            // Will retry unless max retries reached
          }
        }
        
        if (!contractSuccess) {
          try {
            // Update contract balance
            await checkContractBalance();
            contractSuccess = true;
            console.log("Contract balance refresh successful");
          } catch (error) {
            console.error(`Contract balance refresh attempt ${retryCount + 1} failed:`, error);
            // Will retry unless max retries reached
          }
        }
        
        if (!nootSuccess || !contractSuccess) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between retries
          retryCount++;
        }
      }
      
      // Log final status
      if (nootSuccess && contractSuccess) {
        console.log("All balances refreshed successfully");
      } else {
        console.warn("Some balance refreshes failed after 3 attempts", {
          nootSuccess,
          contractSuccess
        });
      }
    } catch (error) {
      console.error("Error refreshing balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Update checkContractBalance to support multiple providers
  const checkContractBalance = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      console.error("No provider detected");
      return;
    }
    
    try {
      let ethersProvider;
      let chainId;

      // If it's AGW client
      if (activeWallet === WALLET_OPTIONS.AGW && abstractClient) {
        // AGW is always on Abstract Testnet
        chainId = ABSTRACT_TESTNET_CHAIN_ID;
        
        // Use window.ethereum as fallback for contract interactions
        if (window.ethereum) {
          ethersProvider = new BrowserProvider(window.ethereum);
        } else {
          console.error("No fallback provider available for contract balance check");
          return;
        }
      } else {
        // For MetaMask or other direct providers
        chainId = await provider.request({ method: 'eth_chainId' });
        ethersProvider = new BrowserProvider(provider);
      }
      
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
        console.log(`Currently on chain ID ${chainId}, not on Abstract Testnet`);
        return;
      }
      
      // Create contract instance 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
      const nootContract = new Contract(NOOT_TOKEN_ADDRESS, tokenAbi, ethersProvider);
      
      // Get the balance
      const balanceWei = await nootContract.balanceOf(FARM_SWAP_ADDRESS);
      const balanceFormatted = etherUtils.formatUnits(balanceWei, 18);
      
      setContractNootBalance(balanceFormatted);
      console.log(`FarmSwap contract NOOT balance: ${balanceFormatted}`);
    } catch (error) {
      console.error("Failed to check contract balance:", error);
    }
  };
  
  // ... existing code for swap functions ...
  
  // Add wallet options dialog
  const WalletOptionsDialog = () => (
    <Dialog open={showWalletOptions} onOpenChange={setShowWalletOptions}>
      <DialogContent className="bg-[#111] border border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-white noot-title">Connect Wallet</DialogTitle>
          <DialogDescription className="text-white/60 noot-text">
            Choose a wallet to connect to Nooters Farm.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {/* MetaMask */}
          <Button
            onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
            className="bg-[#F6851B] hover:bg-[#E2761B] text-white flex items-center justify-between w-full"
            disabled={isLoading}
          >
            <span>MetaMask</span>
            {isLoading && activeWallet === WALLET_OPTIONS.METAMASK ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <img src="/images/metamask-logo.svg" alt="MetaMask" className="h-5 w-5" />
            )}
          </Button>
          
          {/* AGW */}
          <Button
            onClick={() => connectWallet(WALLET_OPTIONS.AGW)}
            className="bg-[#6F4CFF] hover:bg-[#5A3DD8] text-white flex items-center justify-between w-full"
            disabled={isLoading}
          >
            <span>AGW Wallet</span>
            {isLoading && activeWallet === WALLET_OPTIONS.AGW ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <img src="/images/agw-logo.svg" alt="AGW" className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <DialogFooter>
          <Button
            onClick={() => setShowWalletOptions(false)}
            variant="outline"
            className="w-full border-[#333]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="noot-swap-container noot-text">
      {/* Wallet Options Dialog */}
      <WalletOptionsDialog />
      
      {/* Network status indicator with improved wallet UI */}
      <div className="mb-4 py-2 px-3 bg-black/30 rounded-lg border border-[#333] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {isWalletConnected ? (
            <div className="flex flex-col">
              <span className="text-sm">Connected: {activeWallet}</span>
              <span className="text-xs text-white/60">
                {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
              </span>
            </div>
          ) : (
            <span className="text-sm">Wallet Not Connected</span>
          )}
        </div>
        <div className="flex gap-2">
          {isWalletConnected ? (
            <>
              <Button 
                onClick={forceRefreshAllBalances}
                size="sm"
                variant="outline"
                className="bg-transparent border-[#333] text-xs flex gap-1 items-center"
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {isRefreshing ? "Updating..." : "Refresh"}
              </Button>
              <Button 
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
                className="bg-transparent border-[#333] text-xs hover:bg-red-900/20 hover:text-red-400"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setShowWalletOptions(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
      
      {/* Add the Abstract Testnet button */}
      {isWalletConnected && (
        <div className="mt-2 mb-4">
          <Button 
            onClick={() => switchToAbstractTestnet()}
            size="sm"
            className="w-full bg-purple-700 hover:bg-purple-800 text-xs py-2"
          >
            Switch to Abstract Testnet
          </Button>
        </div>
      )}
      
      {/* Rest of the component... */}
    </div>
  );
};