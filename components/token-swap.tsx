"use client"

import { useState, useContext, useEffect } from "react"
import { GameContext } from "@/context/game-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownUp, RefreshCw, ArrowRightLeft, AlertCircle, Coins, ArrowDown, Loader, ExternalLink, CheckCircle2, Plus } from "lucide-react"
// Import specific functions from ethers v6
import { ethers, Contract, formatUnits, parseUnits, BrowserProvider, JsonRpcProvider } from "ethers"
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
    return ethers.getAddress(address);
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
  
  // Check if wallet is connected - use useEffect to prevent hydration errors
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  
  const [contractNootBalance, setContractNootBalance] = useState("0");
  
  // Add state for tracking refresh operation
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setIsWalletConnected(accounts.length > 0);
          
          if (accounts.length > 0) {
            fetchNootBalance(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkWalletConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setIsWalletConnected(accounts.length > 0);
        if (accounts.length > 0) {
          fetchNootBalance(accounts[0]);
        } else {
          setActualNootBalance("0");
        }
      });
    }
    
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
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
        const nootContract = new ethers.Contract(checksummedNOOTAddress, TOKEN_ABI, provider);
        
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
  
  // Getting references to the missing functions and moving them up in the component
  
  // Function to check the NOOT balance of the FarmSwap contract
  const checkContractBalance = async () => {
    if (!window.ethereum) {
      console.error("No Ethereum provider detected");
      return;
    }
    
    try {
      const provider = getProvider(window.ethereum);
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
        console.log(`Currently on chain ID ${chainId}, not on Abstract Testnet`);
        return;
      }
      
      // Create contract instance 
      const tokenAbi = ["function balanceOf(address) view returns (uint256)"];
      const nootContract = new Contract(NOOT_TOKEN_ADDRESS, tokenAbi, provider);
      
      // Get the balance
      const balanceWei = await nootContract.balanceOf(FARM_SWAP_ADDRESS);
      const balanceFormatted = etherUtils.formatUnits(balanceWei, 18);
      
      setContractNootBalance(balanceFormatted);
      console.log(`FarmSwap contract NOOT balance: ${balanceFormatted}`);
    } catch (error) {
      console.error("Failed to check contract balance:", error);
    }
  };
  
  // Add a function to forcefully refresh all balances
  const forceRefreshAllBalances = async () => {
    console.log("Force refreshing all balances");
    
    if (!window.ethereum) {
      console.log("No ethereum provider found");
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const walletAddress = accounts[0];
        
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
      } else {
        console.log("No connected accounts found, skipping balance refresh");
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
      const nootContract = new ethers.Contract(checksummedNOOTAddress, TOKEN_ABI, signer);
      const swapContract = new ethers.Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
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
              ethers.id("Transfer(address,address,uint256)"),
              null,
              ethers.zeroPadValue(walletAddress, 32)
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
          
          // Set a very large approval to prevent needing multiple approvals
          // Approve 10 million tokens to avoid frequent approvals
          const largeApprovalAmount = ethers.parseUnits("10000000", 18); // 10 million tokens
          
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
      const nootContract = new ethers.Contract(checksummedNootTokenAddress, TOKEN_ABI, provider);
      const swapContract = new ethers.Contract(checksummedFarmSwapAddress, SWAP_ABI, signer);
      
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
    </div>
  );
};