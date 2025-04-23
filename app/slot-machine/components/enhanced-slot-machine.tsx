"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CircleDollarSign,
  Coins,
  Bitcoin,
  Gem,
  CreditCard,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  Flame,
  Trophy,
  Zap,
  Rocket,
  Wallet,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import confetti from "canvas-confetti"
import { useIsMobile } from "@/hooks/use-mobile"
import { ethers } from 'ethers'
import Achievements from "./achievements"
import SocialFeatures from "./social-features"
import DailyRewards from "./daily-rewards"
import ProgressSystem from "./progress-system"
import VariableRewards from "./variable-rewards"

// Add these missing animations to your global CSS or define them inline
import './slot-machine.css'

// Define symbol type
type Symbol = {
  id: string;
  image: string;
  value: number;
  color: string;
  bgColor: string;
}

// Define coin symbols with images instead of icons
const SYMBOLS: Symbol[] = [
  { 
    id: "noot-noot", 
    image: "/case items/bronze/noot-noot.jpg", 
    value: 10, 
    color: "text-green-500", 
    bgColor: "bg-green-500" 
  },
  { 
    id: "retsba", 
    image: "/case items/golden/RETSBA.jpg", 
    value: 50, 
    color: "text-amber-500", 
    bgColor: "bg-amber-500" 
  },
  { 
    id: "wojact", 
    image: "/case items/golden/Wojact.jpg", 
    value: 20, 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-400" 
  },
  { 
    id: "yup", 
    image: "/case items/golden/yup.jpg", 
    value: 15, 
    color: "text-blue-400", 
    bgColor: "bg-blue-400" 
  },
  { 
    id: "nutz", 
    image: "/case items/golden/nutz.jpg", 
    value: 30, 
    color: "text-purple-400", 
    bgColor: "bg-purple-400" 
  },
]

// Log SYMBOLS on initial load
console.log("[SlotMachine Init] SYMBOLS:", SYMBOLS);

// Define special effects for different win tiers
const WIN_TIERS = [
  { threshold: 0, icon: null, name: "", color: "from-green-600 to-emerald-500" },
  { threshold: 50, icon: Flame, name: "HOT WIN", color: "from-orange-500 to-red-500" },
  { threshold: 100, icon: Zap, name: "SUPER WIN", color: "from-blue-500 to-purple-600" },
  { threshold: 200, icon: Trophy, name: "MEGA WIN", color: "from-amber-500 to-yellow-500" },
  { threshold: 500, icon: Rocket, name: "INSANE WIN", color: "from-pink-500 to-rose-600" },
]

// --- Copied Blockchain Constants from crashout-game.tsx ---
const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Wallet options
const WALLET_OPTIONS = {
  METAMASK: "metamask"
};

// Central payout address that holds tokens for the game
const PAYOUT_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";

// Token addresses (focus on the requested ones + FARM)
const TOKENS = {
  // FARM: '', // Farm coins are handled locally
  NOOT: "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56",  // Noot-noot
  RETSBA: "0x26707CE367C4758F73EF09fA9D8d730869a38e10", // Retsba
  WOJACT: "0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c", // Wojact
  YUP: "0xF5048aD4FB452f4E39472d085E29994f6088d96B",    // Yup
  NUTZ: "0x77D29085727405340946919A88B0Ac6c9Ffb80BD",    // Nutz
};

// Minimal Token ABI (balanceOf, approve, allowance, transfer)
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// ABI for the swap contract (Payout Address - only need transfer function)
const SWAP_CONTRACT_ABI = [
  // Only need the ability to transfer FROM the payout address TO the user
  "function transferToken(address tokenAddress, address to, uint256 amount) external returns (bool)",
  // Optional: Add other methods if needed later for fallback
  "function claimTestTokens(address tokenAddress, uint256 amount) external returns (bool)",
  "function directTokenTransfer(address tokenAddress, address to, uint256 amount) external returns (bool)"
];
// ----------------------------------------------------------

// --- Added Token Balance Type --- 
interface TokenBalance {
  symbol: string;
  balance: number;
  address: string;
}
// ---------------------------------

// --- Updated Props --- 
interface EnhancedSlotMachineProps {
  farmCoins: number;
  addFarmCoins: (delta: number) => void;
  walletAddress?: string; // Optional prop for initial address
  provider?: any; // Optional prop for external provider
  // Removed tokenBalances prop - will manage internally
  // Removed updateTokenBalance prop - will manage internally
}
// ----------------------

