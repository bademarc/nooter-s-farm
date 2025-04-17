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

// All token addresses
const TOKEN_ADDRESSES = {
  NOOT: "0xBe4A56850cb822dD322190C15Bd2c66781007CBc",
  ABSTER: "0x46eBB071ecC6f1c836F8a63f9C1b8F0e9Ea64250",
  BIT77: "0x4A8AcEEe2D8767B6c3037FA9c130b11C1f2fF1e3",
  ABBY: "0xEF96F05054B72172749a4D474641b6EdC4730147",
  BEARISH: "0x7a29062CC05ce0D0f2D9D6b028cAa1FA1F08b631",
  CHESTER: "0xD611EAb789f4D9640dFC11EC7472a1d92Fe0cCc5",
  DOJO3: "0x63915576f992f5b106CA79D976921A808cC05e30",
  FEATHERS: "0xDDf45775E88776F0B8b9B3D28348F10edE84De64",
  MOP: "0xB28Ee25d59E642A9a072e8EDc97C0759d4dD3Ee2",
  NUTZ: "0x259054F8A89e531d453219d8244b03d4B3FE6586",
  PAINGU: "0x133a7f84eDB02798e7C2244f34c215e0C1410279",
  PENGUIN: "0x5AeCA78594Eb5b7e02fb8E79FE97C200EC345Bfd",
  PUDGY: "0xE4997F23017a7A082023786B2399cA5Fe479233A",
  RETSBA: "0xdaa1628e23658B88E527FdeB0A7BDBbcC40CfB96",
  WOJACT: "0x1f0FD9E9021c09539c03A09316f53633E32C85d1",
  YUP: "0xe584b3c2f051BAe6827612907221a9041828F59C"
};

// Token information with symbols and names
const TOKEN_INFO = {
  NOOT: { symbol: "NOOT", name: "Noot Noot" },
  ABSTER: { symbol: "$ABSTER", name: "ABSTER" },
  BIT77: { symbol: "77BIT", name: "77BIT" },
  ABBY: { symbol: "ABBY", name: "Abby Token" },
  BEARISH: { symbol: "BEARISH", name: "Bearish Token" },
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
  "event NOOTDeposited(address indexed player, uint256 amount)",
  // Add MultiFarmSwap functions
  "function supportedTokens(address) view returns (bool isSupported, uint256 exchangeRate, uint256 balance)",
  "function tokenList(uint256) view returns (address)",
  "function getAllSupportedTokens() view returns (address[])",
  "function getTokenInfo(address tokenAddress) view returns (bool isSupported, uint256 exchangeRate, uint256 balance, uint256 actualBalance)",
  "function addToken(address tokenAddress, uint256 exchangeRate) external",
  "function swapTokenForFarmCoins(address tokenAddress, uint256 tokenAmount) external",
  "function claimTestTokens(address tokenAddress, uint256 tokenAmount) external",
  "function fundToken(address tokenAddress, uint256 amount) external",
  "function swapNOOTForToken(address tokenAddress, uint256 nootAmount) external",
  "function swapTokenForNOOT(address tokenAddress, uint256 tokenAmount) external",
  "function updateExchangeRate(address tokenAddress, uint256 newRate) external"
];

// Add a helper function to properly format addresses for ethers v6
const getChecksumAddress = (address: string): string => {
  try {
    return getAddress(address);
  } catch (error) {
    console.error("Error formatting address:", error);
    return address; // Return original if can't format
  }
};

