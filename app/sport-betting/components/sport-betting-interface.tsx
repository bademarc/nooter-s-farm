'use client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import confetti from 'canvas-confetti';
import { ChevronDown, RefreshCw } from 'lucide-react'; // Import icons
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"; // Assuming ShadCN UI Popover

// --- Constants (Adapted from crashout-game.tsx) ---
const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Wallet options
const WALLET_OPTIONS = {
  METAMASK: "metamask"
};

// Central payout/betting address (Assuming same as crashout for now - adjust if needed)
const BETTING_CONTRACT_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"; // TODO: Verify/Update this address

// Token addresses (Assuming same as crashout)
const TOKENS = {
  NOOT: "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56",
  ABSTER: "0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062",
  // ... include other tokens as needed from crashout-game.tsx ...
  PUDGY: "0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336",
  YUP: "0xF5048aD4FB452f4E39472d085E29994f6088d96B"
};

// --- Add Token Icons (Map symbols to image paths) ---
const TOKEN_ICONS: Record<string, string> = {
    NOOT: '/images/tokens/noot.png', // Adjust paths as needed
    ABSTER: '/images/tokens/abster.png',
    PUDGY: '/images/tokens/pudgy.png',
    YUP: '/images/tokens/yup.png',
    // Add other token icons...
    DEFAULT: '/images/tokens/default.png' // Fallback icon
};

// Token ABI
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)"
];

// TODO: Define ABI for the Sport Betting Contract
const SPORT_BETTING_CONTRACT_ABI: string[] = [
  // ... Add functions like placeBet(matchId, outcome, tokenAddress, amount), claimWinnings(betId), getMatchOdds(matchId) ...
];

// --- Interfaces ---
interface TokenBalance {
  symbol: string;
  balance: number;
  address: string;
  iconUrl?: string; // Add icon URL
}

interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
  oddsDraw?: number; // Optional for draw odds
  startTime: number; // Unix timestamp
  status: 'upcoming' | 'live' | 'finished';
}

interface SportBettingInterfaceProps {
  // Add callbacks for win/loss/bet placement to notify parent page (page.tsx)
  onWin?: (amount: number, tokenSymbol: string) => void;
  onLoss?: () => void;
  onBetPlaced?: () => void; // Callback when bet is successfully placed
}

// Utility function for toasts
const showToast = (message: string, type: 'success' | 'error' | 'loading' = 'success') => {
  toast.dismiss(); // Dismiss existing toasts first
  if (type === 'success') {
    toast.success(message, { duration: 3000 });
  } else if (type === 'error') {
    toast.error(message, { duration: 4000 });
  } else {
    toast.loading(message, { duration: 5000 });
  }
};

// Helper function to get checksummed address
const getChecksumAddress = (address: string): string => {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error("Invalid address format:", error);
    return address; // Return original if invalid
  }
};

