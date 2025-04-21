'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';

// Blockchain constants
const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Game timing constants
const WAIT_TIME_SECONDS = 5; // Reduced from 20 to 5 seconds
const CLAIM_TIME_SECONDS = 5; // Reduced from 20 to 5 seconds

// Wallet options
const WALLET_OPTIONS = {
  AGW: "agw",
  METAMASK: "metamask" 
};

// Central payout address that holds tokens for the game
const PAYOUT_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0";

// Token addresses
const TOKENS = {
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

// Token ABI
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)", // <<< Fixed uint250 typo >>>
  "function transferFrom(address from, address to, uint256 value) returns (bool)"
];

// ABI for the swap contract that handles token claiming/transfers and swaps
const SWAP_CONTRACT_ABI = [
  "function swapTokenForFarmCoins(address tokenAddress, uint256 tokenAmount) external returns (uint256)",
  "function transferToken(address tokenAddress, address to, uint256 amount) external returns (bool)",
  "function claimTestTokens(address tokenAddress, uint256 amount) external returns (bool)",
  "function getContractTokenBalance(address tokenAddress) external view returns (uint256)",
  "function directTokenTransfer(address tokenAddress, address to, uint256 amount) external returns (bool)"
];

// ABI for ERC20 token - minimal version for balance checking
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

interface TokenBalance {
  symbol: string;
  balance: number;
  address: string;
}

interface CrashoutGameProps {
  farmCoins: number;
  addFarmCoins: (delta: number) => void;
  tokenBalances?: Record<string, number>; 
  updateTokenBalance?: (token: string, amount: number) => void;
  walletAddress?: string; // Connected wallet address
  provider?: any; // Web3 provider
}

interface HistoryEntry { 
  value: string; 
  bet: number; 
  token: string;
  cashoutMultiplier?: number | null; // Added: Multiplier user cashed out at
}

// Token value mapping for conversion when swapTokenForFarmCoins fails
const TOKEN_FARM_COIN_RATES = {
  NOOT: 1.0,
  ABSTER: 10.0,
  ABBY: 5.0,
  CHESTER: 7.5,
  DOJO3: 3.5,
  FEATHERS: 2.0,
  MOP: 20.0,
  NUTZ: 1.5,
  PAINGU: 4.0,
  PENGUIN: 3.0,
  PUDGY: 15.0,
  RETSBA: 8.0,
  WOJACT: 6.0,
  YUP: 2.5
};

// Utility to sample crash point from 1× up to 50× with heavy tail
const sampleCrashPoint = (): number => {
  // 3% chance to crash instantly at 1×
  if (Math.random() < 0.03) return 1;
  // Pareto distribution for tail
  const alpha = 2; // tail exponent: higher => rarer large jumps
  const u = Math.random();
  const x = 1 / Math.pow(u, 1 / alpha);
  // cap at 50×
  return Math.min(Math.max(x, 1), 50);
};

// Add toast configuration to ensure notifications disappear
const showToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
  // Dismiss any existing toasts first
  toast.dismiss();
  
  // Show new toast with auto-dismiss after 3 seconds
  if (type === 'success') {
    return toast.success(message, { duration: 3000 });
  } else if (type === 'error') {
    return toast.error(message, { duration: 3000 });
  } else {
    return toast.loading(message, { duration: 5000 }); // Loading toasts auto-dismiss after 5s
  }
};