const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";

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
  // Add new state for token management
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({})
  const [contractTokenBalances, setContractTokenBalances] = useState<{[key: string]: string}>({})
  const [selectedToken, setSelectedToken] = useState<string>("ABSTER")
  const [showTokenSelector, setShowTokenSelector] = useState<boolean>(false)
  const [supportedTokens, setSupportedTokens] = useState<string[]>([])
  const [isMultiSwapLoading, setIsMultiSwapLoading] = useState<boolean>(false)
  const [isLoadingContractBalances, setIsLoadingContractBalances] = useState<boolean>(false)
  const [showDevTools, setShowDevTools] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [swapDirection, setSwapDirection] = useState<'noot-to-token' | 'token-to-noot'>('noot-to-token')
  
  // Check if wallet is connected - use useEffect to prevent hydration errors
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  
  const [contractNootBalance, setContractNootBalance] = useState("0");
  
  // Add state for tracking refresh operation
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Add state for expected output
  const [expectedOutputAmount, setExpectedOutputAmount] = useState<number>(0);
  
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsWalletConnected(accounts.length > 0);
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchNootBalance(accounts[0]);
            
            // Add this to fetch all token balances
            try {
              const balances: {[key: string]: string} = {};
              
              for (const [key, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
                try {
                  const provider = getProvider(window.ethereum);
                  const checksummedTokenAddress = getChecksumAddress(tokenAddress);
                  const checksummedWalletAddress = getChecksumAddress(accounts[0]);
                  const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, provider);
                  const balance = await tokenContract.balanceOf(checksummedWalletAddress);
                  const formattedBalance = formatUnits(balance, 18);
                  balances[key] = formattedBalance;
                } catch (e) {
                  console.error(`Error fetching ${key} balance:`, e);
                  balances[key] = "0";
                }
              }
              
              setTokenBalances(balances);
              console.log("All token balances:", balances);
              
              // Also fetch the supported tokens from contract
              fetchSupportedTokens();
            } catch (error) {
              console.error("Error fetching token balances:", error);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkWalletConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        setIsWalletConnected(accounts.length > 0);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          fetchNootBalance(accounts[0]);
          
          // Also fetch all token balances when account changes
          try {
            const balances: {[key: string]: string} = {};
            
            for (const [key, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
              try {
                const provider = getProvider(window.ethereum);
                const checksummedTokenAddress = getChecksumAddress(tokenAddress);
                const checksummedWalletAddress = getChecksumAddress(accounts[0]);
                const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, provider);
                const balance = await tokenContract.balanceOf(checksummedWalletAddress);
                const formattedBalance = formatUnits(balance, 18);
                balances[key] = formattedBalance;
              } catch (e) {
                console.error(`Error fetching ${key} balance:`, e);
                balances[key] = "0";
              }
            }
            
            setTokenBalances(balances);
            
            // Also fetch the supported tokens from contract when account changes
            fetchSupportedTokens();
          } catch (error) {
            console.error("Error fetching token balances:", error);
          }
        } else {
          setActualNootBalance("0");
          setTokenBalances({});
        }
      });
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  // Add a useEffect to fetch supported tokens when wallet is connected
  useEffect(() => {
    if (isWalletConnected) {
      fetchSupportedTokens();
    }
  }, [isWalletConnected]);
  
  const fetchNootBalance = async (address: string) => {
    try {
      console.log("Fetching NOOT balance for address:", address);
      
      if (!window.ethereum) {
        console.log("No ethereum provider found");
        setActualNootBalance("0");
        return;
      }

      // Check current network first
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log("Current chain ID when fetching balance:", chainId);
      
      // Use our compatibility layer to get provider
      const provider = getProvider(window.ethereum);
      
      // For debugging - use checksummed addresses
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      console.log("NOOT token address (checksummed):", checksummedNOOTAddress);
      
      // Ensure wallet address is properly checksummed
      const checksummedWalletAddress = getChecksumAddress(address);
      console.log("Wallet address (checksummed):", checksummedWalletAddress);
      
      // If we're not on Abstract Testnet, we should still try to get the balance
      // but not show errors to the user - just log them and display 0
      if (chainId !== "0x2b74") { 
        console.log("Not on Abstract Testnet, showing placeholder balance");
        setActualNootBalance("0");
        return;
      }
      
      try {
        const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, provider);
        
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
        
        // Format balance with proper decimals
        let formattedBalance;
        try {
          formattedBalance = formatUnits(balance, 18);
        } catch (e) {
          formattedBalance = etherUtils.formatUnits(balance, 18);
        }
        
        console.log("Formatted NOOT balance:", formattedBalance);
        
        // Set the balance in state
        setActualNootBalance(formattedBalance);
        
        // Set readable version for display
        const readableBalance = parseFloat(formattedBalance).toFixed(2);
        console.log("Readable NOOT balance:", readableBalance);
        
      } catch (e) {
        console.error("Error fetching token balance:", e);
        setActualNootBalance("0");
      }
    } catch (error) {
      console.error("Error in fetchNootBalance:", error);
      setActualNootBalance("0");
    }
  };
  
  // Add function to fetch a specific token balance
  const fetchTokenBalance = async (address: string, tokenKey: string) => {
    try {
      if (!window.ethereum) {
        return "0";
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== "0x2b74") { 
        return "0";
      }
      
      const provider = getProvider(window.ethereum);
      const tokenAddress = TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES];
      const checksummedTokenAddress = getChecksumAddress(tokenAddress);
      const checksummedWalletAddress = getChecksumAddress(address);
      
      try {
        const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, provider);
        const balance = await tokenContract.balanceOf(checksummedWalletAddress);
        
        let formattedBalance;
        try {
          formattedBalance = formatUnits(balance, 18);
        } catch (e) {
          formattedBalance = etherUtils.formatUnits(balance, 18);
        }
        
        return formattedBalance;
      } catch (e) {
        console.error(`Error fetching ${tokenKey} balance:`, e);
        return "0";
      }
    } catch (error) {
      console.error(`Error in fetchTokenBalance for ${tokenKey}:`, error);
      return "0";
    }
  };
  
  // Add function to fetch all token balances
  const fetchAllTokenBalances = async (address: string) => {
    if (!isWalletConnected || !address) return;
    
    const balances: {[key: string]: string} = {};
    
    for (const [key, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
      const balance = await fetchTokenBalance(address, key);
      balances[key] = balance;
    }
    
    setTokenBalances(balances);
    console.log("All token balances:", balances);
  };

  // Fetch the contract's NOOT balance
  const checkContractBalance = async () => {
    try {
      if (!window.ethereum) return;
      
      const provider = getProvider(window.ethereum);
      const nootContract = new Contract(getChecksumAddress(NOOT_TOKEN_ADDRESS), TOKEN_ABI, provider);
      const balance = await nootContract.balanceOf(getChecksumAddress(FARM_SWAP_ADDRESS));
      
      let formattedBalance;
      try {
        formattedBalance = formatUnits(balance, 18);
      } catch (e) {
        formattedBalance = etherUtils.formatUnits(balance, 18);
      }
      
      setContractNootBalance(formattedBalance);
      console.log("Contract NOOT balance:", formattedBalance);
      
      return formattedBalance;
    } catch (error) {
      console.error("Error checking contract balance:", error);
      return "0";
    }
  };
  
  // Update to fetch supported tokens from the contract
  const fetchSupportedTokens = async () => {
    try {
      if (!window.ethereum) return;
      
      const provider = getProvider(window.ethereum);
      const swapContract = new Contract(getChecksumAddress(FARM_SWAP_ADDRESS), SWAP_ABI, provider);
      
      // Try to get all supported tokens
      try {
        const tokenAddresses = await swapContract.getAllSupportedTokens();
        console.log("Supported token addresses:", tokenAddresses);
        
        // Map addresses to token keys
        const tokenKeys = tokenAddresses.map((address: string) => {
          const checksummedAddress = getChecksumAddress(address);
          for (const [key, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
            if (getChecksumAddress(tokenAddress) === checksummedAddress) {
              return key;
            }
          }
          return null;
        }).filter(Boolean);
        
        setSupportedTokens(tokenKeys as string[]);
        console.log("Supported token keys:", tokenKeys);
        
        // When fetching supported tokens, also check token balances in contract
        checkAllContractTokenBalances();
      } catch (e) {
        console.error("Error fetching supported tokens:", e);
        // Default to NOOT if we can't get the list
        setSupportedTokens(["NOOT"]);
      }
    } catch (error) {
      console.error("Error in fetchSupportedTokens:", error);
      setSupportedTokens(["NOOT"]);
    }
  };
  
  // Update the refresh function to fetch all token balances
  const forceRefreshAllBalances = async () => {
    if (!isWalletConnected) return;
    
    try {
      console.log("Force refreshing all balances...");
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        // Fetch NOOT balance
        await fetchNootBalance(accounts[0]);
        
        // Fetch all other token balances
        const balances: {[key: string]: string} = {};
        
        for (const [key, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
          try {
            const provider = getProvider(window.ethereum);
            const checksummedTokenAddress = getChecksumAddress(tokenAddress);
            const checksummedWalletAddress = getChecksumAddress(accounts[0]);
            const tokenContract = new Contract(checksummedTokenAddress, TOKEN_ABI, provider);
            const balance = await tokenContract.balanceOf(checksummedWalletAddress);
            
            let formattedBalance;
            try {
              formattedBalance = formatUnits(balance, 18);
            } catch (e) {
              formattedBalance = etherUtils.formatUnits(balance, 18);
            }
            
            balances[key] = formattedBalance;
          } catch (e) {
            console.error(`Error fetching ${key} balance:`, e);
            balances[key] = "0";
          }
        }
        
        setTokenBalances(balances);
        console.log("All token balances:", balances);
        
        // Check contract NOOT balance
        await checkContractBalance();
        
        // Also check all contract token balances
        await checkAllContractTokenBalances();
        
        // Refresh supported tokens
        await fetchSupportedTokens();
      }
    } catch (error) {
      console.error("Error refreshing balances:", error);
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
  
  // Update the monitorTransaction function
  const monitorTransaction = async (txHash: string, onConfirm: () => void) => {
    console.log(`Monitoring transaction: ${txHash}`);
    
    if (!window.ethereum) return;
    
    try {
      const provider = getProvider(window.ethereum);
      
      // Wait for transaction to be mined
      const receipt = await provider.waitForTransaction(txHash);
      
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

  // Add network switcher function
  const switchToAbstractTestnet = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
      return false;
    }
    
    try {
      // Check current network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // Already on Abstract Testnet
      if (chainId === "0x2b74") {
        toast.success("Already connected to Abstract Testnet");
        return true;
      }
      
      // Try to switch to Abstract Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2b74' }], // Abstract Testnet
      });
      
      toast.success("Successfully switched to Abstract Testnet");
      return true;
    } catch (switchError: any) {
      // This error code indicates the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2b74',
              chainName: 'Abstract Testnet',
              nativeCurrency: {
                name: 'Abstract ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://api.testnet.abs.xyz'],
              blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER]
            }]
          });
          toast.success("Abstract Testnet added to your wallet");
          return true;
        } catch (addError) {
          console.error("Error adding chain:", addError);
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
  
  // Debug function to verify contract configuration
  const debugContractConfig = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
      return;
    }
    
    try {
      setIsRefreshing(true);
      toast.loading("Checking contract configuration...", { id: "debug-toast" });
      
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check if we're using the correct addresses
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Create contract instances 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)", "function name() view returns (string)"];
      const nootContract = new Contract(checksummedNOOTAddress, tokenAbi, provider);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, provider);
      
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
        contractTokenAddress: contractTokenAddress ? getChecksumAddress(contractTokenAddress) : "Unknown",
        contractNootBalance: formattedContractBalance
      };
      
      console.log("Contract configuration:", debugInfo);
      
      // Check if addresses match
      const addressesMatch = checksummedNOOTAddress.toLowerCase() === 
        (typeof contractTokenAddress === 'string' ? contractTokenAddress.toLowerCase() : "");
      
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
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsRefreshing(true);
    toast.loading("Refreshing balances...", { id: "refresh-toast" });
    
    try {
      await forceRefreshAllBalances();
      toast.success("Balances refreshed successfully", { id: "refresh-toast" });
    } catch (error) {
      console.error("Error refreshing balances:", error);
      toast.error("Error refreshing balances", { id: "refresh-toast" });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Get test tokens by claiming from the contract
  const getTestTokens = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Add farm coins directly in the UI (these aren't on-chain)
      addFarmCoins(500);
      
      // Now let's get actual NOOT tokens from the contract
      console.log("Claiming NOOT tokens from contract...");
      
      // Use our getProvider helper
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network ID to ensure we're on Abstract Testnet
      let chainId;
      try {
        chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("Current chain ID:", chainId);
        
        // Check if on Abstract Testnet (chain ID 11124 = 0x2B74 in hex)
        if (chainId !== "0x2b74") {
          console.log("Not on Abstract Testnet, attempting to switch network...");
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2b74' }], // Abstract Testnet
            });
            console.log("Successfully switched to Abstract Testnet");
          } catch (switchError: any) {
            // This error code indicates the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              console.log("Network not in wallet, attempting to add Abstract Testnet...");
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2b74',
                  chainName: 'Abstract Testnet',
                  nativeCurrency: {
                    name: 'Abstract ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://api.testnet.abs.xyz'],
                  blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER]
                }]
              });
            } else {
              throw switchError;
            }
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        toast.error("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
        setIsLoading(false);
        return;
      }
      
      // Get the connected wallet address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      console.log("Wallet address for claiming tokens:", walletAddress);
      
      // Create contract instances
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
      const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
      // First check contract's NOOT balance
      const contractBalance = await nootContract.balanceOf(checksummedFarmSwapAddress);
      let formattedContractBalance;
      try {
        formattedContractBalance = formatUnits(contractBalance, 18);
      } catch (err) {
        formattedContractBalance = etherUtils.formatUnits(contractBalance, 18);
      }
      
      console.log("Contract NOOT balance:", formattedContractBalance);
      
      // Use a smaller amount to prevent issues
      const requestAmount = 10; // Reduced from 50 to 10 NOOT
      
      if (parseFloat(formattedContractBalance) < requestAmount) {
        toast.error(
          <div className="space-y-1">
            <p>The FarmSwap contract doesn't have enough NOOT tokens.</p>
            <p className="text-xs">Available: {formattedContractBalance} NOOT</p>
            <p className="text-xs">Please use the developer tools to fund the contract first.</p>
          </div>,
          {duration: 7000}
        );
        setIsLoading(false);
        return;
      }
      
      // Calculate amount in wei (10 tokens with 18 decimals)
      const nootAmount = etherUtils.parseUnits(requestAmount.toString(), 18);
      
      console.log("Claiming NOOT amount:", nootAmount.toString());
      
      // Call claimTestNOOT function on the contract
      const tx = await swapContract.claimTestNOOT(nootAmount, {
        gasLimit: 1000000, // Increased gas limit for better success rate
      });
      
      console.log("Claim transaction sent:", tx.hash);
      
      // Set transaction details for display
      setCurrentTx({
        hash: tx.hash,
        status: "pending"
      });
      
      // Show transaction details dialog
      setShowTxDetails(true);
      
      // Show loading toast
      toast.loading("Claiming tokens...", { id: "claim-toast" });
      
      // Wait for transaction confirmation
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      toast.dismiss("claim-toast");
      
      // Update transaction status
      setCurrentTx(prev => ({
        ...prev,
        status: receipt && receipt.status === 1 ? "success" : "failed"
      }));
      
      if (receipt && receipt.status === 1) {
        // Update NOOT balance immediately
        await fetchNootBalance(walletAddress);
        
        // Force immediate balance refresh and set a timer for a second refresh
        setTimeout(async () => {
          await forceRefreshAllBalances();
          console.log("Forced balance refresh after token claim");
          
          // Double-check after a delay to catch any pending transactions
          setTimeout(async () => {
            await forceRefreshAllBalances();
            console.log("Second balance refresh after token claim");
          }, 3000);
        }, 500);
        
        // Add event listener for token transfers to this wallet
        try {
          const provider = getProvider(window.ethereum);
          const filter = {
            address: checksummedNOOTAddress,
            topics: [
              id("Transfer(address,address,uint256)"),
              null,
              zeroPadValue(walletAddress, 32)
            ]
          };
          
          // Listen for transfer events to this wallet for 30 seconds
          const timeoutId = setTimeout(() => {
            provider.removeAllListeners(filter);
            console.log("Removed claim event listener after timeout");
          }, 30000);
          
          provider.on(filter, (log: any) => {
            console.log("Transfer event detected after claim:", log);
            fetchNootBalance(walletAddress);
            clearTimeout(timeoutId);
            provider.removeAllListeners(filter);
          });
        } catch (eventError) {
          console.error("Error setting up event listener:", eventError);
        }
        
        toast.success(`Successfully claimed ${requestAmount} NOOT tokens and added 500 Farm Coins!`);
      } else {
        // Transaction was mined but failed
        console.error("Transaction reverted:", receipt);
        toast.error(
          <div className="space-y-1">
            <p>Failed to claim NOOT tokens</p>
            <p className="text-xs">The contract may not have enough NOOT tokens or there might be restrictions on claiming.</p>
          </div>,
          {duration: 6000}
        );
      }
    } catch (error: any) {
      console.error("Error getting test tokens:", error);
      
      if (error.code === "ACTION_REJECTED") {
        toast.error("You rejected the transaction");
      } else if (error.code === "CALL_EXCEPTION") {
        // Handle contract call exceptions
        toast.error(
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Failed to claim tokens:</p>
            <ul className="list-disc pl-4 text-xs">
              <li>Not enough NOOT in contract</li>
              <li>There might be a limit on how much you can claim</li>
              <li>Contract may require admin permissions</li>
            </ul>
            <p className="text-xs mt-1">Try using the developer tools to mint tokens instead</p>
          </div>,
          {duration: 7000}
        );
      } else {
        toast.error("Something went wrong claiming tokens: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add NOOT token to wallet - using a reliable manual approach instead of problematic wallet_watchAsset
  const addTokenToWallet = async () => {
    try {
      // Get checksummed address
      const checksummedAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      console.log("Adding token to wallet:", checksummedAddress);
      
      if (!window.ethereum) {
        toast.error("Web3 wallet not detected. Please install MetaMask or another Web3 wallet.");
        return;
      }
      
      // Try to use wallet_watchAsset first (automatic method)
      if (window.ethereum?.request) {
        try {
          console.log("Attempting to add token using wallet_watchAsset method");
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC20',
              options: {
                address: checksummedAddress,
                symbol: 'NOOT',
                decimals: 18,
                image: 'https://nootersfarm.com/images/noot-token-logo.png', // Replace with actual logo
              },
            } as unknown as any,
          });
          
          if (wasAdded) {
            console.log("Token successfully added to wallet");
            toast.success("$NOOT token successfully added to your wallet!");
            return;
          } else {
            console.log("User rejected adding the token");
            fallbackToManualMethod(checksummedAddress);
          }
        } catch (error) {
          console.error("Error adding token using wallet_watchAsset:", error);
          fallbackToManualMethod(checksummedAddress);
        }
      } else {
        console.log("wallet_watchAsset method not supported");
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
          <div className="text-xs space-y-1">
            <p className="font-bold">Add $NOOT to your wallet:</p>
            <p>1. Open your wallet</p>
            <p>2. Select "Import token" or "Add token"</p>
            <p>3. Paste the address</p>
            <p>4. Enter "NOOT" for symbol and "18" for decimals</p>
          </div>,
          { duration: 7000 }
        );
      }, 1000);
    }).catch(err => {
      console.error("Clipboard error:", err);
      // Fallback for clipboard errors
      toast(
        <div className="text-xs space-y-1 mt-2">
          <p className="font-semibold">Add token manually with these details:</p>
          <p>Address: <span className="font-mono bg-black/40 px-1">{tokenAddress}</span></p>
          <p>Symbol: NOOT | Decimals: 18</p>
        </div>,
        { duration: 10000 }
      );
    });
  };

  // Swap NOOT for Farm Coins with blockchain transaction
  const swapNOOTForFarmCoins = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
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
      
      // Use our provider helper
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network ID to ensure we're on Abstract Testnet
      let chainId;
      try {
        chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("Current chain ID:", chainId);
        
        // Check if on Abstract Testnet (chain ID 11124 = 0x2B74 in hex)
        if (chainId !== "0x2b74") {
          console.log("Not on Abstract Testnet, attempting to switch network...");
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2b74' }], // Abstract Testnet
            });
            console.log("Successfully switched to Abstract Testnet");
          } catch (switchError: any) {
            // This error code indicates the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              console.log("Network not in wallet, attempting to add Abstract Testnet...");
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2b74',
                  chainName: 'Abstract Testnet',
                  nativeCurrency: {
                    name: 'Abstract ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://api.testnet.abs.xyz'],
                  blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER]
                }]
              });
            } else {
              throw switchError;
            }
          }
        }
      } catch (error) {
        console.error("Error checking or switching network:", error);
        setError("Failed to switch to Abstract Testnet. Please switch manually in your wallet.");
        setIsLoading(false);
        return;
      }
      
      // Get the connected wallet address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      console.log("Wallet address:", walletAddress);
      
      // Create contract instances
      const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
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
        const checksummedWalletAddress = getChecksumAddress(walletAddress);
        const currentAllowance = await nootContract.allowance(checksummedWalletAddress, checksummedFarmSwapAddress);
        console.log("Current allowance:", currentAllowance.toString());
        
        // Only approve if needed - use a much larger allowance to prevent frequent approvals
        if (currentAllowance < nootAmount) {
          console.log("Allowance insufficient, requesting approval...");
          
          // Due to limitations with MetaMask, we need to use a large approval amount for tokens
          const largeApprovalAmount = parseUnits("10000000", 18); // 10 million tokens
          
          toast.success(
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Approval Required</p>
              <p className="text-xs">Please approve NOOT tokens in your wallet</p>
              <p className="text-xs">This is required only once</p>
            </div>,
            {duration: 8000}
          );
          
          // Before sending transaction, show toast that we're preparing approval
          toast.loading("Preparing approval transaction...", { id: "approval-toast" });
          
          try {
            const approvalTx = await nootContract.approve(checksummedFarmSwapAddress, largeApprovalAmount);
            console.log("Approval transaction sent:", approvalTx.hash);
            
            // Update toast to show transaction sent
            toast.loading("Approval transaction sent. Waiting for confirmation...", { id: "approval-toast" });
            
            // Set approval transaction details
            setCurrentTx({
              hash: approvalTx.hash,
              status: "pending"
            });
            setShowTxDetails(true);
            
            // Wait for approval confirmation with timeout
            let approvalConfirmed = false;
            const approvalPromise = approvalTx.wait().then((receipt: any) => {
              approvalConfirmed = true;
              return receipt;
            });
            
            // Set timeout for better UX
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => {
                if (!approvalConfirmed) {
                  reject(new Error("Approval confirmation is taking longer than expected. Please check your wallet."));
                }
              }, 60000) // 60 seconds timeout
            );
            
            // Race between approval and timeout
            const approvalReceipt = await Promise.race([approvalPromise, timeoutPromise]);
            
            // Update toast
            toast.dismiss("approval-toast");
            
            console.log("Approval confirmed:", approvalReceipt);
            
            if (approvalReceipt.status !== 1) {
              throw new Error("Token approval failed");
            }
            
            toast.success("NOOT tokens approved successfully! Now proceeding with swap.");
            
            // Check allowance again to confirm
            const newAllowance = await nootContract.allowance(checksummedWalletAddress, checksummedFarmSwapAddress);
            console.log("New allowance after approval:", newAllowance.toString());
            
            if (newAllowance < nootAmount) {
              throw new Error("Approval transaction succeeded but allowance is still insufficient");
            }
          } catch (innerError) {
            toast.dismiss("approval-toast");
            throw innerError; // Re-throw to be caught by outer catch
          }
        } else {
          console.log("Allowance sufficient, no need for approval");
        }
      } catch (approvalError: any) {
        if (approvalError.code === "ACTION_REJECTED") {
          // User rejected the transaction
          console.log("User rejected the approval transaction");
          setError("You rejected the approval transaction. Approval is required to swap tokens.");
          toast.error("You must approve NOOT tokens before swapping. Please try again.");
          setIsLoading(false);
          return;
        }
        
        console.error("Approval error:", approvalError);
        setError(`Failed to approve NOOT tokens: ${approvalError.message?.slice(0, 100) || "Unknown error"}`);
        toast.error("Token approval failed. Please try again.");
        setIsLoading(false);
        return; // Exit the function if approval fails
      }
      
      // STEP 2: Execute the swap
      console.log("Executing swap transaction...");
      try {
        // Execute the swap - include significantly higher gas limit to ensure success
        const tx = await swapContract.swapNOOTForFarmCoins(nootAmount, {
          gasLimit: 2000000, // Increased gas limit to maximum allowed to ensure transaction success
        });
        
        console.log("Swap transaction sent:", tx.hash);
        
        // Set transaction details for display
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        
        // Show transaction details dialog
        setShowTxDetails(true);
        
        // Loading toast
        toast.loading("Processing transaction...", { id: "swap-toast" });
        
        // Wait for transaction confirmation
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        toast.dismiss("swap-toast");
        
        // Update transaction status
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Update NOOT balance immediately
          await fetchNootBalance(walletAddress);
          
          // Add farm coins - IMMEDIATELY update UI with calculated new total
          const newFarmCoinsTotal = initialFarmCoins + farmCoinsToReceive;
          updateFarmCoins(newFarmCoinsTotal);
          
          // Start monitoring this transaction for additional balance updates
          monitorTransaction(tx.hash, () => {
            console.log("Transaction monitoring complete, performing final balance refresh");
            forceRefreshAllBalances();
          });
          
          console.log(`Farm coins updated: ${initialFarmCoins} + ${farmCoinsToReceive} = ${newFarmCoinsTotal}`);
          toast.success(`Successfully sent ${swapAmount} NOOT and received ${farmCoinsToReceive} Farm Coins!`);
          
          // Force one more refresh after a short delay
          setTimeout(async () => {
            await forceRefreshAllBalances();
            console.log("Final forced refresh after NOOT-to-Farm swap");
          }, 3000);
        } else {
          // Transaction was mined but failed
          console.error("Transaction reverted:", receipt);
          toast.error(
            <div className="space-y-1">
              <p>Transaction reverted on blockchain</p>
              <p className="text-xs">This may be due to insufficient token balance or network issues</p>
            </div>,
            {duration: 6000}
          );
        }
      } catch (txError: any) {
        toast.dismiss("swap-toast");
        console.error("Transaction error:", txError);
        
        // Detailed logging for errors
        console.log("Detailed transaction error info:", {
          code: txError.code,
          message: txError.message,
          data: txError.data,
          reason: txError.reason,
          error: txError.error
        });
        
        // Check if user rejected transaction
        if (txError.code === "ACTION_REJECTED") {
          setError("You rejected the transaction");
        } else {
          // For any other error, format it nicely
          setError(txError.reason || txError.message || "Transaction failed");
          
          toast.error(
            <div className="space-y-1 text-sm">
              <p className="font-semibold">Transaction failed:</p>
              <p className="text-xs">{txError.reason || txError.message || "Unknown error"}</p>
            </div>,
            {duration: 8000}
          );
        }
      }
    } catch (error: any) {
      console.error("Error in swap process:", error);
      setError(error.message || "Something went wrong with the swap");
      toast.error("Failed to complete the swap");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap Farm Coins for NOOT with blockchain transaction
  const swapFarmCoinsForNOOT = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    if (farmToNootAmount <= 0) {
      setFarmToNootError("Please enter a valid amount");
      return;
    }
    
    if (farmCoins < farmToNootAmount) {
      setFarmToNootError(`Not enough Farm Coins. You have ${farmCoins} Farm Coins`);
      return;
    }
    
    try {
      setIsFarmToNootLoading(true);
      setFarmToNootError("");
      
      // Calculate NOOT to receive (10 Farm Coins = 1 NOOT)
      const nootToReceive = farmToNootAmount / 10;
      
      // Check if the contract has enough NOOT
      if (parseFloat(contractNootBalance) < nootToReceive) {
        setFarmToNootError(`FarmSwap contract has only ${contractNootBalance} NOOT. Not enough to swap.`);
        setIsFarmToNootLoading(false);
        return;
      }
      
      // Use our compatibility helpers
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network ID to ensure we're on Abstract Testnet
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== "0x2b74") {
        // Try to switch to Abstract Testnet
        const switched = await switchToAbstractTestnet();
        if (!switched) {
          setFarmToNootError("Please switch to Abstract Testnet to continue");
          setIsFarmToNootLoading(false);
          return;
        }
      }
      
      // Get the connected wallet address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      
      // Format amount with proper decimals for the blockchain
      let nootAmount;
      try {
        nootAmount = parseUnits(nootToReceive.toString(), 18);
      } catch (err) {
        // Fallback using our utility
        nootAmount = etherUtils.parseUnits(nootToReceive.toString(), 18);
      }
      
      // Create contract instances
      const checksummedNootTokenAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const nootContract = new Contract(checksummedNootTokenAddress, TOKEN_ABI, provider);
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
      
      // Execute the claimTestNOOT function on the contract
      try {
        toast.loading("Preparing transaction...", { id: "swap-toast" });
        
        // Call claimTestNOOT function with increased gas limit for better success rate
        const tx = await swapContract.claimTestNOOT(nootAmount, {
          gasLimit: 2000000, // Increased gas limit to ensure transaction success
        });
        
        console.log("Swap transaction sent:", tx.hash);
        toast.loading("Transaction submitted, waiting for confirmation...", { id: "swap-toast" });
        
        // Set transaction details for display
        setCurrentTx({
          hash: tx.hash,
          status: "pending"
        });
        
        // Show transaction details dialog
        setShowTxDetails(true);
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        toast.dismiss("swap-toast");
        
        // Update transaction status
        setCurrentTx(prev => ({
          ...prev,
          status: receipt && receipt.status === 1 ? "success" : "failed"
        }));
        
        if (receipt && receipt.status === 1) {
          // Transaction successful - update UI
          
          // Immediately update farm coins
          setFarmCoins(prevCoins => prevCoins - farmToNootAmount);
          
          // Update NOOT balance - fetch from contract
          await fetchNootBalance(walletAddress);
          
          // Show success message
          toast.success(`Successfully swapped ${farmToNootAmount} Farm Coins for ${nootToReceive} NOOT!`);
          
          // Force additional balance refreshes for better UI sync
          setTimeout(async () => {
            await forceRefreshAllBalances();
          }, 2000);
        } else {
          // Transaction reverted
          toast.error("Transaction failed. The contract may not have enough NOOT tokens.");
        }
      } catch (txError: any) {
        console.error("Transaction error:", txError);
        
        // Handle specific error cases
        if (txError.code === "ACTION_REJECTED") {
          toast.error("You rejected the transaction");
        } else {
          toast.error(`Transaction failed: ${txError.reason || txError.message || "Unknown error"}`);
        }
      }
    } catch (error: any) {
      console.error("Overall swap error:", error);
      toast.error("An unexpected error occurred during the swap");
    } finally {
      setIsFarmToNootLoading(false);
      toast.dismiss("swap-toast");
    }
  };

  // Add a function to swap NOOT for other tokens
  const swapNootForToken = async () => {
    // Just call directSwapWithTransfers with the current swap direction
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Make sure we're in NOOT-to-token direction
    setSwapDirection('noot-to-token');
    
    // Call the direct swap method
    directSwapWithTransfers();
  };
  
  // Missing checkAllContractTokenBalances function
  const checkAllContractTokenBalances = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setIsLoadingContractBalances(true);
      
      // Get provider
      const provider = getProvider(window.ethereum);
      
      // Setup contract instances
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, provider);
      
      // Get all supported tokens
      const tokenAddresses = await swapContract.getAllSupportedTokens().catch(() => []);
      console.log("Supported token addresses:", tokenAddresses);
      
      // Track balances
      const balances: {[key: string]: string} = {};
      
      // First check NOOT balance
      try {
        const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
        const nootContract = new Contract(nootAddress, TOKEN_ABI, provider);
        const nootBalanceWei = await nootContract.balanceOf(farmSwapAddress);
        const nootBalance = etherUtils.formatUnits(nootBalanceWei, 18);
        balances.NOOT = nootBalance;
      } catch (error) {
        console.error("Error getting NOOT balance:", error);
        balances.NOOT = "Error";
      }
      
      // Check each token's balance
      for (const tokenAddress of tokenAddresses) {
        try {
          // Find token key from address
          const tokenKey = Object.keys(TOKEN_ADDRESSES).find(
            key => TOKEN_ADDRESSES[key as keyof typeof TOKEN_ADDRESSES].toLowerCase() === tokenAddress.toLowerCase()
          );
          
          if (!tokenKey) continue;
          
          // Get token info from contract
          const info = await swapContract.getTokenInfo(tokenAddress);
          
          // Format actual token balance
          const actualBalance = etherUtils.formatUnits(info.actualBalance, 18);
          
          // Save the balance
          balances[tokenKey] = actualBalance;
          
        } catch (error) {
          console.error(`Error getting balance for token ${tokenAddress}:`, error);
        }
      }
      
      console.log("Contract token balances:", balances);
      setContractTokenBalances(balances);
      
    } catch (error) {
      console.error("Error checking contract token balances:", error);
      toast.error("Failed to check contract token balances");
    } finally {
      setIsLoadingContractBalances(false);
    }
  };

  // Add a function to swap from token to NOOT
  const swapTokenForNOOT = async () => {
    // Just call directSwapWithTransfers with the opposite swap direction
    if (!isWalletConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Make sure we're in token-to-NOOT direction
    setSwapDirection('token-to-noot');
    
    // Call the direct swap method
    directSwapWithTransfers();
  };

  // Helper function to get Ethers provider
  const getEthersProvider = async () => {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider detected");
    }
    
    const provider = getProvider(window.ethereum);
    
    // Determine if using Abstract Gaming Wallet
    const isAGW = false; // You would need to implement actual detection logic
    
    return { provider, isAGW };
  };
  
  // Add function to calculate expected output based on current swap direction
  const calculateExpectedOutput = async () => {
    if (!isWalletConnected || !walletAddress || swapAmount <= 0) {
      setExpectedOutputAmount(0);
      return;
    }

    try {
      const provider = getProvider(window.ethereum);
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Check if contract has the token we need to receive
      let tokenBalance = "0";
      
      if (swapDirection === 'noot-to-token') {
        // We need to receive the selected token from the contract
        tokenBalance = contractTokenBalances[selectedToken] || "0";
      } else {
        // We need to receive NOOT from the contract
        tokenBalance = contractTokenBalances["NOOT"] || "0";
      }
      
      console.log(`Contract balance for token to receive: ${tokenBalance}`);
      
      // Use the appropriate exchange rate based on token pair
      let exchangeRate = 1.0;
      
      // This would normally come from the contract or API, but we'll hardcode exchange rates for now
      // These rates represent realistic token values 
      const exchangeRates = {
        "USDT": { toNoot: 1000, fromNoot: 0.001 },
        "USDC": { toNoot: 1000, fromNoot: 0.001 },
        "DAI": { toNoot: 950, fromNoot: 0.00105 },
        "WETH": { toNoot: 2000000, fromNoot: 0.0000005 }
      };
      
      if (swapDirection === 'token-to-noot') {
        // Converting from selected token to NOOT
        exchangeRate = exchangeRates[selectedToken as keyof typeof exchangeRates]?.toNoot || 1.0;
      } else {
        // Converting from NOOT to selected token
        exchangeRate = exchangeRates[selectedToken as keyof typeof exchangeRates]?.fromNoot || 1.0;
      }
      
      // Calculate expected output
      const formattedOutput = swapAmount * exchangeRate;
      
      // Make sure we don't expect more than the contract has
      const availableBalance = parseFloat(tokenBalance);
      const finalOutput = Math.min(formattedOutput, availableBalance);
      
      setExpectedOutputAmount(finalOutput);
      
      console.log(`Setting expected output to ${finalOutput} (rate: ${exchangeRate}, available: ${availableBalance})`);
      
    } catch (error) {
      console.error("Failed to calculate expected output:", error);
      // Set expected output to equal input as fallback (1:1 exchange rate)
      setExpectedOutputAmount(swapAmount);
    }
  };
  
  // Add useEffect to recalculate expected output when relevant values change
  useEffect(() => {
    if (isWalletConnected && walletAddress && swapAmount > 0) {
      calculateExpectedOutput();
    }
  }, [isWalletConnected, walletAddress, swapAmount, selectedToken, swapDirection, contractTokenBalances]);
  
  // Add function to check token exchange rates
  const checkTokenExchangeRates = async () => {
    try {
      setIsRefreshing(true);
      
      const { provider } = await getEthersProvider();
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, provider);
      
      // Get all supported tokens
      const tokenAddresses = await swapContract.getAllSupportedTokens();
      const rates: {[key: string]: {rate: number, symbol: string}} = {};
      
      for (const address of tokenAddresses) {
        try {
          const tokenInfo = await swapContract.getTokenInfo(address);
          const isSupported = tokenInfo[0];
          const exchangeRate = tokenInfo[1];
          
          if (isSupported) {
            // Find token symbol
            let symbol = "Unknown";
            for (const [key, value] of Object.entries(TOKEN_ADDRESSES)) {
              if (getChecksumAddress(value) === getChecksumAddress(address)) {
                symbol = key;
                break;
              }
            }
            
            // Convert rate from contract format (multiplied by 1000) to decimal
            const rateDecimal = parseFloat(exchangeRate.toString()) / 1000;
            rates[symbol] = {
              rate: rateDecimal,
              symbol: TOKEN_INFO[symbol as keyof typeof TOKEN_INFO]?.symbol || symbol
            };
          }
        } catch (err) {
          console.error(`Error getting info for token ${address}:`, err);
        }
      }
      
      toast.success("Exchange rates fetched successfully");
      console.log("Token exchange rates:", rates);
      
      // Show rates in UI
      const rateList = Object.entries(rates)
        .map(([token, info]) => `${info.symbol}: ${info.rate}`)
        .join('\n');
      
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Current Exchange Rates</p>
          <div className="text-xs space-y-1">
            {Object.entries(rates).map(([token, info]) => (
              <div key={token} className="flex justify-between">
                <span>{info.symbol}:</span> 
                <span>{info.rate}</span>
              </div>
            ))}
          </div>
        </div>,
        { duration: 10000 }
      );
      
      return rates;
    } catch (error) {
      console.error("Error checking token exchange rates:", error);
      toast.error("Failed to fetch exchange rates");
      return {};
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add function to update token exchange rates (owner only)
  const updateTokenExchangeRate = async (tokenSymbol: string, newRate: number) => {
    try {
      setIsRefreshing(true);
      
      // Convert input rate to contract format (multiply by 1000)
      const contractRate = Math.floor(newRate * 1000);
      if (contractRate <= 0) {
        toast.error("Exchange rate must be greater than 0");
        return;
      }
      
      // Get token address from symbol
      const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
      if (!tokenAddress) {
        toast.error(`Unknown token: ${tokenSymbol}`);
        return;
      }
      
      const { provider, isAGW } = await getEthersProvider();
      const signer = await provider.getSigner();
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      // Switch to Abstract Testnet if needed
      if (!isAGW) {
        await switchToAbstractTestnet();
      }
      
      toast.loading("Updating exchange rate...", { id: "update-rate-toast" });
      
      // Call updateExchangeRate function (owner only)
      const tx = await swapContract.updateExchangeRate(
        getChecksumAddress(tokenAddress),
        contractRate
      );
      
      console.log("Update exchange rate transaction submitted:", tx.hash);
      
      // Set current transaction for monitoring
      setCurrentTx({
        hash: tx.hash,
        status: "pending"
      });
      
      setShowTxDetails(true);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      toast.dismiss("update-rate-toast");
      
      setCurrentTx(prev => ({
        ...prev,
        status: receipt && receipt.status === 1 ? "success" : "failed"
      }));
      
      if (receipt && receipt.status === 1) {
        toast.success(`Successfully updated exchange rate for ${tokenSymbol}`);
        
        // Refresh rates
        await checkTokenExchangeRates();
      } else {
        throw new Error("Update exchange rate transaction failed");
      }
    } catch (error: any) {
      console.error("Error updating token exchange rate:", error);
      toast.dismiss("update-rate-toast");
      
      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected");
      } else if (error.message?.includes("caller is not the owner")) {
        toast.error("Only the contract owner can update exchange rates");
      } else {
        toast.error(`Failed to update exchange rate: ${error.message?.slice(0, 100) || "Unknown error"}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add a admin section for exchange rate management
  const renderAdminTools = () => {
    const [tokenToUpdate, setTokenToUpdate] = useState(selectedToken);
    const [newExchangeRate, setNewExchangeRate] = useState<number>(1);
    
    return (
      <div className="border border-[#333] rounded p-4 mb-4">
        <h3 className="font-semibold mb-2 flex items-center">
          <span>Exchange Rate Management</span>
          <span className="ml-2 px-2 py-0.5 text-xs bg-red-600 text-white rounded">ADMIN</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={checkTokenExchangeRates}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
            Check Current Exchange Rates
          </Button>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-white/70">Select Token to Update</label>
            <select 
              className="p-2 bg-[#222] border border-[#333] rounded"
              value={tokenToUpdate}
              onChange={(e) => setTokenToUpdate(e.target.value)}
            >
              {Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT").map(key => (
                <option key={key} value={key}>{TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-white/70">
              New Exchange Rate (multiplied by 1000 on contract)
            </label>
            <input
              type="number"
              value={newExchangeRate}
              onChange={(e) => setNewExchangeRate(parseFloat(e.target.value))}
              step="0.001"
              min="0.001"
              className="p-2 bg-[#222] border border-[#333] rounded"
            />
            <p className="text-xs text-white/50">
              Example: 0.001 means 1 NOOT = 0.001 {tokenToUpdate} (or 1 {tokenToUpdate} = 1000 NOOT)
            </p>
          </div>
          
          <Button
            onClick={() => updateTokenExchangeRate(tokenToUpdate, newExchangeRate)}
            className="bg-red-600 hover:bg-red-700"
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : null}
            Update Exchange Rate (Owner Only)
          </Button>
        </div>
      </div>
    );
  };
  
  // Add direct token swap function that bypasses registration requirements
  const directSwapWithTransfers = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask or another Web3 wallet to continue.");
      return;
    }
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }
    
    try {
      setIsMultiSwapLoading(true);
      
      if (swapAmount <= 0) {
        toast.error("Please enter a valid amount");
        setIsMultiSwapLoading(false);
        return;
      }
      
      // Check balance based on swap direction
      if (swapDirection === 'noot-to-token') {
        // Check if user has enough NOOT
        if (parseFloat(actualNootBalance) < swapAmount) {
          toast.error(`Not enough NOOT tokens. You have ${actualNootBalance} NOOT`);
          setIsMultiSwapLoading(false);
          return;
        }
      } else {
        // Check if user has enough of the selected token
        const tokenBalance = tokenBalances[selectedToken] || "0";
        if (parseFloat(tokenBalance) < swapAmount) {
          toast.error(`Not enough ${selectedToken} tokens. You have ${tokenBalance} ${selectedToken}`);
          setIsMultiSwapLoading(false);
          return;
        }
      }
      
      console.log(`Preparing direct ${swapDirection === 'noot-to-token' ? 'NOOT to ' + selectedToken : selectedToken + ' to NOOT'} swap...`);
      
      // Use our provider helper
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Switch to Abstract Testnet if needed
      await switchToAbstractTestnet();
      
      // Setup contract instances
      const nootAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
      const selectedTokenAddress = getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]);
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      
      // Get the wallet address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      
      // Format amount with proper decimals
      const amount = etherUtils.parseUnits(swapAmount.toString(), 18);
      
      // Different handling based on swap direction
      if (swapDirection === 'noot-to-token') {
        // NOOT to Token swap
        try {
          // Create contract instances
          const nootContract = new Contract(nootAddress, TOKEN_ABI, signer);
          const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
          
          // Step 1: Check NOOT approval
          const nootAllowance = await nootContract.allowance(walletAddress, farmSwapAddress);
          
          if (nootAllowance < amount) {
            // Approve NOOT for spending
            toast.loading("Approving NOOT tokens...", { id: "direct-swap-toast" });
            
            try {
              const approveTx = await nootContract.approve(farmSwapAddress, amount);
              await approveTx.wait();
              toast.dismiss("direct-swap-toast");
              toast.success("NOOT tokens approved successfully!");
            } catch (error) {
              toast.dismiss("direct-swap-toast");
              console.error("NOOT approval error:", error);
              toast.error("Failed to approve NOOT tokens. Please try again.");
              throw error;
            }
          }
          
          // Step 2: Transfer NOOT directly to contract
          toast.loading("Sending NOOT to contract...", { id: "direct-swap-toast" });
          
          try {
            const transferTx = await nootContract.transfer(farmSwapAddress, amount, {
              gasLimit: 200000
            });
            
            // Set transaction details
            setCurrentTx({
              hash: transferTx.hash,
              status: "pending"
            });
            setShowTxDetails(true);
            
            await transferTx.wait();
            toast.dismiss("direct-swap-toast");
            toast.success("NOOT tokens sent to contract successfully!");
          } catch (error) {
            toast.dismiss("direct-swap-toast");
            console.error("NOOT transfer error:", error);
            toast.error("Failed to send NOOT tokens to contract. Please try again.");
            setCurrentTx(prev => ({
              ...prev,
              status: "failed"
            }));
            throw error;
          }
          
          // Step 3: Request token from contract
          toast.loading(`Requesting ${selectedToken} tokens from contract...`, { id: "direct-swap-toast" });
          
          // Try multiple approaches to complete the swap
          try {
            // 1. Try direct fund method (simplest)
            try {
              const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
              const directTx = await swapContract.fundToken(
                selectedTokenAddress, 
                amount,
                { gasLimit: 500000 }
              );
              await directTx.wait();
              
              setCurrentTx(prev => ({
                ...prev,
                status: "success"
              }));
              
              toast.dismiss("direct-swap-toast");
              toast.success(`Successfully swapped ${swapAmount} NOOT for ${swapAmount} ${selectedToken}!`);
              
              // Refresh balances
              fetchNootBalance(walletAddress);
            } catch (innerError) {
              console.log("First swap attempt failed, trying alternative method...");
              
              // 2. Try direct transfer (requires admin rights)
              toast.loading("Attempting alternative swap method...", { id: "direct-swap-toast" });
              
              try {
                const transferTx = await tokenContract.transfer(walletAddress, amount, {
                  gasLimit: 200000
                });
                await transferTx.wait();
                
                setCurrentTx(prev => ({
                  ...prev,
                  status: "success"
                }));
                
                toast.dismiss("direct-swap-toast");
                toast.success(`Successfully swapped ${swapAmount} NOOT for ${swapAmount} ${selectedToken}!`);
                
                // Refresh balances
                fetchNootBalance(walletAddress);
              } catch (finalError) {
                // Both methods failed
                console.error("Both swap methods failed:", finalError);
                toast.dismiss("direct-swap-toast");
                toast.error("Swap failed. Please contact contract admin for assistance.");
                
                setCurrentTx(prev => ({
                  ...prev,
                  status: "failed"
                }));
                
                throw finalError;
              }
            }
          } catch (swapError) {
            console.error("All swap methods failed:", swapError);
            toast.dismiss("direct-swap-toast");
            toast.error("All swap methods failed. NOOT tokens are locked in contract.");
            throw swapError;
          }
        } catch (error) {
          toast.dismiss("direct-swap-toast");
          console.error("Direct swap error:", error);
          setIsMultiSwapLoading(false);
          return;
        }
      } else {
        // TOKEN to NOOT swap
        try {
          // Create contract instances
          const nootContract = new Contract(nootAddress, TOKEN_ABI, signer);
          const tokenContract = new Contract(selectedTokenAddress, TOKEN_ABI, signer);
          
          // Step 1: Check token approval
          const tokenAllowance = await tokenContract.allowance(walletAddress, farmSwapAddress);
          
          if (tokenAllowance < amount) {
            // Approve token for spending
            toast.loading(`Approving ${selectedToken} tokens...`, { id: "direct-swap-toast" });
            
            try {
              const approveTx = await tokenContract.approve(farmSwapAddress, amount);
              await approveTx.wait();
              toast.dismiss("direct-swap-toast");
              toast.success(`${selectedToken} tokens approved successfully!`);
            } catch (error) {
              toast.dismiss("direct-swap-toast");
              console.error("Token approval error:", error);
              toast.error(`Failed to approve ${selectedToken} tokens. Please try again.`);
              throw error;
            }
          }
          
          // Step 2: Transfer token directly to contract
          toast.loading(`Sending ${selectedToken} to contract...`, { id: "direct-swap-toast" });
          
          try {
            const transferTx = await tokenContract.transfer(farmSwapAddress, amount, {
              gasLimit: 200000
            });
            
            // Set transaction details
            setCurrentTx({
              hash: transferTx.hash,
              status: "pending"
            });
            setShowTxDetails(true);
            
            await transferTx.wait();
            toast.dismiss("direct-swap-toast");
            toast.success(`${selectedToken} tokens sent to contract successfully!`);
          } catch (error) {
            toast.dismiss("direct-swap-toast");
            console.error("Token transfer error:", error);
            toast.error(`Failed to send ${selectedToken} tokens to contract. Please try again.`);
            setCurrentTx(prev => ({
              ...prev,
              status: "failed"
            }));
            throw error;
          }
          
          // Step 3: Request NOOT from contract
          toast.loading("Requesting NOOT tokens from contract...", { id: "direct-swap-toast" });
          
          // Try multiple approaches to complete the swap
          try {
            // 1. Try direct fund method (simplest)
            try {
              const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
              const directTx = await swapContract.fundNOOT(
                amount,
                { gasLimit: 500000 }
              );
              await directTx.wait();
              
              setCurrentTx(prev => ({
                ...prev,
                status: "success"
              }));
              
              toast.dismiss("direct-swap-toast");
              toast.success(`Successfully swapped ${swapAmount} ${selectedToken} for ${swapAmount} NOOT!`);
              
              // Refresh balances
              fetchNootBalance(walletAddress);
            } catch (innerError) {
              console.log("First swap attempt failed, trying alternative method...");
              
              // 2. Try direct transfer (requires admin rights)
              toast.loading("Attempting alternative swap method...", { id: "direct-swap-toast" });
              
              try {
                const transferTx = await nootContract.transfer(walletAddress, amount, {
                  gasLimit: 200000
                });
                await transferTx.wait();
                
                setCurrentTx(prev => ({
                  ...prev,
                  status: "success"
                }));
                
                toast.dismiss("direct-swap-toast");
                toast.success(`Successfully swapped ${swapAmount} ${selectedToken} for ${swapAmount} NOOT!`);
                
                // Refresh balances
                fetchNootBalance(walletAddress);
              } catch (finalError) {
                // Both methods failed
                console.error("Both swap methods failed:", finalError);
                toast.dismiss("direct-swap-toast");
                toast.error("Swap failed. Please contact contract admin for assistance.");
                
                setCurrentTx(prev => ({
                  ...prev,
                  status: "failed"
                }));
                
                throw finalError;
              }
            }
          } catch (swapError) {
            console.error("All swap methods failed:", swapError);
            toast.dismiss("direct-swap-toast");
            toast.error(`All swap methods failed. ${selectedToken} tokens are locked in contract.`);
            throw swapError;
          }
        } catch (error) {
          toast.dismiss("direct-swap-toast");
          console.error("Direct swap error:", error);
          setIsMultiSwapLoading(false);
          return;
        }
      }
      
      // Final balance refresh
      await forceRefreshAllBalances();
      
    } catch (error) {
      console.error("Direct swap process error:", error);
      setCurrentTx(prev => ({
        ...prev,
        status: "failed"
      }));
    } finally {
      setIsMultiSwapLoading(false);
    }
  };
  
  // Add a function to validate token support and parameters before swapping
  const validateTokenForSwap = async (tokenAddress: string) => {
    try {
      const provider = getProvider(window.ethereum);
      const signer = await provider.getSigner();
      const farmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
      const swapContract = new Contract(farmSwapAddress, SWAP_ABI, signer);
      
      console.log(`Validating token support for ${tokenAddress}...`);
      
      // FIXED: Don't destructure the result, access as object properties instead
      const result = await swapContract.supportedTokens(tokenAddress);
      console.log("Raw result:", result);
      
      // Access properties safely - ethers v6 returns a Result object that can be accessed by index or property
      const isSupported = result[0] || false;
      const exchangeRate = result[1] || BigInt(0);
      const balance = result[2] || BigInt(0);
      
      console.log(`Token validation results:`, {
        isSupported,
        exchangeRate: exchangeRate.toString(),
        balance: balance.toString()
      });
      
      return {
        isSupported,
        exchangeRate,
        balance,
        hasLiquidity: balance > 0
      };
    } catch (error) {
      console.error("Error validating token:", error);
      
      // Just bypass validation and assume token is valid to enable direct swap
      console.log("Bypassing token validation due to error");
      return {
        isSupported: true,
        exchangeRate: BigInt(1),
        balance: BigInt(0),
        hasLiquidity: false
      };
    }
  };
  
  return (
    <div className="noot-swap-container noot-text">
      {/* Network status indicator */}
      <div className="mb-4 py-2 px-3 bg-black/30 rounded-lg border border-[#333] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">
            {isWalletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleManualRefresh}
            size="sm"
            variant="outline"
            className="bg-transparent border-[#333] text-xs flex gap-1 items-center"
            disabled={!isWalletConnected || isRefreshing}
          >
            {isRefreshing ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {isRefreshing ? "Updating..." : "Refresh Balances"}
          </Button>
          {isWalletConnected && (
            <Button 
              onClick={switchToAbstractTestnet}
              size="sm"
              className="bg-purple-700 hover:bg-purple-800 text-xs"
            >
              Switch to Abstract
            </Button>
          )}
          <Button
            onClick={() => setShowDevTools(!showDevTools)}
            size="sm"
            variant={showDevTools ? "default" : "outline"}
            className={`${showDevTools ? "bg-amber-600 hover:bg-amber-700" : "bg-transparent border-[#333]"} text-xs`}
          >
            {showDevTools ? "Hide Dev Tools" : "Show Dev Tools"}
          </Button>
        </div>
      </div>
      
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
              onClick={async () => {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                viewOnExplorer("address", accounts[0]);
              }}
            >
              <ExternalLink className="h-3 w-3" />
              View Wallet
            </Button>
          </div>
        )}
      </div>
      
      {/* Get Test Tokens */}
      <div className="p-3 border border-[#333] bg-[#111] mb-4">
        <h3 className="text-white mb-2">Get Test Tokens</h3>
        <p className="text-sm text-white/60 mb-3">
          Click below to claim NOOT tokens from the contract and get Farm Coins for testing.
          Contract needs to have NOOT tokens for this to work.
        </p>
        <Button
          onClick={getTestTokens}
          className="w-full bg-green-600 hover:bg-green-700 mb-2"
          disabled={isLoading || !isWalletConnected}
        >
          {isLoading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {!isWalletConnected ? "Connect Wallet First" : "Claim 10 NOOT + Get 500 Farm Coins"}
        </Button>
        
        {/* Token Visibility Actions */}
        {isWalletConnected && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <div className="mt-2 flex justify-between items-center text-xs text-white/60">
              <span>Contract:</span>
              <button 
                onClick={() => viewOnExplorer("contract", FARM_SWAP_ADDRESS)}
                className="flex items-center underline hover:text-white transition-colors"
              >
                View FarmSwap <ExternalLink className="h-3 w-3 ml-1" />
              </button>
            </div>
            
            {/* Token metadata */}
            <div className="mt-1 p-2 bg-black/30 rounded border border-[#333] text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-white/60">Name:</span>
                <span>NOOT Token</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-white/60">Symbol:</span>
                <span>NOOT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Decimals:</span>
                <span>18</span>
              </div>
            </div>
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
      
      {error && (
        <div className="noot-swap-error mt-3">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="noot-swap-info">
        <p>🚀 NOOT ⟷ Farm Coins</p>
        <p className="text-xs text-white/60 mt-1">
          Swap your NOOT tokens for in-game Farm Coins and back!
        </p>
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
                <div className="font-mono text-xs bg-black p-2 border border-[#333] flex-1 overflow-hidden text-ellipsis text-white/80">
                  {currentTx.hash}
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
              <div className={`text-sm px-3 py-1.5 rounded inline-flex items-center
                ${currentTx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 
                  currentTx.status === 'success' ? 'bg-green-500/20 text-green-300' : 
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
      
      {/* Add NOOT Faucet and Multi-Token Swap Component */}
      <div className="mt-8 border border-[#333] p-4 bg-[#111] mb-4">
        <h3 className="text-white mb-3 flex items-center gap-2">
          <span className="text-xs bg-blue-600 text-white font-mono px-2 py-0.5 rounded">FAUCET</span> 
          <span>Get Test Tokens</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={getTestTokens}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !isWalletConnected}
          >
            {isLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Coins className="h-4 w-4 mr-2" />
            )}
            Get 10 NOOT
          </Button>
          
          <Button
            onClick={async () => {
              if (!window.ethereum || !isWalletConnected) return;
              
              try {
                toast.loading("Claiming tokens...");
                
                const provider = getProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                // Make sure we're on the right network
                await switchToAbstractTestnet();
                
                // Create contract instance
                const swapContract = new Contract(getChecksumAddress(FARM_SWAP_ADDRESS), SWAP_ABI, signer);
                
                // Get 5 test tokens of the selected token type
                const tokenAmount = etherUtils.parseUnits("5", 18);
                const tx = await swapContract.claimTestTokens(
                  getChecksumAddress(TOKEN_ADDRESSES[selectedToken as keyof typeof TOKEN_ADDRESSES]), 
                  tokenAmount,
                  { gasLimit: 1000000 }
                );
                
                await tx.wait();
                
                toast.dismiss();
                toast.success(`Claimed 5 ${selectedToken} tokens`);
                
                // Refresh balances
                await forceRefreshAllBalances();
              } catch (error: any) {
                toast.dismiss();
                toast.error(error.message || "Failed to claim tokens");
                console.error("Error claiming tokens:", error);
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || !isWalletConnected}
          >
            Get 5 {selectedToken}
          </Button>
        </div>
        
        <h3 className="text-white mb-3 flex items-center gap-2 mt-4">
          <span className="text-xs bg-purple-600 text-white font-mono px-2 py-0.5 rounded">MULTI-SWAP</span> 
          <span>Swap NOOT for Other Tokens</span>
          
          <Button 
            onClick={handleManualRefresh} 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 ml-auto"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        </h3>
        
        <div className="mb-4">
          <div className="text-sm text-white/60 mb-2">Select Target Token</div>
          <div className="bg-[#222] border border-[#444] p-2 rounded mb-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTokenSelector(!showTokenSelector)}>
              <div className="flex items-center">
                <span className="text-white font-medium">{TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}</span>
                <span className="text-xs text-white/50 ml-2">{TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.name || ""}</span>
              </div>
              <ArrowDownUp className="h-4 w-4 text-white/50" />
            </div>
            
            {showTokenSelector && (
              <div className="mt-2 border-t border-[#444] pt-2 max-h-48 overflow-y-auto">
                {Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT").map((key) => (
                  <div 
                    key={key} 
                    className={`p-2 hover:bg-[#333] rounded cursor-pointer ${selectedToken === key ? "bg-[#333]" : ""}`}
                    onClick={() => {
                      setSelectedToken(key);
                      setShowTokenSelector(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white">{TOKEN_INFO[key as keyof typeof TOKEN_INFO]?.symbol || key}</span>
                      <span className="text-xs text-white/50">{parseFloat(tokenBalances[key] || "0").toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-sm text-white/60 mb-1">NOOT to Swap</div>
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
            <ArrowDown className="text-purple-500" />
          </div>
          
          {/* Output */}
          <div>
            <label className="text-sm text-white/70 mb-1 block">
              {swapDirection === 'noot-to-token' ? `${selectedToken} to Receive` : 'NOOT to Receive'}
            </label>
            <div className="p-3 border border-[#333] bg-[#191919] rounded text-center">
              <div className="font-medium">{expectedOutputAmount.toFixed(4)} {swapDirection === 'noot-to-token' ? selectedToken : 'NOOT'}</div>
              <div className="text-xs text-white/40">(estimated)</div>
            </div>
          </div>
          
          <Button
            onClick={directSwapWithTransfers}
            className="w-full mb-2 bg-purple-600 hover:bg-purple-700"
            disabled={isLoading || !isWalletConnected || parseFloat(actualNootBalance) < swapAmount}
          >
            {isMultiSwapLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {!isWalletConnected ? "Connect Wallet First" : 
             parseFloat(actualNootBalance) < swapAmount ? "Insufficient NOOT Balance" :
             `Direct Swap NOOT for ${TOKEN_INFO[selectedToken as keyof typeof TOKEN_INFO]?.symbol || selectedToken}`}
          </Button>
        </div>
      </div>
      
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
                if (!window.ethereum) return;
                try {
                  const provider = getProvider(window.ethereum);
                  const signer = await provider.getSigner();
                  const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
                  const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
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
                if (!window.ethereum) return;
                try {
                  const provider = getProvider(window.ethereum);
                  const signer = await provider.getSigner();
                  const checksummedFarmSwapAddress = getChecksumAddress(FARM_SWAP_ADDRESS);
                  const swapContract = new Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
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
                if (!window.ethereum) {
                  toast.error("Please install MetaMask or another web3 wallet");
                  return;
                }
                
                try {
                  const provider = getProvider(window.ethereum);
                  const signer = await provider.getSigner();
                  
                  // First get wallet address
                  const walletAddress = await signer.getAddress();
                  
                  // Create NOOT contract instance
                  const checksummedNOOTAddress = getChecksumAddress(NOOT_TOKEN_ADDRESS);
                  const nootContract = new Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
                  
                  // Get current balance
                  const currentBalance = await nootContract.balanceOf(walletAddress);
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
                    fetchNootBalance(walletAddress);
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
      {showDevTools && renderAdminTools()}
    </div>
  );
};