// --- Main Component ---
const SportBettingInterface = ({ onWin, onLoss, onBetPlaced }: SportBettingInterfaceProps) => {
  // --- State Variables (Adapted) ---
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [localWalletAddress, setLocalWalletAddress] = useState<string>('');
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);

  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]); // Initialize empty
  const [selectedToken, setSelectedToken] = useState<string>("NOOT"); // Default to NOOT or fetch first available
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<number>(0);

  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'teamA' | 'teamB' | 'draw' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);

  const [txStatus, setTxStatus] = useState<'none' | 'pending' | 'confirming' | 'confirmed' | 'failed'>('none');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTxDialog, setShowTxDialog] = useState<boolean>(false);

  // Mock match data - Replace with actual data fetching
  const [matches, setMatches] = useState<MatchData[]>([
    { id: 'match1', teamA: 'Nooters FC', teamB: "Abby's Army", oddsA: 1.85, oddsB: 2.10, startTime: Date.now() + 3600000, status: 'upcoming' },
    { id: 'match2', teamA: 'Chester Cheetahs', teamB: 'Pudgy Penguins', oddsA: 2.50, oddsB: 1.65, oddsDraw: 3.0, startTime: Date.now() + 7200000, status: 'upcoming' },
    { id: 'match3', teamA: 'Mighty Mops', teamB: 'Feather Fighters', oddsA: 1.50, oddsB: 2.80, startTime: Date.now() - 1800000, status: 'live' },
  ]);

  // --- Refs ---
  const tokenRef = useRef<string>(selectedToken);

  // --- Effects (Adapted) ---
  useEffect(() => {
    tokenRef.current = selectedToken;
  }, [selectedToken]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (isWalletConnected && localWalletAddress && (metamaskProvider || window.ethereum)) {
      fetchTokenBalances();
    } else {
      // Reset balances if wallet disconnects
      setAvailableTokens([]); // Or keep Farm Coins if applicable
    }
  }, [isWalletConnected, localWalletAddress, metamaskProvider]);

  // Refetch balances periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isWalletConnected && localWalletAddress && (metamaskProvider || window.ethereum) && Date.now() - lastBalanceUpdate > 60000) {
        fetchTokenBalances();
      }
    }, 60000); // Every 60 seconds
    return () => clearInterval(intervalId);
  }, [isWalletConnected, localWalletAddress, metamaskProvider, lastBalanceUpdate]);


  // --- Wallet Functions (Adapted) ---

  const connectWallet = async (walletType?: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (!walletType) {
        setShowWalletOptions(true); // Show options if no specific type given
        setIsLoading(false);
        return;
      }

      if (walletType === WALLET_OPTIONS.METAMASK) {
        await connectMetaMask();
      } else {
        console.error("Unsupported wallet type:", walletType);
        showToast("Unsupported wallet type selected", "error");
      }
      setShowWalletOptions(false);
    } catch (error) {
      console.error(`Error connecting to ${walletType}:`, error);
      showToast(`Failed to connect ${walletType}. Ensure it's installed and unlocked.`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      showToast("MetaMask not detected. Please install the extension.", "error");
      throw new Error("MetaMask not available");
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const currentAddress = getChecksumAddress(accounts[0]);
        console.log("MetaMask Connected:", currentAddress);
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.METAMASK);
        setLocalWalletAddress(currentAddress);
        setMetamaskProvider(window.ethereum);

        await switchToAbstractTestnet(window.ethereum); // Attempt to switch network

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        // Listen for chain changes
        window.ethereum.on('chainChanged', handleChainChanged);

        // Fetch initial balances immediately
        await fetchTokenBalances(currentAddress, window.ethereum); // Pass address and provider

        showToast("MetaMask Connected!", "success");
      } else {
        throw new Error("No accounts found in MetaMask.");
      }
    } catch (error: any) {
      console.error("MetaMask connection error:", error);
      if (error.code === 4001) { // User rejected connection
        showToast("Connection request rejected.", "error");
      }
      throw error; // Re-throw for connectWallet to catch
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnecting wallet");
    setIsWalletConnected(false);
    setActiveWallet(null);
    setLocalWalletAddress('');
    setMetamaskProvider(null);
    setAvailableTokens([]); // Clear token balances
    // Remove listeners if added
    if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
    showToast("Wallet disconnected", "success");
  };

  // Handle account changes from MetaMask
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // MetaMask is locked or the user has disconnected all accounts
      console.log("MetaMask accounts disconnected or locked.");
      handleDisconnect();
    } else {
      const newAddress = getChecksumAddress(accounts[0]);
      console.log("MetaMask account changed:", newAddress);
      setLocalWalletAddress(newAddress);
      // Refetch balances for the new account
      fetchTokenBalances(newAddress, metamaskProvider || window.ethereum);
    }
  };

    // Handle chain changes from MetaMask
  const handleChainChanged = (chainId: string) => {
    console.log("MetaMask chain changed to:", chainId);
    if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) {
        showToast(`Switched to wrong network (${chainId}). Please switch back to Abstract Testnet.`, "error");
        // Optionally disconnect or prompt user to switch back
        // handleDisconnect(); // Or prompt:
        switchToAbstractTestnet(metamaskProvider || window.ethereum);
    } else {
        showToast("Switched back to Abstract Testnet.", "success");
        // Potentially refetch balances or other chain-specific data
        fetchTokenBalances();
    }
  };


  const switchToAbstractTestnet = async (provider: any) => {
     if (!provider) {
        showToast("No wallet provider detected.", "error");
        return false;
     }
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ABSTRACT_TESTNET_CHAIN_ID }],
      });
      console.log("Switched to Abstract Testnet");
      return true;
    } catch (switchError: any) {
      // Chain not added
      if (switchError.code === 4902) {
        console.log("Abstract Testnet not added to wallet, attempting to add...");
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ABSTRACT_TESTNET_CHAIN_ID,
              chainName: 'Abstract Testnet',
              nativeCurrency: { name: 'Abstract ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://api.testnet.abs.xyz', 'https://rpc.testnet.abs.xyz'],
              blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER],
            }],
          });
          console.log("Abstract Testnet added and switched");
          return true;
        } catch (addError) {
          console.error("Error adding Abstract Testnet:", addError);
          showToast("Could not add Abstract Testnet to wallet.", "error");
          return false;
        }
      } else {
        console.error("Error switching network:", switchError);
        showToast("Failed to switch to Abstract Testnet. Please do it manually in your wallet.", "error");
        return false;
      }
    }
  };

  // --- Token Balance Functions (Update to include icons) ---
  const fetchTokenBalances = async (addressOverride?: string, providerOverride?: any) => {
    const targetAddress = addressOverride || localWalletAddress;
    const targetProvider = providerOverride || metamaskProvider || window.ethereum;

    if (!targetAddress || !targetProvider) {
      console.log("Cannot fetch balances: Missing address or provider.");
      return;
    }

    console.log(`Fetching token balances for ${targetAddress.substring(0, 6)}...`);
    setIsLoadingBalances(true);

    try {
      const provider = new ethers.BrowserProvider(targetProvider);
      const tokensToFetch = Object.entries(TOKENS);
      const balancePromises = tokensToFetch.map(async ([symbol, tokenAddress]) => {
        try {
          const contract = new ethers.Contract(getChecksumAddress(tokenAddress), TOKEN_ABI, provider);
          const balanceRaw = await contract.balanceOf(targetAddress);
          // TODO: Get token decimals dynamically if they vary, assuming 18 for now
          const balanceFormatted = parseFloat(ethers.formatUnits(balanceRaw, 18));
          const iconUrl = TOKEN_ICONS[symbol] || TOKEN_ICONS.DEFAULT; // Get icon URL
          console.log(` -> ${symbol}: ${balanceFormatted.toFixed(4)}`);
          return { symbol, balance: balanceFormatted, address: tokenAddress, iconUrl }; // Include iconUrl
        } catch (error) {
          console.error(`Error fetching ${symbol} balance:`, error);
          return { symbol, balance: 0, address: tokenAddress, iconUrl: TOKEN_ICONS.DEFAULT }; // Default on error
        }
      });

      const resolvedBalances = await Promise.all(balancePromises);
      // Filter out tokens with 0 balance? Optional.
      const nonZeroBalances = resolvedBalances.filter(b => b.balance > 0.0001 || b.symbol === 'NOOT'); // Show tiny balances too? Always show NOOT?

       // Add Farm Coins if applicable
       // const farmCoinBalance = { symbol: "FARM", balance: /* get farm coin balance */, address: "" };
       // setAvailableTokens([farmCoinBalance, ...nonZeroBalances]);

      setAvailableTokens(nonZeroBalances);

      // Set default selected token if current one is no longer available or hasn't been set
       if (!selectedToken || !nonZeroBalances.some(b => b.symbol === selectedToken)) {
           setSelectedToken(nonZeroBalances.length > 0 ? nonZeroBalances[0].symbol : 'NOOT'); // Fallback to NOOT or first available
       }

      setLastBalanceUpdate(Date.now());
      console.log("Token balances updated.");

    } catch (error) {
      console.error("Error fetching token balances:", error);
      showToast("Could not fetch token balances.", "error");
    } finally {
      setIsLoadingBalances(false);
    }
  };

  // --- Betting Logic (Update to use callbacks) ---
  const handlePlaceBet = async () => {
     if (!selectedMatch || !selectedOutcome || !betAmount || isPlacingBet || !isWalletConnected) {
        showToast("Please select a match, outcome, enter a valid bet amount, and connect wallet.", "error");
        return;
    }

    const betValue = parseFloat(betAmount);
    const tokenInfo = availableTokens.find(t => t.symbol === selectedToken);

    if (!tokenInfo || betValue <= 0) {
        showToast("Invalid bet amount or token selected.", "error");
        return;
    }
    if (betValue > tokenInfo.balance) {
        showToast(`Insufficient ${selectedToken} balance. Need ${betValue}, have ${tokenInfo.balance.toFixed(4)}`, "error");
        return;
    }

    setIsPlacingBet(true);
    showToast(`Placing bet of ${betValue} ${selectedToken}...`, "loading");

    try {
        const provider = new ethers.BrowserProvider(metamaskProvider || window.ethereum);
        const signer = await provider.getSigner();
        const tokenAddress = tokenInfo.address;
        const bettingContractAddress = getChecksumAddress(BETTING_CONTRACT_ADDRESS);

        // --- Check Allowance ---
        const tokenContract = new ethers.Contract(getChecksumAddress(tokenAddress), TOKEN_ABI, signer);
        const allowance = await tokenContract.allowance(localWalletAddress, bettingContractAddress);
        const betAmountWei = ethers.parseUnits(betValue.toString(), 18); // Assuming 18 decimals

        if (allowance < betAmountWei) {
            showToast("Approving token spend...", "loading");
            const approveTx = await tokenContract.approve(bettingContractAddress, betAmountWei); // Approve exact amount or MaxUint256
            setTxHash(approveTx.hash);
            setTxStatus('confirming');
            setShowTxDialog(true);
            const receipt = await approveTx.wait();
             if (!receipt || receipt.status !== 1) {
                throw new Error("Approval transaction failed");
            }
            showToast("Approval successful!", "success");
            setTxStatus('none'); // Reset status for the next step
        }

        // --- Place Bet on Contract ---
        showToast("Sending bet transaction...", "loading");
        // TODO: Replace with actual contract interaction
        console.warn("TODO: Implement actual contract call for placeBet");
        // Example structure:
        // const bettingContract = new ethers.Contract(bettingContractAddress, SPORT_BETTING_CONTRACT_ABI, signer);
        // const placeBetTx = await bettingContract.placeBet(
        //     selectedMatch.id,
        //     selectedOutcome, // Ensure outcome matches contract expectation (e.g., 0 for A, 1 for B, 2 for Draw)
        //     tokenAddress,
        //     betAmountWei,
        //     { gasLimit: 500000 } // Adjust gas limit as needed
        // );
        // setTxHash(placeBetTx.hash);
        // setTxStatus('confirming');
        // setShowTxDialog(true);
        // const betReceipt = await placeBetTx.wait();
        // if (!betReceipt || betReceipt.status !== 1) {
        //     throw new Error("Place bet transaction failed");
        // }

        // --- MOCK DELAY & SUCCESS (Remove when contract call is added) ---
        await new Promise(resolve => setTimeout(resolve, 2000));
        setTxHash('0xmockbettransactionhash' + Math.random().toString(16).substring(2));
        setShowTxDialog(true);
        setTxStatus('confirmed');
        // --- END MOCK ---

        showToast(`Bet placed successfully! ${betValue} ${selectedToken} on ${selectedOutcome === 'teamA' ? selectedMatch.teamA : selectedOutcome === 'teamB' ? selectedMatch.teamB : 'Draw'}`, "success");

        // --- Trigger bet placed callback ---
        onBetPlaced?.();

        // --- Optimistic UI Update & Refresh ---
        // Deduct balance locally immediately for better UX
        setAvailableTokens(prev =>
            prev.map(t =>
                t.symbol === selectedToken ? { ...t, balance: t.balance - betValue } : t
            )
        );
        setBetAmount(''); // Clear input
        setSelectedMatch(null); // Reset selections
        setSelectedOutcome(null);
        // Refresh balances from blockchain after a short delay
        setTimeout(() => fetchTokenBalances(), 5000); // 5 second delay

    } catch (error: any) {
        console.error("Error placing bet:", error);
        showToast(`Bet failed: ${error.reason || error.message || 'Unknown error'}`, "error");
        setTxStatus('failed');
        onLoss?.(); // Trigger loss callback on bet failure
    } finally {
        setIsPlacingBet(false);
        // Don't close dialog immediately on failure, let user see status/hash
        // if (txStatus !== 'failed') {
        //     setTimeout(() => { setShowTxDialog(false); setTxStatus('none'); setTxHash(null); }, 3000);
        // }
    }
};