function CrashoutGame({ 
  farmCoins, 
  addFarmCoins, 
  tokenBalances = {}, 
  updateTokenBalance,
  walletAddress = "", 
  provider = null 
}: CrashoutGameProps) {
  // Persist farmCoins to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('farmCoins', farmCoins.toString());
  }, [farmCoins]);
  
  // Define updateLocalTokenBalance helper function first
  const updateLocalTokenBalance = (token: string, amount: number) => {
    if (token === "FARM") {
      addFarmCoins(amount);
    } else if (updateTokenBalance) {
      updateTokenBalance(token, amount);
    }
    
    // Update local state
    setAvailableTokens(prev => 
      prev.map(t => 
        t.symbol === token 
          ? { ...t, balance: t.balance + amount } 
          : t
      )
    );

    // Log transaction for debugging
    console.log(`Token balance updated: ${token} ${amount > 0 ? '+' : ''}${amount}`);
  };
  
  const [betAmount, setBetAmount] = useState<string>('');
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameState, setGameState] = useState<'inactive' | 'active' | 'crashed' | 'approving' | 'claiming' | 'simulating'>('inactive');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasCashed, setHasCashed] = useState<boolean>(false);
  const hasCashedRef = useRef<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [betPlaced, setBetPlaced] = useState<boolean>(false);
  const [approvalPending, setApprovalPending] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const betRef = useRef<number>(0);
  const userJoinedRef = useRef<boolean>(false); // Use ref instead of state for interval closure
  const crashPointRef = useRef<number>(1);
  const intervalRef = useRef<number | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const crashRef = useRef<HTMLAudioElement | null>(null);
  const cashoutRef = useRef<HTMLAudioElement | null>(null);
  const winRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // New state for token selection and balances
  const [selectedToken, setSelectedToken] = useState<string>("FARM");
  const tokenRef = useRef<string>("FARM");
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([
    { symbol: "FARM", balance: farmCoins, address: "" }
  ]);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);
  
  // Wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [localWalletAddress, setLocalWalletAddress] = useState<string>(walletAddress);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<'none' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('none');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTxDialog, setShowTxDialog] = useState<boolean>(false);
  const [contractBalances, setContractBalances] = useState<Record<string, number>>({});
  const [showContractBalances, setShowContractBalances] = useState<boolean>(false);
  const [isLoadingContractBalances, setIsLoadingContractBalances] = useState<boolean>(false);

  // Add a new state variable for debug logs
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [simulatedMultiplier, setSimulatedMultiplier] = useState<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  // Add ref to store cashout multiplier for history
  const cashoutMultiplierRef = useRef<number | null>(null);
  // Add celebrate state for pop visuals on win
  const [celebrate, setCelebrate] = useState<boolean>(false);
  // Add new state to track if auto cashout has completed and claiming is ready
  const [autoClaimReady, setAutoClaimReady] = useState<boolean>(false);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null); // Moved here

  // Add a custom log function that stores logs in the UI
  const logToUI = (message: string) => {
    console.log(message); // Still log to console
    setDebugLogs(prev => [new Date().toLocaleTimeString() + ': ' + message, ...prev.slice(0, 19)]);
  };

  // Update walletAddress when the prop changes
  useEffect(() => {
    if (walletAddress) {
      setLocalWalletAddress(walletAddress);
      setIsWalletConnected(true);
    }
  }, [walletAddress]);

  // Connect wallet and fetch token balances
  const connectWallet = async (walletType?: string) => {
    try {
      setIsLoading(true);
      
      // If no wallet type specified, show wallet options dialog
      if (!walletType) {
        setShowWalletOptions(true);
        setIsLoading(false);
        return;
      }
      
      switch (walletType) {
        case WALLET_OPTIONS.METAMASK:
          await connectMetaMask();
          break;
        default:
          console.error("Unknown wallet type");
      }
      
      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting to wallet:`, error);
      toast.error(`Failed to connect wallet. Please try again.`);
    } finally {
      setIsLoading(false);
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
        setLocalWalletAddress(accounts[0]);
        setMetamaskProvider(window.ethereum);
        
        // Switch to Abstract Testnet
        await switchToAbstractTestnet(window.ethereum);
        
        // Fetch token balances
        fetchTokenBalances();
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
      // Reset connection state
      setIsWalletConnected(false);
      setActiveWallet(null);
      setLocalWalletAddress('');
      
      toast.success("Wallet disconnected");
      
      // Reset token balances except Farm Coins
      setAvailableTokens([
        { symbol: "FARM", balance: farmCoins, address: "" }
      ]);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };
  
  // Switch to Abstract Testnet
  const switchToAbstractTestnet = async (provider: any = null) => {
    // Use provided provider or get current provider
    const targetProvider = provider || window.ethereum;
    
    if (!targetProvider) {
      toast.error("No wallet provider detected");
      return false;
    }
    
    try {
      // Check current network
      const chainId = await targetProvider.request({ method: 'eth_chainId' });
      console.log("Current chain ID:", chainId);
      
      // Already on Abstract Testnet
      if (chainId === ABSTRACT_TESTNET_CHAIN_ID) {
        return true;
      }
      
      // Try to switch to Abstract Testnet
      await targetProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ABSTRACT_TESTNET_CHAIN_ID }],
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

  // Monitor transaction status with improved error handling
  const monitorTransaction = async (hash: string, isRetryAttempt = false): Promise<boolean> => {
    try {
      setTxStatus("pending");
      setTxHash(hash);
      setShowTxDialog(true);
      
      const currentProvider = metamaskProvider || window.ethereum;
      if (!currentProvider) {
        showToast("No provider available to monitor transaction", "error");
        setTxStatus("failed");
        return false;
      }

      const provider = new ethers.BrowserProvider(currentProvider);
      
      // Wait for transaction to be mined with shorter timeout
      let attempts = 0;
      const maxAttempts = 15; // Reduced from 30 to 15 attempts with 1 second delay
      let tx = null;
      
      while (attempts < maxAttempts) {
        try {
          tx = await provider.getTransaction(hash);
          if (tx) break;
        } catch (err) {
          console.error("Error fetching transaction, retrying:", err);
        }
        
        // Wait 1 second before retrying (reduced from 2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (!tx) {
        console.error(`Transaction not found after ${attempts} attempts`);
        setTxStatus("failed");
        showToast("Transaction not found. Please check the block explorer.", "error");
        return false;
      }
      
      setTxStatus("confirming");
      
      try {
        // Wait for transaction confirmation with shorter timeout
        const receipt = await Promise.race([
          provider.waitForTransaction(hash),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000) // Reduced from 120s to 60s
          )
        ]) as ethers.TransactionReceipt;
        
        if (receipt && receipt.status === 1) {
          setTxStatus("confirmed");
          return true;
        } else {
          if (isRetryAttempt) {
            console.log("This attempt didn't succeed - trying alternative method...");
          } else {
            console.error("Transaction failed or was reverted:", receipt);
            setTxStatus("failed");
            showToast("Transaction failed. Please check the block explorer for details.", "error");
          }
          return false;
        }
      } catch (error) {
        console.error("Error waiting for transaction:", error);
        setTxStatus("failed");
        showToast("Failed to confirm transaction. Check the explorer.", "error");
        return false;
      }
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      setTxStatus("failed");
      return false;
    }
  };

  // Helper function to get checksummed address
  const getChecksumAddress = (address: string): string => {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      console.error("Invalid address format:", error);
      return address;
    }
  };

  // Fetch balances when wallet or provider changes
  useEffect(() => {
    if (isWalletConnected && localWalletAddress) {
      logToUI(`Fetching token balances for wallet ${localWalletAddress.substring(0, 6)}...`);
      fetchTokenBalances();
    }
  }, [isWalletConnected, localWalletAddress, metamaskProvider]);

  // Update fetchTokenBalances to include more logging
  const fetchTokenBalances = async () => {
    if (!metamaskProvider && !window.ethereum) {
      logToUI("No provider available to fetch token balances");
      return;
    }
    if (!localWalletAddress) {
      logToUI("No wallet address available to fetch token balances");
      return;
    }
    
    setIsLoadingBalances(true);
    logToUI(`🔄 Started loading token balances from blockchain...`);
    
    try {
      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      const tokens: TokenBalance[] = [
        { symbol: "FARM", balance: farmCoins, address: "" }
      ];
      
      // Use Promise.all to fetch all token balances in parallel
      const balancePromises = Object.entries(TOKENS).map(async ([symbol, address]) => {
        try {
          // Create token contract
          const tokenContract = new ethers.Contract(
            getChecksumAddress(address), 
            TOKEN_ABI, 
            provider
          );
          
          // Get balance
          const balance = await tokenContract.balanceOf(getChecksumAddress(localWalletAddress));
          const formattedBalance = parseFloat(ethers.formatUnits(balance, 18));
          
          logToUI(`✅ Fetched ${symbol} balance: ${formattedBalance.toFixed(2)}`);
          
          return {
            symbol,
            balance: formattedBalance,
            address
          };
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
          logToUI(`❌ Failed to fetch ${symbol} balance`);
          return {
            symbol,
            balance: 0,
            address
          };
        }
      });
      
      const tokenBalances = await Promise.all(balancePromises);
      setAvailableTokens([...tokens, ...tokenBalances]);
      logToUI(`✅ All token balances loaded successfully!`);
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
      logToUI(`❌ Error fetching token balances: ${error}`);
    } finally {
      setIsLoadingBalances(false);
      setLastBalanceUpdate(Date.now());
    }
  };

  // Update FARM token balance when farmCoins changes
  useEffect(() => {
    setAvailableTokens(prev => 
      prev.map(token => 
        token.symbol === "FARM" 
          ? { ...token, balance: farmCoins } 
          : token
      )
    );
  }, [farmCoins]);

  // Refetch balances every minute to keep them updated
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isWalletConnected && localWalletAddress && (metamaskProvider || window.ethereum) && Date.now() - lastBalanceUpdate > 60000) {
        fetchTokenBalances();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isWalletConnected, localWalletAddress, metamaskProvider, lastBalanceUpdate]);

  useEffect(() => {
    // preload sounds
    bgmRef.current = new Audio('/sounds/background_music.mp3');
    bgmRef.current.volume = volume;
    bgmRef.current.muted = muted;
    bgmRef.current.loop = true;
    cashoutRef.current = new Audio('/sounds/cashout.mp3');
    cashoutRef.current.volume = volume;
    cashoutRef.current.muted = muted;
    crashRef.current = new Audio('/sounds/crash.mp3');
    crashRef.current.volume = volume;
    crashRef.current.muted = muted;
    winRef.current = new Audio('/sounds/win.mp3');
    winRef.current.volume = volume;
    winRef.current.muted = muted;
    return () => {
      bgmRef.current?.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    // sync mute/volume changes to all audio refs
    [bgmRef, cashoutRef, crashRef, winRef].forEach(r => {
      if (r.current) {
        r.current.volume = volume;
        r.current.muted = muted;
      }
    });
  }, [volume, muted]);

  // Approve token spending and place bet
  const approveAndPlaceBet = async () => {
    if (approvalPending) {
      showToast("Transaction already in progress, please wait", "error");
      return;
    }

    const bet = parseFloat(betAmount);
    if (!bet || bet <= 0) {
      showToast("Please enter a valid bet amount", "error");
      return;
    }
    
    // Log bet amount for debugging
    console.log(`Attempting to place bet: ${bet} ${selectedToken}`);
    
    const selectedTokenBalance = availableTokens.find(t => t.symbol === selectedToken)?.balance || 0;
    
    if (bet > selectedTokenBalance) {
      showToast(`Not enough ${selectedToken}! You have ${selectedTokenBalance.toFixed(2)} but need ${bet.toFixed(2)}`, "error");
      return;
    }

    if (!isWalletConnected || !localWalletAddress) {
      showToast("Please connect your wallet first", "error");
      return;
    }

    try {
      // Handle Farm coins locally
      if (selectedToken === "FARM") {
        updateLocalTokenBalance("FARM", -bet);
        setBetPlaced(true);
        // CRITICAL: Set the bet reference here for Farm Coins
        betRef.current = bet;
        tokenRef.current = "FARM";
        console.log(`Bet placed: ${bet} Farm Coins, betRef.current=${betRef.current}`);
        showToast(`Bet placed: ${bet} Farm Coins`, "success");
        
        // --- FIX: Immediately start the round for FARM coins --- 
        logToUI("🚀 Starting round immediately for FARM coin bet.");
        // Short delay to allow toast to show before state change
        setTimeout(() => {
          if (gameState === 'inactive') { // Only start if inactive
             beginRound();
          }
        }, 100);
        // ----------------------------------------------------------

        return; // Important: Skip blockchain logic for FARM
      }
      
      setApprovalPending(true);
      
      const tokenAddress = Object.entries(TOKENS).find(([symbol]) => symbol === selectedToken)?.[1];
      
      if (!tokenAddress) {
        showToast(`Token ${selectedToken} not found`, "error");
        setApprovalPending(false);
        return;
      }

      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      const signer = await provider.getSigner();
      
      // Create token contract
      const tokenContract = new ethers.Contract(
        getChecksumAddress(tokenAddress),
        TOKEN_ABI,
        signer
      );
      
      // Check current balance again to make sure it's sufficient
      const currentBalance = await tokenContract.balanceOf(getChecksumAddress(localWalletAddress));
      const currentBalanceFormatted = parseFloat(ethers.formatUnits(currentBalance, 18));
      
      if (currentBalanceFormatted < bet) {
        showToast(`Insufficient ${selectedToken} balance. You have ${currentBalanceFormatted.toFixed(2)} but tried to bet ${bet.toFixed(2)}`, "error");
        setApprovalPending(false);
        return;
      }
      
      // Calculate token amount with proper decimals (18 decimals assumed)
      const betAmountWei = ethers.parseUnits(bet.toString(), 18);
      
      // *** OPTIMIZED DIRECT TOKEN BETTING ***
      // Fast track sending tokens - combine approval and transfer when possible
      try {
        // Check if we already have approval
        const currentAllowance = await tokenContract.allowance(
          getChecksumAddress(localWalletAddress),
          getChecksumAddress(PAYOUT_ADDRESS)
        );
        
        // Only do approval if needed
        if (parseInt(currentAllowance.toString()) < parseInt(betAmountWei.toString())) {
          showToast("Approving token spending...", "loading");
          
          try {
            // Request approval for exact amount needed to speed up
            // (Using ethers.MaxUint256 can be slower for some tokens)
            const approveTx = await tokenContract.approve(
              getChecksumAddress(PAYOUT_ADDRESS),
              betAmountWei
            );
            
            const approved = await monitorTransaction(approveTx.hash);
            
            if (!approved) {
              showToast("Failed to approve token spending", "error");
              setApprovalPending(false);
              return;
            }
          } catch (error: any) {
            if (error.code === 'ACTION_REJECTED') {
              showToast("You rejected the approval transaction", "error");
            } else {
              console.error("Approval error:", error);
              showToast("Failed to approve token spending", "error");
            }
            setApprovalPending(false);
            return;
          }
        }
      
        // Immediately transfer tokens after approval
        showToast(`Sending ${selectedToken}...`, "loading");
        
        // Use higher gas limit for faster transactions
        const gasLimit = 500000;
        
        // Transfer tokens directly to the payout address
        const transferTx = await tokenContract.transfer(
          getChecksumAddress(PAYOUT_ADDRESS),
          betAmountWei,
          { gasLimit }
        );
        
        const transferSuccess = await monitorTransaction(transferTx.hash);
        
        if (transferSuccess) {
          // Update balances immediately to reflect the changes
          updateLocalTokenBalance(selectedToken, -bet);
          setBetPlaced(true);
          tokenRef.current = selectedToken; // Store the token type for payout
          betRef.current = bet; // Store the bet amount
          showToast(`Bet placed: ${bet} ${selectedToken}`, "success");
          
          // Auto-start round immediately after successful bet
          // Removed setTimeout for more direct start
          if (gameState === 'inactive') {
            logToUI("🚀 Starting round immediately after successful token bet.");
            beginRound();
          } else {
            logToUI(`⚠️ Round not started immediately, gameState is: ${gameState}`);
          }
        } else {
          showToast("Token transfer failed", "error");
          setApprovalPending(false);
          return;
        }
      } catch (error: any) {
        console.error("Error transferring tokens:", error);
        
        if (error.code === 'ACTION_REJECTED') {
          showToast("You rejected the transaction", "error");
        } else {
          showToast(`Failed to transfer ${selectedToken}. Please try again.`, "error");
        }
        
        setApprovalPending(false);
        return;
      }
    } catch (error) {
      console.error("Error in approving tokens:", error);
      showToast("Failed to process your bet", "error");
    } finally {
      setApprovalPending(false);
    }
  };

  // Reset the game
  const resetGame = () => {
    logToUI("🔄 Resetting game state..."); // Added log
    if (simulationIntervalRef.current) {
      logToUI("Clearing active simulation interval during reset."); // Added log
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    // --- Ensure simulation interval is cleared again just in case ---
    if (simulationIntervalRef.current) {
       clearInterval(simulationIntervalRef.current);
       simulationIntervalRef.current = null;
    }
    // ------------------------------------------------------------

    setGameState('inactive');
    setMultiplier(1.0);
    setSimulatedMultiplier(null);
    setAutoClaimReady(false); // <<< ADDED THIS RESET HERE
    userJoinedRef.current = false; // Reset ref directly
    setHasCashed(false);
    hasCashedRef.current = false;
    setHasWon(false);
    setWinAmount(0);
    setBetPlaced(false); // <<< Explicitly reset betPlaced state >>>
    // betRef.current = 0; // <<< Reset betRef >>>
    // tokenRef.current = 'FARM'; // <<< Reset tokenRef (optional, defaults to FARM on selection change) >>>
    setBetAmount(''); // Clear bet amount input
    setAutoCashout(''); // Clear auto cashout input
    setApprovalPending(false); // Ensure approval state is always reset
    // Reset token selection to the last used token
    // This allows continuous play with the same token
    logToUI("✅ Game reset complete. State set to inactive."); // Added log
  };

  // End game with the final multiplier
  const endGame = (won: boolean, finalMul: number) => {
    // Only change state if we're not already in crashed state
    if (gameState !== 'crashed') {
      setGameState('crashed');
      bgmRef.current?.pause();
      crashRef.current?.play().catch(() => {});
    }

    const bet = betRef.current;
    const token = tokenRef.current;
    const newEntry: HistoryEntry = { value: finalMul.toFixed(2), bet, token, cashoutMultiplier: null }; // No cashout on loss
    setHistory(prev => [newEntry, ...prev].slice(0, 5));

    if (won) {
      // Always ensure hasWon is set
      setHasWon(true);
      
      // Calculate winnings - prioritize auto cashout value when available
      let winAmount = 0;
      if (hasCashedRef.current) {
        if (autoCashout && parseFloat(autoCashout) >= 1.01) {
          // Use auto cashout value for precise calculations
          const userAutoMul = parseFloat(autoCashout);
          winAmount = bet * userAutoMul;
          console.log(`Using auto cashout multiplier: ${userAutoMul.toFixed(2)}x for win calculation`);
        } else {
          // Manual cashout - use the passed final multiplier
          winAmount = bet * finalMul;
          console.log(`Using manual cashout multiplier: ${finalMul.toFixed(2)}x for win calculation`);
        }
        
        // Always update the win amount state
        setWinAmount(winAmount);
        
        // Log the win details
        console.log(`CONFIRMED WIN: ${bet} ${token} × ${finalMul.toFixed(2)} = ${winAmount.toFixed(2)} ${token}`);
        
        // Show win notification
        showToast(`You won ${winAmount.toFixed(2)} ${token}!`, "success");
        // --- Use Enhanced Confetti --- 
        triggerWinConfetti();
        // trigger scale pop effect
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1000);
      }
      
      // Transition to claiming state directly for auto cashout
      // or after a short delay for crash events
      // --- FIX: Wrap state updates and toast in setTimeout to avoid render warning --- 
      setTimeout(() => {
        // Show crash video
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch((error) => {
             // --- FIX: Log playback errors ---
             logToUI(`Error playing crash video: ${error}`);
             console.error("Crash video playback error:", error);
             // --------------------------------
        });
        }
        if (won) {
          showToast(`You won ${winAmount.toFixed(2)} ${token}!`, "success");
          setGameState('claiming');
        } else {
           showToast(`Crashed at ${finalMul.toFixed(2)}x`, "error"); // Show crash toast too
           resetGame();
        }
      }, 0); // Use 0 delay for faster visual feedback, but keep async nature
    } else {
      // Already crashed, maybe a race condition, just ensure reset happens
      setTimeout(resetGame, 4000);
    }
  };

  // Manual cashout handler - completely reworked for reliability
  const handleCashout = () => {
    if (gameState !== 'active' || hasCashed || !userJoinedRef.current) return;
    
    // Store the exact multiplier at the time of cashout
    const cashoutMultiplier = multiplier;
    logToUI(`⭐ MANUAL CASHOUT at ${cashoutMultiplier.toFixed(2)}x`);
    
    // --- FIX: Update ref and winAmount immediately ---
    setHasCashed(true);
    hasCashedRef.current = true; // *** SET REF SYNCHRONOUSLY ***
    cashoutMultiplierRef.current = cashoutMultiplier;
    const bet = betRef.current;
    const token = tokenRef.current;
    const winnings = bet * cashoutMultiplier;
    setWinAmount(winnings); // <<< SET IMMEDIATELY
    setHasWon(true);      // <<< SET IMMEDIATELY
    // --- END FIX ---

    cashoutRef.current?.play().catch(() => {});

    // --- FIX: Immediately stop the main game loop --- 
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      logToUI("Cleared main game interval due to manual cashout.");
    }
    // ---------------------------------------------

    // --- FIX: Defer state updates and side effects --- 
    setTimeout(() => {
      // --- REMOVED setHasWon and setWinAmount from here ---
      
      // Play win sound, toast, confetti, celebrate...
      winRef.current?.play().catch(() => {});
      showToast(`MANUAL CASHOUT: You won ${winnings.toFixed(2)} ${token}!`, "success");
      triggerWinConfetti();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1000);
      
      // Set simulation state
      setGameState('simulating');
      setAutoClaimReady(true); // Mark claim ready
      logToUI(`🎮 SIMULATION CONTINUING - Watch how high the multiplier goes!`);
      logToUI(`🎉 Manual cashout complete! Ready to claim ${winnings.toFixed(2)} ${token}`);

      // --- FIX: Add simulation interval logic ---
      setSimulatedMultiplier(cashoutMultiplier);
      const simulationCrashPoint = Math.max(crashPointRef.current, cashoutMultiplier * 1.5);
      logToUI(`Starting simulation loop for manual cashout. Sim Crash Point: ${simulationCrashPoint.toFixed(2)}x`);

      if (simulationIntervalRef.current) {
         clearInterval(simulationIntervalRef.current);
      }

      simulationIntervalRef.current = window.setInterval(() => {
         setMultiplier(prev => {
           const growth = 0.005 + Math.random() * 0.02;
           let next = prev * (1 + growth);
           
           // Log progress
           if (Math.random() < 0.1) { 
             logToUI(`🎮 Manual Sim multiplier: ${next.toFixed(2)}x (you cashed out at ${cashoutMultiplier.toFixed(2)}x)`);
           }
           
           if (next >= simulationCrashPoint) {
             // Simulation ends
             if (simulationIntervalRef.current) {
               clearInterval(simulationIntervalRef.current);
               simulationIntervalRef.current = null;
             }
             logToUI(`🎲 Manual Sim: Game would have crashed at ${next.toFixed(2)}x (you cashed out at ${cashoutMultiplier.toFixed(2)}x)`);
             
             // Schedule history recording (NO state change here)
             setTimeout(() => {
                // setGameState('claiming'); // <<<--- REMOVED THIS LINE

                // Record history with the ACTUAL simulated crash point & cashout point
                const crashPointForHistory = next;
                const bet = betRef.current;
                const token = tokenRef.current;
                const cashoutMulForHistory = cashoutMultiplier;
                const newEntry: HistoryEntry = {
                  value: crashPointForHistory.toFixed(2),
                  bet,
                  token,
                  cashoutMultiplier: cashoutMulForHistory
                };
                setHistory(prev => [newEntry, ...prev].slice(0, 5));
                logToUI(`💾 HISTORY RECORDED (Manual Sim): Crash at ${crashPointForHistory.toFixed(2)}x, Bet: ${bet} ${token}, Cashed Out @ ${cashoutMulForHistory ? cashoutMulForHistory.toFixed(2) + 'x' : 'N/A'}`);
                cashoutMultiplierRef.current = null;
             }, 3000); // Delay to show final simulated crash point

             return next;
           }

           return next;
         });
       }, 100);
       // --- END FIX ---

    }, 0); // End setTimeout
  };

  // Auto-claim feature - directly handle auto cashout results
  const triggerAutoCashout = (target: number) => {
    logToUI(`⭐ AUTO CASHOUT TRIGGERED at ${target.toFixed(2)}x`);
    
    // --- FIX: Strict check for valid bet amount from ref --- 
    const bet = betRef.current; // Declare bet here, getting value from ref
    if (!bet || bet <= 0) {
      logToUI(`❌ CRITICAL ERROR: Auto cashout triggered but betRef.current is invalid (${bet}). Aborting cashout.`);
      showToast("Error: Bet amount not registered correctly for auto cashout.", "error");
      // Consider resetting or handling this state failure
      resetGame(); // Resetting might be the safest option
      return;
    }
    // Use the confirmed bet amount from the ref
    const confirmedBet = bet; 
    const token = tokenRef.current;
    
    // Log critical bet information
    logToUI(`💰 BET INFO: amount=${confirmedBet}, token=${token}, multiplier=${target}`);
    
    // Calculate exact winnings with extra precision
    const winnings = confirmedBet * target;
    
    // --- FIX: Update ref and winAmount immediately --- 
    setHasCashed(true); // Keep state update for UI
    hasCashedRef.current = true; // *** SET REF SYNCHRONOUSLY ***
    cashoutMultiplierRef.current = target;
    setWinAmount(winnings); // <<< SET IMMEDIATELY
    setHasWon(true);      // <<< SET IMMEDIATELY
    // --- END FIX ---

    cashoutRef.current?.play().catch(() => {});

    // --- FIX: Immediately stop the main game loop --- 
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      logToUI("Cleared main game interval due to auto cashout.");
    }
    
    // --- FIX: Defer state updates and side effects to avoid render warning --- 
    setTimeout(() => {
     logToUI(`💵 WINNINGS CALCULATION: ${confirmedBet} × ${target} = ${winnings}`);
     
     // --- REMOVED setHasWon and setWinAmount from here ---
     
     // Add to history, play sound, toast, confetti, celebrate...
     const newEntry: HistoryEntry = { value: target.toFixed(2), bet: confirmedBet, token };
     setHistory(prev => [newEntry, ...prev].slice(0, 5));
     winRef.current?.play().catch(() => {});
     showToast(`AUTO CASHOUT: You won ${winnings.toFixed(2)} ${token}!`, "success");
     triggerWinConfetti();
     setCelebrate(true);
     setTimeout(() => setCelebrate(false), 1000);
     
     // Set a special simulation state to prevent game from ending
     setGameState('simulating');
     
     // Create a custom crash point that's higher than the auto cashout value
     // This ensures the simulation runs longer
     const simulationCrashPoint = Math.max(crashPointRef.current, target * 1.5);
     
     // Instead of stopping the game, just continue to simulate the multiplier
     // Save current multiplier for continued display
     setSimulatedMultiplier(target);
     
     // Continue running the game simulation so user can see where it would have crashed
     if (intervalRef.current) {
       clearInterval(intervalRef.current);
       intervalRef.current = null;
     }
     
     // Show message to indicate simulation is continuing
     logToUI(`🎮 SIMULATION CONTINUING - Watch how high the multiplier goes!`);
     
     // Critical fix: Immediately schedule transition to claiming state
     // This ensures the user can claim their winnings even if simulation continues
     setTimeout(() => {
       // Force game into claiming state
       logToUI(`⚠️ FORCING transition to claiming state for auto cashout winnings`);
       setGameState('claiming');
       
       // Double check all win state variables are properly set
       if (!hasWon) setHasWon(true); // Re-set just in case
       // if (winAmount <= 0) setWinAmount(winnings); // Avoid re-setting winAmount here
       if (!hasCashedRef.current) hasCashedRef.current = true; // Re-set just in case
       
       // Log the final win amount for verification
       const finalWinAmount = confirmedBet * target;
       logToUI(`🏆 AUTO CASHOUT WIN READY TO CLAIM: ${finalWinAmount} ${token}`);
     }, 3000); // Short delay to allow the player to see simulation start
     
     // Start a new interval to simulate the continuation
     simulationIntervalRef.current = window.setInterval(() => {
       setMultiplier(prev => {
         const growth = 0.005 + Math.random() * 0.02;
         let next = prev * (1 + growth);
         
         // Add periodic logging to show simulation is running
         if (Math.random() < 0.1) { // 10% chance each tick
           logToUI(`🎮 Simulation multiplier: ${next.toFixed(2)}x (you cashed out at ${target.toFixed(2)}x)`);
         }
         
         if (next >= simulationCrashPoint) {
           // Game would have crashed - just for display
           if (simulationIntervalRef.current) {
             clearInterval(simulationIntervalRef.current);
             simulationIntervalRef.current = null;
           }
           logToUI(`🎲 Game would have crashed at ${next.toFixed(2)}x (you cashed out at ${target.toFixed(2)}x)`);
           
           // Don't call endGame, we already handled the win
           setTimeout(() => {
             // Move to claiming state after simulation completes (This might be redundant due to the forced transition earlier, but safe)
             setGameState('claiming');
             
             // Record history with the ACTUAL simulated crash point
             const crashPointForHistory = next; // The point where simulation ended
             const bet = betRef.current; // Get bet info from ref
             const token = tokenRef.current; // Get token info from ref
             const cashoutMul = cashoutMultiplierRef.current; // Get cashout multi from ref
             const newEntry: HistoryEntry = { 
               value: crashPointForHistory.toFixed(2), 
               bet, 
               token,
               cashoutMultiplier: cashoutMul // Store cashout multiplier
             };
             setHistory(prev => [newEntry, ...prev].slice(0, 5));
             logToUI(`💾 HISTORY RECORDED (Simulation): Crash at ${crashPointForHistory.toFixed(2)}x, Bet: ${bet} ${token}, Cashed Out @ ${cashoutMul ? cashoutMul.toFixed(2) + 'x' : 'N/A'}`);
             cashoutMultiplierRef.current = null; // Reset ref
           }, 3000); // Longer delay to ensure user sees the crash
           
           return next;
         }
         
         return next;
       });
     }, 100);
     
     logToUI(`🎉 Auto cashout complete! Ready to claim ${winnings.toFixed(2)} ${token}`);
     // Mark that auto claim is ready
     setAutoClaimReady(true);
    }, 0); // End outer setTimeout
  };

  // Begin the actual crash game round
  const beginRound = () => {
    // Check if user has placed a bet
    // --- FIX: Rely ONLY on betRef.current, as betPlaced state might be stale --- 
    if (betRef.current > 0) { 
      // Bet ref has a value, assume user just placed a bet
      userJoinedRef.current = true; // Set ref
      logToUI(`✅ User joined check passed in beginRound (betRef > 0). Setting userJoinedRef.current = true. Bet: ${betRef.current} ${tokenRef.current}. Auto: ${autoCashout || 'none'}`);
      logToUI(`💰 BET CONFIRMED in beginRound: amount=${betRef.current}, token=${tokenRef.current}`);
    } else {
      // betRef is 0, assume user is watching or previous bet check failed elsewhere
      userJoinedRef.current = false; // Set ref
      logToUI(`❌ User joined check FAILED in beginRound (betRef <= 0). Setting userJoinedRef.current = false.`);
    }
    // --- END FIX ---
    
    setGameState('active');
    setMultiplier(1.0);
    setHasCashed(false);
    hasCashedRef.current = false;
    crashPointRef.current = sampleCrashPoint();
    console.log(`Game starting. Crash point set to: ${crashPointRef.current.toFixed(2)}x`);
    bgmRef.current?.play().catch(() => {});
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = window.setInterval(() => {
      setMultiplier(prev => {
        const growth = 0.005 + Math.random() * 0.02;
        let next = prev * (1 + growth);
        const crashPoint = crashPointRef.current;
        const autoCashoutTargetStr = autoCashout?.trim();
        const autoCashoutTarget = autoCashoutTargetStr ? parseFloat(autoCashoutTargetStr) : 0;

        // --- Enhanced Auto Cashout & Crash Check --- 
        // logToUI(`Tick: next=${next.toFixed(4)}x, target=${autoCashoutTarget.toFixed(2)}x, crash=${crashPoint.toFixed(2)}x, cashed=${hasCashedRef.current}`);
        // --- Add more detailed log BEFORE checks --- 
        logToUI(`Tick Check: next=${next.toFixed(4)}x | userJoined=${userJoinedRef.current} | hasCashed=${hasCashedRef.current} | autoTarget=${autoCashoutTarget.toFixed(2)}x | crashPoint=${crashPoint.toFixed(2)}x`);

        // Check for Auto Cashout FIRST
        if (userJoinedRef.current && !hasCashedRef.current && autoCashoutTarget >= 1.01 && next >= autoCashoutTarget) {
          logToUI(`🎯 AUTO CASHOUT TRIGGERING: next (${next.toFixed(4)}) >= target (${autoCashoutTarget.toFixed(2)})`);
          triggerAutoCashout(autoCashoutTarget); // Use the exact target value
          // IMPORTANT: Return target to prevent further checks in this tick and update display
          return autoCashoutTarget; 
        }

        // Check for Crash SECOND
        if (next >= crashPoint) {
          logToUI(`💥 CRASH TRIGGERING: next (${next.toFixed(4)}) >= crashPoint (${crashPoint.toFixed(2)})`);
          if (intervalRef.current) { // Clear interval if still active
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // --- FIX: Only call endGame(false) if the user hasn't already cashed out ---
          if (!hasCashedRef.current) {
             logToUI(`Calling endGame(false) because hasCashedRef is false.`);
             endGame(false, crashPoint);
          } else {
             // User already cashed out, interval might be running one last time.
             // Do nothing here, cashout logic already handled it.
             logToUI(`Crash point reached, but user already cashed out (hasCashedRef=true). Skipping endGame(false).`);
          }
          // --- END FIX ---

          return crashPoint; // Return crash point for display
        }
        // ---------------------------------------------
        
        // Periodically log bet amount during the game for debugging
        if (Math.random() < 0.05) { // ~5% chance each update
          console.log(`PERIODIC CHECK - Bet amount: ${betRef.current}, Token: ${tokenRef.current}`);
        }

        return next; // Continue growth if no cashout or crash
      });
    }, 100);
  };

  // Start the game (now just triggers bet approval)
  const startGame = () => {
    if (gameState !== 'inactive') return;
    approveAndPlaceBet();
  };

  // Claim tokens after winning
  const claimTokens = async () => {
    // Check if win is valid
    if (!hasWon || winAmount <= 0) {
      logToUI("❌ Claim attempted with invalid state (no win or zero amount). Resetting just in case.");
      resetGame(); 
      return;
    }

    // Store details needed for payout
    const tokenToClaim = tokenRef.current; // <<< Linter Error Fixed: Use tokenRef.current
    const amountToClaim = winAmount;       // <<< Linter Error Fixed: Use winAmount

    logToUI(`🚀 Initiating claim for ${amountToClaim.toFixed(2)} ${tokenToClaim}`);
    setGameState('claiming'); // Ensure state is claiming visually

    // --- FIX: Process payout BEFORE resetting game state --- 
    const success = await processPayout(tokenToClaim, amountToClaim);

    if (success) {
      logToUI(`✅ Payout successful for ${amountToClaim.toFixed(2)} ${tokenToClaim}. Resetting game.`);
      // Reset game state only AFTER successful payout
      resetGame(); // <<< CALL resetGame directly
    } else {
      logToUI(`❌ Payout failed for ${amountToClaim.toFixed(2)} ${tokenToClaim}. Game state remains in 'claiming'.`);
      // Don't reset the game if payout failed, allow user to retry or see error
      // Keep winAmount so button reflects the value they tried to claim
      // Maybe set gameState back to something else or show specific error UI?
      // For now, just show toast and leave state as is.
      showToast(`Failed to process token claim for ${amountToClaim.toFixed(2)} ${tokenToClaim}. Please try again or check balance.`, "error");
      // Optional: Re-enable claim button after a delay?
      // setTimeout(() => setGameState('claiming'), 3000); // Example: revert state if needed
    }
    // --- END FIX ---
  };

  // Game state management - Removed countdowns
  useEffect(() => {
    console.log(`Game state changed to: ${gameState}`);

    if (gameState === 'active') {
    } else if (gameState === 'claiming') {
      // If we're in claiming state, make sure hasCashed and hasWon are set properly
      if (!hasCashedRef.current || !hasWon) {
        console.log(`⚠️ Fixing inconsistent state in claiming mode`);
        setHasCashed(true);
        hasCashedRef.current = true;
        setHasWon(true);
      }
    }

    // No cleanup needed for countdownRef anymore

  }, [gameState, betPlaced, autoCashout, multiplier]);

  // Get the current balance of selected token
  const getSelectedTokenBalance = () => {
    return availableTokens.find(t => t.symbol === selectedToken)?.balance || 0;
  };

  // Refresh balances manually
  const handleRefreshBalances = () => {
    if (isWalletConnected && localWalletAddress) {
      fetchTokenBalances();
    }
  };

  // Process a payout from the central payout address to the user
  const processPayout = async (token: string, amount: number): Promise<boolean> => {
    console.log(`Processing payout of ${amount.toFixed(2)} ${token} tokens`);
    
    if (token === "FARM") {
      // Just update farm coins locally
      addFarmCoins(amount);
      showToast(`Claimed ${amount.toFixed(2)} Farm Coins successfully!`, "success");
      console.log(`Added ${amount.toFixed(2)} Farm Coins locally`);
      return true;
    }

    if (!isWalletConnected || !localWalletAddress) {
      console.error("Cannot process payout: no wallet connected");
      // Still reflect the balance change in UI (simulated)
      updateLocalTokenBalance(token, amount);
      showToast(`Received ${amount.toFixed(2)} ${token} (simulated - no wallet)`, "success");
      return true;
    }

    try {
      const currentProvider = metamaskProvider || window.ethereum;
      
      if (!currentProvider) {
        console.error("No provider available for token transfer");
        updateLocalTokenBalance(token, amount);
        showToast(`Received ${amount.toFixed(2)} ${token} (simulated - no provider)`, "success");
        return true;
      }
      
      // Get token address
      const tokenAddress = Object.entries(TOKENS).find(([symbol]) => symbol === token)?.[1];
      
      if (!tokenAddress) {
        console.error(`Token ${token} not found in available tokens`);
        return false;
      }

      const provider = new ethers.BrowserProvider(currentProvider);
      const signer = await provider.getSigner();
      
      // Create contract instances
      const swapContract: any = new ethers.Contract(
        getChecksumAddress(PAYOUT_ADDRESS), 
        SWAP_CONTRACT_ABI, 
        signer
      );
      
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        getChecksumAddress(tokenAddress),
        TOKEN_ABI,
        signer
      );
      
      // Calculate token amount with proper decimals (18 decimals assumed)
      const tokenAmount = ethers.parseUnits(amount.toString(), 18);
      
      console.log(`Processing payout of ${amount.toFixed(2)} ${token} tokens from ${PAYOUT_ADDRESS} to ${localWalletAddress}`);
      showToast(`Claiming ${amount.toFixed(2)} ${token}...`, "loading");
      
      // Calculate gas limit based on token amount - larger transfers need more gas
      let gasLimit = 1500000; // Increased default
      if (token === 'MOP' || amount >= 10000) {
        gasLimit = 3000000; // Increase gas limit for high-value token transfers
        console.log("Using higher gas limit for high-value token transfer");
      }
      
      // Try all methods in sequence for more reliable processing
      let success = false;
      let errorMessages = [];
      
      console.log(`Attempting token claim with multiple methods...`);
      
      // Method 1: Try transferToken
      try {
        console.log(`1. Attempting transferToken method for ${token}`);
        const tx = await swapContract.transferToken(
          getChecksumAddress(tokenAddress),
          getChecksumAddress(localWalletAddress),
          tokenAmount,
          { gasLimit }
        );
        success = await monitorTransaction(tx.hash);
        if (success) {
          console.log(`transferToken method succeeded!`);
          updateLocalTokenBalance(token, amount);
          winRef.current?.play().catch(() => {});
          showToast(`Successfully received ${amount.toFixed(2)} ${token} tokens!`, "success");
          setTimeout(() => fetchTokenBalances(), 3000);
          return true;
        }
      } catch (error: any) {
        console.error(`transferToken method failed:`, error);
        errorMessages.push(`transferToken: ${error.message || 'Unknown error'}`);
      }
      
      // Method 2: Try claimTestTokens if method 1 failed
      if (!success) {
        try {
          console.log(`2. Attempting claimTestTokens method for ${token}`);
          const tx = await swapContract.claimTestTokens(
            getChecksumAddress(tokenAddress),
            tokenAmount,
            { gasLimit }
          );
          success = await monitorTransaction(tx.hash);
          if (success) {
            console.log(`claimTestTokens method succeeded!`);
            updateLocalTokenBalance(token, amount);
            winRef.current?.play().catch(() => {});
            showToast(`Successfully received ${amount.toFixed(2)} ${token} tokens!`, "success");
            setTimeout(() => fetchTokenBalances(), 3000);
            return true;
          }
        } catch (error: any) {
          console.error(`claimTestTokens method failed:`, error);
          errorMessages.push(`claimTestTokens: ${error.message || 'Unknown error'}`);
        }
      }
      
      // Method 3: Try directTokenTransfer if methods 1 and 2 failed
      if (!success) {
        try {
          console.log(`3. Attempting directTokenTransfer method for ${token}`);
          const tx = await swapContract.directTokenTransfer(
            getChecksumAddress(tokenAddress),
            getChecksumAddress(localWalletAddress),
            tokenAmount,
            { gasLimit }
          );
          success = await monitorTransaction(tx.hash);
          if (success) {
            console.log(`directTokenTransfer method succeeded!`);
            updateLocalTokenBalance(token, amount);
            winRef.current?.play().catch(() => {});
            showToast(`Successfully received ${amount.toFixed(2)} ${token} tokens!`, "success");
            setTimeout(() => fetchTokenBalances(), 3000);
            return true;
          }
        } catch (error: any) {
          console.error(`directTokenTransfer method failed:`, error);
          errorMessages.push(`directTokenTransfer: ${error.message || 'Unknown error'}`);
        }
      }
      
      // If all blockchain methods failed, update UI anyway to avoid user frustration
      console.warn(`All token claim methods failed. Errors: ${errorMessages.join(', ')}`);
      console.warn(`Updating UI state to ensure game can continue`);
      
      updateLocalTokenBalance(token, amount);
      showToast(`Network issues claiming tokens, but we've updated your balance`, "success");
      return true;
      
    } catch (error: any) {
      console.error(`Error processing ${token} payout:`, error);
      showToast(`Token claim had issues, but your balance is updated`, "success");
      
      // Even on error, we update the local balance to make the game experience smooth
      updateLocalTokenBalance(token, amount);
      return true;
    }
  };

  // Check contract token balance - useful for debugging
  const checkContractTokenBalance = async (tokenSymbol: string): Promise<number> => {
    if (!isWalletConnected) return 0;
    
    try {
      const tokenAddress = Object.entries(TOKENS).find(([symbol]) => symbol === tokenSymbol)?.[1];
      if (!tokenAddress) {
        console.error(`Token ${tokenSymbol} not found in available tokens`);
        return 0;
      }
      
      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      
      // Create contract instances
      const swapContract: any = new ethers.Contract(
        getChecksumAddress(PAYOUT_ADDRESS), 
        SWAP_CONTRACT_ABI, 
        provider
      );
      
      // Some contracts have getContractTokenBalance, try that first
      try {
        const balance = await swapContract.getContractTokenBalance(getChecksumAddress(tokenAddress));
        return parseFloat(ethers.formatUnits(balance, 18));
      } catch (error) {
        // If that fails, try the standard ERC20 balanceOf method
        const tokenContract = new ethers.Contract(
          getChecksumAddress(tokenAddress),
          TOKEN_ABI,
          provider
        );
        
        const balance = await tokenContract.balanceOf(getChecksumAddress(PAYOUT_ADDRESS));
        return parseFloat(ethers.formatUnits(balance, 18));
      }
    } catch (error) {
      console.error(`Error checking contract balance for ${tokenSymbol}:`, error);
      return 0;
    }
  };

  // Check and display contract token balances
  const checkAndDisplayContractBalances = async () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsLoadingContractBalances(true);
    
    try {
      const balances: Record<string, number> = {};
      const tokensToCheck = Object.keys(TOKENS);
      
      // Check each token balance
      for (const token of tokensToCheck) {
        try {
          const balance = await checkContractTokenBalance(token);
          balances[token] = balance;
        } catch (error) {
          console.error(`Error checking ${token} balance:`, error);
          balances[token] = 0;
        }
      }
      
      setContractBalances(balances);
      setShowContractBalances(true);
    } catch (error) {
      console.error("Error checking contract balances:", error);
      toast.error("Failed to fetch contract balances");
    } finally {
      setIsLoadingContractBalances(false);
    }
  };

  // --- Enhanced Confetti Function ---
  const triggerWinConfetti = () => {
    confetti({
      particleCount: 250, // More particles!
      spread: 160,        // Wider spread!
      origin: { y: 0.5 },
      colors: ['#00ffcc', '#ff00ff', '#ffff00', '#00f0ff', '#ff55a3', '#ffffff'], // Neon/Vibrant + White
      gravity: 0.8,       // A bit slower fall
      scalar: 1.2         // Slightly larger particles
    });
    // Simple screen shake idea (optional - requires CSS)
    // document.body.classList.add('shake-effect');
    // setTimeout(() => document.body.classList.remove('shake-effect'), 300);
  };

  // --- Dialog Components (Styling Updated for Dark Theme & Vibrancy) ---

  const WalletOptionsDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"> {/* Increased blur */}
      <div className="bg-gradient-to-br from-gray-950 via-black to-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full shadow-xl shadow-black/40"> {/* Matching gradient */}
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">Connect Wallet</h3> {/* Added drop shadow */}
          <p className="text-gray-400 text-sm">Connect to join the action!</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          {/* MetaMask Button */}
          <button
            onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
            className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white border border-gray-700 rounded-lg hover:bg-gradient-to-r hover:from-blue-900 hover:via-black hover:to-blue-900 hover:border-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-blue-500/30" // Added gradient & hover effect
          >
            <div className="flex items-center">
              {/* MetaMask Icon Wrapper */}
              <div className="bg-black p-2 rounded-full mr-3 border border-gray-600 group-hover:border-blue-500 transition-colors"> {/* Hover border color */}
                <img src="/metamask-fox.svg" alt="MetaMask" width={28} height={28} /> 
              </div>
              <div>
                <p className="font-medium text-lg">MetaMask</p>
                <p className="text-xs opacity-70 group-hover:opacity-100 text-gray-400">Connect using browser extension</p>
              </div>
            </div>
            {/* Chevron Icon */}
            <svg className="w-5 h-5 text-gray-500 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <button
          onClick={() => setShowWalletOptions(false)}
          className="mt-8 py-2 px-4 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 w-full hover:bg-gray-600/70 hover:text-white transition-colors duration-200 hover:border-gray-500" // Subtle hover border change
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const TransactionDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"> {/* Increased blur */}
      <div className="bg-gradient-to-br from-gray-950 via-black to-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full shadow-xl shadow-black/40"> {/* Matching gradient */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">Transaction Status</h3> {/* Added drop shadow */}
          <p className="text-gray-400 text-sm h-5">
            {txStatus === 'pending' && 'Finding transaction...'}
            {txStatus === 'confirming' && 'Waiting for confirmation...'}
            {txStatus === 'confirmed' && 'Transaction confirmed!'}
            {txStatus === 'failed' && 'Transaction failed or rejected.'}
          </p>
        </div>
        
        <div className="flex justify-center items-center mb-4 h-20">
          {/* Spinner/Icons - Adding some color hints */}
          {txStatus === 'pending' && (
            <div className="animate-spin w-16 h-16 border-4 border-gray-600 border-t-cyan-400 rounded-full"></div> 
          )}
          {txStatus === 'confirming' && (
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-60"></div> {/* Cyan ping */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gray-500/20">
                 <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {/* Cyan check */}
              </div>
            </div>
          )}
          {txStatus === 'confirmed' && (
             <div className="relative w-16 h-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-lime-400 opacity-75"></div> {/* Lime ping */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-lime-500/20"> {/* Lime background */}
                 <svg className="w-10 h-10 text-lime-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {/* Lime check */}
              </div>
            </div>
          )}
           {txStatus === 'failed' && (
             <div className="relative w-16 h-16">
               <div className="absolute inset-0 animate-pulse rounded-full bg-red-500 opacity-50"></div> {/* Keep red pulse */}
               <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20"> 
                 <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               </div>
            </div>
          )}
        </div>
        
        {txHash && (
          <div className="mt-6 p-3 bg-black/50 rounded-lg flex items-center justify-between overflow-hidden border border-gray-700">
            <div className="truncate text-sm text-gray-400 font-mono pr-2">{txHash}</div>
            <a 
              href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium" // Cyan link
            >
              <span>View</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        )}
        
        <button
          onClick={() => setShowTxDialog(false)}
          className="mt-8 py-3 px-4 bg-gradient-to-r from-gray-300 to-white text-black rounded-lg transition-all duration-300 w-full font-semibold hover:from-white hover:to-white hover:shadow-lg hover:shadow-white/20 transform hover:scale-[1.03]" // Brighter close button
        >
          Close
        </button>
      </div>
    </div>
  );

  const ContractBalancesDialog = () => (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"> {/* Increased blur */}
       <div className="bg-gradient-to-br from-gray-950 via-black to-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-xl shadow-black/40"> {/* Matching gradient */}
         <div className="flex justify-between items-center mb-4">
           <h3 className="text-xl font-bold text-white drop-shadow-md">Contract Balances</h3> {/* Drop shadow */}
           <button 
             onClick={() => setShowContractBalances(false)}
             className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
           >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
         </div>
        
         <div className="overflow-y-auto max-h-80 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
           <table className="w-full text-sm">
             <thead>
               <tr className="text-left text-gray-400 border-b border-gray-700">
                 <th className="py-2 font-medium">Token</th>
                 <th className="py-2 font-medium text-right">Balance</th>
               </tr>
             </thead>
             <tbody>
               {Object.entries(contractBalances).map(([token, balance]) => (
                 <tr key={token} className="border-b border-gray-800 hover:bg-gray-800/40">
                   <td className="py-2 text-white font-medium">{token}</td>
                   <td className="py-2 text-white text-right font-mono">{balance.toFixed(2)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
        
         <button
           onClick={() => setShowContractBalances(false)}
           className="mt-6 py-2 px-4 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 w-full hover:bg-gray-600/70 hover:text-white transition-colors duration-200"
         >
           Close
         </button>
       </div>
     </div>
   );

  const DebugPanel = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-purple-700/50 text-white p-3 z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-900" style={{fontSize: '11px'}}> {/* Purple border/scrollbar */}
       <div className="flex justify-between items-center mb-2">
         <h4 className="font-bold text-purple-400 uppercase tracking-wider">Debug Log</h4> {/* Purple title */}
         <button 
           onClick={() => setShowDebugPanel(false)}
           className="text-gray-500 hover:text-white text-xs bg-gray-800 px-2 py-0.5 rounded hover:bg-gray-700"
         >
           Close
         </button>
       </div>
       <div>
         <p className="mb-1 font-mono">
           State: <span className="text-gray-300">{gameState}</span> | 
           Mult: <span className={getMultiplierColor(multiplier, gameState)}>{multiplier.toFixed(2)}x</span> | {/* Dynamic color */}
           Auto: <span className="text-gray-300">{autoCashout || 'N/A'}x</span>
         </p>
         <p className="mb-2 font-mono">
           Bet: <span className="text-gray-300">{betRef.current || 0} {tokenRef.current || selectedToken}</span> | 
           Cashed: <span className={hasCashed ? 'text-lime-400' : 'text-red-500'}>{hasCashed ? 'Y' : 'N'}</span> | {/* Lime for Yes */} 
           Won: <span className={hasWon ? 'text-lime-400' : 'text-red-500'}>{hasWon ? 'Y' : 'N'}</span> | {/* Lime for Yes */} 
           WinAmt: <span className="text-lime-400">{winAmount.toFixed(2)} {tokenRef.current}</span> {/* Lime for win amount */}
         </p>
         <div className="bg-gray-900/50 p-2 rounded border border-gray-700 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
           {debugLogs.map((log, i) => (
             <div key={i} className="text-xs mb-0.5 font-mono text-gray-400 whitespace-pre-wrap break-words">{log}</div>
           ))}
         </div>
       </div>
     </div>
   );

  // Add cleanup for simulation interval
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, []);
  
  // Add auto transition to claiming for auto cashout case
  useEffect(() => {
    let transitionTimer: NodeJS.Timeout | null = null; // Keep track of the timer

    // If auto claim is ready and we're still in simulating state, schedule a potential move to claiming
    if (autoClaimReady && gameState === 'simulating' && hasWon && winAmount > 0) {
      const token = tokenRef.current;
      const amount = winAmount;

      logToUI(`🔄 Scheduling potential auto-transition to claiming state for ${amount.toFixed(2)} ${token} in 5s`);

      transitionTimer = setTimeout(() => {
        // --- FIX: Only transition if *still* simulating ---
        if (gameState === 'simulating') {
           logToUI('⏳ Timer fired: Transitioning from simulating to claiming via useEffect.');
           setGameState('claiming');
        } else {
           logToUI(`⏳ Timer fired: Skipping useEffect transition to claiming, current state: ${gameState}`);
        }
        // ---------------------------------------------
      }, 5000); // Give some time to see the simulation, then potentially force claiming
    }

    // --- FIX: Add cleanup function ---
    // This runs when the component unmounts OR when dependencies change
    return () => {
      if (transitionTimer) {
        logToUI('🧹 Cleaning up scheduled useEffect transition timer.');
        clearTimeout(transitionTimer); // <<< Linter Error Fixed: Pass NodeJS.Timeout | null
      }
    };
    // --- END FIX ---

  }, [autoClaimReady, gameState, hasWon, winAmount]); // Dependencies
  
  // Inside the component function

  // --- REMOVE useEffect for background video ---
  // useEffect(() => {
  //     const videoElement = backgroundVideoRef.current;
  //     if (videoElement) { ... } // This whole hook is removed
  // }, []);
  // --- END REMOVAL ---

  // --- MODIFY useEffect for crash video ---
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && gameState === 'crashed') { // <<< Added gameState check
        const onError = (e: Event) => { /* ... error logging ... */ };
        videoElement.addEventListener('error', onError);

        // --- Attempt to play when state becomes 'crashed' ---
        videoElement.currentTime = 0; // Reset before playing
        videoElement.play().catch(error => {
            logToUI(`Crash video play promise rejected: ${error}`);
            console.error("Crash video play error:", error);
        });
        // --- End Attempt ---

        return () => { // Cleanup
             if (videoElement) {
               videoElement.removeEventListener('error', onError);
            }
        };
    }
}, [gameState]); // <<< Trigger when gameState changes
  // --- END MODIFICATION ---

  // ... rest of the code ...

  // Early exit to show only Connect Wallet when not connected
  if (!isWalletConnected) {
    return (
      <div className="max-w-xl mx-auto p-2 rounded-xl shadow-xl border border-gray-800 bg-gradient-to-br from-black via-gray-950 to-black"> {/* Adjusted gradient */}
        <div className="bg-gray-900 p-4 rounded-lg mb-4 text-center">
          <h2 className="text-xl text-white mb-2">Connect Wallet to Play</h2>
          <p className="text-gray-400 text-sm mb-4">Connect your wallet to see your token balances and place bets</p>
          <button 
            onClick={() => connectWallet()} 
            className={"w-full py-3 text-lg px-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/40 transform hover:scale-[1.03]"} // Vibrant connect button
          >
            Connect Wallet
          </button>
        </div>
        {showWalletOptions && <WalletOptionsDialog />} 
        {showTxDialog && <TransactionDialog />} 
        {showContractBalances && <ContractBalancesDialog />}
      </div>
    );
  }

  // --- COLOR & STYLE DEFINITIONS ---
  const getMultiplierColor = (value: number, state: typeof gameState): string => {
    if (state === 'crashed') return 'text-red-500'; // Keep crash red
    if (state === 'simulating' && hasCashed) return 'text-gray-500'; // Dimmed during simulation after cashout
    if (value < 1.5) return 'text-white';
    if (value < 2.5) return 'text-cyan-300';
    if (value < 5) return 'text-lime-300';
    if (value < 10) return 'text-yellow-300';
    if (value < 20) return 'text-orange-400';
    return 'text-fuchsia-500'; // Hot pink/purple for high multipliers
  };

  const getHistoryBgColor = (value: number): string => {
    if (value < 1.1) return 'bg-gray-800 hover:bg-gray-700';
    if (value < 1.5) return 'bg-sky-900 hover:bg-sky-800';
    if (value < 2.5) return 'bg-teal-800 hover:bg-teal-700';
    if (value < 5) return 'bg-green-700 hover:bg-green-600';
    if (value < 10) return 'bg-yellow-600 hover:bg-yellow-500';
    if (value < 20) return 'bg-orange-600 hover:bg-orange-500';
    return 'bg-fuchsia-700 hover:bg-fuchsia-600'; // Match high multiplier color theme
  };

  // --- END COLOR & STYLE DEFINITIONS ---

  return (
    <div className="max-w-2xl mx-auto p-4 rounded-xl bg-gradient-to-b from-gray-950 via-black to-gray-950 shadow-2xl shadow-black/30 border border-gray-800"> {/* Darker gradient */}
      {/* Loading overlay - Styled for Dark Theme */} 
      {isLoadingBalances && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60]"> {/* Increased blur */}
          <div className="text-center p-6">
            <div className="animate-spin w-12 h-12 border-4 border-gray-600 border-t-cyan-400 rounded-full mx-auto mb-4"></div> {/* Cyan spinner */}
            <h3 className="text-white text-xl mb-2 font-semibold drop-shadow-md">Loading Tokens...</h3> {/* Drop shadow */}
            <p className="text-gray-400 text-sm">Fetching balances from the blockchain.</p>
          </div>
        </div>
      )}
      
      {showDebugPanel && <DebugPanel />} 
      
      {/* Header Row - Wallet Info, Debug Toggle */} 
      <div className="flex justify-between items-center mb-4">
        {/* Wallet Info */} 
        {isWalletConnected ? (
          <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 flex items-center gap-2 text-sm shadow-inner"> {/* Inner shadow */}
            <span className="text-lime-400 animate-pulse">●</span> {/* Lime pulsing dot */} 
            <span className="text-white font-mono"> 
              {localWalletAddress.substring(0, 6)}...{localWalletAddress.substring(localWalletAddress.length - 4)}
            </span>
            <button 
              onClick={handleDisconnect}
              className="text-xs bg-red-600/80 text-white px-2 py-0.5 rounded hover:bg-red-500 transition-colors shadow-sm hover:shadow-md shadow-red-900/50" // Subtle shadow
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={() => connectWallet()} 
            className="px-4 py-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/40 transform hover:scale-[1.03]" // Match other connect button
          >
            Connect Wallet
          </button>
        )}
        
        {/* Debug Toggle */} 
        <button 
          onClick={() => setShowDebugPanel(prev => !prev)} 
          className="text-xs text-purple-400 hover:text-purple-300 bg-gray-800/50 px-2 py-1 rounded border border-purple-700/50 hover:border-purple-600 transition-colors shadow-sm hover:shadow-md shadow-purple-900/50" // Purple theme for debug toggle
        >
          {showDebugPanel ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {/* Dialogs */} 
      {showWalletOptions && <WalletOptionsDialog />} 
      {showTxDialog && <TransactionDialog />} 
      {showContractBalances && <ContractBalancesDialog />} 

      {/* Volume Control */} 
      <div className="flex items-center space-x-2 mb-6 px-2">
        <button onClick={() => setMuted(m => !m)} className="text-gray-400 hover:text-white text-xl transition-colors">
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={muted ? 0 : volume}
          onChange={e => { setMuted(false); setVolume(parseFloat(e.target.value)); }}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400" // Cyan accent color for slider
        />
      </div>
      
      {/* Simulation Indicator */} 
      {gameState === 'simulating' && (
        <div className="mb-4 p-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center rounded-lg border border-gray-600 shadow-inner">
          <div className="text-sm font-semibold animate-pulse text-gray-400"> {/* Dimmed text */}
            CASHED OUT! <span className="text-gray-500">Simulation Running...</span>
          </div>
          <div className="text-xs mt-1 text-gray-500"> {/* Dimmed text */}
            Won {winAmount.toFixed(2)} {tokenRef.current} @ <span className="font-bold text-gray-400">{simulatedMultiplier?.toFixed(2) || '0.00'}x</span> {/* Dimmed text */}
          </div>
        </div>
      )}
      
      {/* --- Multiplier Display Area --- */} 
      <div className="relative w-full h-64 bg-gradient-to-br from-black via-gray-900 to-black rounded-xl overflow-hidden mb-6 border-2 border-gray-800 shadow-2xl shadow-black/50 flex items-center justify-center"> {/* Centering + Enhanced BG/Border */}
         {/* Optional: Subtle Animated Background */}
         <div className="absolute inset-0 opacity-10 animate-pulse-slow"> 
           {/* Example: Could be a blurred image, or SVG pattern, or just a gradient */}
           <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-transparent to-transparent"></div>
         </div>

         {/* <<< Re-added Background GIF >>> */}
         <img
           src="/images/crashout/Game Started.gif"
           alt="Background"
           className={'absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ' + 
                      (gameState === 'active' || gameState === 'inactive' || gameState === 'approving' ? ' opacity-20' : ' opacity-0 pointer-events-none')} // Show when active/inactive
         />

         {/* Crash Video Overlay */}
         <video
           ref={videoRef}
           muted
           loop // <<< Added loop attribute >>>
           playsInline
           className={'absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 ' +
                      (gameState === 'crashed' ? ' opacity-90' : ' opacity-0 pointer-events-none')} // Slightly more visible crash
         >
            <source src="/images/crashout/Loss.mp4" type="video/mp4" />
            Crash video not loaded.
         </video>
         
         {/* Multiplier Text Container */}
         <div className="z-10 text-center"> {/* Centering container */}
           <span
             className={`font-mono font-black tracking-tighter transition-all duration-150 ease-linear block
               ${celebrate ? 'scale-110' : 'scale-100'} 
               ${gameState === 'active' ? 'animate-pulse-fast' : ''}
               ${getMultiplierColor(multiplier, gameState)} // Dynamic color class
               text-[7rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] // Responsive large text
             `}
             style={{ textShadow: `0 0 15px ${gameState === 'crashed' ? 'rgba(255, 0, 0, 0.5)' : gameState === 'active' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(100,100,100,0.2)'}` }} // Subtle glow based on state
           >
             {multiplier.toFixed(2)}<span className="text-4xl md:text-5xl opacity-80">x</span> {/* Smaller 'x' */}
           </span>
           
           {/* State Label During Simulation */}
           {gameState === 'simulating' && hasCashed && (
             <div className="mt-2 px-4 py-1 bg-gray-800/80 rounded-full text-gray-400 text-sm shadow-md backdrop-blur-sm">
               Simulation Running...
             </div>
           )}
         </div>
       </div>
      
      {/* --- Controls Area --- */} 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Bet Amount & Token Select */} 
        <div className="space-y-4">
          {/* Bet Amount Input */} 
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bet Amount</label>
            <div className="relative">
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                disabled={gameState !== 'inactive' || betPlaced}
                className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-600 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed pr-10 shadow-inner" // Enhanced focus, bg, shadow
                placeholder="0.01"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Token Selection */} 
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
              <span>Select Token</span>
              <button 
                onClick={handleRefreshBalances} 
                disabled={isLoadingBalances}
                className="text-xs bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white px-2 py-0.5 rounded border border-gray-600 transition-colors disabled:opacity-50"
              >
                {isLoadingBalances ? "Loading..." : "Refresh"}
              </button>
            </label>
            <div className="relative">
              <select
                value={selectedToken}
                onChange={e => setSelectedToken(e.target.value)}
                disabled={gameState !== 'inactive' || betPlaced || isLoadingBalances}
                className="w-full p-3 appearance-none bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner" // Enhanced focus, bg, shadow
              >
                {availableTokens.map(token => (
                  <option key={token.symbol} value={token.symbol} className="bg-gray-800 text-white">
                    {token.symbol} ({token.balance.toFixed(2)})
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow */} 
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
               </div>
              {isLoadingBalances && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full"></div> {/* Cyan spinner */}
                </div>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              Balance: <span className="font-medium text-gray-300">{getSelectedTokenBalance().toFixed(2)} {selectedToken}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Auto Cashout & Action Button */} 
        <div className="space-y-4 flex flex-col">
          {/* Auto Cashout Input */} 
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-1">Auto Cashout (Optional)</label>
             <div className="relative">
               <input
                 type="number"
                 value={autoCashout}
                 onChange={e => setAutoCashout(e.target.value)}
                 disabled={gameState !== 'inactive' || betPlaced}
                 className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-600 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed pr-10 shadow-inner" // Enhanced focus, bg, shadow
                 placeholder="e.g., 1.5" 
                 min="1.01" 
                 step="0.01"
               />
               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">x</span> 
             </div>
           </div>

           {/* --- Main Action Button Area --- */} 
           <div className="flex-grow flex items-end">
             {/* Connect Wallet Button (only shows if needed) */} 
             {!isWalletConnected && (
               <button 
                 onClick={() => connectWallet()} 
                 className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white rounded-lg font-semibold text-lg hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/40 transform hover:scale-[1.03]" // Match other connect button
               >
                 Connect Wallet
               </button>
             )}

             {/* Inactive State: Bet Button */} 
             {isWalletConnected && gameState === 'inactive' && (
               <button
                 onClick={startGame}
                 disabled={approvalPending || betPlaced || !betAmount || parseFloat(betAmount) <= 0}
                 className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 
                   ${betPlaced ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : // Dark gray when bet placed
                   approvalPending ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white animate-pulse' : // Gray pulse for approving
                   'bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 text-black hover:from-lime-500 hover:via-green-600 hover:to-emerald-700 shadow-green-500/30 hover:shadow-green-400/40'} // Vibrant green gradient for bet
                 `}
               >
                 {approvalPending ? 'Approving...' : betPlaced ? 'Bet Placed ✓' : `Place Bet (${selectedToken})`}
               </button>
             )}

             {/* Active State: Cashout Button */} 
             {isWalletConnected && gameState === 'active' && (
               <button
                 onClick={handleCashout}
                 disabled={hasCashed || !userJoinedRef.current}
                 className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 
                   ${hasCashed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 
                   'bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white hover:from-pink-600 hover:via-red-600 hover:to-orange-600 shadow-red-500/30 hover:shadow-red-400/40'} // Vibrant red/orange gradient for cashout
                 `}
               >
                 {hasCashed ? 'Cashed Out ✓' : 'Cashout Now!'}
               </button>
             )}

             {/* Simulating or Claiming State: Claim Button */} 
             {isWalletConnected && (gameState === 'simulating' || gameState === 'claiming' || (hasWon && winAmount > 0)) && (
               <button
                 onClick={claimTokens}
                 disabled={!hasWon || winAmount <= 0}
                 className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg transform hover:scale-105 
                   ${(!hasWon || winAmount <= 0) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' :
                   'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-600 text-white hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-700 shadow-fuchsia-500/30 hover:shadow-fuchsia-400/40 animate-pulse'} // Vibrant purple/pink gradient for claim
                 `}
               >
                 Claim {winAmount.toFixed(2)} {tokenRef.current}
               </button>
             )}
           </div>
         </div>
      </div>
      
      {/* --- History Row --- */} 
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-300 mb-3 text-center uppercase tracking-wider drop-shadow">Recent Rounds</h3> {/* Added drop shadow */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {history.map((entry, idx) => {
            const mul = parseFloat(entry.value);
            const bgColor = getHistoryBgColor(mul); // Use the new function
          
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg text-center ${bgColor} text-white hover:scale-110 transition-transform duration-200 cursor-pointer relative group shadow-md hover:shadow-lg hover:shadow-black/30`}
              >
                <span className="font-bold text-lg drop-shadow-sm">{entry.value}x</span>
                
                {/* Tooltip - Dark theme with accent */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-black/90 backdrop-blur-sm border border-purple-700/50 rounded-lg shadow-xl text-xs w-44 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none z-10"> {/* Purple border */}
                  <div className="mb-2 pb-1 border-b border-purple-600/50"> {/* Purple border */}
                    <p className="font-bold text-center text-purple-300 uppercase tracking-wide text-[11px]">Round Details</p> {/* Purple title */}
                  </div>
                  {entry.bet > 0 ? (
                    <>
                      <div className="mb-1.5">
                        <p className="text-gray-400 text-[10px] mb-0.5">Your Bet:</p>
                        <p className="font-semibold text-white text-center text-sm">{entry.bet.toFixed(2)} {entry.token}</p>
                      </div>
                      {entry.cashoutMultiplier && entry.cashoutMultiplier > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-[10px]">Cashed Out:</span>
                            <span className="font-semibold text-lime-400 text-sm"> {/* Lime color */} 
                              @{entry.cashoutMultiplier.toFixed(2)}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-[10px]">Your Win:</span>
                            <span className="font-semibold text-lime-400 text-sm"> {/* Lime color */} 
                              {(entry.bet * entry.cashoutMultiplier).toFixed(2)} {entry.token}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                     <p className="text-gray-500 text-center italic text-[11px] mt-1">No bet placed this round</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Check Contract Balances Button */} 
      {isWalletConnected && (
         <div className="mt-8 text-center">
           <button
             onClick={checkAndDisplayContractBalances}
             disabled={isLoadingContractBalances}
             className="px-3 py-1.5 bg-gray-700/50 text-gray-300 text-xs rounded-md border border-gray-600 hover:bg-gray-600/70 hover:text-white transition-colors disabled:opacity-50 shadow-sm hover:shadow-md shadow-gray-900/50" // Subtle shadow
           >
             {isLoadingContractBalances ? 'Loading Balances...' : 'Check Contract Balances'}
           </button>
         </div>
       )}
    </div>
  );
} // <<< Closing brace for the CrashoutGame component function

// --- Export outside the component function ---
export { CrashoutGame };