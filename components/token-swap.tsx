"use client"

import { useState, useContext, useEffect } from "react"
import React from "react"
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
// Import viem utilities for AGW compatibility
import { parseAbi } from "viem"
import { getGeneralPaymasterInput } from "viem/zksync"

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
const NOOT_TOKEN_ADDRESS = "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56";
// This is our official NOOT token FarmSwap address - UPDATED
const FARM_SWAP_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";
// This is our new NOOT swap address specifically for NOOT/Farm Coin swaps
// const NOOT_SWAP_ADDRESS = "0xF811e93AAc587F89B32c6d59421268c433B970a6";



// Add all token addresses
const TOKEN_ADDRESSES = {
  NOOT: "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56",
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

// Token information with symbols and names
const TOKEN_INFO = {
  NOOT: { symbol: "NOOT", name: "Noot Noot" },
  ABSTER: { symbol: "$ABSTER", name: "ABSTER" },
  ABBY: { symbol: "ABBY", name: "Abby Token" },
  CHESTER: { symbol: "CHESTER", name: "Chester Token" },
  DOJO3: { symbol: "DOJO3", name: "Dojo3 Token" },
  FEATHERS: { symbol: "FEATHERS", name: "Feathers Token" },
  MOP: { symbol: "MOP", name: "MOP Token" },
  NUTZ: { symbol: "NUTZ", name: "NUTZ Token" },
  PAINGU: { symbol: "PAINGU", name: "Paingu Token" },
  PENGUIN: { symbol: "PENGUIN", name: "Penguin Token" },
  PUDGY: { symbol: "PUDGY", name: "Pudgy Penguins Token" },
  RETSBA: { symbol: "RETSBA", name: "RETSBA Token" },
  WOJACT: { symbol: "WOJACT", name: "Wojact Token" },
  YUP: { symbol: "YUP", name: "YUP Token" }
};

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
    "function swapNOOTForToken(address toTokenAddress, uint256 amount) external",
    "function swapTokenForNOOT(address fromTokenAddress, uint256 amount) external",
    "function swapTokens(address fromTokenAddress, address toTokenAddress, uint256 amount) external",
    "function addToken(address tokenAddress) external",
    "function removeToken(address tokenAddress) external",
    "function fundToken(address tokenAddress, uint256 amount) external",
    "function getTokenInfo(address tokenAddress) external view returns (bool isSupported, uint256 balance, uint256 actualBalance)",
    "function getAllSupportedTokens() external view returns (address[])",
    "function claimTestTokens(address tokenAddress, uint256 amount) external",
    "function emergencyWithdraw(address tokenAddress, uint256 amount, address recipient) external",
    "function addMultipleTokens(address[] memory tokenAddresses) external",
    "function addAllFarmTokens() external"
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

// Add the FAUCET constants near other contract constants
const FAUCET_ADDRESS = '0x324B6DA594145093b003Ec9b305e2A478A76Ba88'; // Updated to match new contract address
const FAUCET_ABI = [
  "function requestTokens() external",
  "function getTokenBalance() external view returns (uint256)"
]; // Simplified ABI, add more functions if needed

// Add a utility function to correctly format addresses for AGW transactions
const formatAddressForAGW = (address: string): `0x${string}` => {
  // Ensure the address starts with 0x
  const normalizedAddress = address.startsWith('0x') 
    ? address.toLowerCase() 
    : `0x${address.toLowerCase()}`;
  
  // Cast to the required type
  return normalizedAddress as `0x${string}`;
};

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
  
  // Add new state for token management
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({})
  const [selectedToken, setSelectedToken] = useState<string>("ABSTER")
  const [showTokenSelector, setShowTokenSelector] = useState<boolean>(false)
  const [supportedTokens, setSupportedTokens] = useState<string[]>([])
  const [isMultiSwapLoading, setIsMultiSwapLoading] = useState<boolean>(false)
  const [swapDirection, setSwapDirection] = useState<'noot-to-token' | 'token-to-noot'>('noot-to-token')
  const [expectedOutputAmount, setExpectedOutputAmount] = useState<number>(0)
  
  const [contractNootBalance, setContractNootBalance] = useState("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGettingTestTokens, setIsGettingTestTokens] = useState(false);
  
  // AGW wallet hooks
  const { login: loginWithAbstract, logout: logoutAbstract } = useLoginWithAbstract();
  const { data: abstractClient } = useAbstractClient();
  const { address, isConnected } = useAccount();
  
  // Initialize wallet providers
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  
  // Dev tools state variables (added here to avoid duplicates)
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [fundAmount, setFundAmount] = useState<number>(100);
  const [selectedFundToken, setSelectedFundToken] = useState<string>("NOOT");
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [contractTokenBalances, setContractTokenBalances] = useState<{[key: string]: string}>({});
  const [isLoadingContractBalances, setIsLoadingContractBalances] = useState<boolean>(false);
  
  // Add support for registering new tokens
  const [newTokenAddress, setNewTokenAddress] = useState<string>("");
  const [newTokenExchangeRate, setNewTokenExchangeRate] = useState<number>(1);
  const [isAddingToken, setIsAddingToken] = useState<boolean>(false);
  
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
    console.log("Getting provider for wallet type:", activeWallet);
    
    switch (activeWallet) {
      case WALLET_OPTIONS.AGW:
        // For AGW, check if abstractClient is available
        if (!abstractClient) {
          console.warn("abstractClient not available yet for AGW wallet");
          return null;
        }
        console.log("Returning AGW abstractClient provider");
        return abstractClient;
      case WALLET_OPTIONS.METAMASK:
        if (!metamaskProvider) {
          console.warn("metamaskProvider not available yet for MetaMask wallet");
          return null;
        }
        console.log("Returning MetaMask provider");
        return metamaskProvider;
      default:
        const defaultProvider = window.ethereum || null;
        console.log("Returning default provider:", defaultProvider ? "Available" : "Not available");
        return defaultProvider;
    }
  };
  
  // Get a proper ethers provider based on the wallet type
  const getEthersProvider = async () => {
    switch (activeWallet) {
      case WALLET_OPTIONS.AGW:
        // For AGW, we shouldn't rely on window.ethereum
        if (!abstractClient) {
          throw new Error("No AGW client available");
        }
        
        try {
          // Use the abstractClient's transformed provider
          // Note: The client itself can be used as a provider in most cases
          const ethProvider = getProvider(abstractClient);
          return {
            provider: ethProvider,
            signer: await ethProvider.getSigner(),
            isAGW: true
          };
        } catch (err) {
          console.error("Error getting signer from abstractClient:", err);
          throw new Error("Cannot get signer for AGW");
        }
      
      case WALLET_OPTIONS.METAMASK:
        if (!metamaskProvider) {
          throw new Error("No MetaMask provider available");
        }
        const ethProviderMM = getProvider(metamaskProvider);
        return {
          provider: ethProviderMM,
          signer: await ethProviderMM.getSigner(),
          isAGW: false
        };
      
      default:
        if (!window.ethereum) {
          throw new Error("No wallet provider detected");
        }
        const ethProvider = getProvider(window.ethereum);
        return {
          provider: ethProvider,
          signer: await ethProvider.getSigner(),
          isAGW: false
        };
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

      // Get provider information consistently using our standardized approach
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for balance check, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for balance check:", error);
        setActualNootBalance("0");
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const isAGW = ethersProviderInfo.isAGW;
      
      // Check network/chain ID
      let chainId;
      
      // For AGW, we assume it's always on Abstract Testnet
      if (isAGW) {
        chainId = ABSTRACT_TESTNET_CHAIN_ID;
        console.log("Using AGW, assuming chain ID:", chainId);
      } else {
        // For MetaMask or other direct providers
        // Check current network first
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Current chain ID when fetching balance:", chainId);
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
        // Create the contract instance with our consistent provider
        const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, ethersProvider);
        
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
        
        // Also fetch all token balances
        fetchAllTokenBalances();
      } catch (e) {
        console.error("Error accessing contract:", e);
        // Don't update the state on error - keeps previous valid balance
      }
    } catch (error) {
      console.error("Error fetching NOOT balance:", error);
      // Set fallback values on complete error
      setActualNootBalance("0");  
    }
  };
  
  // Update checkContractBalance to handle missing provider better
  const checkContractBalance = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      console.warn("No provider detected in checkContractBalance - will retry later");
      // Don't show an error toast as this might be called during initialization
      return;
    }
    
    try {
      // Get provider information consistently using our standardized approach
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for contract balance check, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for contract balance check:", error);
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const isAGW = ethersProviderInfo.isAGW;
      
      // Check chain ID
      let chainId;
      
      // For AGW, assume it's always on Abstract Testnet
      if (isAGW) {
        chainId = ABSTRACT_TESTNET_CHAIN_ID;
        console.log("Using AGW for contract balance check, assuming chain ID:", chainId);
      } else {
        // For MetaMask or other direct providers
        chainId = await provider.request({ method: 'eth_chainId' });
        console.log("Current chain ID for contract balance check:", chainId);
      }
      
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
        console.log(`Currently on chain ID ${chainId}, not on Abstract Testnet`);
        return;
      }
      
      // Create contract instance 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
      const nootContract = new Contract(NOOT_TOKEN_ADDRESS, tokenAbi, ethersProvider);
      
      // Get the balance from the NOOT swap address
      // FIX: Check the balance of FARM_SWAP_ADDRESS, not NOOT_SWAP_ADDRESS
      const balanceWei = await nootContract.balanceOf(FARM_SWAP_ADDRESS);
      const balanceFormatted = etherUtils.formatUnits(balanceWei, 18);
      
      setContractNootBalance(balanceFormatted);
      console.log(`NOOT Swap contract NOOT balance: ${balanceFormatted}`);
    } catch (error) {
      console.error("Failed to check contract balance:", error);
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
  
  // Make the Farm Coins state update more responsive
  const updateFarmCoins = (newAmount: number) => {
    console.log(`Updating Farm Coins to ${newAmount}`);
    setFarmCoins(newAmount);
    // Add a small delay and then refresh balances again to ensure sync
    setTimeout(() => {
      forceRefreshAllBalances();
    }, 1000);
  };
  
  // Monitor transaction for confirmation
  const monitorTransaction = async (txHash: string, onConfirm: () => void) => {
    const provider = getCurrentProvider();
    if (!provider) return;
    
    try {
      // Get provider information consistently
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for transaction monitoring, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for monitoring:", error);
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      
      // Wait for transaction to be mined
      const receipt = await ethersProvider.waitForTransaction(txHash);
      
      // Check if receipt exists and was successful
      if (receipt && receipt.status === 1) {
        console.log(`Transaction ${txHash} confirmed`);
        // Call callback
        onConfirm();
        // Also refresh balances
        forceRefreshAllBalances();
      } else {
        console.error(`Transaction ${txHash} failed or null receipt`);
      }
    } catch (error) {
      console.error(`Error monitoring transaction ${txHash}:`, error);
    }
  };
  
  // Add a function to view token on explorer
  const viewOnExplorer = (type: "token" | "address" | "contract" | string, address: string) => {
    let url = ABSTRACT_BLOCK_EXPLORER;
    
    switch(type) {
      case "token":
        url += `/token/${address}`;
        break;
      case "address":
        url += `/address/${address}`;
        break;
      case "contract":
        url += `/address/${address}`;
        break;
      default:
        url += `/${type}/${address}`;
    }
    
    window.open(url, '_blank');
  };
  
  // Debug function to verify contract configuration
  const debugContractConfig = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("No wallet provider detected");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Checking contract configuration...", { id: "debug-toast" });
      
      // Get provider information consistently
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for contract debugging, wallet type:", activeWallet);
      } catch (error) {
        console.error("Error getting ethers provider for debugging:", error);
        toast.error("Could not connect to your wallet for debugging");
        return;
      }
      
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      
      // Check if we're using the correct addresses
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Create contract instances 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function name() view returns (string)"];
      const nootContract = new Contract(checksummedNOOTAddress, tokenAbi, ethersProvider);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      // Verify NOOT token contract is valid
      const tokenName = await nootContract.name().catch(e => "Error: Cannot read token name");
      
      // Check what token the FarmSwap contract thinks it's using
      const contractTokenAddress = await swapContract.nootToken().catch(e => "Error: Cannot read token address from FarmSwap");
      
      // Check FarmSwap contract's NOOT balance
      const contractNootBalanceWei = await nootContract.balanceOf(checksummedFarmSwapAddress).catch(e => "Error: Cannot read contract balance");
      
      // Format balances for display
      let formattedContractBalance: string;
      try {
        formattedContractBalance = formatUnits(contractNootBalanceWei, 18);
      } catch (err) {
        formattedContractBalance = etherUtils.formatUnits(contractNootBalanceWei, 18);
      }
      
      toast.dismiss("debug-toast");
      
      // Display results
      const debugInfo = {
        nootTokenAddress: checksummedNOOTAddress,
        farmSwapAddress: checksummedFarmSwapAddress,
        tokenName: tokenName,
        // FIX: Only call getChecksumAddress if it's a valid address string
        contractTokenAddress: (typeof contractTokenAddress === 'string' && contractTokenAddress.startsWith('0x')) 
           ? getChecksumAddress(contractTokenAddress) 
           : contractTokenAddress, // Keep the error string as is
        contractNootBalance: formattedContractBalance
      };
      
      console.log("Contract configuration:", debugInfo);
      
      // Check if addresses match
      const addressesMatch = typeof contractTokenAddress === 'string' && contractTokenAddress.startsWith('0x') && checksummedNOOTAddress.toLowerCase() === contractTokenAddress.toLowerCase();
      
      if (addressesMatch) {
        console.log("✅ Token addresses match between UI and FarmSwap contract");
        toast.success("Contract configuration looks good!");
      } else {
        console.log("❌ Token addresses DON'T MATCH between UI and FarmSwap contract");
        toast.error("Contract configuration mismatch! Check console for details.");
      }
      
      // Return debug info for UI rendering
      return debugInfo;
    } catch (error) {
      console.error("Debug error:", error);
      toast.dismiss("debug-toast");
      toast.error("Error checking contract configuration");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced refresh function with loading state
  const handleManualRefresh = async () => {
    if (isRefreshing || !isWalletConnected) return;
    
    setIsRefreshing(true);
    toast.success("Refreshing balances...");
    
    try {
      await forceRefreshAllBalances();
      toast.success("All balances updated successfully!");
    } catch (error) {
      console.error("Error during manual refresh:", error);
      toast.error("Failed to refresh balances. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // Get test tokens from faucet
  const getTestTokens = async () => {
    setIsGettingTestTokens(true);
    setError("");

    // Even if the faucet call fails, we'll still provide Farm Coins as a fallback
    let faucetSuccess = false;
    
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      setIsGettingTestTokens(false);
      return;
    }

    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      setIsGettingTestTokens(false);
      return;
    }

    try {
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet, "isAGW:", ethersProviderInfo.isAGW);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsGettingTestTokens(false);
        return;
      }
      
      // Extract provider information
      const isAGW = ethersProviderInfo.isAGW;
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;

      // Check network ID to ensure we're on Abstract Testnet
      let chainId;
      try {
        // For AGW, we assume it's always on Abstract Testnet
        if (isAGW) {
          chainId = ABSTRACT_TESTNET_CHAIN_ID;
          console.log("Using AGW, assuming chain ID:", chainId);
        } else {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Current chain ID:", chainId);
        }
        
        // Check if on Abstract Testnet
        if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
          console.log("Not on Abstract Testnet, attempting to switch network...");
          const switched = await switchToAbstractTestnet();
          if (!switched) {
            setError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
            
            // Provide Farm Coins anyway as fallback
            updateFarmCoins(farmCoins + 500);
            toast.success("Added 500 Farm Coins as a fallback, but you need to switch to Abstract Testnet for full functionality.");
            
            setIsGettingTestTokens(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
        setIsGettingTestTokens(false);
        return;
      }

      // Get wallet address
      let walletAddr;
      if (isAGW) {
        walletAddr = address;
        console.log("Using AGW address:", walletAddr);
      } else {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        walletAddr = accounts[0];
        console.log("Using wallet address:", walletAddr);
      }

      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsGettingTestTokens(false);
        return;
      }

      // Create contract instance
      const checksummedFaucetAddress = getChecksumAddress(FAUCET_ADDRESS);
      console.log("Using faucet address:", checksummedFaucetAddress);

      console.log("Requesting test tokens...");
      toast.loading("Requesting test tokens...", {id: "faucet-toast"});

      // Different transaction handling based on wallet type
      try {
        let txHash;
        
        if (isAGW) {
          console.log("Using AGW direct method for test token request");
          
          if (!abstractClient) {
            throw new Error("No abstractClient available");
          }
          
          try {
            // First try to get a fresh provider check
            if (!getCurrentProvider()) {
              throw new Error("AGW provider not properly initialized");
            }
            
            console.log("Starting AGW writeContract call with these parameters:", {
              address: formatAddressForAGW(checksummedFaucetAddress),
              functionName: "requestTokens",
              gas: "1000000"
            });
            
            // Use properly typed transaction with paymaster
            // Use type assertion to fix TypeScript errors
            txHash = await abstractClient.writeContract({
              address: formatAddressForAGW(checksummedFaucetAddress),
              abi: parseAbi(FAUCET_ABI),
              functionName: "requestTokens",
              args: [], // Make sure to pass empty args array for functions with no parameters
              gas: BigInt(1000000), // Increase to 1,000,000 for more transaction headroom
              // Restore paymaster configuration for gas sponsoring
              paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391" as `0x${string}`,
              paymasterInput: getGeneralPaymasterInput({
                innerInput: "0x"
              })
            } as any); // Use type assertion to fix TypeScript errors
            
            console.log("AGW test token request sent:", txHash);
            
            // Set transaction details
            setCurrentTx({
              hash: txHash,
              status: "success" // AGW transactions are considered successful immediately
            });
            setShowTxDetails(true);
            
            // Update UI immediately for AGW
            await fetchNootBalance(walletAddr);
            toast.dismiss("faucet-toast");
            toast.success("Successfully received test tokens!");
            
            // Force refresh after a delay
            setTimeout(() => forceRefreshAllBalances(), 2000);
            
            // Mark faucet request as successful
            faucetSuccess = true;
          } catch (agwError: any) {
            console.error("AGW-specific error during transaction:", agwError);
            
            // Handle AGW-specific errors with more detailed information
            let errorMessage = "Failed to process transaction";
            let detailedMessage = "";
            
            if (typeof agwError === "object") {
              if (agwError.message?.includes("rejected")) {
                errorMessage = "Transaction was rejected by user";
              } else if (agwError.message?.includes("reverted")) {
                errorMessage = "Transaction reverted";
                detailedMessage = "You may have already claimed tokens recently";
              } else if (agwError.message?.includes("insufficient funds")) {
                errorMessage = "Insufficient funds for transaction";
              } else {
                // Log detailed error for debugging
                console.log("Detailed AGW error:", JSON.stringify(agwError));
                errorMessage = agwError.message || "Unknown error";
              }
            }
            
            toast.dismiss("faucet-toast");
            toast.error(
              React.createElement("div", { className: "space-y-1 text-sm" },
                React.createElement("p", { className: "font-semibold" }, "Failed to get test tokens:"),
                React.createElement("p", { className: "text-xs" }, errorMessage),
                detailedMessage && React.createElement("p", { className: "text-xs text-red-300" }, detailedMessage)
              ),
              {duration: 5000}
            );
            
            setError(errorMessage);
            throw agwError; // Rethrow to be caught by outer catch
          }
        } else {
          // For standard wallets
          const faucetContract = new Contract(checksummedFaucetAddress, FAUCET_ABI, signer);
          
          const tx = await faucetContract.requestTokens({
            gasLimit: 300000,
          });
          
          txHash = tx.hash;
          console.log("Test token request transaction sent:", txHash);
          
          // Set transaction details
          setCurrentTx({
            hash: txHash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          toast.loading("Transaction sent. Waiting for confirmation...", {id: "faucet-toast"});
          
          // Wait for confirmation
          const receipt = await tx.wait();
          toast.dismiss("faucet-toast");
          
          // Update transaction status
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            // Transaction successful
            await fetchNootBalance(walletAddr);
            toast.success("Successfully received test tokens!");
            
            // Force refresh after a delay
            setTimeout(() => forceRefreshAllBalances(), 2000);
            
            // Mark faucet request as successful
            faucetSuccess = true;
          } else {
            toast.error("Failed to get test tokens. The transaction was reverted.");
            // faucetSuccess remains false for the fallback to kick in
          }
        }
      } catch (error: any) {
        toast.dismiss("faucet-toast");
        console.error("Transaction error:", error);
        
        // More detailed error analysis and logging
        console.log("Detailed transaction error info:", {
          code: error?.code,
          message: error?.message || "Unknown error",
          data: error?.data,
          reason: error?.reason,
          error: error?.error,
          receipt: error?.receipt,
          transaction: error?.transaction
        });
        
        // Check receipt status for transaction reversion
        const hasReceipt = error?.receipt || error?.transaction?.receipt;
        const reverted = hasReceipt && hasReceipt.status === 0;
        
        // More detailed error handling with proper error typing
        if (error?.code === "ACTION_REJECTED") {
          setError("You rejected the transaction");
          toast.error("You rejected the transaction. Please try again if you want test tokens.");
        } else {
          // Provide more detailed error information 
          const errorReason = error?.reason || error?.message || "Unknown error";
          const detailedError = error?.details || (error?.data ? error.data.message : "") || "";
          
          // Prepare user-friendly message based on the error
          let userFriendlyMessage = "Transaction failed";
          
          if (reverted) {
            userFriendlyMessage = "Contract execution reverted";
            // Check if it's likely a rate limiting or already claimed issue
            if (errorReason.toLowerCase().includes("limit") || 
                detailedError.toLowerCase().includes("limit") ||
                errorReason.toLowerCase().includes("already") || 
                detailedError.toLowerCase().includes("already")) {
              userFriendlyMessage = "You may have already claimed tokens recently";
            }
          }
          
          setError(`Transaction failed: ${errorReason}`);
          
          console.log("Detailed error information:", {
            error,
            message: error?.message || "No message",
            reason: error?.reason || "No reason",
            details: error?.details || "No details",
            data: error?.data || "No data"
          });
          
          // Create error toast with proper React elements
          const errorToastContent = React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, userFriendlyMessage + ":"),
            React.createElement("p", { className: "text-xs", key: "message" }, errorReason),
            detailedError ? React.createElement("p", { className: "text-xs text-red-300", key: "details" }, detailedError) : null,
            reverted ? React.createElement("p", { className: "text-xs text-yellow-300 mt-1", key: "suggestion" }, 
              "This usually means you've already claimed tokens or there's a time limit between claims.") : null
          ]);
          
          toast.error(errorToastContent, {duration: 10000});
          
          // If transaction reverted, check contract balance and try a fallback direct claim
          if (reverted) {
            setTimeout(() => {
              console.log("Checking contract balance after revert...");
              checkContractBalance()
                .then(() => console.log("Balance check completed"))
                .catch(err => console.error("Error checking balance:", err));
            }, 2000);
            
            // Try using a direct NOOT to Farm Coins swap as fallback
            setTimeout(() => {
              toast("Trying alternative approach to get coins...", 
                {icon: "⚙️", duration: 3000});
              
              // Add some farm coins directly as fallback 
              updateFarmCoins(farmCoins + 500);
              toast.success("Added 500 Farm Coins as a fallback. Try the swap functionality instead.", 
                {duration: 5000});
            }, 3000);
          }
        }
      }
    } catch (error: any) {
      toast.dismiss("faucet-toast");
      console.error("Error getting test tokens:", error);
      toast.error(`An unexpected error occurred: ${error?.message || "Unknown error"}`);
    } finally {
      // If faucet request failed, provide Farm Coins as fallback to enable gameplay
      if (!faucetSuccess) {
        console.log("Faucet request failed or was rejected. Adding Farm Coins as fallback.");
        setTimeout(() => {
          // Add Farm Coins directly since NOOT token request failed
          updateFarmCoins(farmCoins + 500);
          toast.success(
            React.createElement("div", { className: "space-y-1 text-sm" }, [
              React.createElement("p", { className: "font-semibold", key: "title" }, "Added 500 Farm Coins as fallback!"),
              React.createElement("p", { className: "text-xs", key: "message" }, "You can continue playing with Farm Coins even without NOOT tokens.")
            ]),
            {duration: 5000}
          );
        }, 500);
      }
      
      setIsGettingTestTokens(false);
    }
  };

  // Add NOOT token to wallet - using a reliable manual approach instead of problematic wallet_watchAsset
  const addTokenToWallet = async () => {
    try {
      // Get checksummed address
      const checksummedAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      console.log("Adding token to wallet:", checksummedAddress);
      
      const provider = getCurrentProvider();
      if (!provider) {
        toast.error("No wallet provider detected");
        return;
      }
      
      // For AGW, use the fallback method directly as it doesn't support wallet_watchAsset
      if (activeWallet === WALLET_OPTIONS.AGW) {
        console.log("AGW detected, using manual token addition method");
        fallbackToManualMethod(checksummedAddress);
        return;
      }
      
      // Try to use wallet_watchAsset for other wallets
      try {
        console.log("Attempting to add token using wallet_watchAsset method");
        
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC20',
              options: {
                address: checksummedAddress,
                symbol: 'NOOT',
                decimals: 18,
                image: 'https://nooters.farm/logo.png',
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added successfully!');
          toast.success("NOOT token added to your wallet!");
        } else {
          console.log('User rejected adding the token, using fallback method');
          fallbackToManualMethod(checksummedAddress);
        }
      } catch (error) {
        console.error("Error using wallet_watchAsset:", error);
        // Use fallback method without throwing a new error
        console.log("wallet_watchAsset not supported, using fallback method");
        fallbackToManualMethod(checksummedAddress);
      }
    } catch (error) {
      console.error("Token addition error:", error);
      toast.error("Error adding token to wallet", {
        duration: 5000,
      });
      fallbackToManualMethod(NOOT_TOKEN_ADDRESS);
    }
  };
  
  // Fallback method for adding tokens
  const fallbackToManualMethod = (tokenAddress: string) => {
    // Copy the checksummed token address to clipboard
    navigator.clipboard.writeText(tokenAddress).then(() => {
      // Show token address copied confirmation
      toast.success("Token address copied to clipboard!", {
        duration: 5000,
        icon: "📋"
      });
      
      // Show detailed instructions toast
      setTimeout(() => {
        toast.success(
          React.createElement("div", { className: "text-xs space-y-1" },
            React.createElement("p", { className: "font-bold" }, "Add $NOOT to your wallet:"),
            React.createElement("p", null, "1. Open your wallet"),
            React.createElement("p", null, "2. Select \"Import token\" or \"Add token\""),
            React.createElement("p", null, "3. Paste the address"),
            React.createElement("p", null, "4. Enter \"NOOT\" for symbol and \"18\" for decimals")
          ),
          { duration: 7000 }
        );
      }, 1000);
    }).catch(err => {
      console.error("Clipboard error:", err);
      // Fallback for clipboard errors
      toast(
        React.createElement("div", { className: "text-xs space-y-1 mt-2" },
          React.createElement("p", { className: "font-semibold" }, "Add token manually with these details:"),
          React.createElement("p", null, "Address: ", React.createElement("span", { className: "font-mono bg-black/40 px-1" }, tokenAddress)),
          React.createElement("p", null, "Symbol: NOOT | Decimals: 18")
        ),
        { duration: 10000 }
      );
    });
  };

  // Add the selected token to wallet
  const addSelectedTokenToWallet = async (tokenKey = selectedToken) => {
    if (!tokenKey) return;
    
    try {
      // Get the token address and info
      const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
      const tokenInfo = TOKEN_INFO[tokenKey as keyof typeof TOKEN_INFO];
      
      if (!tokenAddress || !tokenInfo) {
        toast.error("Token information not found");
        return;
      }
      
      console.log(`Adding ${tokenKey} token to wallet:`, tokenAddress);
      
      const provider = getCurrentProvider();
      if (!provider) {
        toast.error("No wallet provider detected");
        return;
      }
      
      // For AGW, use the fallback method directly as it doesn't support wallet_watchAsset
      if (activeWallet === WALLET_OPTIONS.AGW) {
        console.log("AGW detected, using manual token addition method");
        fallbackToManualTokenMethod(tokenAddress, tokenInfo);
        return;
      }
      
      // Try to use wallet_watchAsset for other wallets
      try {
        console.log("Attempting to add token using wallet_watchAsset method");
        
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC20',
              options: {
                address: tokenAddress,
                symbol: tokenInfo.symbol,
                decimals: 18,
                image: `https://nooters.farm/tokens/${tokenKey.toLowerCase()}.png`, // Fallback image path
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added successfully!');
          toast.success(`${tokenInfo.symbol} token added to your wallet!`);
        } else {
          console.log('User rejected adding the token, using fallback method');
          fallbackToManualTokenMethod(tokenAddress, tokenInfo);
        }
      } catch (error) {
        console.error("Error using wallet_watchAsset:", error);
        // Use fallback method without throwing a new error
        console.log("wallet_watchAsset not supported, using fallback method");
        fallbackToManualTokenMethod(tokenAddress, tokenInfo);
      }
    } catch (error) {
      console.error("Token addition error:", error);
      toast.error("Error adding token to wallet", {
        duration: 5000,
      });
    }
  };

  // Fallback method for adding any token
  const fallbackToManualTokenMethod = (tokenAddress: string, tokenInfo: {symbol: string, name: string}) => {
    // Copy the checksummed token address to clipboard
    navigator.clipboard.writeText(tokenAddress).then(() => {
      // Show token address copied confirmation
      toast.success("Token address copied to clipboard!", {
        duration: 5000,
        icon: "📋"
      });
      
      // Show detailed instructions toast
      setTimeout(() => {
        toast.success(
          React.createElement("div", { className: "text-xs space-y-1" },
            React.createElement("p", { className: "font-bold" }, `Add ${tokenInfo.symbol} to your wallet:`),
            React.createElement("p", null, "1. Open your wallet"),
            React.createElement("p", null, "2. Select \"Import token\" or \"Add token\""),
            React.createElement("p", null, "3. Paste the address"),
            React.createElement("p", null, `4. Enter "${tokenInfo.symbol}" for symbol and "18" for decimals`)
          ),
          { duration: 7000 }
        );
      }, 1000);
    }).catch(err => {
      console.error("Clipboard error:", err);
      // Fallback for clipboard errors
      toast(
        React.createElement("div", { className: "text-xs space-y-1 mt-2" },
          React.createElement("p", { className: "font-semibold" }, `Add token manually with these details:`),
          React.createElement("p", null, "Address: ", React.createElement("span", { className: "font-mono bg-black/40 px-1" }, tokenAddress)),
          React.createElement("p", null, `Symbol: ${tokenInfo.symbol} | Decimals: 18`)
        ),
        { duration: 10000 }
      );
    });
  };

  // Swap NOOT for Farm Coins with blockchain transaction
  const swapNOOTForFarmCoins = async () => {
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsLoading(false);
        return;
      }
      
      // For blockchain swaps, we need to check actual balance
      if (parseFloat(actualNootBalance) < swapAmount) {
        toast.error(`Not enough NOOT tokens. You have ${actualNootBalance} NOOT`);
        setIsLoading(false);
        return;
      }
      
      console.log("Preparing NOOT to Farm Coins swap transaction...");
      
      // Calculate Farm Coins to receive (1 NOOT = 10 Farm Coins)
      const farmCoinsToReceive = swapAmount * 10;
      
      // Store initial farm coins to ensure proper update
      const initialFarmCoins = farmCoins;
      
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet, "isAGW:", ethersProviderInfo.isAGW);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Extract provider and signer from the provider info
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      const isAGW = ethersProviderInfo.isAGW;
      
      // Check network ID to ensure we're on Abstract Testnet
      let chainId;
      try {
        // For AGW, we assume it's always on Abstract Testnet
        if (isAGW) {
          chainId = ABSTRACT_TESTNET_CHAIN_ID;
          console.log("Using AGW, assuming chain ID:", chainId);
        } else {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Current chain ID:", chainId);
        }
        
        // Check if on Abstract Testnet
        if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
          console.log("Not on Abstract Testnet, attempting to switch network...");
          const switched = await switchToAbstractTestnet();
          if (!switched) {
            setError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
        setIsLoading(false);
        return;
      }
      
      // Get the connected wallet address
      let walletAddr;
      if (isAGW) {
        walletAddr = address;
        console.log("Using AGW address:", walletAddr);
      } else {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        walletAddr = accounts[0];
        console.log("Using wallet address:", walletAddr);
      }
      
      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsLoading(false);
        return;
      }
      
      // Create contract instances
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      console.log("Creating contracts with signer:", signer ? "Available" : "Not available");
      const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      console.log("Contract instances created");
      
      // Format amount with proper decimals for the blockchain
      const nootAmount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      console.log("Amount to swap:", nootAmount.toString());
      
      // STEP 1: Approve NOOT tokens for spending
      console.log("Approving token spend...");
      try {
        // Check current allowance first
        const checksummedWalletAddress = getChecksumAddress(walletAddr);
        const currentAllowance = await nootContract.allowance(checksummedWalletAddress, checksummedFarmSwapAddress);
        console.log("Current allowance:", currentAllowance.toString());
        
        // Only approve if needed - use a much larger allowance to prevent frequent approvals
        if (currentAllowance < nootAmount) {
          console.log("Allowance insufficient, requesting approval...");
          
          // Due to limitations with MetaMask, we need to use a large approval amount for tokens
          const largeApprovalAmount = parseUnits("10000000", 18); // 10 million tokens
          
          toast.success(
            React.createElement("div", { className: "space-y-1 text-sm" },
              React.createElement("p", { className: "font-semibold" }, "Approval Required"),
              React.createElement("p", { className: "text-xs" }, "Please approve NOOT tokens in your wallet"),
              React.createElement("p", { className: "text-xs" }, "This is required only once")
            ),
            {duration: 8000}
          );
          
          // Before sending transaction, show toast that we're preparing approval
          toast.loading("Preparing approval transaction...", { id: "approval-toast" });
          
          try {
            // Execute approval - using a consistent approach for all wallet types
            console.log(`Executing approval with wallet type: ${activeWallet}`);
            
            let approvalTx: any;
            let approvalTxHash: string;
            
            if (isAGW) {
              console.log("Using AGW direct method for token approval");
              
              // For AGW, use the abstractClient directly
              if (!abstractClient) {
                throw new Error("No abstractClient available");
              }
              
              // Use AGW's writeContract method with minimal gas settings
              approvalTx = await abstractClient.writeContract({
                address: formatAddressForAGW(checksummedNOOTAddress),
                abi: parseAbi(TOKEN_ABI),
                functionName: "approve",
                args: [formatAddressForAGW(checksummedFarmSwapAddress), largeApprovalAmount],
                gas: BigInt(300000), // Increased for safety
                paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391" as `0x${string}`,
                paymasterInput: getGeneralPaymasterInput({
                  innerInput: "0x"
                })
              } as any); // Type assertion needed for TypeScript
              
              approvalTxHash = approvalTx;
              
            } else {
              // Standard wallets use regular ethers.js calls
              approvalTx = await nootContract.approve(checksummedFarmSwapAddress, largeApprovalAmount);
              approvalTxHash = approvalTx.hash;
            }
            
            console.log("Approval transaction submitted:", approvalTxHash);
            
            // Show transaction details
            setCurrentTx({
              hash: approvalTxHash,
              status: isAGW ? "success" : "pending" // AGW tx are considered successful immediately
            });
            setShowTxDetails(true);
            
            // Handle confirmation based on wallet type
            if (!isAGW) {
              toast.loading("Waiting for approval confirmation...", { id: "approval-toast" });
              await approvalTx.wait();
            }
            
            toast.dismiss("approval-toast");
            toast.success("NOOT spending approved!");
          } catch (approvalError: any) {
            toast.dismiss("approval-toast");
            console.error("Approval error:", approvalError);
            
            if (approvalError.code === "ACTION_REJECTED") {
              setError("You rejected the approval transaction");
              toast.error("Transaction canceled: You rejected the approval");
              setIsLoading(false);
              return;
            } else {
              setError(approvalError.reason || approvalError.message || "Approval transaction failed");
              toast.error("Approval failed: " + (approvalError.reason || approvalError.message || "Unknown error"));
              setIsLoading(false);
              return;
            }
          }
        } else {
          console.log("Sufficient allowance already granted");
        }
        
        // IMPORTANT: Use the correct swap function from the NooterSwap contract
        try {
          toast.loading("Processing swap via direct transfer...", { id: "swap-toast" });
          
          // Instead of direct transfer, use the swapNOOTForToken function directly
          // First determine which farm token to swap to (default to ABSTER)
          const farmToken = selectedToken || "ABSTER";
          const farmTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[farmToken as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Calling swapNOOTForToken with target token: ${farmToken} (${farmTokenAddress}) and amount: ${nootAmount.toString()}`);
          
          let tx;
          if (isAGW) {
            if (!abstractClient) {
              throw new Error("No abstractClient available");
            }
            
            tx = await abstractClient.writeContract({
              address: formatAddressForAGW(checksummedFarmSwapAddress),
              abi: parseAbi(SWAP_ABI),
              functionName: "swapNOOTForToken",
              args: [formatAddressForAGW(farmTokenAddress), nootAmount],
              gas: BigInt(1500000),
              paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391" as `0x${string}`,
              paymasterInput: getGeneralPaymasterInput({
                innerInput: "0x"
              })
            } as any);
            
          } else {
            tx = await swapContract.swapNOOTForToken(farmTokenAddress, nootAmount, {
              gasLimit: 2000000
            });
          }
          
          console.log("Swap transaction submitted:", tx.hash);
          setCurrentTx({
            hash: tx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await tx.wait();
          toast.dismiss("swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              // Enhanced Dopamine Toast! ✨
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 text-2xl">💰</span>
                </span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP SUCCESS!</p>
                  <p className="text-sm text-white/90">You got {farmCoinsToReceive} Farm Coins!</p>
                </div>
              </div>,
              {
                duration: 4000, // Longer duration
                icon: '🎉', // Fun icon
                style: { // Remove default styling
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Update farm coins
            updateFarmCoins(farmCoinsToReceive);
            
            // Update NOOT balance
            await fetchNootBalance(walletAddr);
            
            // Reset input
            setSwapAmount(0);
          } else {
            throw new Error("Swap transaction failed with status 0");
          }
        } catch (error: unknown) {
          console.error("Error in swap process:", error);
          setError(error instanceof Error ? error.message : "Something went wrong with the swap");
          toast.error("Failed to complete the swap");
        } finally {
          setIsLoading(false);
        }
      } catch (error: unknown) {
        console.error("Error in swap process:", error);
        setError(error instanceof Error ? error.message : "Something went wrong with the swap");
        toast.error("Failed to complete the swap");
      } finally {
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("Error in swap process:", error);
      setError(error instanceof Error ? error.message : "Something went wrong with the swap");
      toast.error("Failed to complete the swap");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap Farm Coins for NOOT with blockchain transaction
  const swapFarmCoinsForNOOT = async () => {
    setIsFarmToNootLoading(true);
    setFarmToNootError("");
    
    const provider = getCurrentProvider();
    if (!provider) {
      toast.error("Please connect a wallet to continue.");
      setIsFarmToNootLoading(false);
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      setIsFarmToNootLoading(false);
      return;
    }
    
    try {
      // Validate input
      if (farmToNootAmount <= 0) {
        toast.error("Please enter a valid amount of Farm Coins");
        setIsFarmToNootLoading(false);
        return;
      }
      
      if (farmToNootAmount > farmCoins) {
        toast.error(`Not enough Farm Coins. You have ${farmCoins} Farm Coins`);
        setIsFarmToNootLoading(false);
        return;
      }
      
      // Calculate NOOT to receive (10 Farm Coins = 1 NOOT)
      let nootToReceive = farmToNootAmount / 10;
      
      // IMPORTANT: Limit the maximum amount to claim to 10 NOOT to avoid failures
      // The contract may not have enough NOOT tokens for larger claims
      if (nootToReceive > 10) {
        nootToReceive = 10;
        toast.loading(
          React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, "Amount Reduced:"),
            React.createElement("p", { className: "text-xs", key: "message" }, 
              `Limited claim to 10 NOOT to avoid contract errors. The contract may not have enough reserves for larger amounts.`)
          ]),
          {id: "limit-toast", duration: 3000}
        );
      }
      
      console.log(`Swapping ${farmToNootAmount} Farm Coins for ${nootToReceive} NOOT...`);
      
      // Get proper ethers provider and signer based on wallet type
      let ethersProviderInfo;
      try {
        ethersProviderInfo = await getEthersProvider();
        console.log("Got provider for wallet type:", activeWallet, "isAGW:", ethersProviderInfo.isAGW);
      } catch (error) {
        console.error("Error getting ethers provider:", error);
        toast.error("Could not connect to your wallet. Please try again.");
        setIsFarmToNootLoading(false);
        return;
      }
      
      // Extract provider and signer from the provider info
      const ethersProvider = ethersProviderInfo.provider;
      const signer = ethersProviderInfo.signer;
      const isAGW = ethersProviderInfo.isAGW;
      
      // Check network ID to ensure we're on Abstract Testnet
      let chainId;
      try {
        // For AGW, we assume it's always on Abstract Testnet
        if (isAGW) {
          chainId = ABSTRACT_TESTNET_CHAIN_ID;
          console.log("Using AGW, assuming chain ID:", chainId);
        } else {
          chainId = await provider.request({ method: 'eth_chainId' });
          console.log("Current chain ID:", chainId);
        }
        
        // Check if on Abstract Testnet
        if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
          console.log("Not on Abstract Testnet, attempting to switch network...");
          const switched = await switchToAbstractTestnet();
          if (!switched) {
            setFarmToNootError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
            setIsFarmToNootLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setFarmToNootError("Failed to check or switch to Abstract Testnet.");
        setIsFarmToNootLoading(false);
        return;
      }
      
      // Get the wallet address
      let walletAddr;
      if (isAGW) {
        walletAddr = address;
        console.log("Using AGW address:", walletAddr);
      } else {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        walletAddr = accounts[0];
        console.log("Using wallet address:", walletAddr);
      }
      
      if (!walletAddr) {
        toast.error("Could not determine wallet address");
        setIsFarmToNootLoading(false);
        return;
      }
      
      // Create contract instances with contract runner that works for both AGW and standard wallets
      const checksummedNootTokenAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS); // Use FARM_SWAP_ADDRESS here
      const nootContract = new Contract(checksummedNootTokenAddress, TOKEN_ABI, ethersProvider);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      // First check contract's NOOT balance
      const contractBalance = await nootContract.balanceOf(checksummedFarmSwapAddress);
      let formattedBalance;
      
      try {
        formattedBalance = formatUnits(contractBalance, 18);
      } catch (err) {
        formattedBalance = etherUtils.formatUnits(contractBalance, 18);
      }
      
      console.log("Contract NOOT balance:", formattedBalance);
      
      // Check if contract has enough NOOT for the swap
      if (parseFloat(formattedBalance) < nootToReceive) {
        setFarmToNootError(`The contract doesn't have enough NOOT tokens. Available: ${formattedBalance}`);
        toast.error(`Contract has insufficient NOOT tokens (${formattedBalance} available).`);
        setIsFarmToNootLoading(false);
        return;
      }
      
      // First capture the initial farm coins for proper updates
      const initialFarmCoins = farmCoins;
      
      // Format amount with proper decimals for the blockchain
      let nootAmount;
      try {
        nootAmount = parseUnits(nootToReceive.toString(), 18);
      } catch (err) {
        // Fallback using our utility
        nootAmount = etherUtils.parseUnits(nootToReceive.toString(), 18);
      }
      
      // Get the NOOT token address to be used in claimTestTokens
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      
      // TRY DIRECT TRANSFER APPROACH
      try {
        toast.loading("Processing claim via direct method...", { id: "swap-toast" });
        
        // Execute the claimTestTokens function on the contract - which gives NOOT tokens
        if (isAGW) {
          if (!abstractClient) {
            throw new Error("No abstractClient available");
          }
          
          console.log("Using AGW direct method for Farm to NOOT swap");
          
          // Use AGW's writeContract method for transaction with proper type assertion
          const txHash = await abstractClient.writeContract({
            address: formatAddressForAGW(checksummedFarmSwapAddress),
            abi: parseAbi(SWAP_ABI),
            functionName: "claimTestTokens",
            args: [formatAddressForAGW(checksummedNOOTAddress), nootAmount],
            // Increased gas limit to avoid out-of-gas issues
            gas: BigInt(1500000),
            // Paymaster configuration with proper type casting
            paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391" as `0x${string}`,
            paymasterInput: getGeneralPaymasterInput({
              innerInput: "0x"
            })
          } as any);
          
          console.log("AGW transaction sent:", txHash);
          
          // Show transaction details
          setCurrentTx({
            hash: txHash,
            status: "success"  // AGW transactions are considered successful immediately
          });
          setShowTxDetails(true);
          
          // Update UI immediately for AGW
          setFarmCoins(prevCoins => prevCoins - farmToNootAmount);
          await fetchNootBalance(walletAddr);
          
          toast.dismiss("swap-toast");
          // Enhanced Dopamine Toast! ✨
          toast.success(
            <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg shadow-lg">
              <span className="text-2xl animate-pulse">💎</span>
              <div>
                <p className="font-bold text-white text-lg animate-pulse">NOOT ACQUIRED!</p>
                <p className="text-sm text-white/90">Got {nootToReceive.toFixed(2)} NOOT!</p>
              </div>
            </div>,
            {
              duration: 4000,
              icon: '🚀',
              style: {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
              },
            }
          );
          
          // Reset the input field after successful swap
          setFarmToNootAmount(0);
          
          // Force refresh after a delay for UI consistency
          setTimeout(() => forceRefreshAllBalances(), 2000);
        } else {
          // For standard wallets
          // Add direct method first
          console.log("Attempting direct claim with standard wallet");
          
          const gasLimit = 2000000;
          // FIXED: Use claimTestTokens with NOOT address as parameter
          const tx = await swapContract.claimTestTokens(
            checksummedNOOTAddress, // NOOT token address
            nootAmount, // amount to claim
            {
              gasLimit: gasLimit
            }
          );
          
          console.log("Standard transaction sent:", tx.hash);
          
          // Show transaction details
          setCurrentTx({
            hash: tx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          toast.loading("Transaction submitted, waiting for confirmation...", { id: "swap-toast" });
          
          // Wait for confirmation
          const receipt = await tx.wait();
          toast.dismiss("swap-toast");
          
          // Update transaction status
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            // Transaction successful
            setFarmCoins(prevCoins => prevCoins - farmToNootAmount);
            await fetchNootBalance(walletAddr);
            
            toast.success(
              // Enhanced Dopamine Toast! ✨
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-pulse">💎</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">NOOT ACQUIRED!</p>
                  <p className="text-sm text-white/90">Got {nootToReceive.toFixed(2)} NOOT!</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '🚀',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Reset the input field after successful swap
            setFarmToNootAmount(0);
            
            // Force refresh after a delay
            setTimeout(() => forceRefreshAllBalances(), 2000);
          } else {
            toast.error("Transaction failed. The contract may not have enough NOOT tokens.");
          }
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        toast.dismiss("swap-toast");
        
        // Detailed logging for debugging
        console.log("Detailed claim error:", {
          code: error?.code,
          message: error?.message || "Unknown error",
          data: error?.data,
          reason: error?.reason,
          error: error?.error,
          receipt: error?.receipt,
          transaction: error?.transaction
        });
        
        if (error?.code === "ACTION_REJECTED") {
          toast.error("You rejected the transaction");
        } else {
          // Provide more detailed error information
          const errorMessage = error?.reason || error?.message || "Unknown error";
          const detailedMessage = error?.details || (error?.data ? error.data.message : "") || "";
          
          // Check receipt status for transaction reversion
          const hasReceipt = error?.receipt || error?.transaction?.receipt;
          const reverted = hasReceipt && hasReceipt.status === 0;
          
          // Check specifically for common contract errors
          let userFriendlyMessage = "Transaction failed";
          
          if (reverted) {
            userFriendlyMessage = "Contract execution reverted";
          }
          
          if (errorMessage.toLowerCase().includes("insufficient") || 
              detailedMessage.toLowerCase().includes("insufficient") ||
              errorMessage.toLowerCase().includes("reverted")) {
            userFriendlyMessage = "The contract doesn't have enough NOOT tokens to fulfill your claim";
          }
          
          if (errorMessage.toLowerCase().includes("already claimed") || 
              detailedMessage.toLowerCase().includes("already claimed")) {
            userFriendlyMessage = "You have already claimed NOOT tokens recently";
          }
          
          // Create error toast with proper React elements
          const errorToastContent = React.createElement("div", { className: "space-y-1 text-sm" }, [
            React.createElement("p", { className: "font-semibold", key: "title" }, userFriendlyMessage + ":"),
            React.createElement("p", { className: "text-xs", key: "message" }, errorMessage),
            detailedMessage ? React.createElement("p", { className: "text-xs text-red-300", key: "details" }, detailedMessage) : null,
            reverted ? React.createElement("p", { className: "text-xs text-yellow-300 mt-1", key: "suggestion" }, 
              "This usually means the contract cannot complete the request. Try a smaller amount or try again later.") : null
          ]);
          
          toast.error(errorToastContent, {duration: 8000});
          
          // If transaction reverted, log more details and suggest checking balance
          if (reverted) {
            console.log("Transaction reverted. Contract may not have enough tokens or there may be other restrictions.");
            
            // Check contract balance after a short delay
            setTimeout(function() {
              checkContractBalance()
                .then(() => console.log("Balance check completed after revert"))
                .catch(err => console.error("Error checking balance after revert:", err));
            }, 2000);
          }
        }
      }
    } catch (error: any) {
      console.error("Overall swap error:", error);
      toast.error(`An unexpected error occurred: ${error?.message || "Unknown error"}`);
      setIsFarmToNootLoading(false);
      toast.dismiss("swap-toast");
    } finally {
      setIsFarmToNootLoading(false);
      toast.dismiss("swap-toast");
    }
  };

  // Add function to fetch a specific token balance
  const fetchTokenBalance = async (address: string, tokenKey: string) => {
    try {
      if (!address) return "0";

      // Get a compatible ethers provider for the active wallet
      const { provider: ethersProvider, isAGW } = await getEthersProvider(); 
      const checksummedWalletAddress = getChecksumAddress(address);
      const tokenAddress = TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES];
      const checksummedTokenAddress = getChecksumAddress(tokenAddress);

      // Ensure we are on the correct network (check only needed for non-AGW)
      if (!isAGW && window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
          console.log(`fetchTokenBalance: Not on Abstract Testnet for ${tokenKey}. Returning 0.`);
          return "0";
        }
      } else if (!ethersProvider) {
         // Added check if provider itself is null/undefined after getEthersProvider
         console.warn(`fetchTokenBalance: No provider found for ${tokenKey} after getEthersProvider.`);
         return "0"; 
      }
      
      // --- Use Standard Ethers Implementation for ALL wallet types ---
      console.log(`Fetching ${tokenKey} balance for ${isAGW ? 'AGW' : 'standard'} user: ${checksummedWalletAddress}`);
      let balanceWei: bigint;
      try {
        // Use the ethersProvider returned by getEthersProvider()
        const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, ethersProvider);
        const balanceResult = await tokenContract.balanceOf(checksummedWalletAddress);
        balanceWei = BigInt(balanceResult?.toString() ?? '0');
        console.log(`Raw balance for ${tokenKey}: ${balanceWei.toString()}`);
      } catch (ethersError) {
        console.error(`Error fetching ${tokenKey} balance with ethers (${isAGW ? 'AGW provider' : 'Standard provider'}):`, ethersError);
        return "0";
      }
     
      // Format the balance consistently
      const formattedBalance = etherUtils.formatUnits(balanceWei, 18); // Assuming 18 decimals
      console.log(`Formatted ${tokenKey} balance: ${formattedBalance}`);
      return formattedBalance;

    } catch (error) {
      console.error(`Generic error in fetchTokenBalance for ${tokenKey}:`, error);
      return "0";
    }
  };
  
  // Add function to fetch all token balances
  const fetchAllTokenBalances = async () => {
    if (!isWalletConnected || !walletAddress) {
      console.log("fetchAllTokenBalances: Wallet not connected, skipping.");
      return;
    }
    
    console.log(`fetchAllTokenBalances: Fetching all balances for ${walletAddress}...`);
    const balances: {[key: string]: string} = {};
    let fetchError = false;

    // Corrected loop definition - using Object.keys to get the keys directly
    for (const tokenKey of Object.keys(TOKEN_ADDRESSES)) {
      // Fetch NOOT separately using its dedicated function
      if (tokenKey === "NOOT") {
        // Assuming fetchNootBalance updates actualNootBalance state directly
        // We can read it, but don't need to set it in `balances` here
        continue;
      }

      console.log(`fetchAllTokenBalances: Fetching balance for ${tokenKey}...`);
      // Use tokenKey consistently when calling fetchTokenBalance
      const balance = await fetchTokenBalance(walletAddress, tokenKey);
      if (balance === "0" && tokenKey !== "NOOT") { // Log if non-NOOT balance is 0
        console.warn(`fetchAllTokenBalances: Fetched balance is 0 for ${tokenKey}.`);
        // Optionally add a check here to see if it *should* be 0
      }
      // Use tokenKey as the key for the balances object
      balances[tokenKey] = balance;
    }
    
    console.log("fetchAllTokenBalances: Setting token balances state:", balances);
    setTokenBalances(balances);
  };

  // Fix validateTokenForSwap around line 2430 to match the new contract interface
  const validateTokenForSwap = async (tokenAddress: string) => {
    try {
      // Setup provider and contract
      const { provider: ethersProvider } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get token info from the contract
      // FIXED: Updated to match the NooterSwap contract's getTokenInfo return values
      const tokenInfo = await swapContract.getTokenInfo(tokenAddress);
      
      const isSupported = tokenInfo[0]; // isSupported is the first return value
      const balance = tokenInfo[2]; // actualBalance is the third return value
      
      console.log(`Token ${tokenAddress} validation:`, {
        isSupported,
        balance: formatUnits(balance, 18)
      });
      
      return {
        isSupported,
        exchangeRate: BigInt(1), // Hardcode to 1:1 exchange rate
        balance,
        hasLiquidity: balance > 0
      };
    } catch (error) {
      console.error("Error validating token:", error);
      return {
        isSupported: false,
        exchangeRate: BigInt(0),
        balance: BigInt(0),
        hasLiquidity: false
      };
    }
  };

  // Fix calculateExpectedOutput to use 1:1 exchange rate
  const calculateExpectedOutput = async () => {
    try {
      if (swapAmount <= 0 || !selectedToken) {
        setExpectedOutputAmount(0);
        return;
      }
      
      // For NooterSwap, the exchange rate is always 1:1
      // Simply use the same amount for expected output
      setExpectedOutputAmount(swapAmount);
      console.log(`Expected output for ${swapAmount} tokens: ${swapAmount} (1:1 exchange rate)`);
    } catch (error) {
      console.error("Error calculating expected output:", error);
      setExpectedOutputAmount(0);
    }
  };

  const swapNootForToken = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Set the swap direction and use directSwapWithTransfers
    setSwapDirection('noot-to-token');
    
    // Call the direct transfer function
    await directSwapWithTransfers();
  };

  const swapTokenForNOOT = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsMultiSwapLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsMultiSwapLoading(false);
        return;
      }
      
      // Check if the user has enough of the selected token
      const tokenBalance = tokenBalances[selectedToken] || "0";
      if (parseFloat(tokenBalance) < swapAmount) {
        toast.error(`Not enough ${selectedToken} tokens. You have ${tokenBalance} ${selectedToken}`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      console.log(`Preparing ${selectedToken} to NOOT swap transaction...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Setup contract instances
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Validate token before attempting swap
      const validation = await validateTokenForSwap(selectedTokenAddress);
      if (!validation.isSupported) {
        console.log(`${selectedToken} is not supported in the contract. Registering...`);
        toast.loading(`${selectedToken} is not registered. Attempting registration...`, { id: "register-toast" });
        
        try {
          // Register the token with 1:1 exchange rate
          const oneToOneRate = etherUtils.parseUnits("1", 18);
          const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
          const registerTx = await swapContract.addToken(selectedTokenAddress, { gasLimit: 500000 });
          
          console.log(`Registration transaction submitted: ${registerTx.hash}`);
          await registerTx.wait();
          
          toast.dismiss("register-toast");
          toast.success(`${selectedToken} successfully registered with 1:1 exchange rate`);
          
          // Re-validate after registration
          const revalidation = await validateTokenForSwap(selectedTokenAddress);
          if (!revalidation.isSupported) {
            toast.error(`Failed to register ${selectedToken}. Please try again later.`);
            setIsMultiSwapLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error registering token:", error);
          toast.dismiss("register-toast");
          toast.error(`Failed to register ${selectedToken}. You may not have permission to register tokens.`);
          setIsMultiSwapLoading(false);
          return;
        }
      }
      
      // Check if contract has NOOT liquidity
      const nootValidation = await validateTokenForSwap(nootAddress);
      if (!nootValidation.hasLiquidity) {
        console.log(`Contract has no NOOT liquidity.`);
        toast.error(`Contract has no NOOT liquidity available for swapping. Please fund the contract first.`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      const selectedTokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const tokenAmount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      // FIXED: Calculate expected output using 1:1 exchange rate instead of contract function
      const expectedOutput = tokenAmount; // 1:1 exchange rate
      console.log(`Expected NOOT output: ${formatUnits(expectedOutput, 18)} NOOT`);
      
      // Step 1: Check allowance and approve if needed
      try {
        // ADDED: Check if contract has enough NOOT liquidity BEFORE approval
        const contractNootBalanceStr = contractTokenBalances.NOOT || "0"; // Use the fetched contract balance
        const contractNootBalance = parseFloat(contractNootBalanceStr);
        const estimatedNootOutputAmount = expectedOutputAmount > 0 ? expectedOutputAmount : swapAmount; // Use calculated or fallback

        if (contractNootBalance < estimatedNootOutputAmount) {
          toast.error(`Contract has insufficient NOOT liquidity. Available: ${contractNootBalance.toFixed(2)}`);
          setIsMultiSwapLoading(false);
          return;
        }

        const currentAllowance = await selectedTokenContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < tokenAmount) {
          console.log(`Insufficient allowance. Approving ${selectedToken} spending...`);
          toast.loading(`Approving ${selectedToken} spending...`, { id: "approval-toast" });
          
          // Fix in swapTokenForNOOT function - replace mul with BigInt multiplication
          const approveTx = await selectedTokenContract.approve(farmSwapAddress, tokenAmount * BigInt(2));
          console.log("Approval transaction submitted:", approveTx.hash);
          
          await approveTx.wait();
          toast.dismiss("approval-toast");
          toast.success(`${selectedToken} spending approved`);
        } else {
          console.log("Sufficient allowance already granted");
        }
      } catch (error) {
        console.error("Error in approval process:", error);
        toast.error(`Failed to approve ${selectedToken} spending`);
        setIsMultiSwapLoading(false);
        return;
      }
      
      // Step 2: Execute swap
      try {
        toast.loading("Processing swap...", { id: "swap-toast" });
        
        // IMPORTANT: Add debug logging before transaction
        console.log("Debug swap params:", {
          fromToken: selectedToken,
          toToken: "NOOT",
          fromAddress: selectedTokenAddress,
          toAddress: nootAddress,
          amount: tokenAmount.toString(),
          amountFormatted: formatUnits(tokenAmount, 18)
        });
        
        // Use the swapTokenForNOOT function with higher gas limit
        const tx = await swapContract.swapTokenForNOOT(
          selectedTokenAddress,
          tokenAmount,
          { 
            gasLimit: 1500000,  // Increased gas limit
            gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
          }
        );
        
        console.log("Swap transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("swap-toast");
        
        console.log("Transaction receipt:", receipt);
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchNootBalance(walletAddress);
          
          // Display success message with formatted expected output if available
          const formattedOutput = expectedOutput 
            ? formatUnits(expectedOutput, 18)
            : swapAmount.toString();
            
          toast.success(
            <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg">
              <span className="text-2xl animate-bounce">✨</span>
              <div>
                <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                <p className="text-sm text-white/90">Swapped {swapAmount} NOOT for {swapAmount} {selectedToken}</p>
              </div>
            </div>,
            {
              duration: 4000,
              icon: '✅',
              style: {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
              },
            }
          );
          
          // Reset swap amount
          setSwapAmount(0);
          
          // After successful swap, refresh all balances
          await handleManualRefresh();
        } else {
          throw new Error("Swap transaction failed with status 0");
        }
      } catch (error) {
        console.error("Error executing swap:", error);
        toast.dismiss("swap-toast");
        
        // Detect common errors
        const errorStr = String(error).toLowerCase();
        if (errorStr.includes("insufficient")) {
          if (errorStr.includes("gas")) {
            toast.error("Swap failed: Insufficient gas. Try increasing gas limit.");
          } else {
            toast.error("Swap failed: Insufficient balance or allowance.");
          }
        } else if (errorStr.includes("liquidity") || errorStr.includes("not supported")) {
          toast.error("Swap failed: Insufficient liquidity or token not supported.");
        } else if (errorStr.includes("revert")) {
          // Contract reverted
          toast.error("Swap failed: Contract reverted the transaction. The token may not be properly configured in the contract.");
          console.log("Try manually registering the token with updateAllExchangeRatesToOneToOne() function.");
        } else {
          toast.error("Swap transaction failed. See console for details.");
        }
        
        setCurrentTx(prev => ({
          ...prev,
          status: "failed"
        }));
      } finally {
        setIsMultiSwapLoading(false);
      }
    } catch (error) {
      console.error("Error in swap process:", error);
      toast.error("Swap process failed");
      setIsMultiSwapLoading(false);
    }
  };

  // Dev tools functions to fund tokens to contract
  // Note: State variables are declared at the top of the component

  // Function to check all token balances in the contract
  const checkAllContractTokenBalances = async () => {
    try {
      console.log("Checking all contract token balances...");
      const { provider: ethersProvider } = await getEthersProvider();
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, ethersProvider);
      
      // Get all tokens including NOOT
      const allTokens = [
        "NOOT",
        "ABSTER",
        "ABBY",
        "CHESTER",
        "DOJO3",
        "FEATHERS",
        "MOP",
        "NUTZ",
        "PAINGU",
        "PENGUIN",
        "PUDGY",
        "RETSBA",
        "WOJACT",
        "YUP"
      ];
      
      const newBalances: Record<string, string> = {};
      
      // First check NOOT balance
      try {
        const nootContract = new Contract(nootAddress, TOKEN_ABI, ethersProvider);
        const contractNootBalance = await nootContract.balanceOf(farmSwapAddress);
        const formattedNootBalance = formatUnits(contractNootBalance, 18);
        newBalances["NOOT"] = formattedNootBalance;
        console.log(`Contract NOOT balance: ${formattedNootBalance}`);
      } catch (error) {
        console.error("Error checking contract NOOT balance:", error);
        newBalances["NOOT"] = "0";
      }
      
      // Then check all other tokens
      for (const tokenKey of allTokens.filter(t => t !== "NOOT")) {
        try {
          if (TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]) {
            const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
            const tokenContract = new Contract(tokenAddress, TOKEN_ABI, ethersProvider);
            const tokenBalance = await tokenContract.balanceOf(farmSwapAddress);
            const formattedBalance = formatUnits(tokenBalance, 18);
            newBalances[tokenKey] = formattedBalance;
            console.log(`Contract ${tokenKey} balance: ${formattedBalance}`);
          } else {
            console.warn(`Token address not found for ${tokenKey}`);
            newBalances[tokenKey] = "0";
          }
        } catch (error) {
          console.error(`Error checking contract balance for ${tokenKey}:`, error);
          newBalances[tokenKey] = "0";
        }
      }
      
      // Update the state with all balances
      setContractTokenBalances(newBalances);
      
      console.log("Contract token balances updated:", newBalances);
      return newBalances;
    } catch (error) {
      console.error("Error checking contract token balances:", error);
      return {};
    }
  };
  
  // Check contract balances when dev tools are opened
  useEffect(() => {
    if (showDevTools && isWalletConnected) {
      checkAllContractTokenBalances();
    }
  }, [showDevTools, isWalletConnected]);
  
  // Function to fund the contract with NOOT
  const fundContractWithNOOT = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsFunding(true);
      
      if (fundAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsFunding(false);
        return;
      }
      
      // Check balance
      if (parseFloat(actualNootBalance) < fundAmount) {
        toast.error(`Not enough NOOT tokens. You have ${actualNootBalance} NOOT`);
        setIsFunding(false);
        return;
      }
      
      console.log(`Preparing to fund contract with ${fundAmount} NOOT...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      // Setup contract instances
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      const nootContract = new Contract(nootAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const nootAmount = etherUtils.parseUnits(fundAmount.toString(), 18);
      
      // Step 1: Check allowance and approve if needed
      try {
        const currentAllowance = await nootContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < nootAmount) {
          console.log("Insufficient allowance, requesting approval...");
          toast.loading("Approving tokens...", { id: "approval-toast" });
          
          // Use a large approval amount to avoid frequent approvals
          const largeApprovalAmount = parseUnits("100000", 18);
          const approvalTx = await nootContract.approve(farmSwapAddress, largeApprovalAmount);
          
          console.log("Approval transaction submitted:", approvalTx.hash);
          setCurrentTx({
            hash: approvalTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          // Wait for confirmation
          const receipt = await approvalTx.wait();
          toast.dismiss("approval-toast");
          
          if (receipt.status !== 1) {
            throw new Error("Token approval failed");
          }
          
          toast.success("NOOT tokens approved for funding");
        }
      } catch (error: any) {
        toast.dismiss("approval-toast");
        console.error("Error approving tokens:", error);
        toast.error("Failed to approve tokens: " + (error.message || "Unknown error"));
        setIsFunding(false);
        return;
      }
      
      // Step 2: Execute funding
      try {
        toast.loading("Funding contract...", { id: "fund-toast" });
        
        // Use the fundNOOT function
        const tx = await swapContract.fundNOOT(
          nootAmount,
          { gasLimit: 1000000 }
        );
        
        console.log("Funding transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("fund-toast");
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchNootBalance(walletAddress);
          await checkContractBalance();
          
          toast.success(
            `Successfully funded contract with ${fundAmount} NOOT tokens!`,
            { duration: 5000 }
          );
        } else {
          throw new Error("Funding transaction failed");
        }
      } catch (error: any) {
        toast.dismiss("fund-toast");
        console.error("Error funding contract:", error);
        toast.error("Failed to fund contract: " + (error.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error in funding process:", error);
      toast.error("Funding process failed: " + (error.message || "Unknown error"));
    } finally {
      setIsFunding(false);
    }
  };
  
  // Function to fund the contract with any token
  const fundContractWithToken = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (selectedFundToken === "NOOT") {
      return fundContractWithNOOT();
    }
    
    try {
      setIsFunding(true);
      
      if (fundAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsFunding(false);
        return;
      }
      
      // Check if the user has enough of the selected token
      const tokenBalance = tokenBalances[selectedFundToken] || "0";
      if (parseFloat(tokenBalance) < fundAmount) {
        toast.error(`Not enough ${selectedFundToken} tokens. You have ${tokenBalance} ${selectedFundToken}`);
        setIsFunding(false);
        return;
      }
      
      console.log(`Preparing to fund contract with ${fundAmount} ${selectedFundToken}...`);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      // Setup contract instances
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedFundToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const tokenAmount = etherUtils.parseUnits(fundAmount.toString(), 18);
      
      // Step 1: Check allowance and approve if needed
      try {
        const currentAllowance = await tokenContract.allowance(walletAddress, farmSwapAddress);
        
        if (currentAllowance < tokenAmount) {
          console.log("Insufficient allowance, requesting approval...");
          toast.loading(`Approving ${selectedFundToken} tokens...`, { id: "approval-toast" });
          
          // Use a large approval amount to avoid frequent approvals
          const largeApprovalAmount = parseUnits("100000", 18);
          const approvalTx = await tokenContract.approve(farmSwapAddress, largeApprovalAmount);
          
          console.log("Approval transaction submitted:", approvalTx.hash);
          setCurrentTx({
            hash: approvalTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          // Wait for confirmation
          const receipt = await approvalTx.wait();
          toast.dismiss("approval-toast");
          
          if (receipt.status !== 1) {
            throw new Error("Token approval failed");
          }
          
          toast.success(`${selectedFundToken} tokens approved for funding`);
        }
      } catch (error: any) {
        toast.dismiss("approval-toast");
        console.error("Error approving tokens:", error);
        toast.error("Failed to approve tokens: " + (error.message || "Unknown error"));
        setIsFunding(false);
        return;
      }
      
      // Step 2: Execute funding
      try {
        toast.loading("Funding contract...", { id: "fund-toast" });
        
        // Use the fundToken function
        const tx = await swapContract.fundToken(
          selectedTokenAddress,
          tokenAmount,
          { gasLimit: 1000000 }
        );
        
        console.log("Funding transaction submitted:", tx.hash);
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        setShowTxDetails(true);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        toast.dismiss("fund-toast");
        
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Refresh balances
          await fetchAllTokenBalances();
          
          toast.success(
            `Successfully funded contract with ${fundAmount} ${selectedFundToken} tokens!`,
            { duration: 5000 }
          );
        } else {
          throw new Error("Funding transaction failed");
        }
      } catch (error: any) {
        toast.dismiss("fund-toast");
        console.error("Error funding contract:", error);
        toast.error("Failed to fund contract: " + (error.message || "Unknown error"));
      }
    } catch (error: any) {
      console.error("Error in funding process:", error);
      toast.error("Funding process failed: " + (error.message || "Unknown error"));
    } finally {
      setIsFunding(false);
    }
  };

  // Function to add a new token to the contract
  const addTokenToContract = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!newTokenAddress || newTokenAddress.length !== 42 || !newTokenAddress.startsWith('0x')) {
      toast.error("Please enter a valid token address");
      return;
    }
    
    if (newTokenExchangeRate <= 0) {
      toast.error("Exchange rate must be greater than 0");
      return;
    }
    
    try {
      setIsAddingToken(true);
      
      // Get provider based on wallet type
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      // Setup contract instance
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format the exchange rate - multiply by 1e18 for the contract
      const exchangeRateWei = etherUtils.parseUnits(newTokenExchangeRate.toString(), 18);
      
      // Add the token to the contract
      toast.loading("Adding token to contract...", { id: "add-token-toast" });
      
      // FIXED: NooterSwap.sol addToken only accepts tokenAddress (no exchange rate parameter)
      const tx = await swapContract.addToken(
        getChecksumAddress(newTokenAddress),
        { gasLimit: 1000000 }
      );
      
      console.log("Add token transaction submitted:", tx.hash);
      setCurrentTx({
        hash: tx.hash,
        status: "pending"
      });
      setShowTxDetails(true);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      toast.dismiss("add-token-toast");
      
      setCurrentTx(prev => ({
        ...prev,
        status: receipt && receipt.status === 1 ? "success" : "failed"
      }));
      
      if (receipt && receipt.status === 1) {
        toast.success("Token added successfully!");
        
        // Clear the input fields
        setNewTokenAddress("");
        setNewTokenExchangeRate(1);
        
        // Refresh contract token balances
        await checkAllContractTokenBalances();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      toast.dismiss("add-token-toast");
      console.error("Error adding token:", error);
      toast.error("Failed to add token: " + (error.message || "Unknown error"));
    } finally {
      setIsAddingToken(false);
    }
  };

  // Add useEffect to initialize token balances for all tokens
  useEffect(() => {
    // Initialize all tokens with zero balances 
    const initialTokenBalances: Record<string, string> = {};
    const initialContractBalances: Record<string, string> = {};
    
    // Get all tokens from TOKEN_ADDRESSES
    Object.keys(TOKEN_ADDRESSES).forEach(tokenKey => {
      initialTokenBalances[tokenKey] = "0";
      initialContractBalances[tokenKey] = "0";
    });
    
    setTokenBalances(initialTokenBalances);
    setContractTokenBalances(initialContractBalances);
    
    // Refresh balances if connected
    if (isWalletConnected && walletAddress) {
      fetchAllTokenBalances();
      checkAllContractTokenBalances();
    }
  }, [isWalletConnected, walletAddress]);
  
  // Add existing useEffect to recalculate expected output
  useEffect(() => {
    if (isWalletConnected && walletAddress && swapAmount > 0) {
      calculateExpectedOutput();
    }
  }, [isWalletConnected, walletAddress, swapAmount, selectedToken, swapDirection, contractTokenBalances]);

  // Add function to update all token exchange rates to 1:1
  const updateAllExchangeRatesToOneToOne = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Updating exchange rates...", { id: "update-rates-toast" });
      
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens except NOOT
      const tokensToUpdate = Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT");
      
      // Set exchange rate to 1:1 (1 ether)
      const oneToOneRate = etherUtils.parseUnits("1", 18);
      
      console.log(`Setting exchange rate to 1:1 (${formatUnits(oneToOneRate, 18)}) for all tokens...`);
      
      // Update each token's exchange rate
      for (const tokenKey of tokensToUpdate) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Updating exchange rate for ${tokenKey} (${tokenAddress})...`);
          
          // Update exchange rate to 1:1
          const tx = await swapContract.updateExchangeRate(tokenAddress, oneToOneRate, { gasLimit: 500000 });
          
          console.log(`Transaction submitted for ${tokenKey}: ${tx.hash}`);
          
          // Wait for confirmation
          await tx.wait();
          console.log(`Exchange rate updated for ${tokenKey}`);
        } catch (error) {
          console.error(`Error updating exchange rate for ${tokenKey}:`, error);
        }
      }
      
      toast.dismiss("update-rates-toast");
      toast.success("Exchange rates updated to 1:1 for all tokens");
      
      // Refresh exchange rates
      await handleManualRefresh();
    } catch (error) {
      console.error("Error updating exchange rates:", error);
      toast.dismiss("update-rates-toast");
      toast.error("Failed to update exchange rates");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add function to fund all tokens in the contract
  const fundAllTokensInContract = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Funding contract with tokens...", { id: "fund-toast" });
      
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens including NOOT
      const tokensToFund = Object.keys(TOKEN_ADDRESSES);
      
      // Amount to fund per token (1000 tokens)
      const fundAmount = etherUtils.parseUnits("1000", 18);
      
      console.log(`Funding contract with ${formatUnits(fundAmount, 18)} of each token...`);
      
      // Fund each token
      for (const tokenKey of tokensToFund) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          const tokenContract = new Contract(tokenAddress, TOKEN_ABI, signer);
          
          console.log(`Processing ${tokenKey} (${tokenAddress})...`);
          
          // Check user's balance
          const userBalance = await tokenContract.balanceOf(walletAddress);
          if (userBalance.lt(fundAmount)) {
            console.log(`Insufficient ${tokenKey} balance: ${formatUnits(userBalance, 18)}`);
            continue;
          }
          
          // First approve token spending
          console.log(`Approving ${tokenKey} for contract funding...`);
          const approveTx = await tokenContract.approve(farmSwapAddress, fundAmount);
          console.log(`Approval transaction submitted: ${approveTx.hash}`);
          await approveTx.wait();
          
          // Then fund the contract
          console.log(`Funding contract with ${tokenKey}...`);
          
          // Use the appropriate funding method based on token
          let fundTx;
          if (tokenKey === "NOOT") {
            fundTx = await swapContract.fundNOOT(fundAmount, { gasLimit: 500000 });
          } else {
            fundTx = await swapContract.fundToken(tokenAddress, fundAmount, { gasLimit: 500000 });
          }
          
          console.log(`Funding transaction submitted: ${fundTx.hash}`);
          await fundTx.wait();
          console.log(`Contract funded with ${tokenKey} successfully`);
        } catch (error) {
          console.error(`Error funding contract with ${tokenKey}:`, error);
        }
      }
      
      toast.dismiss("fund-toast");
      toast.success("Contract funding complete");
      
      // Refresh contract balances
      await checkAllContractTokenBalances();
    } catch (error) {
      console.error("Error funding contract:", error);
      toast.dismiss("fund-toast");
      toast.error("Failed to fund contract");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Add a function to register all tokens and set their exchange rates properly
  const registerAndConfigureAllTokens = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Registering and configuring all tokens...", { id: "configure-toast" });
      
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Get all tokens except NOOT
      const tokensToRegister = Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT");
      
      // Set exchange rate to 1:1 (1 ether)
      const oneToOneRate = etherUtils.parseUnits("1", 18);
      
      console.log(`Registering and configuring ${tokensToRegister.length} tokens...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each token
      for (const tokenKey of tokensToRegister) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Processing ${tokenKey} (${tokenAddress})...`);
          
          // First check if token is already registered
          const [isRegistered] = await swapContract.supportedTokens(tokenAddress).catch(() => [false]);
          
          // If not registered, register it
          if (!isRegistered) {
            console.log(`Registering ${tokenKey}...`);
            try {
              const registerTx = await swapContract.addToken(tokenAddress, oneToOneRate, { gasLimit: 500000 });
              console.log(`Registration transaction submitted: ${registerTx.hash}`);
              await registerTx.wait();
              console.log(`${tokenKey} registered successfully`);
            } catch (error) {
              console.error(`Error registering ${tokenKey}:`, error);
              errorCount++;
              continue; // Skip to next token on error
            }
          } else {
            console.log(`${tokenKey} is already registered`);
          }
          
          // Now update the exchange rate to 1:1
          console.log(`Updating exchange rate for ${tokenKey}...`);
          try {
            const updateTx = await swapContract.updateExchangeRate(tokenAddress, oneToOneRate, { gasLimit: 500000 });
            console.log(`Update exchange rate transaction submitted: ${updateTx.hash}`);
            await updateTx.wait();
            console.log(`${tokenKey} exchange rate updated successfully`);
            successCount++;
          } catch (error) {
            console.error(`Error updating exchange rate for ${tokenKey}:`, error);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing ${tokenKey}:`, error);
          errorCount++;
        }
      }
      
      toast.dismiss("configure-toast");
      
      if (errorCount === 0) {
        toast.success(`All ${successCount} tokens registered and configured successfully!`);
      } else {
        toast.success(`${successCount} tokens configured, ${errorCount} failed. Check console for details.`);
      }
      
      // Refresh balances and token information
      await handleManualRefresh();
      await checkAllContractTokenBalances();
    } catch (error) {
      console.error("Error registering and configuring tokens:", error);
      toast.dismiss("configure-toast");
      toast.error("Failed to register and configure tokens");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Update the AdminSettings component to include the new function
  const AdminSettings = () => (
    <div className="noot-settings-section border border-[#333] rounded p-4 mb-4">
      <h2 className="noot-settings-title font-bold mb-2">Admin Settings</h2>
      
      <div className="space-y-2">
        <div className="flex flex-col space-y-2">
          <button
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm"
            onClick={registerAndConfigureAllTokens}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Processing..." : "Register & Configure All Tokens"}
          </button>
          <button
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded text-sm"
            onClick={updateAllExchangeRatesToOneToOne}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Updating..." : "Update All Exchange Rates to 1:1"}
          </button>
          <button
            className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded text-sm"
            onClick={fundAllTokensInContract}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Processing..." : "Fund Contract with Tokens"}
          </button>
          <button
            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Token Data"}
          </button>
          <button
            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded text-sm"
            onClick={checkAllContractTokenBalances}
            disabled={isLoadingContractBalances}
          >
            {isLoadingContractBalances ? "Checking..." : "Refresh Contract Token Balances"}
          </button>
        </div>
      </div>
    </div>
  );

  // Add a direct token swap function that bypasses contract registration issues
  const directSwapWithTransfers = async () => {
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsMultiSwapLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsMultiSwapLoading(false);
        return;
      }
      
      const { provider: ethersProvider, isAGW } = await getEthersProvider();
      const signer = await ethersProvider.getSigner();
      
      // Setup contract instances
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Create contract instances
      const nootContract = new Contract(nootAddress, TOKEN_ABI, signer);
      const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Format amount with proper decimals
      const amount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      // Check balances based on swap direction
      if (swapDirection === 'noot-to-token') {
        // Check user NOOT balance
        if (parseFloat(actualNootBalance) < swapAmount) {
          toast.error(`Not enough NOOT tokens. You have ${actualNootBalance} NOOT`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Check contract token balance
        const contractOutputBalanceStr = contractTokenBalances[selectedToken] || "0";
        const contractOutputBalance = parseFloat(contractOutputBalanceStr);
        if (contractOutputBalance < swapAmount) {
          toast.error(`Contract has insufficient ${selectedToken} liquidity. Available: ${contractOutputBalance}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Step 1: Approve NOOT spending
        toast.loading("Approving NOOT transfer...", { id: "direct-swap-toast" });
        
        try {
          const currentAllowance = await nootContract.allowance(walletAddress, farmSwapAddress);
          if (currentAllowance < amount) {
            const approveTx = await nootContract.approve(farmSwapAddress, amount * BigInt(2));
            console.log("Approval transaction submitted:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval confirmed");
          } else {
            console.log("Sufficient allowance already exists");
          }
          
          // Step 2: Execute the swap directly through the contract
          toast.loading("Processing swap...", { id: "direct-swap-toast" });
          
          console.log("Executing swapNOOTForToken with params:", {
            tokenAddress: selectedTokenAddress,
            amount: amount.toString()
          });
          
          // FIXED: Use the correct contract function call matching the NooterSwap.sol contract
          const swapTx = await swapContract.swapNOOTForToken(
            selectedTokenAddress, // toTokenAddress
            amount, // amount
            { 
              gasLimit: 2000000,
              gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
            }
          );
          
          console.log("Swap transaction submitted:", swapTx.hash);
          setCurrentTx({
            hash: swapTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await swapTx.wait();
          toast.dismiss("direct-swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-bounce">✨</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                  <p className="text-sm text-white/90">Swapped {swapAmount} NOOT for {swapAmount} {selectedToken}</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '✅',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Refresh balances
            await fetchNootBalance(walletAddress);
            await handleManualRefresh();
          } else {
            throw new Error("Swap transaction failed");
          }
        } catch (error) {
          console.error("Direct swap error:", error);
          toast.dismiss("direct-swap-toast");
          
          const errorStr = String(error).toLowerCase();
          if (errorStr.includes("insufficient")) {
            if (errorStr.includes("liquidity")) {
              toast.error(`Swap failed: The contract doesn't have enough ${selectedToken} tokens.`);
            } else if (errorStr.includes("allowance")) {
              toast.error("Swap failed: Not enough allowance. Try approving more tokens.");
            } else if (errorStr.includes("balance")) {
              toast.error("Swap failed: Not enough NOOT tokens in your wallet.");
            } else {
              toast.error("Swap failed: Insufficient funds or gas.");
            }
          } else if (errorStr.includes("user denied")) {
            toast.error("Transaction was rejected in your wallet.");
          } else if (errorStr.includes("not supported")) {
            toast.error(`Swap failed: ${selectedToken} is not supported in the contract.`);
            toast.error(
              <div className="space-y-1">
                <p>The token needs to be registered in the contract first.</p>
                <p className="text-xs">Try using the "Add Token" function from the admin settings.</p>
              </div>
            );
          } else {
            toast.error("Swap failed. Please see console for details: " + String(error));
          }
          
          setCurrentTx(prev => ({
            ...prev,
            status: "failed"
          }));
        }
      } else {
        // TOKEN TO NOOT SWAP
        // Check user token balance
        const tokenBalance = tokenBalances[selectedToken] || "0";
        if (parseFloat(tokenBalance) < swapAmount) {
          toast.error(`Not enough ${selectedToken} tokens. You have ${tokenBalance} ${selectedToken}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        // Check contract NOOT balance
        const contractNootBalanceStr = contractTokenBalances.NOOT || "0";
        const contractNootBalance = parseFloat(contractNootBalanceStr);
        if (contractNootBalance < swapAmount) {
          toast.error(`Contract has insufficient NOOT liquidity. Available: ${contractNootBalance}`);
          setIsMultiSwapLoading(false);
          return;
        }
        
        try {
          // Step 1: Approve token spending
          toast.loading(`Approving ${selectedToken} transfer...`, { id: "direct-swap-toast" });
          
          const currentAllowance = await tokenContract.allowance(walletAddress, farmSwapAddress);
          if (currentAllowance < amount) {
            const approveTx = await tokenContract.approve(farmSwapAddress, amount * BigInt(2));
            console.log("Approval transaction submitted:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval confirmed");
          } else {
            console.log("Sufficient allowance already exists");
          }
          
          // Step 2: Execute the swap directly through the contract
          toast.loading("Processing swap...", { id: "direct-swap-toast" });
          
          console.log("Executing swapTokenForNOOT with params:", {
            tokenAddress: selectedTokenAddress,
            amount: amount.toString()
          });
          
          // FIXED: Make sure we're correctly calling the contract function
          const swapTx = await swapContract.swapTokenForNOOT(
            selectedTokenAddress, // fromTokenAddress
            amount, // amount
            { 
              gasLimit: 2000000,
              gasPrice: ethersProvider.getFeeData ? (await ethersProvider.getFeeData()).gasPrice : undefined
            }
          );
          
          console.log("Swap transaction submitted:", swapTx.hash);
          setCurrentTx({
            hash: swapTx.hash,
            status: "pending"
          });
          setShowTxDetails(true);
          
          const receipt = await swapTx.wait();
          toast.dismiss("direct-swap-toast");
          
          console.log("Transaction receipt:", receipt);
          
          setCurrentTx(prev => ({
            ...prev,
            status: receipt && receipt.status === 1 ? "success" : "failed"
          }));
          
          if (receipt && receipt.status === 1) {
            toast.success(
              <div className="flex items-center space-x-3 p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
                <span className="text-2xl animate-spin">🚀</span>
                <div>
                  <p className="font-bold text-white text-lg animate-pulse">SWAP COMPLETE!</p>
                  <p className="text-sm text-white/90">Swapped {swapAmount} {selectedToken} for {swapAmount} NOOT</p>
                </div>
              </div>,
              {
                duration: 4000,
                icon: '✅',
                style: {
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              }
            );
            
            // Refresh balances
            await fetchNootBalance(walletAddress);
            await handleManualRefresh();
          } else {
            throw new Error("Swap transaction failed");
          }
        } catch (error) {
          console.error("Direct swap error:", error);
          toast.dismiss("direct-swap-toast");
          
          const errorStr = String(error).toLowerCase();
          if (errorStr.includes("insufficient")) {
            if (errorStr.includes("liquidity")) {
              toast.error("Swap failed: The contract doesn't have enough NOOT tokens.");
            } else if (errorStr.includes("allowance")) {
              toast.error(`Swap failed: Not enough allowance. Try approving more ${selectedToken} tokens.`);
            } else if (errorStr.includes("balance")) {
              toast.error(`Swap failed: Not enough ${selectedToken} tokens in your wallet.`);
            } else {
              toast.error("Swap failed: Insufficient funds or gas.");
            }
          } else if (errorStr.includes("user denied")) {
            toast.error("Transaction was rejected in your wallet.");
          } else if (errorStr.includes("not supported")) {
            toast.error(`Swap failed: ${selectedToken} is not supported in the contract.`);
            toast.error(
              <div className="space-y-1">
                <p>The token needs to be registered in the contract first.</p>
                <p className="text-xs">Try using the "Add Token" function from the admin settings.</p>
              </div>
            );
          } else {
            toast.error("Swap failed. Please see console for details: " + String(error));
          }
          
          setCurrentTx(prev => ({
            ...prev,
            status: "failed"
          }));
        }
      }
    } catch (error) {
      console.error("Direct swap process error:", error);
      toast.dismiss("direct-swap-toast");
      toast.error("Swap process failed. Please try again later.");
    } finally {
      setIsMultiSwapLoading(false);
    }
  };
  
  // Update the multi-token swap UI to add the direct swap option
  const renderSwapButtons = () => (
    <div className="flex flex-col space-y-2">
      <button
        onClick={swapDirection === 'noot-to-token' ? swapNootForToken : swapTokenForNOOT}
        disabled={isMultiSwapLoading || swapAmount <= 0 || !isWalletConnected}
        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md font-medium transition"
      >
        {isMultiSwapLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="h-5 w-5 mr-2 animate-spin" />
            <span>Swapping...</span>
          </div>
        ) : (
          <span>
            Swap {swapAmount > 0 ? swapAmount : '0'} {swapDirection === 'noot-to-token' ? 'NOOT' : selectedToken} for {expectedOutputAmount ? expectedOutputAmount.toFixed(4) : '0'} {swapDirection === 'noot-to-token' ? selectedToken : 'NOOT'}
          </span>
        )}
      </button>
      
      <button
        onClick={directSwapWithTransfers}
        disabled={isMultiSwapLoading || swapAmount <= 0 || !isWalletConnected}
        className="w-full py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-md font-medium transition text-sm"
      >
        {isMultiSwapLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <span>
            Try Direct 1:1 Swap (Emergency Mode)
          </span>
        )}
      </button>
    </div>
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
                {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress?.length - 4)}
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
      
      {/* Add a prominent banner */}
      <div className="mb-4 bg-gradient-to-r from-purple-900 to-blue-900 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">Need $NOOT in your wallet?</span>
          <span className="text-xs text-gray-300">Add the token to your Web3 wallet</span>
        </div>
        <Button 
          onClick={addTokenToWallet}
          className="mt-2 sm:mt-0 bg-white text-purple-900 hover:bg-white/90 text-xs whitespace-nowrap"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add $NOOT to Wallet
        </Button>
      </div>
      
      {/* Add Token Visibility Section */}
      <div className="mb-4 bg-[#111] border border-[#333] p-3 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
          <div>
            <h3 className="text-sm font-bold">Token Visibility in Wallet</h3>
            <p className="text-xs text-white/60 mt-1">Make tokens visible in your wallet (e.g., MetaMask)</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button
              onClick={async () => {
                toast.loading("Adding tokens to wallet...");
                // Add each token one by one with slight delay
                for (const key of Object.keys(TOKEN_ADDRESSES)) {
                  if (key === "NOOT") {
                    await addTokenToWallet();
                  } else {
                    await addSelectedTokenToWallet(key);
                  }
                  // Small delay to avoid overwhelming the wallet
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                toast.dismiss();
                toast.success("All tokens have been added to your wallet!");
              }}
              className="text-xs bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add All Tokens to Wallet
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {Object.keys(TOKEN_ADDRESSES).map(key => (
            <Button
              key={key}
              onClick={() => key === "NOOT" ? addTokenToWallet() : addSelectedTokenToWallet(key)}
              variant="outline"
              className="h-auto py-1.5 border-[#333] hover:bg-[#222] flex items-center justify-center"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add {TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Add contract balance information */}
      <div className="mb-4 border border-[#333] p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/70">FarmSwap Contract NOOT Balance:</span>
          <span className="text-sm font-bold text-white">
            {Number(contractNootBalance).toLocaleString(undefined, {maximumFractionDigits: 2})} NOOT
          </span>
        </div>
        {Number(contractNootBalance) === 0 && (
          <p className="text-xs text-red-400 mt-1">
            ⚠️ Contract has no NOOT tokens. Please contact admin to fund the contract.
          </p>
        )}
      </div>
      
      <div className="wallet-info mb-4">
        <div className="text-sm text-white/60 flex justify-between">
          <span>NOOT Balance:</span> 
          <span>{isWalletConnected ? actualNootBalance : nootBalance}</span>
        </div>
        <div className="text-sm text-white/60 flex justify-between">
          <span>Farm Coins:</span>
          <span>{farmCoins}</span>
        </div>
        
        {/* Token info and explorer links */}
        {isWalletConnected && (
          <div className="mt-3 text-xs grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-[#333] flex items-center justify-center gap-1 hover:bg-blue-900/20"
              onClick={() => viewOnExplorer("token", NOOT_TOKEN_ADDRESS)}
            >
              <ExternalLink className="h-3 w-3" />
              View Token
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-[#333] flex items-center justify-center gap-1 hover:bg-blue-900/20"
              onClick={() => {
                if (walletAddress) {
                  viewOnExplorer("address", walletAddress);
                }
              }}
            >
              <ExternalLink className="h-3 w-3" />
              View Wallet
            </Button>
          </div>
        )}
      </div>
      
     
      
      {/* Swap interface: NOOT to Farm Coins */}
      <div className="border border-[#333] p-4 bg-[#111] mb-4">
        <h3 className="text-white mb-3 flex justify-between items-center">
          <span>Swap NOOT for Farm Coins</span>
          <Button 
            onClick={handleManualRefresh}
            size="sm"
            variant="outline"
            className="h-8 border-[#333] text-xs flex gap-1 items-center"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isRefreshing ? "Updating..." : "Refresh"}
          </Button>
        </h3>
        
        <div>
          <div className="text-sm text-white/60 mb-1">Amount to Swap</div>
          <div className="noot-swap-input-container mb-3">
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setSwapAmount(isNaN(value) ? 0 : value);
                setError("");
              }}
              min="0"
              className="noot-swap-input noot-text"
            />
            <div className="noot-swap-token">
              <span>NOOT</span>
              <span className="text-xs opacity-60">Balance: {isWalletConnected ? actualNootBalance : "0"}</span>
            </div>
          </div>
          
          <div className="flex justify-center my-3">
            <ArrowDown className="text-blue-500" />
          </div>
          
          <div className="noot-swap-output-container mb-4">
            <div className="noot-swap-output">
              {swapAmount * 10}
            </div>
            <div className="noot-swap-token">
              <span>Farm Coins</span>
              <span className="text-xs opacity-60">Current: {farmCoins}</span>
            </div>
          </div>
          
          {error && (
            <div className="p-2 mb-4 bg-red-900/20 border border-red-800/40 rounded text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
        
        <Button
          onClick={swapNOOTForFarmCoins}
          className="w-full mb-2 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading || !isWalletConnected || parseFloat(actualNootBalance) < swapAmount}
        >
          {isLoading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {!isWalletConnected ? "Connect Wallet First" : 
           parseFloat(actualNootBalance) < swapAmount ? "Insufficient NOOT Balance" :
           `Swap ${swapAmount} NOOT for ${swapAmount * 10} Farm Coins`}
        </Button>
      </div>
      
      {/* NEW: Swap Farm Coins for NOOT */}
      <div className="border border-[#333] p-4 bg-[#111] mb-4">
        <h3 className="text-white mb-3">Swap Farm Coins for NOOT</h3>
        
        {/* Contract balance warning */}
        {Number(contractNootBalance) < 10 && (
          <div className="p-2 mb-3 bg-red-900/30 border border-red-800 rounded text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 font-semibold">Warning: Contract Low on NOOT</span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              The swap contract has only {Number(contractNootBalance).toFixed(2)} NOOT tokens available.
              Swaps might fail if there are insufficient tokens.
            </p>
          </div>
        )}
        
        <div>
          <div className="text-sm text-white/60 mb-1">Farm Coins to Swap</div>
          <div className="noot-swap-input-container mb-3">
            <Input 
              type="number"
              min="10"
              step="10"
              value={farmToNootAmount}
              onChange={(e) => setFarmToNootAmount(Number(e.target.value))}
              className="noot-swap-input"
            />
            <div className="noot-swap-token-info">
              <span>Farm Coins</span>
              <span className="text-xs opacity-60">Balance: {farmCoins}</span>
            </div>
          </div>
          
          <div className="flex justify-center my-3">
            <ArrowDown className="text-purple-500" />
          </div>
          
          <div className="text-sm text-white/60 mb-1">NOOT to Receive</div>
          <div className="noot-swap-output-container mb-4">
            <div className="noot-swap-output">
              {(farmToNootAmount / 10).toFixed(2)}
            </div>
            <div className="noot-swap-token-info">
              <span>NOOT</span>
              <span className="text-xs opacity-60">Balance: {isWalletConnected ? actualNootBalance : "0"}</span>
            </div>
          </div>
          
          {farmToNootError && (
            <div className="p-2 mb-4 bg-red-900/20 border border-red-800/40 rounded text-sm text-red-400">
              {farmToNootError}
            </div>
          )}
          
          <Button
            onClick={swapFarmCoinsForNOOT}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={isFarmToNootLoading || !isWalletConnected || Number(contractNootBalance) < farmToNootAmount / 10}
          >
            {isFarmToNootLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {!isWalletConnected ? "Connect Wallet First" : 
             Number(contractNootBalance) < farmToNootAmount / 10 ? "Insufficient Contract Balance" :
             `Swap ${farmToNootAmount} Farm Coins for ${(farmToNootAmount / 10).toFixed(2)} NOOT`}
          </Button>
        </div>
      </div>
      
      
      
      {/* Transaction Details Dialog */}
      <Dialog open={showTxDetails} onOpenChange={setShowTxDetails}>
        <DialogContent className="bg-[#111] border border-[#333] text-white">
          <DialogHeader>
            <DialogTitle className="text-white noot-title">Transaction Details</DialogTitle>
            <DialogDescription className="text-white/60 noot-text">
              Your swap transaction information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Transaction Hash</div>
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs bg-black p-2 border border-[#333] flex-1 overflow-hidden text-ellipsis text-white/80" title={currentTx.hash}>
                  {currentTx.hash.substring(0, 10)}...{currentTx.hash.substring(currentTx.hash.length - 8)}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2 border-[#333] text-white/80"
                  onClick={() => {
                    navigator.clipboard.writeText(currentTx.hash);
                    toast.success("Transaction hash copied to clipboard");
                  }}
                >
                  Copy
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-2 border-[#333] text-white/80"
                  onClick={() => {
                    window.open(`${ABSTRACT_BLOCK_EXPLORER}/tx/${currentTx.hash}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Status</div>
              <div className={`text-sm px-3 py-1.5 rounded inline-flex items-center transition-all duration-300
                ${currentTx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 animate-pulse' : 
                  currentTx.status === 'success' ? 'bg-green-500/20 text-green-300 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30' : 
                  'bg-red-500/20 text-red-300'}`}
              >
                {currentTx.status === 'pending' ? (
                  <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : currentTx.status === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 mr-2" />
                )}
                {currentTx.status.charAt(0).toUpperCase() + currentTx.status.slice(1)}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowTxDetails(false)}
              className="w-full bg-white text-black hover:bg-white/90 noot-text"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Developer debug panel - hidden in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-8 border border-[#333] p-4 bg-[#111] rounded-lg">
          <h3 className="text-white mb-3 flex items-center gap-2">
            <span className="text-xs bg-yellow-600 text-black font-mono px-2 py-0.5 rounded">DEBUG</span> 
            <span>Developer Tools</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) return;
                
                try {
                  let ethersProvider;
                  
                  if (activeWallet === WALLET_OPTIONS.AGW && abstractClient) {
                    if (window.ethereum) {
                      ethersProvider = getProvider(window.ethereum);
                    } else {
                      toast.error("No provider available");
                      return;
                    }
                  } else {
                    ethersProvider = getProvider(provider);
                  }
                  
                  const signer = await ethersProvider.getSigner();
                  const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
                  const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, ethersProvider);
                  const name = await nootContract.name();
                  const symbol = await nootContract.symbol();
                  toast.success(`Token info: ${name} (${symbol})`);
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to get token info");
                }
              }}
              className="bg-blue-900 hover:bg-blue-800 text-xs"
              size="sm"
            >
              Test NOOT Contract
            </Button>
            
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) return;
                
                try {
                  let ethersProvider;
                  let signer;
                  
                  if (activeWallet === WALLET_OPTIONS.AGW && abstractClient) {
                    if (window.ethereum) {
                      ethersProvider = getProvider(window.ethereum);
                      signer = await ethersProvider.getSigner();
                    } else {
                      toast.error("No provider available");
                      return;
                    }
                  } else {
                    ethersProvider = getProvider(provider);
                    signer = await ethersProvider.getSigner();
                  }
                  
                  const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, ethersProvider);
                  const nootAddr = await swapContract.nootToken();
                  const checksummedNootAddr = getChecksumAddress(nootAddr);
                  toast.success(`FarmSwap linked to NOOT at: ${checksummedNootAddr}`);
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to get FarmSwap info");
                }
              }}
              className="bg-blue-900 hover:bg-blue-800 text-xs"
              size="sm"
            >
              Test FarmSwap Contract
            </Button>
            
            <Button 
              onClick={debugContractConfig}
              className="bg-red-800 hover:bg-red-700 text-xs col-span-2"
              size="sm"
            >
              Debug Contract Setup
            </Button>
            
            <Button
              onClick={async () => {
                const provider = getCurrentProvider();
                if (!provider) {
                  toast.error("Please connect a wallet");
                  return;
                }
                
                try {
                  let ethersProvider;
                  let signer;
                  let walletAddr;
                  
                  if (activeWallet === WALLET_OPTIONS.AGW && abstractClient) {
                    if (!window.ethereum) {
                      toast.error("No provider available for funding");
                      return;
                    }
                    
                    ethersProvider = getProvider(window.ethereum);
                    signer = await ethersProvider.getSigner();
                    walletAddr = address;
                  } else {
                    ethersProvider = getProvider(provider);
                    signer = await ethersProvider.getSigner();
                    const accounts = await provider.request({ method: 'eth_requestAccounts' });
                    walletAddr = accounts[0];
                  }
                  
                  if (!walletAddr) {
                    toast.error("Could not determine wallet address");
                    return;
                  }
                  
                  // Create NOOT contract instance
                  const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
                  const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
                  
                  // Get current balance
                  const currentBalance = await nootContract.balanceOf(walletAddr);
                  const formattedBalance = etherUtils.formatUnits(currentBalance, 18);
                  
                  // Ask how much to fund
                  const inputAmount = prompt(`Current balance: ${formattedBalance} NOOT\nHow many NOOT tokens do you want to fund to the contract?`, "100");
                  if (!inputAmount) return;
                  
                  const amount = parseFloat(inputAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error("Please enter a valid amount");
                    return;
                  }
                  
                  // Convert to wei
                  const weiAmount = etherUtils.parseUnits(amount.toString(), 18);
                  
                  // Get the contract address
                  const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  
                  // Direct transfer instead of using fundNOOT function
                  toast.success("Sending tokens to FarmSwap contract...");
                  
                  // Transfer directly to the contract
                  const tx = await nootContract.transfer(checksummedFarmSwapAddress, weiAmount, {
                    gasLimit: 200000
                  });
                  
                  // Wait for confirmation
                  toast.success("Transaction submitted, waiting for confirmation...");
                  const receipt = await tx.wait();
                  
                  if (receipt.status === 1) {
                    toast.success(`Successfully sent ${amount} NOOT to the contract!`);
                    
                    // Fetch new balances to keep UI in sync
                    fetchNootBalance(walletAddr);
                    checkContractBalance();
                    
                    // Fetch balance of the contract for immediate feedback
                    const contractBalance = await nootContract.balanceOf(checksummedFarmSwapAddress);
                    const formattedContractBalance = etherUtils.formatUnits(contractBalance, 18);
                    
                    toast.success(`Contract now has ${formattedContractBalance} NOOT`);
                  } else {
                    toast.error("Transaction failed");
                  }
                } catch (error: any) {
                  console.error("Fund error:", error);
                  toast.error(
                    <div className="space-y-1">
                      <p>Failed to fund contract</p>
                      <p className="text-xs">{error.message?.slice(0, 100) || "Unknown error"}</p>
                    </div>
                  );
                }
              }}
              className="bg-purple-800 hover:bg-purple-700 text-xs"
              size="sm"
            >
              Fund Contract
            </Button>
          </div>
          
          <p className="text-xs text-white/60 mb-3">
            Use these tools to deploy and interact with the NOOT token and FarmSwap contracts directly.
            You can deploy a fresh NOOT token, fund the contract, and check contract statuses.
          </p>
        </div>
      )}
      
      {/* Update the multi-token swap section */}
      <div className="noot-swap-section mb-4">
        <h2 className="noot-swap-title flex items-center">
          <span>Multi-Token Swap</span>
          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 text-white rounded">NEW</span>
        </h2>
        
        <div className="p-4 border border-[#333] rounded mb-4">
          <div className="flex flex-col space-y-4">
            {/* Add swap direction toggle */}
            <div className="flex justify-center mb-2">
              <div className="bg-[#222] rounded p-1 flex">
                <button 
                  className={`px-3 py-1 rounded ${swapDirection === 'noot-to-token' ? 'bg-purple-600' : 'hover:bg-[#333]'}`}
                  onClick={() => {
                    setSwapDirection('noot-to-token');
                    // Recalculate expected output when direction changes
                    setTimeout(() => calculateExpectedOutput(), 100);
                  }}
                >
                  NOOT → Token
                </button>
                <button 
                  className={`px-3 py-1 rounded ${swapDirection === 'token-to-noot' ? 'bg-blue-600' : 'hover:bg-[#333]'}`}
                  onClick={() => {
                    setSwapDirection('token-to-noot');
                    // Recalculate expected output when direction changes
                    setTimeout(() => calculateExpectedOutput(), 100);
                  }}
                >
                  Token → NOOT
                </button>
              </div>
            </div>
            
            {/* Token Selector */}
            <div>
              <label className="text-sm text-white/70 mb-1 block flex justify-between items-center">
                <span>{swapDirection === 'noot-to-token' ? 'Select Target Token' : 'Select Source Token'}</span>
                <Button
                  onClick={() => swapDirection === 'noot-to-token' 
                    ? addSelectedTokenToWallet() 
                    : addTokenToWallet()}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-[#333] hover:bg-[#222] flex items-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add {swapDirection === 'noot-to-token' ? selectedToken : 'NOOT'} to Wallet
                </Button>
              </label>
              <div 
                className="flex items-center justify-between p-2 bg-[#222] border border-[#333] rounded cursor-pointer"
                onClick={() => setShowTokenSelector(!showTokenSelector)}
              >
                <div className="flex items-center">
                  <span>{TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}</span>
                </div>
                <ArrowDownUp className="h-4 w-4 text-white/60" />
              </div>
              
              {showTokenSelector && (
                <div className="mt-1 border border-[#333] bg-[#171717] rounded max-h-40 overflow-y-auto">
                  {Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT").map((key) => (
                    <div 
                      key={key}
                      className={`p-2 hover:bg-[#222] cursor-pointer ${selectedToken === key ? "bg-[#222]" : ""}`}
                      onClick={() => {
                        setSelectedToken(key);
                        setShowTokenSelector(false);
                        // Recalculate expected output when token changes
                        setTimeout(() => calculateExpectedOutput(), 100);
                      }}
                    >
                      <span>{TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Input */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                {swapDirection === 'noot-to-token' ? 'NOOT to Swap' : `${selectedToken} to Swap`}
              </label>
              <div className="flex items-center border border-[#333] bg-[#111] rounded overflow-hidden">
                <input
                  type="number"
                  value={swapAmount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setSwapAmount(isNaN(value) ? 0 : value);
                  }}
                  className="flex-1 bg-[#111] border-none px-3 py-2 text-white focus:outline-none"
                />
                <div className="px-3 py-2 bg-[#222]">
                  {swapDirection === 'noot-to-token' ? 'NOOT' : selectedToken}
                </div>
              </div>
              <div className="text-xs text-white/60 mt-1">
                Balance: {swapDirection === 'noot-to-token' ? actualNootBalance : parseFloat(tokenBalances[selectedToken] || "0").toFixed(2)}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowDown className="text-white/60" />
            </div>
            
            {/* Output */}
            <div>
              <label className="text-sm text-white/70 mb-1 block">
                {swapDirection === 'noot-to-token' ? `${selectedToken} to Receive` : 'NOOT to Receive'}
              </label>
              <div className="p-3 border border-[#333] bg-[#191919] rounded text-center">
                <div className="font-medium">{expectedOutputAmount || swapAmount} {swapDirection === 'noot-to-token' ? selectedToken : 'NOOT'}</div>
                <div className="text-xs text-white/40">(estimated)</div>
              </div>
            </div>
            
            {/* Swap Button */}
            <Button 
              onClick={swapDirection === 'noot-to-token' ? swapNootForToken : swapTokenForNOOT}
              className={`w-full ${swapDirection === 'noot-to-token' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={
                isMultiSwapLoading || 
                !isWalletConnected || 
                (swapDirection === 'noot-to-token' 
                  ? parseFloat(actualNootBalance) < swapAmount 
                  : parseFloat(tokenBalances[selectedToken] || "0") < swapAmount)
              }
            >
              {isMultiSwapLoading ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {!isWalletConnected ? "Connect Wallet First" : 
               swapDirection === 'noot-to-token' 
                ? (parseFloat(actualNootBalance) < swapAmount 
                    ? "Insufficient NOOT Balance" 
                    : `Swap NOOT for ${TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}`)
                : (parseFloat(tokenBalances[selectedToken] || "0") < swapAmount 
                    ? `Insufficient ${selectedToken} Balance` 
                    : `Swap ${TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken} for NOOT`)
              }
            </Button>
            
            {/* Token Faucet Button */}
            <Button
              onClick={async () => {
                if (!isWalletConnected || !walletAddress) {
                  toast.error("Please connect your wallet first");
                  return;
                }
                
                try {
                  setIsGettingTestTokens(true);
                  
                  const { provider: ethersProvider } = await getEthersProvider();
                  const signer = await ethersProvider.getSigner();
                  
                  // Switch to Abstract Testnet if needed
                  await switchToAbstractTestnet();
                  
                  // Create contract instance
                  const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
                  
                  let tx;
                  if (swapDirection === 'noot-to-token' || selectedToken === 'NOOT') {
                    // Get test NOOT tokens
                    const nootAmount = etherUtils.parseUnits("10", 18); // 10 NOOT
                    toast.loading("Claiming NOOT test tokens...");
                    tx = await swapContract.claimTestNOOT(nootAmount);
                  } else {
                    // Get test selected tokens
                    const tokenAmount = etherUtils.parseUnits("5", 18); // 5 tokens
                    const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
                    toast.loading(`Claiming ${selectedToken} test tokens...`);
                    tx = await swapContract.claimTestTokens(tokenAddress, tokenAmount, { gasLimit: 500000 });
                  }
                  
                  await tx.wait();
                  toast.dismiss();
                  
                  // Update balances
                  await fetchNootBalance(walletAddress);
                  
                  toast.success(`Test tokens claimed successfully!`);
                } catch (error: any) {
                  toast.dismiss();
                  console.error("Error claiming test tokens:", error);
                  toast.error(error.message || "Failed to claim test tokens");
                } finally {
                  setIsGettingTestTokens(false);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isGettingTestTokens || !isWalletConnected}
            >
              {isGettingTestTokens ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Coins className="h-4 w-4 mr-2" />
              )}
              Get Test {swapDirection === 'noot-to-token' ? 'NOOT' : selectedToken}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Contract Transaction Details */}
      {showTxDetails && (
        <div className="mt-4 p-3 border border-[#333] rounded bg-[#111] text-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Transaction Details</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => setShowTxDetails(false)}
            >
              <span>×</span>
            </Button>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white/60">Status:</span>
              <span className={`${currentTx.status === 'pending' ? 'text-yellow-500' : 
                                    currentTx.status === 'success' ? 'text-green-500' : 
                                    'text-red-500'}`}>
                {currentTx.status.charAt(0).toUpperCase() + currentTx.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60">Hash:</span>
              <a 
                href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${currentTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline truncate max-w-[180px]"
              >
                {currentTx.hash.substring(0, 10)}...{currentTx.hash.substring(currentTx.hash.length - 8)}
              </a>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 p-0 px-1"
                onClick={() => navigator.clipboard.writeText(currentTx.hash)}
              >
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dev Tools Section */}
      <div className="mt-8 border-t border-[#333] pt-4">
        <button
          onClick={() => setShowDevTools(!showDevTools)}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <span className={`transform transition-transform ${showDevTools ? 'rotate-90' : ''}`}>▶</span>
          Developer Tools
        </button>
        
        {showDevTools && (
          <div className="mt-4 p-4 border border-[#333] rounded bg-[#111]">
            <h3 className="font-semibold mb-4 flex items-center">
              <span>Contract Funding Tools</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">DEV ONLY</span>
            </h3>
            
            {/* Contract Token Balances */}
            <div className="mb-4 p-3 border border-[#333] rounded bg-[#191919]">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Contract Token Balances</h4>
                <Button 
                  size="sm"
                  variant="outline"
                  className="h-6 p-1 text-xs bg-transparent border-[#444]"
                  onClick={checkAllContractTokenBalances}
                  disabled={isLoadingContractBalances}
                >
                  {isLoadingContractBalances ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="text-white/60">
                    <tr>
                      <th className="text-left py-1">Token</th>
                      <th className="text-right py-1">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(contractTokenBalances).length > 0 ? (
                      Object.keys(contractTokenBalances).map(token => (
                        <tr key={token} className="border-t border-[#333]">
                          <td className="py-1">{TOKEN_INFO[token as keyof typeof TOKEN_INFO]?.symbol || token}</td>
                          <td className="py-1 text-right">
                            {parseFloat(contractTokenBalances[token]).toFixed(4)}
                          </td>
                        </tr>
                      ))
                    ) : isLoadingContractBalances ? (
                      <tr>
                        <td colSpan={2} className="py-2 text-center text-white/40">
                          Loading balances...
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-2 text-center text-white/40">
                          No token balances found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Token Selector */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">
                  Select Token to Fund
                </label>
                <select
                  className="w-full bg-[#222] border border-[#333] rounded p-2 text-white"
                  value={selectedFundToken}
                  onChange={(e) => setSelectedFundToken(e.target.value)}
                >
                  {Object.keys(TOKEN_ADDRESSES).map((token) => (
                    <option key={token} value={token}>
                      {TOKEN_INFO[token as keyof typeof TOKEN_INFO]?.symbol || token}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="text-sm text-white/70 mb-1 block">
                  Amount to Fund
                </label>
                <div className="flex items-center border border-[#333] bg-[#111] rounded overflow-hidden">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setFundAmount(isNaN(value) ? 0 : value);
                    }}
                    className="flex-1 bg-[#111] border-none px-3 py-2 text-white focus:outline-none"
                    placeholder="Enter amount"
                  />
                  <div className="px-3 py-2 bg-[#222]">
                    {selectedFundToken}
                  </div>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Current Balance: {selectedFundToken === "NOOT" ? 
                    actualNootBalance : 
                    parseFloat(tokenBalances[selectedFundToken] || "0").toFixed(2)}
                </div>
              </div>
              
              {/* Fund Button */}
              <Button 
                onClick={fundContractWithToken}
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isFunding || !isWalletConnected}
              >
                {isFunding ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Funding...
                  </>
                ) : (
                  <>
                    Fund Contract with {selectedFundToken}
                  </>
                )}
              </Button>
              
              {/* Info Box */}
              <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-500">
                <p>⚠️ Developer tools: Use these functions to add liquidity to the contract for token swaps. This allows users to swap between tokens.</p>
                <p className="mt-1">A token must be both supported and have sufficient liquidity for swaps to work.</p>
              </div>
            </div>
            
            {/* Token Registration Section */}
            <div className="mt-6 pt-4 border-t border-[#333]">
              <h4 className="font-medium mb-4">Register New Token</h4>
              
              <div className="space-y-4">
                {/* Token Address Input */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    Token Contract Address
                  </label>
                  <input
                    type="text"
                    value={newTokenAddress}
                    onChange={(e) => setNewTokenAddress(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0x..."
                  />
                </div>
                
                {/* Exchange Rate Input */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    Exchange Rate (1 Token = X NOOT)
                  </label>
                  <input
                    type="number"
                    value={newTokenExchangeRate}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setNewTokenExchangeRate(isNaN(value) ? 1 : value);
                    }}
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter exchange rate"
                    step="0.1"
                    min="0.1"
                  />
                  <div className="text-xs text-white/60 mt-1">
                    Example: Setting 2.5 means 1 Token = 2.5 NOOT
                  </div>
                </div>
                
                {/* Add Token Button */}
                <Button 
                  onClick={addTokenToContract}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isAddingToken || !isWalletConnected || !newTokenAddress}
                >
                  {isAddingToken ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Adding Token...
                    </>
                  ) : (
                    <>
                      Register Token to Contract
                    </>
                  )}
                </Button>
                
                {/* Info about token registration */}
                <div className="p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-400">
                  <p>ℹ️ Once a token is registered, it can be funded and used for swaps.</p>
                  <p className="mt-1">Make sure the token follows the ERC-20 standard with 18 decimals.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <AdminSettings />
      <div className="mt-4">
        {renderSwapButtons()}
      </div>
    </div>
  );
};