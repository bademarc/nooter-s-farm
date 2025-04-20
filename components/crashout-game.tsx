'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';

// Blockchain constants
const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Game timing constants
const WAIT_TIME_SECONDS = 30; // Wait time for placing bets
const CLAIM_TIME_SECONDS = 20; // Time for winners to claim tokens

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
  "function allowance(address owner, address spender) view returns (uint256)"
];

// ABI for the swap contract that handles token claiming/transfers
const SWAP_CONTRACT_ABI = [
  "function transferToken(address tokenAddress, address recipient, uint256 amount) external",
  "function claimTestTokens(address tokenAddress, uint256 tokenAmount) external",
  "function swapTokenForFarmCoins(address tokenAddress, uint256 tokenAmount) external returns (uint256)"
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
}

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

const baseBtnClass = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 w-full text-xs h-8 bg-white text-black rounded-none hover:bg-white/90 noot-text border border-[rgb(51_51_51_/var(--tw-border-opacity,1))]';

export function CrashoutGame({ 
  farmCoins, 
  addFarmCoins, 
  tokenBalances = {}, 
  updateTokenBalance,
  walletAddress = "", 
  provider = null 
}: CrashoutGameProps) {
  // Sync farmCoins with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('farmCoins');
    if (stored !== null) {
      const storedVal = parseInt(stored, 10);
      if (storedVal !== farmCoins) {
        addFarmCoins(storedVal - farmCoins);
      }
    } else {
      localStorage.setItem('farmCoins', farmCoins.toString());
    }
  }, []);
  // Persist farmCoins to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('farmCoins', farmCoins.toString());
  }, [farmCoins]);
  const [betAmount, setBetAmount] = useState<string>('');
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameState, setGameState] = useState<'inactive' | 'active' | 'crashed' | 'approving' | 'claiming'>('inactive');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hasCashed, setHasCashed] = useState<boolean>(false);
  const hasCashedRef = useRef<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30); // Increased to 30 seconds
  const countdownRef = useRef<number | null>(null);
  const [betPlaced, setBetPlaced] = useState<boolean>(false);
  const [approvalPending, setApprovalPending] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const betRef = useRef<number>(0);
  const [userJoined, setUserJoined] = useState<boolean>(false);
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

  // Monitor transaction status
  const monitorTransaction = async (hash: string): Promise<boolean> => {
    try {
      setTxStatus("pending");
      setTxHash(hash);
      setShowTxDialog(true);
      
      const currentProvider = metamaskProvider || window.ethereum;
      const provider = new ethers.BrowserProvider(currentProvider);
      
      // Wait for transaction to be mined with timeout
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts with 2 second delay = 60 seconds max wait
      let tx = null;
      
      while (attempts < maxAttempts) {
        tx = await provider.getTransaction(hash);
        if (tx) break;
        
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
      
      if (!tx) {
        setTxStatus("failed");
        toast.error("Transaction not found after multiple attempts. Please check the block explorer.");
        return false;
      }
      
      setTxStatus("confirming");
      
      try {
        // Wait for transaction confirmation
        const receipt = await provider.waitForTransaction(hash);
        
        if (receipt && receipt.status === 1) {
          setTxStatus("confirmed");
          return true;
        } else {
          setTxStatus("failed");
          toast.error("Transaction failed. Please check the block explorer for details.");
          return false;
        }
      } catch (error) {
        console.error("Error waiting for transaction:", error);
        setTxStatus("failed");
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

  // Fetch token balances from the blockchain
  const fetchTokenBalances = async () => {
    if (!metamaskProvider && !window.ethereum) return;
    if (!localWalletAddress) return;
    
    setIsLoadingBalances(true);
    
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
          
          return {
            symbol,
            balance: formattedBalance,
            address
          };
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
          return {
            symbol,
            balance: 0,
            address
          };
        }
      });
      
      const tokenBalances = await Promise.all(balancePromises);
      setAvailableTokens([...tokens, ...tokenBalances]);
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
    } finally {
      setIsLoadingBalances(false);
      setLastBalanceUpdate(Date.now());
    }
  };

  // Fetch balances when wallet or provider changes
  useEffect(() => {
    if (isWalletConnected && localWalletAddress) {
      fetchTokenBalances();
    }
  }, [isWalletConnected, localWalletAddress, metamaskProvider]);

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
    const bet = parseFloat(betAmount);
    if (!bet || bet <= 0) return;
    
    const selectedTokenBalance = availableTokens.find(t => t.symbol === selectedToken)?.balance || 0;
    
    if (bet > selectedTokenBalance) {
      toast.error(`Not enough ${selectedToken}!`);
      return;
    }

    if (!isWalletConnected || !localWalletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Handle Farm coins locally
      if (selectedToken === "FARM") {
        updateLocalTokenBalance("FARM", -bet);
        setBetPlaced(true);
        toast.success(`Bet placed: ${bet} Farm Coins`);
        return;
      }
      setApprovalPending(true);
      const tokenAddress = Object.entries(TOKENS).find(([symbol]) => symbol === selectedToken)?.[1];
      
      if (!tokenAddress) {
        toast.error(`Token ${selectedToken} not found`);
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
      
      // Check if we already have approval
      const currentAllowance = await tokenContract.allowance(
        getChecksumAddress(localWalletAddress),
        getChecksumAddress(PAYOUT_ADDRESS)
      );
      
      // Calculate token amount with proper decimals (18 decimals assumed)
      const betAmountWei = ethers.parseUnits(bet.toString(), 18);
      
      // If allowance is less than bet amount, request approval
      if (parseInt(currentAllowance.toString()) < parseInt(betAmountWei.toString())) {
        toast.loading("Waiting for bet approval...");
        
        // Request approval for a large amount (MAX_UINT256) to avoid multiple approvals
        const approveTx = await tokenContract.approve(
          getChecksumAddress(PAYOUT_ADDRESS),
          ethers.MaxUint256
        );
        
        const approved = await monitorTransaction(approveTx.hash);
        
        if (!approved) {
          toast.error("Failed to approve token spending");
          setApprovalPending(false);
          return;
        }
        
        toast.success("Token approved for betting");
      }
      
      // If betting with a non-FARM token, swap tokens for Farm coins
      if (selectedToken !== "FARM") {
        toast.loading("Swapping tokens for Farm coins...");
        const swapContract = new ethers.Contract(
          getChecksumAddress(PAYOUT_ADDRESS),
          SWAP_CONTRACT_ABI,
          signer
        );
        // Static call to get expected Farm coins out
        const farmCoinOutWei = await (swapContract as any).callStatic.swapTokenForFarmCoins(
          getChecksumAddress(tokenAddress),
          betAmountWei
        );
        const farmCoinOut = parseFloat(ethers.formatUnits(farmCoinOutWei, 18));
        // Execute swap
        const tx = await (swapContract as any).swapTokenForFarmCoins(
          getChecksumAddress(tokenAddress),
          betAmountWei
        );
        const success = await monitorTransaction(tx.hash);
        if (!success) {
          toast.error("Swap transaction failed");
          setApprovalPending(false);
          return;
        }
        // Reflect balances: deduct token, add Farm coins
        updateLocalTokenBalance(selectedToken, -bet);
        updateLocalTokenBalance("FARM", farmCoinOut);
        setBetPlaced(true);
        toast.success(`Swapped ${bet} ${selectedToken} for ${farmCoinOut.toFixed(2)} Farm Coins`);
        return;
      }
      // FARM coins: deduct locally
      updateLocalTokenBalance("FARM", -bet);
      setBetPlaced(true);
      toast.success(`Bet placed: ${bet} ${selectedToken}`);
      
    } catch (error) {
      console.error("Error approving tokens:", error);
      toast.error("Failed to approve tokens for betting");
    } finally {
      setApprovalPending(false);
    }
  };

  // Reset the game
  const resetGame = () => {
    setGameState('inactive');
    setMultiplier(1.0);
    setUserJoined(false);
    setHasCashed(false);
    setBetPlaced(false);
    setHasWon(false);
    setWinAmount(0);
    setTimeLeft(30);
  };

  // End game with the final multiplier
  const endGame = (won: boolean, finalMul: number) => {
    setGameState('crashed');
    bgmRef.current?.pause();
    crashRef.current?.play().catch(() => {});

    const bet = betRef.current;
    const token = tokenRef.current;
    const newEntry: HistoryEntry = { value: finalMul.toFixed(2), bet, token };
    setHistory(prev => [newEntry, ...prev].slice(0, 5));

    if (won) {
      setHasWon(true);
      setWinAmount(bet * finalMul);
      setTimeout(() => {
        setGameState('active');
        setTimeLeft(CLAIM_TIME_SECONDS);
      }, 3000);
    } else {
      setTimeout(resetGame, 4000);
    }
    
    // Show crash video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Begin the actual crash game round
  const beginRound = () => {
    // Check if user has placed a bet
    const bet = parseFloat(betAmount);
    if (betPlaced && bet > 0) {
      // Deduct tokens only now that the game is starting
      updateLocalTokenBalance(selectedToken, -bet);
      betRef.current = bet;
      tokenRef.current = selectedToken;
      setUserJoined(true);
    } else {
      betRef.current = 0;
      setUserJoined(false);
    }
    
    setGameState('active');
    setMultiplier(1.0);
    setHasCashed(false);
    hasCashedRef.current = false;
    crashPointRef.current = sampleCrashPoint();
    bgmRef.current?.play().catch(() => {});
    
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = window.setInterval(() => {
      setMultiplier(prev => {
        const growth = 0.005 + Math.random() * 0.02;
        let next = prev * (1 + growth);
        const target = parseFloat(autoCashout);
        if (!hasCashedRef.current && target && next >= target && userJoined) {
          setHasCashed(true);
          hasCashedRef.current = true;
          cashoutRef.current?.play().catch(() => {});
          const winnings = betRef.current * target;
          setHasWon(true);
          setWinAmount(winnings);
        }
        const cp = crashPointRef.current;
        if (next >= cp) {
          next = cp;
          if (intervalRef.current) clearInterval(intervalRef.current);
          endGame(hasCashedRef.current, next);
        }
        return next;
      });
    }, 100);
  };

  // Start the game (now just triggers bet approval)
  const startGame = () => {
    if (gameState !== 'inactive') return;
    approveAndPlaceBet();
  };

  // Manual cashout
  const handleCashout = () => {
    if (gameState !== 'active' || hasCashed || !userJoined) return;
    
    setHasCashed(true);
    hasCashedRef.current = true;
    cashoutRef.current?.play().catch(() => {});
    
    // Calculate winnings
    const winnings = betRef.current * multiplier;
    setHasWon(true);
    setWinAmount(winnings);
  };

  // Claim tokens after winning
  const claimTokens = async () => {
    if (!hasWon || winAmount <= 0) return;
    
    const success = await processPayout(tokenRef.current, winAmount);
    
    if (success) {
      setHasWon(false);
      setWinAmount(0);
      resetGame();
    }
  };

  // Game state management with countdowns
  useEffect(() => {
    if (gameState === 'inactive') {
      // Countdown to start game
      setTimeLeft(30);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      countdownRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            
            // Start game only if at least one player has placed a bet
            if (betPlaced) {
              beginRound();
            } else {
              // If no bets, reset timer and stay in inactive state
              setTimeLeft(30);
              return 30;
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState === 'active') {
      // Countdown for claiming tokens
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      countdownRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            countdownRef.current = null;
            resetGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [gameState, betPlaced]);

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

  // Update local token balance state
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
  };

  // Process a payout from the central payout address to the user
  const processPayout = async (token: string, amount: number): Promise<boolean> => {
    if (token === "FARM") {
      // Just update farm coins locally
      addFarmCoins(amount);
      return true;
    }

    if (!isWalletConnected || !localWalletAddress) {
      console.error("Cannot process payout: no wallet connected");
      // Still reflect the balance change in UI (simulated)
      updateLocalTokenBalance(token, amount);
      return false;
    }

    try {
      const currentProvider = metamaskProvider || window.ethereum;
      
      if (!currentProvider) {
        console.error("No provider available for token transfer");
        updateLocalTokenBalance(token, amount);
        return false;
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
      const swapContract = new ethers.Contract(
        getChecksumAddress(PAYOUT_ADDRESS), 
        SWAP_CONTRACT_ABI, 
        signer
      );
      
      // Calculate token amount with proper decimals (18 decimals assumed)
      const tokenAmount = ethers.parseUnits(amount.toString(), 18);
      
      console.log(`Processing payout of ${amount} ${token} tokens from ${PAYOUT_ADDRESS} to ${localWalletAddress}`);
      
      // Calculate gas limit based on token amount - larger transfers need more gas
      let gasLimit = 1000000; // Default
      if (token === 'MOP' || amount >= 10000) {
        gasLimit = 2500000; // Increase gas limit for large token amounts
        console.log("Using higher gas limit for high-value token transfer");
      }
        
      // Try to use transferToken method first
      try {
        const tx = await swapContract.transferToken(
          getChecksumAddress(tokenAddress),
          getChecksumAddress(localWalletAddress),
          tokenAmount,
          { gasLimit }
        );
        
        toast.loading(`Processing token transfer...`);
        
        // Monitor the transaction
        const success = await monitorTransaction(tx.hash);
        
        if (success) {
          // Update local balance
          updateLocalTokenBalance(token, amount);
          winRef.current?.play().catch(() => {});
          
          toast.success(`Successfully received ${amount} ${token} tokens!`);
          
          // After a successful payout, refresh balances from blockchain
          setTimeout(() => fetchTokenBalances(), 3000);
          
          return true;
        } else {
          toast.error("Token transfer failed.");
          return false;
        }
      } catch (transferError) {
        console.error("Direct token transfer failed, trying claimTestTokens:", transferError);
        
        // If transferToken isn't available, try the claimTestTokens function as fallback
        try {
          toast.loading(`Trying alternative claim method...`);
          
          // Try claimTestTokens as fallback
          const tx = await swapContract.claimTestTokens(
            getChecksumAddress(tokenAddress),
            tokenAmount,
            { gasLimit }
          );
          
          toast.loading(`Processing token claim...`);
          
          // Monitor the transaction
          const success = await monitorTransaction(tx.hash);
          
          if (success) {
            // Update local balance
            updateLocalTokenBalance(token, amount);
            winRef.current?.play().catch(() => {});
            
            toast.success(`Successfully received ${amount} ${token} tokens!`);
            
            // After a successful payout, refresh balances from blockchain
            setTimeout(() => fetchTokenBalances(), 3000);
            
            return true;
          } else {
            toast.error("Token claim failed.");
            return false;
          }
        } catch (claimError) {
          console.error("Both token transfer methods failed:", claimError);
          toast.error("Token payout failed. Please try again later.");
          return false;
        }
      }
    } catch (error) {
      console.error(`Error processing ${token} payout:`, error);
      toast.error("Token payout failed. Please try again later.");
      return false;
    }
  };

  // Wallet options dialog
  const WalletOptionsDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="border border-[rgb(51_51_51_/var(--tw-border-opacity,1))] rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 text-sm">Select a wallet to continue</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
            className="flex items-center justify-between p-4 bg-black text-white border border-gray-700 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="bg-black p-2 rounded-full mr-3">
                <img src="/metamask-fox.svg" alt="MetaMask" width={28} height={28} />
              </div>
              <div>
                <p className="font-medium">MetaMask</p>
                <p className="text-xs opacity-70">Connect using MetaMask</p>
              </div>
            </div>
            <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 5L5 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <button
          onClick={() => setShowWalletOptions(false)}
          className="mt-6 py-2 px-4 border border-gray-700 rounded-lg text-white w-full hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // Transaction dialog
  const TransactionDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Transaction Status</h3>
          <p className="text-gray-400 text-sm">
            {txStatus === 'pending' && 'Finding transaction...'}
            {txStatus === 'confirming' && 'Waiting for confirmation...'}
            {txStatus === 'confirmed' && 'Transaction confirmed!'}
            {txStatus === 'failed' && 'Transaction failed'}
          </p>
        </div>
        
        <div className="flex justify-center mb-4">
          {txStatus === 'pending' && (
            <div className="animate-spin w-16 h-16 border-4 border-gray-700 border-t-green-400 rounded-full"></div>
          )}
          {txStatus === 'confirming' && (
            <div className="animate-pulse w-16 h-16 flex items-center justify-center rounded-full bg-blue-500/20">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {txStatus === 'confirmed' && (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500/20">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {txStatus === 'failed' && (
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/20">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        
        {txHash && (
          <div className="mt-6 p-4 bg-black/40 rounded-lg flex items-center justify-between overflow-hidden border border-gray-800">
            <div className="truncate text-sm text-gray-400">{txHash}</div>
            <a 
              href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1 text-white hover:text-gray-300 transition-colors"
            >
              <span>View</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
        
        <button
          onClick={() => setShowTxDialog(false)}
          className="mt-8 py-3 px-4 bg-white text-black hover:bg-gray-200 rounded-lg transition-all duration-200 w-full font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-xl mx-auto p-2 rounded-xl shadow-xl border-[#100] border-b">
      {/* Wallet connection dialogs */}
      {showWalletOptions && <WalletOptionsDialog />}
      {showTxDialog && <TransactionDialog />}
      
      {/* volume control */}
      <div className="flex items-center space-x-2 mb-4">
        <button onClick={() => setMuted(m => !m)} className="text-white">
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={muted ? 0 : volume}
          onChange={e => { setMuted(false); setVolume(parseFloat(e.target.value)); }}
          className="w-full"
        />
      </div>
      
      {/* Wallet connection section */}
      <div className="mb-4">
        {!isWalletConnected ? (
          <button
            onClick={() => connectWallet()}
            className={baseBtnClass + ' mb-2'}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="w-full py-2 px-3 mb-3 bg-black/30 text-white border border-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center mr-2 text-xs font-bold">
                  {activeWallet === WALLET_OPTIONS.AGW ? 'A' : 'M'}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Connected with {activeWallet === WALLET_OPTIONS.AGW ? 'AGW' : 'MetaMask'}</p>
                  <p className="text-sm font-medium">{localWalletAddress.substring(0, 6)}...{localWalletAddress.substring(localWalletAddress.length - 4)}</p>
                </div>
              </div>
              <button 
                onClick={handleDisconnect}
                className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Token selection and balance */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white font-medium">Select Token:</label>
          <div className="flex items-center">
            <span className="text-white font-medium mr-2">
              Balance: {getSelectedTokenBalance().toFixed(2)} {selectedToken}
            </span>
            {isWalletConnected && (
              <button 
                onClick={handleRefreshBalances} 
                disabled={isLoadingBalances}
                className="text-white hover:text-green-400 transition-colors"
                title="Refresh Balances"
              >
                {isLoadingBalances ? '⟳' : '↻'}
              </button>
            )}
          </div>
        </div>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          disabled={gameState !== 'inactive'}
          className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {availableTokens.map(token => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol} ({token.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>
      
      <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden mb-6">
        <img
          src="/images/crashout/Game%20Started.gif"
          alt="Starting"
          className={'absolute top-0 left-0 w-full h-full object-cover transition-opacity' + (gameState === 'crashed' ? ' opacity-0' : ' opacity-100')}
        />
        <video
          ref={videoRef}
          src="/images/crashout/Loss.mp4"
          muted
          playsInline
          className={'absolute top-0 left-0 w-full h-full object-cover transition-opacity' + (gameState === 'crashed' ? ' opacity-100' : ' opacity-0')}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={'text-7xl font-extrabold tracking-wide ' + (gameState === 'crashed' ? 'text-red-500' : 'text-green-400')}>
            {multiplier.toFixed(2)}x
          </span>
        </div>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-white mb-1">Bet Amount</label>
          <input
            type="number"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
            disabled={gameState !== 'inactive' || betPlaced}
            className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="0.01"
            min="0.01"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-white mb-1">Auto Cashout</label>
          <input
            type="number"
            value={autoCashout}
            onChange={e => setAutoCashout(e.target.value)}
            disabled={gameState !== 'inactive' || betPlaced}
            className="w-full p-3 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="1.01"
            min="1.01"
            step="0.01"
          />
        </div>
      </div>
      <div className="flex space-x-4 mb-6">
        {/* Game state indicators and actions */}
        {gameState === 'inactive' && (
          <div className="flex-1 mb-4 text-white font-medium">
            <div className="mb-2">Place your bet: {timeLeft}s</div>
            <div className="flex space-x-2">
              <button
                onClick={startGame}
                disabled={approvalPending || betPlaced}
                className={baseBtnClass + ' flex-1'}
              >
                {approvalPending ? 'Approving...' : betPlaced ? 'Bet Placed' : 'Place Bet'}
              </button>
            </div>
          </div>
        )}
        
        {gameState === 'active' && (
          <div className="flex-1 flex">
            <button
              onClick={handleCashout}
              disabled={hasCashed || !userJoined}
              className={baseBtnClass + ' flex-1'}
            >
              {hasCashed ? 'Cashed Out' : 'Cashout'}
            </button>
          </div>
        )}
        
        {gameState === 'claiming' && (
          <div className="flex-1">
            <div className="text-white text-center mb-2">
              You won: {winAmount.toFixed(2)} {tokenRef.current}!
            </div>
            <div className="text-white text-center mb-2">
              Claim within: {timeLeft}s
            </div>
            <button
              onClick={claimTokens}
              className={baseBtnClass}
            >
              Claim Tokens
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 mt-4">
        {history.map((entry, idx) => {
          const mul = parseFloat(entry.value);
          const bet = entry.bet;
          const token = entry.token;
          // 1–1.4× always red
          let bgClass = '';
          if (mul <= 1.4) bgClass = 'bg-red-500';
          else if (mul <= 2) bgClass = 'bg-orange-500';
          else if (mul <= 5) bgClass = 'bg-yellow-400';
          else if (mul <= 10) bgClass = 'bg-green-500';
          else if (mul <= 20) bgClass = 'bg-blue-400';
          else bgClass = 'bg-purple-500';
          return (
            <div
              key={idx}
              className={`p-2 rounded text-center ${bgClass} text-white`}
              title={`Crash at ${entry.value}x - Bet: ${bet.toFixed(2)} ${token}`}
            >
              {entry.value}x
            </div>
          );
        })}
      </div>
    </div>
  );
}