export default function EnhancedSlotMachine({ farmCoins, addFarmCoins, walletAddress: initialWalletAddress = "", provider: externalProvider = null }: EnhancedSlotMachineProps) {
  // === Original State Declarations (Keep these) ===
  const [balance, setBalance] = useState(1000); // Re-adding this state
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<Array<{ spinning: boolean; symbol: Symbol; position: number; symbols: Symbol[]; stopDelay: number; }>>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [muted, setMuted] = useState(false);
  const [jackpotMode, setJackpotMode] = useState(false);
  const [winningLines, setWinningLines] = useState<number[]>([]);
  const [autoSpin, setAutoSpin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [biggestWin, setBiggestWin] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [winTier, setWinTier] = useState(0);
  const [lossStreak, setLossStreak] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [showLossEffect, setShowLossEffect] = useState(false);
  const [nearMiss, setNearMiss] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [lastResults, setLastResults] = useState<Array<{ win: boolean; amount: number }>>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [lastBigWin, setLastBigWin] = useState<{ amount: number; multiplier: number } | null>(null);

  // Wallet/Token State
  const [selectedToken, setSelectedToken] = useState<string>("FARM");
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([{ symbol: "FARM", balance: farmCoins, address: "" }]);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(!!initialWalletAddress);
  const [localWalletAddress, setLocalWalletAddress] = useState<string>(initialWalletAddress);
  const [activeWallet, setActiveWallet] = useState<string | null>(externalProvider ? WALLET_OPTIONS.METAMASK : null);
  const [metamaskProvider, setMetamaskProvider] = useState<any>(externalProvider);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);
  const [approvalPending, setApprovalPending] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<'none' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('none');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTxDialog, setShowTxDialog] = useState<boolean>(false);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [lastWinToken, setLastWinToken] = useState<string | null>(null);

  // Auto Spin State Variables (Ensure these are declared ONCE)
  const [autoSpinTotalBet, setAutoSpinTotalBet] = useState<string>('');
  const [targetAutoSpinSpend, setTargetAutoSpinSpend] = useState<number>(0);
  const [amountSpentOnAutoSpin, setAmountSpentOnAutoSpin] = useState<number>(0);

  // Log initial reels state right after declaration
  console.log("[SlotMachine Init] Initial Reels State:", reels);

  // === Refs ===
  const betRef = useRef<number>(0);
  const tokenRef = useRef<string>("FARM");
  const spinSound = useRef<HTMLAudioElement | null>(null);
  const winSound = useRef<HTMLAudioElement | null>(null);
  const jackpotSound = useRef<HTMLAudioElement | null>(null);
  const reelStopSound = useRef<HTMLAudioElement | null>(null);
  const clickSound = useRef<HTMLAudioElement | null>(null);
  const coinSound = useRef<HTMLAudioElement | null>(null);
  const lossSound = useRef<HTMLAudioElement | null>(null);
  const nearMissSound = useRef<HTMLAudioElement | null>(null);
  const machineRef = useRef<HTMLDivElement | null>(null);
  const autoSpinRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // --- Memoized getCurrentBalance ---
  const getCurrentBalance = useCallback(() => {
    return availableTokens.find(t => t.symbol === selectedToken)?.balance || 0;
  }, [availableTokens, selectedToken]);
  // ----------------------------------

  // Initialize reels state on mount (Client-side)
  useEffect(() => {
    if (SYMBOLS && SYMBOLS.length > 0) {
      const initialReels = Array.from({ length: 3 }, (_, index) => ({
        spinning: false,
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], // Start with random symbols
        position: 0,
        symbols: [], // Will be populated during spin
        stopDelay: 800 + index * 600,
      }));
      setReels(initialReels);
      console.log("[SlotMachine Init Effect] Reels initialized client-side:", initialReels);
    } else {
       console.error("[SlotMachine Init Effect] SYMBOLS array is empty or not defined on mount!");
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // === Helper Functions ===
  // Toast helper - Corrected for useToast hook
  const showAppToast = (message: string, type: 'success' | 'error' | 'loading' | 'default' = 'default', options?: any) => {
    let variant: "default" | "destructive" = "default";
    if (type === 'error') variant = "destructive";
    // Add custom class based on type if needed
    let className = '';
    if (type === 'success') className = 'bg-green-600 text-white';
    // Note: Loading style might need specific setup or just use default

    toast({
      title: message,
      description: options?.description, // Pass description if provided
      variant: variant,
      duration: type === 'loading' ? 8000 : 4000,
      className: className,
      ...options, // Allow overriding defaults
    });
  };

  const getChecksumAddress = (address: string): string => {
    try { return ethers.getAddress(address); }
    catch (error) { console.error("Invalid address format:", error); return address; }
  };

  // === Wallet Connection & Balance Fetching (Implementations) ===

  const connectWallet = async (walletType?: string) => {
    try {
      setIsLoading(true);
      if (!walletType) {
        setShowWalletOptions(true);
        setIsLoading(false);
        return;
      }
      if (walletType === WALLET_OPTIONS.METAMASK) {
        await connectMetaMask();
      }
      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting wallet:`, error);
      showAppToast(`Failed to connect wallet.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      showAppToast("MetaMask not detected. Please install.", 'error');
      throw new Error("MetaMask not available");
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.METAMASK);
        setLocalWalletAddress(accounts[0]);
        setMetamaskProvider(window.ethereum);
        const switched = await switchToAbstractTestnet(window.ethereum);
        if (switched) {
           await fetchTokenBalances(); // Fetch balances only after successful switch
        }
        showAppToast("Connected to MetaMask", 'success');
      } else {
        throw new Error("No accounts found");
      }
    } catch (error) {
      console.error("MetaMask connection error:", error);
      showAppToast("Failed to connect MetaMask", 'error');
      // Reset state if connection failed partially
      setIsWalletConnected(false);
      setActiveWallet(null);
      setLocalWalletAddress('');
      setMetamaskProvider(null);
      throw error;
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsWalletConnected(false);
      setActiveWallet(null);
      setLocalWalletAddress('');
      setMetamaskProvider(null);
      showAppToast("Wallet disconnected", 'success');
      setAvailableTokens([{ symbol: "FARM", balance: farmCoins, address: "" }]);
    } catch (error) {
      console.error("Disconnect error:", error);
      showAppToast("Failed to disconnect", 'error');
    }
  };

  const switchToAbstractTestnet = async (provider: any) => {
    const targetProvider = provider || metamaskProvider || window.ethereum;
    if (!targetProvider) {
      showAppToast("No wallet provider detected", 'error'); return false;
    }
    try {
      const chainId = await targetProvider.request({ method: 'eth_chainId' });
      if (chainId === ABSTRACT_TESTNET_CHAIN_ID) {
         console.log("Already on Abstract Testnet");
         return true;
      }

      await targetProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ABSTRACT_TESTNET_CHAIN_ID }],
      });
      showAppToast("Switched to Abstract Testnet", 'success');
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902 || (switchError.data?.originalError?.code === 4902)) {
        try {
          await targetProvider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ABSTRACT_TESTNET_CHAIN_ID, chainName: 'Abstract Testnet',
              nativeCurrency: { name: 'Abstract ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://api.testnet.abs.xyz', 'https://rpc.testnet.abs.xyz'],
              blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER],
            }]
          });
          showAppToast("Abstract Testnet added", 'success');
          return true;
        } catch (addError) {
          console.error("Add chain error:", addError);
          showAppToast("Could not add Abstract Testnet", 'error'); return false;
        }
      } else {
        console.error("Switch network error:", switchError);
        showAppToast("Failed to switch network. Please do it manually in your wallet.", 'error', { duration: 6000 }); // Longer duration for manual instruction
        return false;
      }
    }
  };

  const fetchTokenBalances = async () => {
    const currentAddress = localWalletAddress;
    if (!isWalletConnected || !currentAddress) {
        console.log("Skipping balance fetch: Wallet not connected or no address.");
        return;
    }
    const currentProvider = metamaskProvider || window.ethereum;
    if (!currentProvider) {
        console.log("Skipping balance fetch: No provider found.");
        return;
    }

    setIsLoadingBalances(true);
    console.log(`Fetching token balances for ${currentAddress.substring(0, 6)}...`);

    try {
      const provider = new ethers.BrowserProvider(currentProvider);
      const farmBalanceEntry = availableTokens.find(t => t.symbol === 'FARM') || { symbol: "FARM", balance: farmCoins, address: "" };

      const balancePromises = Object.entries(TOKENS).map(async ([symbol, address]) => {
        try {
          const tokenContract = new ethers.Contract(getChecksumAddress(address), TOKEN_ABI, provider);
          const balance = await tokenContract.balanceOf(getChecksumAddress(currentAddress));
          const formattedBalance = parseFloat(ethers.formatUnits(balance, 18));
          console.log(`Fetched ${symbol} balance: ${formattedBalance.toFixed(2)}`);
          return { symbol, balance: formattedBalance, address };
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
          return { symbol, balance: 0, address };
        }
      });

      const fetchedTokenBalances = await Promise.all(balancePromises);
      setAvailableTokens([farmBalanceEntry, ...fetchedTokenBalances]);
      console.log(`Token balances updated successfully!`);

    } catch (error) {
      console.error("Error fetching token balances:", error);
      showAppToast("Failed to fetch token balances", 'error');
    } finally {
      setIsLoadingBalances(false);
      setLastBalanceUpdate(Date.now());
    }
  };

  // Refetch balances periodically and on connect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isWalletConnected && localWalletAddress) {
      fetchTokenBalances(); // Fetch immediately on connect/address change
      intervalId = setInterval(() => {
        if (Date.now() - lastBalanceUpdate > 60000) { // Check every minute
          fetchTokenBalances();
        }
      }, 60000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isWalletConnected, localWalletAddress]); // Dependencies trigger refetch

  // Monitor Transaction
  const monitorTransaction = async (hash: string): Promise<boolean> => {
    setTxStatus("pending");
    setTxHash(hash);
    setShowTxDialog(true);
    const currentProvider = metamaskProvider || window.ethereum;
    if (!currentProvider) {
      showAppToast("No provider available", "error");
      setTxStatus("failed"); return false;
    }
    const provider = new ethers.BrowserProvider(currentProvider);
    try {
      setTxStatus("confirming");
      const receipt = await provider.waitForTransaction(hash, 1, 60000);
      if (receipt && receipt.status === 1) {
        setTxStatus("confirmed");
        showAppToast("Transaction successful!", "success");
        setTimeout(() => setShowTxDialog(false), 2000);
        return true;
      } else {
        console.error("Transaction failed or reverted:", receipt);
        setTxStatus("failed");
        showAppToast("Transaction failed.", "error");
        return false;
      }
    } catch (error) {
      console.error("Error waiting for transaction:", error);
      let errorMsg = "Failed to confirm transaction.";
      if (error instanceof Error && error.message.toLowerCase().includes('timeout')) {
         errorMsg = "Transaction timed out. Check explorer.";
      }
      showAppToast(errorMsg, "error");
      setTxStatus("failed");
      return false;
    }
  };

  // === Core Game Logic & Actions ===

  // Update local token balance state and farmCoins prop if necessary
  const updateLocalTokenBalance = (tokenSymbol: string, amountDelta: number) => {
    if (tokenSymbol === "FARM") {
      addFarmCoins(amountDelta); // Update parent state via prop
    } else {
      setAvailableTokens(prev =>
        prev.map(t =>
          t.symbol === tokenSymbol
            ? { ...t, balance: Math.max(0, t.balance + amountDelta) } // Prevent negative balances
            : t
        )
      );
    }
    console.log(`Local balance updated: ${tokenSymbol} ${amountDelta > 0 ? '+' : ''}${amountDelta.toFixed(2)}`);
  };

  // Handle Bet (Approve & Transfer for Tokens)
  const handleTokenBet = async (betAmount: number): Promise<boolean> => {
    if (approvalPending) {
      showAppToast("Transaction in progress...", "default");
      return false;
    }
    if (!isWalletConnected || !localWalletAddress) {
      showAppToast("Connect wallet first", "error");
      return false;
    }

    const tokenInfo = availableTokens.find(t => t.symbol === selectedToken);
    if (!tokenInfo || !tokenInfo.address) { // Ensure address exists
      showAppToast(`Token ${selectedToken} address not found`, "error");
      return false;
    }
    const tokenAddress = tokenInfo.address;

    setApprovalPending(true);
    showAppToast(`Processing ${selectedToken} bet...`, 'loading');

    try {
      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(getChecksumAddress(tokenAddress), TOKEN_ABI, signer);
      const betAmountWei = ethers.parseUnits(betAmount.toString(), 18);

      // Check Allowance
      const currentAllowance = await tokenContract.allowance(
        getChecksumAddress(localWalletAddress),
        getChecksumAddress(PAYOUT_ADDRESS)
      );

      // Approve if necessary
      if (currentAllowance < betAmountWei) {
        showAppToast(`Approving ${selectedToken}...`, 'loading');
        try {
          const approveTx = await tokenContract.approve(getChecksumAddress(PAYOUT_ADDRESS), betAmountWei);
          const approved = await monitorTransaction(approveTx.hash);
          if (!approved) {
            showAppToast(`Approval failed for ${selectedToken}`, "error");
            setApprovalPending(false); return false;
          }
          showAppToast(`${selectedToken} approved!`, 'success');
        } catch (err: any) {
          if (err.code === 'ACTION_REJECTED') showAppToast("Approval rejected", "error");
          else showAppToast(`Approval error: ${err.message || 'Unknown error'}`, "error");
          console.error("Approval error:", err);
          setApprovalPending(false); return false;
        }
      }

      // Transfer Tokens
      showAppToast(`Sending ${selectedToken}...`, 'loading');
      try {
        const transferTx = await tokenContract.transfer(
          getChecksumAddress(PAYOUT_ADDRESS),
          betAmountWei
        );
        const transferred = await monitorTransaction(transferTx.hash);
        if (!transferred) {
          showAppToast(`Transfer failed for ${selectedToken}`, "error");
          setApprovalPending(false); return false;
        }
        // Success!
        // Note: Local balance is updated *after* successful transfer confirmation
        // betRef and tokenRef are set in the calling spin function
        return true;
      } catch (err: any) {
        if (err.code === 'ACTION_REJECTED') showAppToast("Transfer rejected", "error");
        else showAppToast(`Transfer error: ${err.message || 'Unknown error'}`, "error");
        console.error("Transfer error:", err);
        setApprovalPending(false); return false;
      }
    } catch (error) {
      console.error("Bet handling error:", error);
      showAppToast("Failed to process bet", "error");
      setApprovalPending(false);
      return false;
    }
  };

  // Modified Spin Function
  const spin = async () => {
    const currentBet = bet;
    const currentToken = selectedToken;
    const balance = getCurrentBalance();

    if (balance < currentBet) {
      showAppToast("Insufficient funds", "error");
      // Ensure states are reset on early exit
      setIsSpinning(false);
      setApprovalPending(false);
      return;
    }
    if (isSpinning || approvalPending) {
        console.log('[Spin Attempt Blocked]', { isSpinning, approvalPending });
        // Ensure states are reset if somehow stuck and clicked again
        if (!isSpinning && approvalPending) setApprovalPending(false);
        if (isSpinning && !approvalPending) setIsSpinning(false);
        return;
    }

    console.log('[Spin Start]', { isSpinning, approvalPending }); // Log initial state

    // Wrap core spin logic in try/finally
    try {
      setIsSpinning(true);
      console.log('[Spin] Set isSpinning = true');
      setNeedsClaim(false);
      setLastWinToken(null);
      setWinAmount(0);
      setShowWin(false);
      setWinningLines([]);
      setJackpotMode(false);
      setNearMiss(false);

      let betSuccessful = false;
      // Set pending true only if it's a token bet, otherwise no need
      if (currentToken !== "FARM") {
         setApprovalPending(true);
         console.log('[Spin] Set approvalPending = true (for token bet)');
      }

      // --- Bet Processing ---
      if (currentToken === "FARM") {
        updateLocalTokenBalance("FARM", -currentBet);
        betRef.current = currentBet;
        tokenRef.current = "FARM";
        betSuccessful = true;
        console.log(`Farm Coin bet placed: ${currentBet}`);
      } else {
        betSuccessful = await handleTokenBet(currentBet);
        console.log('[Spin] Token bet result:', { betSuccessful });
        // handleTokenBet resets approvalPending internally ON FAILURE OR REJECTION.
        // If successful, approvalPending remains true until the spin concludes.
      }
      // --------------------

      if (!betSuccessful) {
        // If bet failed (incl. token bet failure handled in handleTokenBet)
        setIsSpinning(false); // Stop immediately
        // Ensure approvalPending is false if bet failed, handleTokenBet might have already set it
        if (approvalPending) {
            setApprovalPending(false);
            console.log('[Spin End] Bet failed, ensured approvalPending = false');
        }
        console.log('[Spin End] Bet failed, set isSpinning = false');
        return; // Exit the try block
      }

      // --- Proceed with Spin Animation (Only if bet was successful) ---
      setSpinCount((prev) => prev + 1);
      playSound(spinSound.current);

      // --- Update Auto-Spin Spent Amount ---
      if (autoSpin && betSuccessful) {
        const betJustMade = betRef.current; // Get the bet amount that was successful
        setAmountSpentOnAutoSpin(prev => {
          const newTotal = prev + betJustMade;
          console.log(`[AutoSpin Update] Spent: ${betJustMade}, New Total Spent: ${newTotal}`);
          return newTotal;
        });
      }
      // ------------------------------------

      const finalSymbols: Symbol[] = Array.from({ length: 3 }, () =>
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      );
      const reelSymbols = generateReelSymbols();

      setReels(
        reels.map((reel, index) => ({
          ...reel,
          spinning: true,
          position: Math.floor(Math.random() * 20),
          symbols: reelSymbols[index],
          stopDelay: 800 + index * 600 + Math.random() * 400, // Keep random delays
        }))
      );

      // Stop Reels Logic (Use Promise.all for better async handling)
      const stopPromises = reels.map((_, index) => {
        return new Promise<void>(resolve => {
          const stopDelay = reels[index].stopDelay; // Use the delay set above
          setTimeout(() => {
            playSound(reelStopSound.current);
            setReels((prevReels) => {
              // Important: Ensure immutability
              const newReels = prevReels.map((r, i) => {
                  if (i === index) {
                     return { ...r, spinning: false, symbol: finalSymbols[index] };
                  }
                  return r;
              });
              return newReels;
            });
            resolve(); // Resolve promise when this reel stops
          }, stopDelay);
        });
      });

      // Wait for all reels to finish stopping
      await Promise.all(stopPromises);

      // Check win *after* all reels have visually stopped
      console.log('[Spin End] All reels stopped visually.');
      await new Promise(resolve => setTimeout(resolve, 500)); // Short delay before win check
      checkWin(finalSymbols);
      console.log('[Spin End] checkWin completed.');

      // Note: isSpinning and approvalPending are reset in the finally block

    } catch (error) {
        console.error("[Spin Error] An error occurred during the spin process:", error);
        // Attempt to reset state even if errors occurred mid-spin
    } finally {
        console.log('[Spin Finally] Resetting isSpinning and approvalPending.');
        setIsSpinning(false);
        // Only reset approvalPending if it wasn't a FARM coin spin
        // because handleTokenBet manages it for token failures.
        // If the token bet *succeeded*, we need to reset it here.
        if (currentToken !== "FARM" && approvalPending) {
             setApprovalPending(false);
        } else if (currentToken === "FARM" && approvalPending){
            // Should not happen for FARM, but reset just in case state is inconsistent
            setApprovalPending(false);
            console.warn("[Spin Finally] approvalPending was true for a FARM spin, resetting.");
        }
    }
  };

  // Modified CheckWin Function
  const checkWin = (finalSymbols: Symbol[]) => {
    const symbolIds = finalSymbols.map((symbol) => symbol.id);
    const allSame = symbolIds.every((id) => id === symbolIds[0]);
    const isNearMiss = !allSame && checkForNearMiss(symbolIds);
    const tokenUsed = tokenRef.current; // Get token used from ref
    const betAmount = betRef.current; // Get bet amount from ref

    if (betAmount <= 0) {
      console.warn("CheckWin called with invalid bet amount, skipping.");
      // Reset refs just in case
      betRef.current = 0;
      tokenRef.current = "FARM";
      return; // Don't process win/loss if bet wasn't registered properly
    }

    if (isNearMiss) {
      setNearMiss(true)
      playSound(nearMissSound.current)
      setLossStreak((prev) => prev + 1)
      setWinStreak(0)
      setLastResults((prev) => [...prev.slice(-9), { win: false, amount: 0 }])
    }

    if (allSame) {
      const matchedSymbol = SYMBOLS.find((s) => s.id === symbolIds[0]);
      if (matchedSymbol) {
        const multiplier = matchedSymbol.value;
        const win = betAmount * multiplier;

        setWinAmount(win);
        setShowWin(true);
        setWinningLines([0]);
        setLossStreak(0);
        setWinStreak((prev) => prev + 1);
        setWinCount((prev) => prev + 1);
        setLastResults((prev) => [...prev.slice(-9), { win: true, amount: win }])

        if (tokenUsed === "FARM") {
          updateLocalTokenBalance("FARM", win);
          setTotalWinnings((prev) => prev + win);
          setBiggestWin((prev) => Math.max(prev, win));
          if (win >= 100) setLastBigWin({ amount: win, multiplier: multiplier });
          setNeedsClaim(false);
          console.log(`FARM Coin win: ${win.toFixed(2)}`);
        } else {
          setNeedsClaim(true);
          setLastWinToken(tokenUsed);
          console.log(`Token win: ${win.toFixed(2)} ${tokenUsed}. Needs claim.`);
          // DO NOT update local token balance here
        }

        const tier = getWinTier(win);
        setWinTier(tier);
        if (tier >= 3) {
          setJackpotMode(true);
          playSound(jackpotSound.current);
          triggerWinAnimation(multiplier, tier);
          showAppToast(`${WIN_TIERS[tier].name}! Won ${win.toFixed(2)} ${tokenUsed}!`, 'success');
        } else {
          playSound(winSound.current);
          triggerWinAnimation(multiplier, tier);
          showAppToast(tier > 0 ? `${WIN_TIERS[tier].name}! Won ${win.toFixed(2)} ${tokenUsed}!` : `Winner! ${win.toFixed(2)} ${tokenUsed}!`, 'success');
        }
        if (win > 50) {
          for (let i = 0; i < Math.min(10, Math.floor(win / 20)); i++) {
            setTimeout(() => playSound(coinSound.current), i * 200);
          }
        }
      }
    } else if (!isNearMiss) {
      setShowLossEffect(true);
      playSound(lossSound.current);
      setLossStreak((prev) => prev + 1);
      setWinStreak(0);
      setLastResults((prev) => [...prev.slice(-9), { win: false, amount: 0 }])
    }

    // Reset bet/token refs for the next spin *after* processing win/loss
    betRef.current = 0;
    tokenRef.current = "FARM";
  };

  // Payout Function (Claiming)
  const processPayout = async (tokenSymbol: string, amount: number): Promise<boolean> => {
    if (!isWalletConnected || !localWalletAddress) {
      showAppToast("Connect wallet to claim", "error"); return false;
    }
    if (amount <= 0) {
      showAppToast("Invalid claim amount", "error"); return false;
    }
    const tokenInfo = availableTokens.find(t => t.symbol === tokenSymbol);
    if (!tokenInfo || !tokenInfo.address) {
      showAppToast(`Cannot claim: Token ${tokenSymbol} address not found`, "error"); return false;
    }
    const tokenAddress = tokenInfo.address;

    setApprovalPending(true); // Disable button
    console.log('[processPayout] Set approvalPending = true');
    showAppToast(`Claiming ${amount.toFixed(2)} ${tokenSymbol}...`, 'loading');

    try {
      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      const signer = await provider.getSigner();
      // Use the Payout Address and SWAP_CONTRACT_ABI for the contract instance
      const payoutContract = new ethers.Contract(getChecksumAddress(PAYOUT_ADDRESS), SWAP_CONTRACT_ABI, signer);
      const tokenAmountWei = ethers.parseUnits(amount.toString(), 18);
      let success = false;

      // Attempt to call transferToken on the payout contract
      try {
        console.log(`Attempting payoutContract.transferToken for ${tokenSymbol}`);
        const tx = await payoutContract.transferToken(
          getChecksumAddress(tokenAddress),
          getChecksumAddress(localWalletAddress),
          tokenAmountWei
        );
        success = await monitorTransaction(tx.hash);
        if (success) console.log(`transferToken succeeded`);
      } catch (error: any) {
        console.error(`transferToken failed:`, error);
        // Add fallback attempts if needed (e.g., claimTestTokens)
      }

      if (success) {
        showAppToast(`Claimed ${amount.toFixed(2)} ${tokenSymbol}!`, 'success');
        updateLocalTokenBalance(tokenSymbol, amount); // Add claimed amount to local balance
        setNeedsClaim(false);
        setLastWinToken(null);
        setWinAmount(0);
        setTimeout(fetchTokenBalances, 5000); // Refresh balances after claim
        setApprovalPending(false); // Re-enable on success
        console.log('[processPayout] Success, set approvalPending = false');
        return true;
      } else {
        showAppToast(`Claim failed for ${tokenSymbol}. Contract might be out of funds or issue occurred.`, "error", { duration: 6000 });
        setApprovalPending(false); // Re-enable on failure
        console.log('[processPayout] Failure, set approvalPending = false');
        return false;
      }
    } catch (error) {
      console.error("Claim error:", error);
      showAppToast("Failed to process claim", "error");
      setApprovalPending(false); // Re-enable on error
      console.log('[processPayout] Error, set approvalPending = false');
      return false;
    }
  };

  // Handle Claim Button Click
  const handleClaim = () => {
    if (needsClaim && lastWinToken && winAmount > 0 && !approvalPending) { // Ensure not already processing
      processPayout(lastWinToken, winAmount);
    } else if (approvalPending) {
      showAppToast("Claim already in progress...", "default");
    }
  };

  // === Other Existing Functions ===

  const playSound = (sound: HTMLAudioElement | null) => {
    if (sound && !muted) {
      sound.currentTime = 0
      sound.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  const increaseBet = () => {
    playSound(clickSound.current)
    const balance = getCurrentBalance();
    if (bet < 100 && bet < balance) {
      setBet((prev) => Math.min(prev + 5, 100, balance))
    }
  }

  const decreaseBet = () => {
    playSound(clickSound.current)
    if (bet > 5) {
      setBet((prev) => Math.max(prev - 5, 5))
    }
  }

  // Auto-spin logic - Refined with logging and clearer conditions
  useEffect(() => {
    const currentBalance = getCurrentBalance(); // Get current balance once
    const currentTarget = targetAutoSpinSpend; // Get target once
    const currentSpent = amountSpentOnAutoSpin; // Get spent amount once
    const currentBet = bet; // Get current bet once

    console.log('[AutoSpin Effect Check]', {
      autoSpin,
      isSpinning,
      approvalPending,
      currentBalance,
      currentBet,
      currentSpent,
      currentTarget,
      canAfford: currentBalance >= currentBet,
      targetReached: currentTarget > 0 && currentSpent >= currentTarget,
      nextExceeds: currentTarget > 0 && (currentSpent + currentBet) > currentTarget,
    });

    if (autoSpinRef.current) {
      console.log('[AutoSpin Effect] Clearing existing timer ID:', autoSpinRef.current);
      clearTimeout(autoSpinRef.current);
      autoSpinRef.current = null;
    }

    // Conditions to STOP auto-spin
    const cannotAffordNext = currentBalance < currentBet;
    const hasReachedTarget = currentTarget > 0 && currentSpent >= currentTarget; // Use value captured at start of effect
    const nextSpinExceedsTarget = currentTarget > 0 && (currentSpent + currentBet) > currentTarget; // Use values captured at start
    const isBetProcessing = approvalPending;
    const isCurrentlySpinning = isSpinning;

    const shouldStop = cannotAffordNext || hasReachedTarget || isBetProcessing || nextSpinExceedsTarget;

    // Conditions to START/SCHEDULE the next spin
    // Ensure target is positive AND we are not currently spinning/processing AND stop conditions aren't met
    const canStart = autoSpin && !isCurrentlySpinning && !isBetProcessing && !shouldStop && currentTarget > 0;

    if (autoSpin && shouldStop) {
        console.log('[AutoSpin Effect] Stopping auto-spin due to conditions:', { cannotAffordNext, hasReachedTarget, isBetProcessing, nextSpinExceedsTarget });
        setAutoSpin(false);
        setTargetAutoSpinSpend(0);
        setAmountSpentOnAutoSpin(0);
        setAutoSpinTotalBet(''); // Reset input field

        if (cannotAffordNext) showAppToast("Auto-spin stopped: Insufficient funds for next spin.", "default");
        else if (isBetProcessing) showAppToast("Auto-spin paused: Transaction pending.", "default");
        else if (hasReachedTarget || nextSpinExceedsTarget) showAppToast("Auto-spin stopped: Target spend reached/exceeded.", "default");

    } else if (canStart) {
        console.log(`[AutoSpin Effect] Conditions met (${currentTarget > 0 ? `${currentSpent.toFixed(2)}/${currentTarget.toFixed(2)}` : 'No target'}), scheduling next spin...`);
        autoSpinRef.current = setTimeout(() => {
            console.log('[AutoSpin Timeout] Firing spin...');
            // Ensure spin function is stable or update dependencies if it changes often
            spin(); // spin will update amountSpentOnAutoSpin
            autoSpinRef.current = null; // Clear ref after spin is initiated by timeout
        }, 1500); // Delay between spins
        console.log('[AutoSpin Effect] Scheduled next spin with timer ID:', autoSpinRef.current);
    } else if (autoSpin) {
        // Log why it didn't start if autoSpin is still true
        console.log('[AutoSpin Effect] Conditions not met for scheduling.', { isCurrentlySpinning, isBetProcessing, shouldStop, currentTarget });
        if (currentTarget <= 0 && autoSpin) {
            showAppToast("Please set a valid total auto-spin amount.", "default");
            setAutoSpin(false); // Stop if target is invalid
            setAutoSpinTotalBet('');
        } else if (isCurrentlySpinning) {
            console.log('[AutoSpin Effect] Waiting for current spin animation to finish.');
        } else if (isBetProcessing) {
            console.log('[AutoSpin Effect] Waiting for bet processing to complete.');
        } else if (shouldStop) {
             console.log('[AutoSpin Effect] Waiting because a stop condition is met.');
        }
    }

    return () => {
      if (autoSpinRef.current) {
        console.log('[AutoSpin Effect Cleanup] Clearing timer ID:', autoSpinRef.current);
        clearTimeout(autoSpinRef.current);
        autoSpinRef.current = null;
      }
    };
  // Add getCurrentBalance (memoized) and setAutoSpinTotalBet to dependencies
  // Note: Adding `spin` here might cause loops if not memoized correctly. Monitor console for excessive runs.
  }, [autoSpin, isSpinning, approvalPending, bet, amountSpentOnAutoSpin, targetAutoSpinSpend, selectedToken, availableTokens, getCurrentBalance, showAppToast, /* spin, */ setAutoSpin, setAmountSpentOnAutoSpin, setTargetAutoSpinSpend, setAutoSpinTotalBet]);
  // Temporarily commented out `spin` from deps to avoid potential infinite loops if it's not memoized. Add back if needed and ensure `spin` is stable (e.g., with useCallback).

  // --- Correct definition for toggleAutoSpin --- 
  const toggleAutoSpin = () => {
    playSound(clickSound.current)
    if (autoSpin) {
        stopAutoSpin(); // Call the correct stop function
    } else {
        const totalBet = parseFloat(autoSpinTotalBet);
        if (isNaN(totalBet) || totalBet <= 0) {
            showAppToast("Please enter a valid total amount for auto-spin.", "error");
            return;
        }
        if (totalBet < bet) {
            showAppToast(`Total must be at least the current bet ($${bet.toFixed(2)})`, "error");
            return;
        }
        const balance = getCurrentBalance();
        if (totalBet > balance) {
            showAppToast(`Cannot auto-spin $${totalBet.toFixed(2)} with balance $${balance.toFixed(2)}`, "error");
            return;
        }
        console.log(`[Toggle Auto Spin] Starting auto-spin with target spend: ${totalBet}`);
        setTargetAutoSpinSpend(totalBet);
        setAmountSpentOnAutoSpin(0);
        setAutoSpin(true);
    }
  };

  // --- Correct definition for stopAutoSpin --- 
  const stopAutoSpin = () => {
    playSound(clickSound.current)
    console.log("[Stop Auto Spin] Stopping auto-spin manually.");
    setAutoSpin(false);
    setTargetAutoSpinSpend(0);
    setAmountSpentOnAutoSpin(0);
    setAutoSpinTotalBet(''); // Reset input field value
    if (autoSpinRef.current) { // Clear any pending spin timeout
        clearTimeout(autoSpinRef.current);
        autoSpinRef.current = null;
        console.log("[Stop Auto Spin] Cleared pending spin timeout.");
    }
  };

  // Reset Effects (Unchanged)
  useEffect(() => {
    if (showLossEffect) {
      const timer = setTimeout(() => {
        setShowLossEffect(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [showLossEffect])

  useEffect(() => {
    if (nearMiss) {
      const timer = setTimeout(() => {
        setNearMiss(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [nearMiss])

  const getWinTier = (amount: number) => {
    for (let i = WIN_TIERS.length - 1; i >= 0; i--) {
      if (amount >= WIN_TIERS[i].threshold) {
        return i
      }
    }
    return 0
  }

  const triggerWinAnimation = (multiplier: number, tier: number) => {
    if (!machineRef.current) return

    // Create confetti explosion
    const rect = machineRef.current.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    // First confetti burst
    confetti({
      particleCount: multiplier * 30,
      spread: 70,
      origin: { x: x / window.innerWidth, y: y / window.innerHeight },
      colors: ["#FFD700", "#FFA500", "#FF4500", "#32CD32", "#1E90FF"],
    })

    // Second confetti burst with delay
    setTimeout(() => {
      confetti({
        particleCount: multiplier * 20,
        spread: 90,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: ["#FFD700", "#FFA500", "#FF4500", "#32CD32", "#1E90FF"],
      })
    }, 300)

    // Add pulsing glow effect to the machine
    machineRef.current.classList.add("win-pulse")
    setTimeout(() => {
      if (machineRef.current) {
        machineRef.current.classList.remove("win-pulse")
      }
    }, 3000)
  }

  const generateReelSymbols = () => {
    // Generate a sequence of symbols for each reel
    return reels.map((_, reelIndex) => {
      // Create an array of 20 random symbols for the spinning animation
      const symbols = Array.from({ length: 20 }, () => {
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      })

      return symbols
    })
  }

  const checkForNearMiss = (symbols: string[]) => {
    // Check if two symbols are the same (potential near miss)
    const counts: Record<string, number> = {}
    symbols.forEach((symbol) => {
      counts[symbol] = (counts[symbol] || 0) + 1
    })

    return Object.values(counts).includes(2)
  }

  const getWinTierStyle = () => {
    return {
      bgColor: WIN_TIERS[winTier].color,
      icon: WIN_TIERS[winTier].icon,
      name: WIN_TIERS[winTier].name,
    }
  }

  const winTierStyle = getWinTierStyle()

  // --- Refactored handleReward --- 
   const handleReward = (amount: number) => {
     // Refactored to use updateLocalTokenBalance for FARM coins
     updateLocalTokenBalance("FARM", amount);
     showAppToast("Reward Claimed!", 'success', { 
       description: `${amount} FARM Coins added to your balance!`
     });
   }

   const handleShare = (platform: string) => {
     toast({
       title: "Shared!",
       description: `Your win has been shared on ${platform}!`,
       variant: "default",
     })
   }

  // === Lifecycle and Setup ===

  // Initialize wallet state from props
  // ... (wallet init useEffect)

  // Sync farmCoins prop with FARM balance in availableTokens
  // ... (farmCoins sync useEffect)

  // Audio Init & Intro Timer
  useEffect(() => {
    spinSound.current = new Audio("/spin-sound.mp3");
    winSound.current = new Audio("/win-sound.mp3");
    jackpotSound.current = new Audio("/jackpot-sound.mp3");
    reelStopSound.current = new Audio("/reel-stop.mp3");
    clickSound.current = new Audio("/click-sound.mp3");
    coinSound.current = new Audio("/coin-sound.mp3");
    lossSound.current = new Audio("/loss-sound.mp3");
    nearMissSound.current = new Audio("/near-miss-sound.mp3");

    console.log("Setting intro timer...");
    const introTimer = setTimeout(() => {
      console.log("Hiding intro animation via timer...");
      setShowIntro(false);
    }, 3000);

    return () => {
      console.log("Cleaning up: Clearing intro timer.");
      clearTimeout(introTimer);
      // Cleanup other refs if necessary
      if (autoSpinRef.current) clearTimeout(autoSpinRef.current);
    };
  }, []); // Run only once on mount

  // Load/Save Game State (Keep simple for now)
  // ... (localStorage useEffects)

  // === Render Logic ===
  return (
    <div className="max-w-2xl mx-auto p-2 rounded-xl bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-2xl shadow-black/30 border border-gray-800">
      {/* Loading Overlays */} 
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-gray-600 border-t-cyan-400 rounded-full"></div>
        </div>
      )}
      {isLoadingBalances && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-gray-600 border-t-cyan-400 rounded-full mx-auto mb-2"></div>
              <p className="text-white">Loading Balances...</p>
            </div>
          </div>
      )}

      {/* Dialogs */} 
      {showWalletOptions && (
        <Dialog open={showWalletOptions} onOpenChange={setShowWalletOptions}>
          <DialogContent className="bg-gray-900 text-white border-gray-700">
            <DialogHeader><DialogTitle>Connect Wallet</DialogTitle></DialogHeader>
            <div className="flex flex-col space-y-3 py-4">
              <Button onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)} className="justify-start">
                 <img src="/metamask-fox.svg" alt="MetaMask" width={24} height={24} className="mr-2" /> MetaMask
              </Button>
              {/* Add other wallet options here if needed */}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {showTxDialog && (
        <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
           <DialogContent className="bg-gray-900 text-white border-gray-700">
             <DialogHeader><DialogTitle>Transaction Status</DialogTitle></DialogHeader>
             <div className="py-4 text-center">
               <p className="mb-2">Status: <span className="font-semibold">{txStatus}</span></p>
               {/* Add spinner/icons based on txStatus */} 
               {txHash && (
                 <a href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline break-all text-sm">
                   View on Explorer
                 </a>
               )}
               {txStatus === 'failed' && <p className="text-red-500 mt-2">Transaction failed.</p>}
               {txStatus === 'confirmed' && <p className="text-green-500 mt-2">Transaction successful!</p>}
             </div>
           </DialogContent>
         </Dialog>
      )}

      {/* Intro animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              }}
              className="text-center"
            >
              <motion.h1
                className="text-5xl font-bold text-amber-400 mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  textShadow: [
                    "0 0 10px rgba(251, 191, 36, 0.7)",
                    "0 0 20px rgba(251, 191, 36, 0.9)",
                    "0 0 10px rgba(251, 191, 36, 0.7)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              >
                MEGA FORTUNE
              </motion.h1>
              <motion.div
                className="flex justify-center gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {SYMBOLS.map((symbol, i) => (
                  <motion.div
                    key={symbol.id}
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="relative"
                  >
                    <img 
                      src={symbol.image} 
                      alt={symbol.id} 
                      className="w-12 h-12 slot-image rounded-full object-cover"
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          `0 0 0px ${symbol.bgColor}`,
                          `0 0 20px ${symbol.bgColor}`,
                          `0 0 0px ${symbol.bgColor}`,
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        delay: i * 0.2,
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <motion.p
                className="text-white text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                Match 3 coins to win big!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top section */}
      <div className="flex justify-between items-center mb-4">
         {/* --- Wallet Connect / Balance Display --- */}
         {isWalletConnected ? (
           <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 flex items-center gap-2 text-sm shadow-inner flex-wrap">
             <span className="text-lime-400 animate-pulse">●</span>
             <span className="text-white font-mono truncate" title={localWalletAddress}>{localWalletAddress.substring(0, 6)}...{localWalletAddress.substring(localWalletAddress.length - 4)}</span>
             <button onClick={handleDisconnect} className="text-xs bg-red-600/80 text-white px-1.5 py-0.5 rounded hover:bg-red-500 transition-colors ml-auto">Disconnect</button>
           </div>
         ) : (
           <Button onClick={() => setShowWalletOptions(true)} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"><Wallet className="w-4 h-4 mr-1" /> Connect Wallet</Button>
         )}
         {/* --------------------------------------- */} 

         <div className="flex gap-1">
           {/* Refresh Balances Button */} 
           {isWalletConnected && (
             <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => fetchTokenBalances()} disabled={isLoadingBalances} title="Refresh Balances">
               <RefreshCw className={`w-5 h-5 ${isLoadingBalances ? 'animate-spin' : ''}`} />
             </Button>
           )}
           {/* Mute & Settings Buttons */} 
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setMuted(!muted)}>
             {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
           </Button>
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setShowSettings(true)}>
             <Settings className="w-5 h-5" />
           </Button>
         </div>
       </div>

       {/* Game Features Panel */} 
       <div className="w-full mb-4">
         <details className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800 shadow-lg">
           <summary className="p-2 text-sm font-medium text-gray-300 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-center">
             <span className="flex-1">Game Features</span>
             <span className="text-xs text-gray-500">(click to expand)</span>
           </summary>
           <div className="p-2 bg-gray-900/80">
             <div className="flex flex-wrap gap-2">
               <DailyRewards onClaimReward={handleReward} />
               <Achievements
                 spinCount={spinCount}
                 winCount={winCount}
                 biggestWin={biggestWin}
                 totalWinnings={totalWinnings}
                 lossStreak={lossStreak}
                 winStreak={winStreak}
               />
               <SocialFeatures onShare={handleShare} bigWin={lastBigWin || undefined} />
             </div>
           </div>
         </details>
       </div>

       {/* Progress bar */} 
       <div className="w-full mb-2">
         <ProgressSystem spinCount={spinCount} winCount={winCount} />
       </div>

       {/* Stats panel */} 
       <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full mb-4 overflow-hidden"
            >
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm border border-gray-800">
                 <div className="grid grid-cols-2 gap-2">
                    {/* ... stats grid items ... */} 
                 </div>
                 <div className="mt-2">
                    {/* ... last results ... */} 
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

       {/* Slot Machine Cabinet */} 
       <motion.div 
         ref={machineRef} 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ type: "spring", duration: 0.5 }}
         className={cn(
           "overflow-hidden rounded-xl shadow-2xl transition-all duration-300 relative border-2",
           jackpotMode
             ? "bg-gradient-to-b from-yellow-600 to-amber-900 border-yellow-400 shadow-yellow-400/30"
             : "bg-gradient-to-b from-indigo-900 to-purple-900 border-gray-800 shadow-purple-500/30",
           showLossEffect && "shake-animation",
         )}
       >
         {/* Ambient light effect */} 
         <div className="absolute -inset-40 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-3xl transform -rotate-12 opacity-50"></div>
 
         {/* Near miss effect */} 
         {nearMiss && (
           <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
             <div className="absolute inset-0 bg-orange-600/20 animate-near-miss-pulse"></div>
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: [1, 1.3, 1], opacity: 1 }}
               transition={{ duration: 0.5, repeat: 1, repeatType: "reverse" }}
               className="text-orange-300 font-extrabold text-3xl text-shadow-lg animate-bounce-strong"
             >
               SO CLOSE!
             </motion.div>
           </div>
         )}
 
          {/* --- Logo --- */} 
          <div
           className={cn(
             "py-2 px-4 flex justify-center items-center relative overflow-hidden",
             jackpotMode
               ? "bg-gradient-to-r from-amber-600 to-yellow-500"
               : "bg-gradient-to-r from-indigo-900 to-purple-900",
           )}
         >
           {/* Animated background light */} 
           <div className="absolute inset-0 w-full h-full">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/20 to-purple-500/0 animate-pulse-slow"></div>
             {jackpotMode && (
               <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-amber-400/40 to-yellow-400/0 animate-pulse-fast scale-150 blur-md"></div>
             )}
           </div>
 
           <h2
             className={cn(
               "text-xl md:text-2xl font-bold tracking-wider flex items-center gap-2 relative z-10",
               jackpotMode ? "text-white" : "text-amber-400",
             )}
           >
             {jackpotMode && <Sparkles className="w-5 h-5 animate-pulse" />} 
             MEGA FORTUNE
             {jackpotMode && <Sparkles className="w-5 h-5 animate-pulse" />} 
           </h2>
         </div>
         {/* --- End Logo --- */} 
 
          {/* Auto-spin indicator */} 
          {autoSpin && (
           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs text-center py-1 font-bold">
             AUTO-SPIN: {targetAutoSpinSpend > 0 ? `${amountSpentOnAutoSpin.toFixed(2)}/${targetAutoSpinSpend.toFixed(2)}` : "∞"}
           </div>
         )}
 
          {/* Spin counter */} 
          <div className="bg-black/80 text-white text-xs text-center py-1">SPINS: {spinCount}</div>
 
          {/* --- Reels Container --- */} 
          <div className="p-4 bg-gradient-to-b from-gray-900 to-black relative">
            {/* Win lines */} 
            <div className="absolute inset-0 z-10 pointer-events-none">
              {winningLines.includes(0) && (
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-yellow-400 transform -translate-y-1/2 animate-pulse-fast"></div>
              )}
            </div>
 
            {/* Actual Reels Rendering */} 
            <div className="flex justify-center gap-2 p-2 bg-gray-800 rounded-lg border-2 border-gray-700 relative overflow-hidden">
              {/* Background light effect */} 
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5"></div>
 
              {reels.map((reel, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-1/3 aspect-square flex items-center justify-center rounded-md bg-black border-2 overflow-hidden relative",
                    reel.spinning ? "border-blue-500" : jackpotMode ? "border-yellow-400" : "border-gray-700",
                    showWin && !reel.spinning && "shadow-inner shadow-yellow-400/50",
                  )}
                >
                  {/* Reel background glow */} 
                  <div
                    className={cn(
                      "absolute inset-0 opacity-20",
                      reel.spinning
                        ? "bg-blue-500 animate-pulse"
                        : showWin
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-gray-800",
                    )}
                  ></div>
 
                  {/* Spinning/Stopped Symbol Rendering (Restored Animation) */}
                  <AnimatePresence mode="wait">
                    {reel.spinning ? (
                      // Spinning View
                      <motion.div
                        key="spinning"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
                      >
                        {reel.symbols.slice(reel.position, reel.position + 3).map((spinSymbol, i) => (
                          <motion.img
                            key={`${spinSymbol.id}-${i}`} // Use unique key
                            src={spinSymbol.image}
                            alt="spinning"
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover my-1"
                            animate={{ y: [0, -50 * reel.symbols.length], opacity: [1, 0.5, 0] }} // Adjust animation distance based on symbol count
                            transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      // Stopped View
                      <motion.div
                        key={reel.symbol?.id || 'stopped-fallback'}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.4 }}
                        className={cn(
                          "flex items-center justify-center h-full w-full",
                          showWin && "animate-pulse-strong" // Added strong pulse on win
                        )}
                      >
                        <img
                          src={reel.symbol?.image || SYMBOLS[0].image} // Fallback if symbol is undefined
                          alt={reel.symbol?.id || 'fallback'}
                          className={cn(
                            "w-12 h-12 md:w-16 md:h-16 rounded-full object-cover",
                            showWin ? "slot-image-win" : "slot-image",
                            showWin && "coin-glow" // Add glow on win
                          )}
                         />
                       </motion.div>
                     )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          {/* --- End Reels --- */}

          {/* Win display */} 
          <AnimatePresence>
            {showWin && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className={cn(
                   "text-white text-center py-3 font-bold text-xl overflow-hidden",
                   `bg-gradient-to-r ${winTierStyle.bgColor}`,
                 )}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
                  className="flex items-center justify-center gap-2"
                >
                  {winTierStyle.icon && <winTierStyle.icon className="w-6 h-6 animate-pulse" />} 
                  {winTierStyle.name && <span>{winTierStyle.name}!</span>} 
                   ${winAmount.toFixed(2)} {needsClaim ? lastWinToken : 'FARM'}
                  {needsClaim && <span className="text-xs ml-2 opacity-80">(Claim Needed)</span>}
                  {winTierStyle.icon && <winTierStyle.icon className="w-6 h-6 animate-pulse" />} 
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

         {/* --- Controls Section --- */} 
         <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col gap-4">
           
           {/* --- Token Select & Balance --- */} 
           <div className="flex items-center gap-2">
             <Select value={selectedToken} onValueChange={setSelectedToken} disabled={isSpinning || approvalPending || autoSpin}>
               <SelectTrigger className="flex-1 bg-gray-900 border-gray-700 text-white focus:ring-cyan-500">
                 <SelectValue placeholder="Select Token" />
               </SelectTrigger>
               <SelectContent className="bg-gray-900 text-white border-gray-700">
                 {availableTokens.filter(t => t.symbol === 'FARM').map(token => (
                     <SelectItem key={token.symbol} value={token.symbol} className="focus:bg-gray-700">{token.symbol}</SelectItem>
                 ))}
                 {availableTokens.filter(t => t.symbol !== 'FARM').map(token => (
                     <SelectItem key={token.symbol} value={token.symbol} className="focus:bg-gray-700">{token.symbol}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <div className="text-white text-sm font-mono bg-gray-900/50 border border-gray-700 px-3 py-2 rounded-md min-w-[100px] text-right">
               {getCurrentBalance().toFixed(2)}
             </div>
           </div>
           {/* ----------------------------- */} 

           {/* Bet controls (Slider) */} 
           <div className="flex items-center gap-2">
             <Button size="icon" disabled={bet <= 5 || isSpinning || approvalPending || autoSpin} onClick={() => setBet(b => Math.max(5, b - 5))}><Minus className="w-4 h-4" /></Button>
             <Slider value={[bet]} min={5} max={100} step={5} disabled={isSpinning || approvalPending || autoSpin} onValueChange={(v) => setBet(v[0])} />
             <Button size="icon" disabled={bet >= 100 || bet >= getCurrentBalance() || isSpinning || approvalPending || autoSpin} onClick={() => setBet(b => Math.min(100, getCurrentBalance(), b + 5))}><Plus className="w-4 h-4" /></Button>
           </div>

           {/* Bet display */} 
           <div className="flex justify-between items-center">
              <div className="text-white">
                <span className="text-gray-400 text-xs">BET: </span>
                <span className="text-lg font-bold">${bet.toFixed(2)}</span>
                <span className="text-xs ml-1 text-gray-400">({selectedToken})</span>
              </div>
             <Button variant="ghost" size="sm" onClick={() => setShowStats(s => !s)}>{showStats ? "Hide" : "Show"} Stats</Button>
           </div>

           {/* --- NEW: Auto Spin Total Amount Input --- */}
           <div className="flex items-center gap-2">
               <label htmlFor="auto-spin-total" className="text-sm font-medium text-gray-400 whitespace-nowrap">Auto-Spin Total:</label>
               <Input
                 id="auto-spin-total"
                 type="number"
                 value={autoSpinTotalBet}
                 onChange={(e) => setAutoSpinTotalBet(e.target.value)}
                 disabled={autoSpin} // Disable input while auto-spin is active
                 className="w-full p-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-gray-500 disabled:opacity-50"
                 placeholder={`Min $${bet.toFixed(2)}`}
                 min={bet} // Set min based on current bet
                 step="0.01"
               />
           </div>
           {/* ----------------------------------------- */} 

           {/* --- Action Buttons --- */} 
           <div className="grid grid-cols-2 gap-2">
             {/* Spin / Claim Button */} 
             {needsClaim ? (
               <Button
                 size="lg"
                 onClick={handleClaim}
                 disabled={approvalPending} // Disable claim if tx pending
                 className="col-span-2 font-bold text-lg py-5 bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white animate-pulse shadow-lg"
               >
                 {approvalPending ? 'Claiming...' : `Claim ${winAmount.toFixed(2)} ${lastWinToken}`}
               </Button>
             ) : (
               <Button
                 size="lg"
                 disabled={isSpinning || approvalPending || getCurrentBalance() < bet || autoSpin} // Disable SPIN if auto-spin is ON
                 onClick={spin}
                 className={cn('font-bold text-lg py-5 transition-all duration-300 shadow-lg', (isSpinning || approvalPending || getCurrentBalance() < bet || autoSpin) ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white')}
               >
                 <span className="relative z-10">
                   {approvalPending ? 'Processing...' : isSpinning ? 'SPINNING...' : 'SPIN'}
                 </span>
               </Button>
             )}

            {/* Auto Spin Button */} 
            {!needsClaim && ( // Only show if not in claim state
              autoSpin ? (
                <Button
                  size="lg"
                  onClick={stopAutoSpin} // Use the dedicated stop function
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-5"
                >
                  STOP AUTO
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={isSpinning || approvalPending || getCurrentBalance() < bet} // Disable AUTO SPIN if spinning, pending, or balance too low
                  onClick={toggleAutoSpin} // Use the toggle function
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg py-5 disabled:opacity-50"
                >
                  AUTO SPIN
                </Button>
              )
            )}
          </div>
         </div>

          {/* --- Paytable --- */} 
          <div className="p-3 bg-black text-white border-t border-gray-800">
           <h3 className="text-center font-bold mb-2 text-sm">MATCH 3 COINS TO WIN</h3>
           <div className="grid grid-cols-5 gap-1">
             {SYMBOLS.map((symbol) => (
               <div key={symbol.id} className="flex flex-col items-center bg-gray-900/50 p-1 rounded-md">
                 <img 
                   src={symbol.image} 
                   alt={symbol.id} 
                   className="w-6 h-6 rounded-full object-cover"
                 />
                 <span className="mt-1 font-bold text-xs">{symbol.value}x</span>
               </div>
             ))}
           </div>
         </div>
         {/* --- End Paytable --- */} 
          
       </motion.div>

      {/* Settings Dialog */} 
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
         <DialogContent className="bg-gray-900 text-white border-gray-700">
             <DialogHeader><DialogTitle>Settings</DialogTitle></DialogHeader>
             <div className="space-y-4 py-2">
                 {/* Remove Max Auto Spin Input - Keep others */}
                 <div className="space-y-2">
                     <label className="text-sm font-medium">Sound Effects</label>
                     <Button
                       variant={muted ? "outline" : "default"}
                       onClick={() => setMuted(!muted)}
                       className={muted ? "bg-gray-800 text-gray-300" : ""}
                     >
                       {muted ? "Sound Off" : "Sound On"}
                     </Button>
                 </div>
                 <div className="space-y-2">
                     <label className="text-sm font-medium">Reset Game</label>
                     {/* Add proper reset logic later if needed */}
                     <Button
                       variant="destructive"
                       onClick={() => console.log("Reset Placeholder")}
                     >
                       Reset All Stats (Placeholder)
                     </Button>
                 </div>
             </div>
         </DialogContent>
       </Dialog>

       {/* Variable rewards */} 
       <VariableRewards spinCount={spinCount} onReward={handleReward} />
     </div>
   )
}
