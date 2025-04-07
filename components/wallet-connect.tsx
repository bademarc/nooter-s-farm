"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle, ChevronDown, CheckCircle2, PlugZap, Plus } from "lucide-react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

// Abstract Testnet constants
const ABSTRACT_CHAIN_ID = 11124;
const ABSTRACT_CHAIN_NAME = "Abstract Testnet";
const ABSTRACT_RPC_URL = "https://api.testnet.abs.xyz";
const ABSTRACT_BLOCK_EXPLORER = "https://scan.testnet.abs.xyz";
const ABSTRACT_CURRENCY_SYMBOL = "ABS"; 

// NOOT Token Details
const NOOT_TOKEN_ADDRESS = "0xBe4A56850cb822dD322190C15Bd2c66781007CBc"; 
const NOOT_TOKEN_SYMBOL = "NOOT";
const NOOT_TOKEN_DECIMALS = 18;
const NOOT_TOKEN_IMAGE = "https://nootersfarm.com/images/noot-token-logo.png"; // Replace with actual token image URL

export function WalletConnect() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState<boolean>(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            checkNetwork();
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
            if (newAccounts.length === 0) {
              setWalletAddress("");
              setIsOnCorrectNetwork(false);
            } else {
              setWalletAddress(newAccounts[0]);
              checkNetwork();
            }
          });
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            checkNetwork();
          });
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkConnection();
    
    return () => {
      // Clean up listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);
  
  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setIsOnCorrectNetwork(Number(chainId) === ABSTRACT_CHAIN_ID);
      } catch (error) {
        console.error("Error checking network:", error);
        setIsOnCorrectNetwork(false);
      }
    }
  };
  
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      await checkNetwork();
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected!",
      });
      
      if (!isOnCorrectNetwork) {
        // Prompt to switch network if not on Abstract Testnet
        switchToAbstractNetwork();
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to your wallet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const switchToAbstractNetwork = async () => {
    if (!window.ethereum) return;
    
    setIsNetworkSwitching(true);
    
    try {
      // Try to switch to the Abstract Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${ABSTRACT_CHAIN_ID.toString(16)}` }],
      });
      
      // Check if the switch was successful
      await checkNetwork();
      
      if (isOnCorrectNetwork) {
        toast({
          title: "Network Switched",
          description: `Successfully connected to ${ABSTRACT_CHAIN_NAME}!`,
        });
      }
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${ABSTRACT_CHAIN_ID.toString(16)}`,
                chainName: ABSTRACT_CHAIN_NAME,
                nativeCurrency: {
                  name: 'Abstract Token',
                  symbol: ABSTRACT_CURRENCY_SYMBOL,
                  decimals: 18
                },
                rpcUrls: [ABSTRACT_RPC_URL],
                blockExplorerUrls: [ABSTRACT_BLOCK_EXPLORER]
              },
            ],
          });
          
          // Check if the addition was successful
          await checkNetwork();
          
          if (isOnCorrectNetwork) {
            toast({
              title: "Network Added",
              description: `Successfully added and connected to ${ABSTRACT_CHAIN_NAME}!`,
            });
          }
        } catch (addError) {
          console.error("Error adding Abstract Testnet:", addError);
          toast({
            title: "Network Addition Failed",
            description: "Could not add Abstract Testnet to your wallet. Please try adding it manually.",
            variant: "destructive"
          });
        }
      } else {
        console.error("Error switching to Abstract Testnet:", switchError);
        toast({
          title: "Network Switch Failed",
          description: "Could not switch to Abstract Testnet. Please try manually switching in your wallet.",
          variant: "destructive"
        });
      }
    } finally {
      setIsNetworkSwitching(false);
    }
  };
  
  const disconnectWallet = () => {
    // Note: There's no standard way to disconnect in MetaMask
    // So we just clear the local state
    setWalletAddress("");
    setIsOnCorrectNetwork(false);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected from Nooter's Farm.",
    });
  };
  
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const addTokenToWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet to continue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Using type assertion to handle the wallet_watchAsset params structure
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: NOOT_TOKEN_ADDRESS,
            symbol: NOOT_TOKEN_SYMBOL,
            decimals: NOOT_TOKEN_DECIMALS,
            image: NOOT_TOKEN_IMAGE,
          },
        }] as any
      });

      if (wasAdded) {
        toast({
          title: "Token Added",
          description: `$${NOOT_TOKEN_SYMBOL} token has been added to your wallet!`,
        });
      } else {
        toast({
          title: "Token Not Added",
          description: "You declined to add the token to your wallet.",
        });
      }
    } catch (error) {
      console.error("Error adding token to wallet:", error);
      toast({
        title: "Failed to Add Token",
        description: "There was an error adding the token to your wallet.",
        variant: "destructive"
      });
    }
  };
  
  // Display a compact component on mobile and an expanded one on larger screens
  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      {walletAddress ? (
        <div className="flex flex-col items-end">
          {!isOnCorrectNetwork && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={switchToAbstractNetwork} 
                    variant="destructive"
                    size="sm"
                    className="mb-2 text-xs px-3 py-1 h-auto bg-white text-black border-0 rounded-none hover:bg-white/90 noot-text"
                    disabled={isNetworkSwitching}
                  >
                    {isNetworkSwitching ? (
                      <span className="flex items-center">
                        <PlugZap className="h-3 w-3 mr-1 animate-pulse" /> 
                        Switching...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" /> 
                        Switch to Abstract Testnet
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-black border border-[#333] text-white noot-text">
                  <p>You need to be on Abstract Testnet to use all features</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <div className="border border-[#333] bg-black noot-text">
            <div className="border-b border-[#333] p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm flex items-center text-white">
                  {isOnCorrectNetwork ? (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-white" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-white" />
                  )}
                  Wallet
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-white hover:bg-[#222]" 
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              <div className="text-xs mt-1 text-white/60">
                {isOnCorrectNetwork ? 'Connected to Abstract Testnet' : 'Wrong Network'}
              </div>
            </div>
            
            {showDetails && (
              <div className="p-3 border-b border-[#333]">
                <div className="text-xs space-y-1 text-white">
                  <div className="flex items-center justify-between">
                    <span>Address:</span>
                    <span className="font-mono bg-[#111] border border-[#333] px-1.5 py-0.5">
                      {formatAddress(walletAddress)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network:</span>
                    <span className="text-white">
                      {isOnCorrectNetwork ? ABSTRACT_CHAIN_NAME : "Wrong Network"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="w-full text-xs h-8 bg-white text-black rounded-none hover:bg-white/90 noot-text">
                    <Wallet className="h-3.5 w-3.5 mr-1.5" />
                    Options
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black border border-[#333] text-white">
                  <DropdownMenuItem onClick={addTokenToWallet} className="hover:bg-[#222] focus:bg-[#222] noot-text">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add $NOOT to Wallet
                  </DropdownMenuItem>
                  {!isOnCorrectNetwork && (
                    <DropdownMenuItem onClick={switchToAbstractNetwork} className="hover:bg-[#222] focus:bg-[#222] noot-text">
                      Switch to Abstract Testnet
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={disconnectWallet} className="hover:bg-[#222] focus:bg-[#222] noot-text">
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          onClick={connectWallet} 
          className="bg-white text-black border-0 rounded-none hover:bg-white/90 noot-text"
          disabled={isConnecting}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}
    </div>
  );
}