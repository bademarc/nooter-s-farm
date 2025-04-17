"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// NFT addresses from parent page
const NFT_ADDRESSES = {
  BEARISH: "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591",
  BIT77: "0x2BE78875629607D1d982d59d9564dAd218d7Bf51"
};

// NFT Handler address
const NFT_HANDLER_ADDRESS = "0x96b927A5a1e54C8bfCbeb0574BC0A9bA61a13d5E";

// Handler ABI
const NFT_HANDLER_ABI = [
  "function transferNFT(address nftAddress, uint256 tokenId, address recipient, uint256 amount) external",
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)",
  "function owner() external view returns (address)",
  "function addSupportedNFT(address nftAddress) external",
  "function removeSupportedNFT(address nftAddress) external"
];

type NFTStatus = {
  address: string;
  name: string;
  isSupported: boolean;
  balance: string;
  error?: string;
};

export default function NFTSupport() {
  const [nftStatus, setNftStatus] = useState<NFTStatus[]>([]);
  const [owner, setOwner] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Connect wallet and check support
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
            checkNFTSupport();
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        setMessage("Connecting wallet...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        setMessage("Wallet connected! Checking NFT support...");
        await checkNFTSupport();
        setLoading(false);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setMessage("Error connecting wallet");
        setLoading(false);
      }
    } else {
      setMessage("Ethereum provider not found. Please install MetaMask or use AbstractGW wallet.");
    }
  };

  const checkNFTSupport = async () => {
    if (!window.ethereum) return;
    
    try {
      setLoading(true);
      setMessage("Checking NFT support...");
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const handlerContract = new ethers.Contract(
        NFT_HANDLER_ADDRESS,
        NFT_HANDLER_ABI,
        provider
      );
      
      // Get contract owner
      try {
        const ownerAddress = await handlerContract.owner();
        setOwner(ownerAddress);
        
        // Check if current user is admin
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        setIsAdmin(ownerAddress.toLowerCase() === signerAddress.toLowerCase());
      } catch (error) {
        console.error("Error checking owner:", error);
      }
      
      // Check support for each NFT
      const statuses: NFTStatus[] = [];
      
      for (const [name, address] of Object.entries(NFT_ADDRESSES)) {
        try {
          const isSupported = await handlerContract.isNFTSupported(address);
          let balance = "0";
          
          if (isSupported) {
            try {
              const tokenBalance = await handlerContract.getNFTBalance(address, 1);
              balance = tokenBalance.toString();
            } catch (balanceError) {
              console.error(`Error checking balance for ${name}:`, balanceError);
            }
          }
          
          statuses.push({
            name,
            address,
            isSupported,
            balance
          });
        } catch (error: any) {
          statuses.push({
            name,
            address,
            isSupported: false,
            balance: "0",
            error: error.message || "Unknown error"
          });
        }
      }
      
      setNftStatus(statuses);
      setMessage("");
      setLoading(false);
    } catch (error: any) {
      console.error("Error checking NFT support:", error);
      setMessage(`Error: ${error.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  const addNFTSupport = async (address: string) => {
    if (!window.ethereum || !isAdmin) return;
    
    try {
      setLoading(true);
      setMessage(`Adding support for NFT ${address}...`);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const handlerContract = new ethers.Contract(
        NFT_HANDLER_ADDRESS,
        NFT_HANDLER_ABI,
        signer
      );
      
      const tx = await handlerContract.addSupportedNFT(address);
      setMessage(`Transaction submitted: ${tx.hash}`);
      
      // Wait for transaction to be mined
      await tx.wait();
      
      setMessage("NFT support added successfully! Refreshing status...");
      await checkNFTSupport();
    } catch (error: any) {
      console.error("Error adding NFT support:", error);
      setMessage(`Error: ${error.message || "Unknown error"}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">NFT Support Status</h2>
      
      {!isConnected ? (
        <div className="mb-4">
          <button 
            onClick={connectWallet}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p>Connected Address: <span className="font-mono text-sm">{walletAddress}</span></p>
          <button 
            onClick={checkNFTSupport}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            disabled={loading}
          >
            Refresh Status
          </button>
        </div>
      )}
      
      {loading && <p className="text-blue-500">{message}</p>}
      
      {owner && (
        <div className="mb-4">
          <p>Contract Owner: <span className="font-mono text-sm">{owner}</span></p>
          {isAdmin && <p className="text-green-500 font-bold">You are the contract admin</p>}
        </div>
      )}
      
      <div className="space-y-4">
        {nftStatus.map((nft) => (
          <div 
            key={nft.address}
            className={`p-3 border rounded ${nft.isSupported ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}
          >
            <h3 className="font-bold">{nft.name}</h3>
            <p className="font-mono text-xs mb-1">{nft.address}</p>
            
            <div className="flex items-center mt-1">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${nft.isSupported ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{nft.isSupported ? 'Supported' : 'Not Supported'}</span>
            </div>
            
            {nft.isSupported && (
              <div className="mt-1">
                <p>TokenID 1 Balance: {nft.balance}</p>
                {nft.balance === "0" && (
                  <p className="text-yellow-600 text-sm">⚠️ No tokens available for claiming</p>
                )}
              </div>
            )}
            
            {!nft.isSupported && isAdmin && (
              <button 
                onClick={() => addNFTSupport(nft.address)}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                disabled={loading}
              >
                Add Support
              </button>
            )}
            
            {nft.error && (
              <p className="text-red-500 text-sm mt-1">Error: {nft.error}</p>
            )}
          </div>
        ))}
      </div>
      
      {nftStatus.length === 0 && !loading && (
        <p className="text-gray-500">Connect your wallet to check NFT support status</p>
      )}
      
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-300 rounded">
        <h3 className="font-bold text-yellow-800">Troubleshooting Instructions</h3>
        <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-yellow-800">
          <li>Only the contract owner/admin can add support for NFTs</li>
          <li>If NFTs are not supported, the admin needs to call <code className="bg-yellow-100 px-1">addSupportedNFT(address)</code></li>
          <li>Once NFTs are supported, tokens must be transferred to the handler contract</li>
          <li>NFTs with 0 balance cannot be claimed by users</li>
        </ul>
      </div>
    </div>
  );
} 