// TODO: Add function to handle claiming wins, which would call onWin prop
const handleClaimWinnings = async (betId: string) => {
    console.log(`Attempting to claim winnings for bet ID: ${betId}`);
    // --- TODO: Replace with actual contract interaction ---
    // const provider = new ethers.BrowserProvider(metamaskProvider || window.ethereum);
    // const signer = await provider.getSigner();
    // const bettingContractAddress = getChecksumAddress(BETTING_CONTRACT_ADDRESS);
    // const bettingContract = new ethers.Contract(bettingContractAddress, SPORT_BETTING_CONTRACT_ABI, signer);
    // try {
    //   const claimTx = await bettingContract.claimWinnings(betId);
    //   const receipt = await claimTx.wait();
    //   if (receipt && receipt.status === 1) {
    //     // Extract winnings amount and token symbol from event logs or return value
    //     const winnings = 100; // Placeholder amount
    //     const tokenSymbol = "NOOT"; // Placeholder symbol
    //     showToast(`Claimed ${winnings} ${tokenSymbol}!`, "success");
    //     fetchTokenBalances(); // Update crypto balance display
    //     onWin?.(winnings, tokenSymbol); // <<< Notify parent page about the crypto win
    //   } else {
    //      throw new Error("Claim transaction failed");
    //   }
    // } catch (error: any) {
    //    console.error("Error claiming winnings:", error);
    //    showToast(`Claim failed: ${error.reason || error.message || 'Unknown error'}`, "error");
    // }
    // --- End Contract Interaction ---

    // --- MOCK SUCCESS (Remove when contract call is added) ---
    const mockWinnings = 100;
    const mockTokenSymbol = selectedToken; // Use the token that was bet with for mock
    showToast(`Mock Claimed ${mockWinnings} ${mockTokenSymbol}!`, "success");
    onWin?.(mockWinnings, mockTokenSymbol); // Notify parent page
    fetchTokenBalances(); // Refresh balances
    // --- End Mock ---
}


  // --- UI Rendering ---
  const getSelectedTokenInfo = (): TokenBalance | undefined => {
    return availableTokens.find(t => t.symbol === selectedToken);
  };
  const selectedTokenInfo = getSelectedTokenInfo(); // Get current info once

  // --- Dialog Components (Simplified for brevity) ---
   const WalletOptionsDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-xs w-full">
        <h3 className="text-white text-lg font-semibold mb-4 text-center">Connect Wallet</h3>
        <button
          onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
          className="w-full flex items-center justify-center gap-2 p-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition mb-2"
        >
          <img src="/metamask-fox.svg" alt="MetaMask" width={24} height={24} />
          MetaMask
        </button>
        {/* Add other wallet options here if needed */}
        <button
          onClick={() => setShowWalletOptions(false)}
          className="w-full p-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition text-sm mt-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const TransactionDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full text-white">
        <h3 className="text-lg font-semibold mb-4 text-center">Transaction Status</h3>
        <div className="text-center mb-4">
          {txStatus === 'none' && <p className="text-gray-400">...</p>}
          {txStatus === 'pending' && <p className="text-yellow-400">Pending...</p>}
          {txStatus === 'confirming' && <p className="text-blue-400">Confirming...</p>}
          {txStatus === 'confirmed' && <p className="text-green-400">Confirmed!</p>}
          {txStatus === 'failed' && <p className="text-red-400">Failed.</p>}
        </div>
        {txHash && (
          <div className="mb-4 text-center text-sm break-all">
            <p className="text-gray-400">Tx Hash:</p>
            <a
              href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              {txHash}
            </a>
          </div>
        )}
        <button
          onClick={() => { setShowTxDialog(false); setTxStatus('none'); setTxHash(null);}}
          className="w-full p-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500 transition text-sm mt-3"
        >
          Close
        </button>
      </div>
    </div>
  );


  // --- Main Return JSX ---
  return (
    <div className="max-w-4xl mx-auto p-4 bg-gradient-to-b from-gray-900 to-black text-white rounded-lg shadow-lg border border-gray-700">
      {/* Loading / Dialogs */}
       {isLoading && (
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
               <div className="animate-spin w-10 h-10 border-4 border-gray-600 border-t-blue-500 rounded-full"></div>
               <p className="ml-3 text-white">Connecting...</p>
           </div>
       )}
      {showWalletOptions && <WalletOptionsDialog />}
      {showTxDialog && <TransactionDialog />}

       {/* Header: Wallet Connect & Token Display */}
       <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
           {/* Token Balance & Selector */}
           {isWalletConnected && (
               <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-lg border border-gray-700 shadow-inner">
                   <Popover>
                       <PopoverTrigger asChild>
                           <button className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-700 transition group">
                               {selectedTokenInfo?.iconUrl && <img src={selectedTokenInfo.iconUrl} alt={selectedToken} className="w-6 h-6 rounded-full object-cover" />} {/* Added object-cover */}
                               <span className="font-semibold text-lg">{selectedTokenInfo?.balance?.toFixed(4) ?? '0.0000'}</span>
                               <span className="text-sm text-gray-400 group-hover:text-white">{selectedToken}</span>
                               <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-transform group-data-[state=open]:rotate-180" />
                           </button>
                       </PopoverTrigger>
                       <PopoverContent className="w-64 bg-gray-800 border-gray-700 p-2 text-white">
                           <div className="text-xs text-gray-400 mb-2 px-1">Select Token</div>
                           <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900"> {/* Added scrollbar style */}
                               {availableTokens.map(token => (
                                   <button
                                       key={token.symbol}
                                       onClick={() => setSelectedToken(token.symbol)}
                                       disabled={token.symbol === selectedToken}
                                       className={`w-full flex items-center justify-between p-2 rounded hover:bg-purple-800/50 transition text-left disabled:opacity-50 disabled:bg-purple-900/30`}
                                   >
                                       <div className="flex items-center gap-2">
                                           <img src={token.iconUrl} alt={token.symbol} className="w-5 h-5 rounded-full object-cover"/> {/* Added object-cover */}
                                           <span>{token.symbol}</span>
                                       </div>
                                       <span className="text-sm text-gray-300">{token.balance.toFixed(4)}</span>
                                   </button>
                               ))}
                               {availableTokens.length === 0 && !isLoadingBalances && (
                                    <div className="p-2 text-center text-gray-500 text-sm">No tokens found.</div>
                               )}
                               {isLoadingBalances && (
                                    <div className="p-2 text-center text-gray-500 text-sm">Loading...</div>
                               )}
                           </div>
                       </PopoverContent>
                   </Popover>
                    <button
                       onClick={() => fetchTokenBalances()}
                       disabled={isLoadingBalances}
                       className="p-1.5 text-gray-400 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-wait" // Added cursor-wait
                       title="Refresh Balances"
                    >
                       <RefreshCw className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} />
                    </button>
               </div>
           )}

           {/* Wallet Connect Button / Info */}
           <div className="flex items-center"> {/* Wrap button/info */}
               {isWalletConnected ? (
                   <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-lg border border-gray-600">
                       <span className="text-sm font-mono text-gray-300">
                           {localWalletAddress.substring(0, 6)}...{localWalletAddress.substring(localWalletAddress.length - 4)}
                       </span>
                       <button
                           onClick={handleDisconnect}
                           className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700 transition"
                           title="Disconnect Wallet"
                       >
                           Disconnect
                       </button>
                   </div>
               ) : (
                   <button
                       onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)} // Directly connect to metamask now?
                       className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition font-semibold"
                   >
                       Connect Wallet
                   </button>
               )}
           </div>
       </div>


       {/* Main Content Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

           {/* Column 1: Available Matches */}
           <div className="md:col-span-2 bg-gray-800/60 p-4 rounded-lg border border-gray-700">
               <h2 className="text-xl font-bold mb-4 text-center text-cyan-300">Upcoming & Live Matches</h2>
               <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                   {matches.map(match => (
                       <button
                           key={match.id}
                           onClick={() => { setSelectedMatch(match); setSelectedOutcome(null); /* Reset outcome */ }}
                           disabled={match.status === 'finished'}
                           className={`w-full p-3 rounded-lg border transition-all duration-200 text-left flex justify-between items-center
                               ${selectedMatch?.id === match.id ? 'border-cyan-500 bg-cyan-900/30 ring-2 ring-cyan-600' : 'border-gray-600 bg-gray-700/40 hover:bg-gray-700/80'}
                               ${match.status === 'finished' ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-700'}
                           `}
                       >
                           <div>
                               <span className={`text-xs px-2 py-0.5 rounded mr-2 ${match.status === 'live' ? 'bg-red-600 animate-pulse' : match.status === 'upcoming' ? 'bg-yellow-600' : 'bg-gray-500'}`}>
                                   {match.status.toUpperCase()}
                               </span>
                               <span className="font-semibold">{match.teamA}</span> vs <span className="font-semibold">{match.teamB}</span>
                               <div className="text-xs text-gray-400 mt-1">Starts: {new Date(match.startTime).toLocaleString()}</div>
                           </div>
                           {/* Minimal odds preview */}
                           <div className="text-right text-xs font-mono">
                               <div>{match.teamA.split(' ')[0]}: {match.oddsA.toFixed(2)}</div>
                               <div>{match.teamB.split(' ')[0]}: {match.oddsB.toFixed(2)}</div>
                               {match.oddsDraw && <div>Draw: {match.oddsDraw.toFixed(2)}</div>}
                           </div>
                       </button>
                   ))}
               </div>
           </div>

           {/* Column 2: Betting Slip */}
           <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 flex flex-col">
               <h2 className="text-xl font-bold mb-4 text-center text-purple-300">Bet Slip</h2>
               {!isWalletConnected ? (
                    <div className="text-center text-gray-400 my-auto">Connect wallet to place bets.</div>
                ) : !selectedMatch ? (
                   <div className="text-center text-gray-400 my-auto">Select a match to bet on.</div>
               ) : (
                   <div className="flex flex-col flex-grow space-y-4">
                       {/* Match Info */}
                       <div className="text-center border-b border-gray-600 pb-2">
                           <p className="font-semibold text-lg">{selectedMatch.teamA}</p>
                           <p className="text-sm text-gray-400">vs</p>
                           <p className="font-semibold text-lg">{selectedMatch.teamB}</p>
                       </div>

                       {/* Outcome Selection */}
                       <div>
                           <label className="block text-sm font-medium text-gray-300 mb-1">Select Outcome:</label>
                           <div className="grid grid-cols-3 gap-2">
                               <button
                                   onClick={() => setSelectedOutcome('teamA')}
                                   className={`p-2 rounded border text-center transition ${selectedOutcome === 'teamA' ? 'bg-cyan-600 border-cyan-500 font-bold' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                               >
                                   {selectedMatch.teamA.split(' ')[0]} <span className="block text-xs">({selectedMatch.oddsA.toFixed(2)})</span>
                               </button>
                               {selectedMatch.oddsDraw && (
                                    <button
                                         onClick={() => setSelectedOutcome('draw')}
                                         className={`p-2 rounded border text-center transition ${selectedOutcome === 'draw' ? 'bg-cyan-600 border-cyan-500 font-bold' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                                     >
                                         Draw <span className="block text-xs">({selectedMatch.oddsDraw.toFixed(2)})</span>
                                     </button>
                               )}
                               <button
                                   onClick={() => setSelectedOutcome('teamB')}
                                   className={`p-2 rounded border text-center transition ${selectedOutcome === 'teamB' ? 'bg-cyan-600 border-cyan-500 font-bold' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                               >
                                   {selectedMatch.teamB.split(' ')[0]} <span className="block text-xs">({selectedMatch.oddsB.toFixed(2)})</span>
                               </button>
                           </div>
                       </div>

                       {/* Token and Amount - Token selector is removed, only amount input remains */}
                       <div>
                           <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                               <span>Bet Amount ({selectedToken})</span>
                               <span className='text-xs text-gray-400 hover:text-cyan-400 cursor-pointer' onClick={() => setBetAmount(selectedTokenInfo?.balance?.toString() ?? '0')}>
                                   Max: {selectedTokenInfo?.balance?.toFixed(4)}
                               </span>
                           </label>
                           <input
                               type="number"
                               value={betAmount}
                               onChange={e => setBetAmount(e.target.value)}
                               disabled={!selectedOutcome || isPlacingBet}
                               placeholder="0.00"
                               min="0.01" // Adjust min bet?
                               step="0.01"
                               className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
                           />
                       </div>

                       {/* Potential Winnings Display */}
                       {selectedOutcome && betAmount && parseFloat(betAmount) > 0 && (
                            <div className="text-center text-sm text-gray-300 mt-2">
                                Potential Win:{" "}
                                <span className="font-bold text-green-400">
                                    {(
                                        parseFloat(betAmount) *
                                        (selectedOutcome === 'teamA' ? selectedMatch.oddsA :
                                         selectedOutcome === 'teamB' ? selectedMatch.oddsB :
                                         selectedMatch.oddsDraw || 0) // Handle missing draw odds
                                    ).toFixed(4)}{" "}
                                    {selectedToken}
                                </span>
                            </div>
                        )}

                       {/* Place Bet Button */}
                       <div className="mt-auto pt-4">
                           <button
                               onClick={handlePlaceBet}
                               disabled={!selectedOutcome || !betAmount || parseFloat(betAmount) <= 0 || isPlacingBet || parseFloat(betAmount) > (selectedTokenInfo?.balance ?? 0)} // Check against balance
                               className="w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-600 disabled:shadow-none disabled:hover:from-gray-600"
                           >
                               {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                           </button>
                       </div>
                   </div>
               )}
           </div>
       </div>

       {/* TODO: Add History Section */}
       <div className="mt-8 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
         <h3 className="text-lg font-semibold text-center text-gray-400">Bet History (Coming Soon)</h3>
         {/* Display user's past bets here */}
       </div>
    </div>
  );
};

export default SportBettingInterface; // Use default export if it's the main component for the page 