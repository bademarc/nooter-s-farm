"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, CircleDollarSign, Trophy, Wallet, CreditCard, Coins, LogOut, ExternalLink, RefreshCw, CircleAlert } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { ethers, Contract, BrowserProvider } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
// Import AGW packages
import { 
  useLoginWithAbstract, 
  useAbstractClient
} from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import NFTSupport from './components/NFTSupport';

// NOOT token constants
const NOOT_TOKEN_ADDRESS = "0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56";
const NOOT_SWAP_ADDRESS = "0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"; // Updated to multiFarmSwapAddress from deployment info
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

// NFT ABI for ERC721 standard NFTs
const NFT_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function balanceOf(address owner, uint256 id) external view returns (uint256)",
  "function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external"
];

// ABI for the swap contract that handles token claiming
const SWAP_CONTRACT_ABI = [
  // Token swap functions
  "function swapTokenForFarmCoins(address tokenAddress, uint256 tokenAmount) external returns (uint256)",
  "function swapFarmCoinsForToken(address tokenAddress, uint256 farmCoinAmount) external returns (uint256)",
  "function getTokenPrice(address tokenAddress) external view returns (uint256)",
  "function getFarmCoinPrice(address tokenAddress) external view returns (uint256)",
  // Token reward/claiming functions
  "function claimTestTokens(address tokenAddress, uint256 tokenAmount) external",
  "function claimTestNOOT(uint256 amount) external",
  "function transferNFT(address nftAddress, uint256 tokenId, address to) external",
  "function transferToken(address tokenAddress, address recipient, uint256 amount) external",
  // Admin functions
  "function setTokenPrice(address tokenAddress, uint256 price) external",
  "function setFarmCoinPrice(address tokenAddress, uint256 price) external",
  "function withdrawToken(address tokenAddress, uint256 amount) external",
  // Events
  "event TokenSwapped(address indexed user, address indexed tokenAddress, uint256 tokenAmount, uint256 farmCoinAmount)",
  "event FarmCoinSwapped(address indexed user, address indexed tokenAddress, uint256 farmCoinAmount, uint256 tokenAmount)",
  "event TokenClaimed(address indexed tokenAddress, address indexed player, uint256 amount)",
  "event NFTClaimed(address indexed nftAddress, uint256 indexed tokenId, address indexed player)"
];


// Add all token addresses from token-swap.tsx
const TOKEN_ADDRESSES = {
  BIT77: "0x2BE78875629607D1d982d59d9564dAd218d7Bf51", // Updated address from redeployment
  BEARISH: "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591", // Updated address from redeployment
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

// NFT Addresses
const NFT_ADDRESSES = {
  BEARISH: "0xe7d7c000c0D12Bb47869dEE8E43363255D9d8591", // Regular Bearish
  BIT77: "0x2BE78875629607D1d982d59d9564dAd218d7Bf51"    // Updated address from redeployment
};

// Token information with symbols and names
const TOKEN_INFO = {
  NOOT: { symbol: "NOOT", name: "Noot Noot" },
  ABSTER: { symbol: "$ABSTER", name: "ABSTER" },
  ABBY: { symbol: "ABBY", name: "Abby Token" },
  BIT77: { symbol: "77BIT", name: "77-Bit Token" },
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

// Fee to claim tokens
const CLAIM_FEE = 0.5; // NOOT tokens required to claim
const ABSTRACT_TESTNET_CHAIN_ID = "0x2b74";
const ABSTRACT_BLOCK_EXPLORER = "https://explorer.testnet.abs.xyz";

// Prices for items based on rarity
const prices = {
  legendary: 15000,
  yellow: 10000,
  red: 1200,
  pink: 500,
  purple: 250,
  blue: 100
};

// Cost to open a case with Farm Coins
const CASE_COST = 300; // Farm coins

// Cost to open a case with NOOT tokens
const NOOT_CASE_COST = 1; // 1 NOOT token per case

// Item rarities - expanded to include more items
const imageRarities = [
  // Common (Blue) - 40%
  'blue1', 'blue2',
  // Uncommon (Purple) - 30%
  'purple1', 'purple2', 'purple3',
  // Rare (Pink) - 15%
  'pink1', 'pink2',
  // Very Rare (Red) - 8%
  'red1', 'red2',
  // Ultra Rare (Yellow) - 5%
  'yellow1', 'yellow3',
  // Legendary (Gold) - 2%
  'legendary1', 'legendary2', 'legendary3', 'legendary4', 'legendary5', 'legendary6'
];

// Update itemDetails type to include NFT properties
interface ItemDetailType {
  name: string;
  price: number;
  image: string;
  isNFT?: boolean;
  nftAddress?: string;
  tokenId?: number;
}

// Mapping for the items with rarities and prices - expanded with all available images
const itemDetails: Record<string, ItemDetailType> = {
  // COMMON ITEMS (BLUE) - BRONZE TIER
  blue1: { 
    name: 'Chester Token', 
    price: prices.blue, 
    image: '/case%20items/bronze/Chester.jpg' 
  },
  blue2: { 
    name: 'Dojo3 Token', 
    price: prices.blue, 
    image: '/case%20items/bronze/Dojo3.jpg' 
  },
  
  // UNCOMMON ITEMS (PURPLE) - MIXED TIER
  purple1: { 
    name: 'Wojact Token', 
    price: prices.purple, 
    image: '/case%20items/golden/Wojact.jpg' 
  },
  purple2: { 
    name: 'Yup Token', 
    price: prices.purple, 
    image: '/case%20items/golden/yup.jpg' 
  },
  purple3: { 
    name: 'NUTZ Token', 
    price: prices.purple, 
    image: '/case%20items/golden/nutz.jpg' 
  },
  
  // RARE ITEMS (PINK) - SILVER TIER
  pink1: { 
    name: 'Paingu Token', 
    price: prices.pink, 
    image: '/case%20items/silver/PAINGU.jpg' 
  },
  pink2: { 
    name: 'Penguin Token', 
    price: prices.pink, 
    image: '/case%20items/silver/PENGUIN.jpg' 
  },
  
  // VERY RARE ITEMS (RED) - GOLDEN TIER
  red1: { 
    name: 'Feathers Token', 
    price: prices.red, 
    image: '/case%20items/golden/Feathersabstract.jpg' 
  },
  red2: { 
    name: 'RETSBA Token', 
    price: prices.red, 
    image: '/case%20items/golden/RETSBA.jpg' 
  },
  
  // ULTRA RARE ITEMS (YELLOW) - TOP TIER
  yellow1: { 
    name: 'Abby Token', 
    price: prices.yellow, 
    image: '/case%20items/golden/Abby.jpg' 
  },
  yellow3: { 
    name: 'ABSTER Token', 
    price: prices.yellow, 
    image: '/case%20items/golden/Abster.webp' 
  },
  
  // LEGENDARY ITEMS (LEGENDARY) - ULTIMATE TIER
  legendary1: { 
    name: 'MOP Token', 
    price: prices.legendary, 
    image: '/case%20items/golden/MOP.png' 
  },
  legendary2: { 
    name: 'Bearish NFT', 
    price: prices.legendary * 2, // Value is higher because it's NFT
    image: '/case%20items/golden/bearish.jpg',
    isNFT: true,
    nftAddress: NFT_ADDRESSES.BEARISH,
    tokenId: 1 // Token ID to transfer
  },
  legendary3: { 
    name: '77-Bit NFT', 
    price: prices.legendary * 2, // Value is higher because it's NFT
    image: '/case%20items/bronze/77-Bit.jpg',
    isNFT: true,
    nftAddress: NFT_ADDRESSES.BIT77,
    tokenId: 1 // Token ID to transfer
  },
  legendary4: { 
    name: 'Wojact Token', 
    price: prices.legendary * 1.3, // More valuable
    image: '/case%20items/golden/Wojact.jpg' 
  },
  legendary5: { 
    name: 'RETSBA Token', 
    price: prices.legendary * 1.7, // Most valuable
    image: '/case%20items/golden/RETSBA.jpg' 
  },
  legendary6: { 
    name: 'Exclusive Bearish NFT', 
    price: prices.legendary * 2.5, // Most valuable NFT
    image: '/case%20items/golden/bearish.jpg',
    isNFT: true,
    nftAddress: NFT_ADDRESSES.BEARISH,
    tokenId: 1 // Token ID in the Bearish contract is 1
  }
};

// Slot machine constants - improved for better responsiveness
const IMAGE_WIDTH = 160; // Adjusted for better display
const IMAGE_HEIGHT = 160;
const IMAGE_COUNT = 5;
const OFFSET = 1;
const BASE_SPEED = 8; // Dramatically increased from 3
const ACCELERATION_DURATION_MIN = 300; // Dramatically reduced from 1000
const ACCELERATION_DURATION_MAX = 500; // Dramatically reduced from 1500
const ACCELERATION_STEP = 2.0; // Dramatically increased from 0.8
const DECELERATION_MULTIPLIER = 0.80; // Much more aggressive deceleration
const RETURN_MULTIPLIER = 0.2; // Increased from 0.05

// Add sound effect variables - same as solcasenft
const STATE = {
  ACCELERATION: 'acceleration',
  DECELERATION: 'deceleration',
  RETURN: 'return',
  STOPPED: 'stopped'
};

// Add scroll animation styles near the top of the file
const SCROLL_ANIMATION = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-20px);
    }
    60% {
      transform: translateY(-10px);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes progressAnimation {
    0% { transform: scaleX(0); }
    100% { transform: scaleX(1); }
  }
  
  @keyframes popIn {
    0% { transform: scale(0.5); opacity: 0; }
    70% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes glowPulse {
    0% { box-shadow: 0 0 5px gold; }
    50% { box-shadow: 0 0 20px gold, 0 0 30px yellow; }
    100% { box-shadow: 0 0 5px gold; }
  }

  /* Confetti animation from solcasenft */
  @keyframes confetti-fall {
    0% { transform: translateY(-100vh) rotate(0deg); }
    100% { transform: translateY(100vh) rotate(720deg); }
  }
  
  @keyframes confetti-sway {
    0% { transform: translateX(0); }
    33% { transform: translateX(5vw); }
    66% { transform: translateX(-5vw); }
    100% { transform: translateX(0); }
  }
  
  .confetti-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1000;
    overflow: hidden;
  }
  
  .confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: gold;
    opacity: 0.8;
    animation: confetti-fall 3s linear infinite, confetti-sway 2s ease-in-out infinite;
  }
  
  .confetti:nth-child(odd) {
    background-color: rgba(255, 215, 0, 0.7);
    width: 12px;
    height: 12px;
    animation-delay: 0.2s;
    animation-duration: 2.5s;
  }

  .bounce {
    animation: bounce 2s infinite;
  }

  .fade-in {
    animation: fadeIn 1s ease-in;
  }
  
  .pop-in {
    animation: popIn 0.5s ease-out forwards;
  }
  
  .glow-pulse {
    animation: glowPulse 2s infinite;
  }

  .arrow-down {
    width: 0;
    height: 0;
    border-left: 20px solid transparent;
    border-right: 20px solid transparent;
    border-top: 20px solid #ffd700;
    margin: 0 auto 10px auto;
  }
  
  .slot-machine-container {
    position: relative;
    margin: 0 auto 20px;
    overflow: hidden;
    border: 3px solid #333;
    border-image: linear-gradient(45deg, #333, #FFD700, #333) 1;
    border-radius: 4px;
    background: #111;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
    max-width: 100%;
    padding: 10px 0;
  }
  
  /* Add glass-like sheen effect over slot machine */
  .slot-machine-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, 
      rgba(255, 255, 255, 0.08) 0%, 
      rgba(255, 255, 255, 0.03) 40%, 
      rgba(255, 255, 255, 0) 100%
    );
    pointer-events: none;
  }
  
  /* Enhanced case background */
  .case-background {
    background: linear-gradient(135deg, #222, #111);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.3s ease;
  }
  
  .case-background:hover {
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.1);
  }
`;

// Add CSS styles for the noot theme that match token-swap.tsx
const NOOT_THEME_STYLES = `
  /* Base theme */
  .noot-theme {
    background-color: #0f0f0f;
    color: #ffffff;
    min-height: 100vh;
  }

  @tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Satisfy&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Akaya+Kanadaka&display=swap');



* {
  font-family: "Akaya Kanadaka", system-ui;
}
  
  /* Card styling */
  .noot-card {
    background-color: #171717;
    border: 1px solid #333;
    border-radius: 12px;
    transition: all 0.2s ease-in-out;
    overflow: hidden;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.5);
  }
  
  .noot-card:hover {
    transform: translateY(-4px);
    box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Typography */
  .noot-title {
    font-weight: bold;
    letter-spacing: -0.025em;
  }
  
  /* Button styles */
  .noot-button {
    background-color: #222;
    border: 1px solid #333;
    color: #ffffff;
    transition: all 0.2s ease;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 500;
    text-align: center;
    cursor: pointer;
  }
  
  .noot-button:hover {
    background-color: #ffffff;
    color: #000000;
    transform: translateY(-2px);
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .noot-button:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  .noot-button-outline {
    background-color: transparent;
    border: 1px solid #ffffff;
    color: #ffffff;
  }
  
  .noot-button-outline:hover {
    background-color: #ffffff;
    color: #000000;
  }
  
  .noot-button-dark {
    background-color: #000000;
    border: 1px solid #333;
  }
  
  .noot-button-dark:hover {
    background-color: #ffffff;
    color: #000000;
  }
  
  /* Swap section components */
  .noot-swap-section {
    margin-bottom: 1.5rem;
  }
  
  .noot-swap-title {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
    color: white;
  }
  
  /* Slot machine styling */
  .slot-machine-container {
    background-color: #121212;
    border: 1px solid #333;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
  }
  
  /* Inventory item styling */
  .inventory-item {
    transition: all 0.2s ease;
    border-radius: 12px;
  }
  
  .inventory-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
  
  /* Animations */
  @keyframes glowPulse {
    0% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
    50% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3); }
    100% { box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); }
  }
  
  /* Border effects */
  .gradient-border {
    border: 1px solid transparent;
    background-clip: padding-box;
    position: relative;
  }
  
  .gradient-border::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: -1px;
    border-radius: inherit;
    background: linear-gradient(45deg, #ffffff, #333333);
    z-index: -1;
  }
  
  /* Form elements */
  .noot-input {
    background-color: #171717;
    border: 1px solid #333;
    border-radius: 8px;
    color: #ffffff;
    padding: 0.75rem 1rem;
    width: 100%;
    transition: all 0.2s ease;
  }
  
  .noot-input:focus {
    outline: none;
    border-color: #ffffff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .noot-card {
      padding: 1rem;
    }
    
    .noot-button {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
  }
  
  @media (max-width: 640px) {
    .noot-title {
      font-size: 1.25rem;
    }
    
    .noot-button {
      width: 100%;
      margin-bottom: 0.5rem;
    }
  }
  
  /* Loading animation */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loader {
    border: 3px solid #333;
    border-radius: 50%;
    border-top: 3px solid #fff;
    width: 24px;
    height: 24px;
    animation: spin 1s linear infinite;
  }
`;

// Functions for rarity-based styling
const getRarityBg = (rarity: string) => {
  // Remove any numbers from the rarity to get just the color category
  const rarityType = rarity.replace(/[0-9]/g, '');
  
  switch (rarityType.toLowerCase()) {
    case 'legendary':
      return 'border-amber-500 bg-amber-950/30';
    case 'yellow':
      return 'border-yellow-500 bg-yellow-950/30';
    case 'red':
      return 'border-red-500 bg-red-950/30';
    case 'pink':
      return 'border-pink-500 bg-pink-950/30';
    case 'purple':
      return 'border-purple-500 bg-purple-950/30';
    case 'blue':
      return 'border-blue-500 bg-blue-950/30';
    default:
      return 'border-gray-500 bg-gray-800/30';
  }
};

const getRarityColor = (rarity: string) => {
  // Remove any numbers from the rarity to get just the color category
  const rarityType = rarity.replace(/[0-9]/g, '');
  
  switch (rarityType.toLowerCase()) {
    case 'legendary':
      return 'text-amber-400';
    case 'yellow':
      return 'text-yellow-400';
    case 'red':
      return 'text-red-400';
    case 'pink':
      return 'text-pink-400';
    case 'purple':
      return 'text-purple-400';
    case 'blue':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

// Function to get rarity color in hex format for styling
const getRarityColorHex = (rarity: string): string => {
  // Remove any numbers from the rarity to get just the color category
  const rarityType = rarity.replace(/[0-9]/g, '');
  
  switch (rarityType.toLowerCase()) {
    case 'legendary':
      return '#FFB700'; // Amber/Gold
    case 'yellow':
      return '#FFD700'; // Yellow/Gold
    case 'red':
      return '#FF4C4C'; // Vibrant Red
    case 'pink':
      return '#FF66B2'; // Pink
    case 'purple':
      return '#A855F7'; // Purple
    case 'blue':
      return '#3B82F6'; // Blue
    default:
      return '#9CA3AF'; // Gray
  }
};

// Add a function to ensure image URLs are consistently formatted
const normalizeImagePath = (path: string): string => {
  // Remove any double slashes (except http:// or https://)
  let normalizedPath = path.replace(/([^:])\/+/g, '$1/');
  
  // Ensure the path starts with a slash if it's a relative path
  if (!normalizedPath.startsWith('http') && !normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }
  
  // Make the path absolute (for consistent comparison)
  if (normalizedPath.startsWith('/')) {
    // Replace encoded characters if any
    normalizedPath = normalizedPath.replace(/%20/g, ' ');
  }
  
  console.log(`Normalized image path: ${path} → ${normalizedPath}`);
  return normalizedPath;
};

// Add a helper function to properly format addresses
const getChecksumAddress = (address: string): string => {
  try {
    return ethers.getAddress(address.toLowerCase());
  } catch (error) {
    console.error("Error formatting address:", error);
    return address.toLowerCase();
  }
};

// Create utility functions for ethers
const etherUtils = {
  formatUnits: (value: string | bigint | number, decimals: number): string => {
    try {
      return ethers.formatUnits(value, decimals);
    } catch (err) {
      return String(Number(value) / Math.pow(10, Number(decimals)));
    }
  },
  parseUnits: (value: string, decimals: number): bigint => {
    try {
      return ethers.parseUnits(value, decimals);
    } catch (err) {
      return BigInt(Math.floor(Number(value) * Math.pow(10, Number(decimals))));
    }
  }
};

// After the normalizeImagePath function, add these functions to map rarities to tokens and determine token amounts

// Function to determine token amount based on rarity
const getTokenAmountForRarity = (rarity: string): number => {
  if (rarity === 'blue1') return 100; // Chester token
  if (rarity === 'blue2') return 100; // Dojo token
  if (rarity === 'purple1') return 250; // Wojak token
  if (rarity === 'purple2') return 250; // Yup token
  if (rarity === 'purple3') return 250; // Nutz token
  if (rarity === 'pink1') return 500; // Paingu token
  if (rarity === 'pink2') return 500; // Penguin token
  if (rarity === 'red1') return 1200; // Feathers token
  if (rarity === 'red2') return 1200; // Retsba token
  if (rarity === 'yellow1') return 10000; // Abby token
  if (rarity === 'yellow3') return 10000; // ABSTER token
  if (rarity === 'legendary1') return 15000; // MOP token
  if (rarity === 'legendary2') return 1; // Bearish NFT
  if (rarity === 'legendary3') return 1; // 77-Bit NFT
  if (rarity === 'legendary4') return 19500; // Wojak token
  if (rarity === 'legendary5') return 20000; // RETSBA token
  if (rarity === 'legendary6') return 1; // Bearish NFT Premium
  
  // Default fallback
  return 100;
};

// Map rarities to corresponding tokens
const getRarityTokenMapping = (rarity: string): string => {
  if (rarity === 'blue1') return 'CHESTER';
  if (rarity === 'blue2') return 'DOJO3';
  if (rarity === 'purple1') return 'WOJACT';
  if (rarity === 'purple2') return 'YUP';
  if (rarity === 'purple3') return 'NUTZ';
  if (rarity === 'pink1') return 'PAINGU';
  if (rarity === 'pink2') return 'PENGUIN';
  if (rarity === 'red1') return 'FEATHERS';
  if (rarity === 'red2') return 'RETSBA';
  if (rarity === 'yellow1') return 'ABBY';
  if (rarity === 'yellow3') return 'ABSTER';
  if (rarity === 'legendary1') return 'MOP';
  if (rarity === 'legendary2') return 'BEARISH'; // NFT
  if (rarity === 'legendary3') return 'BIT77'; // NFT
  if (rarity === 'legendary4') return 'WOJACT';
  if (rarity === 'legendary5') return 'RETSBA';
  if (rarity === 'legendary6') return 'BEARISH'; // NFT Premium

  // Default fallback
  return "CHESTER";
};

// Add wallet connection options
const WALLET_OPTIONS = {
  AGW: "agw",
  METAMASK: "metamask" 
}

// NFT handler address
const NFT_HANDLER_ADDRESS = "0x96b927A5a1e54C8bfCbeb0574BC0A9bA61a13d5E";

// NFT handler ABI
const NFT_HANDLER_ABI = [
  "function transferNFT(address nftAddress, uint256 tokenId, address recipient, uint256 amount) external",
  "function isNFTSupported(address nftAddress) external view returns (bool)",
  "function getNFTBalance(address nftAddress, uint256 tokenId) external view returns (uint256)",
  "function owner() external view returns (address)"
];

export default function NootCasePage() {
  // Update to include token properties in inventory items
  interface InventoryItem {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
    image?: string;  // Added to fix linter error
    price?: number;  // Added to fix linter error
    claimed?: boolean;
    tokenKey?: string;
    tokenAddress?: string;
    tokenAmount?: number;
    isNFT?: boolean;
    nftAddress?: string;
    tokenId?: number;
    caseOrigin?: string;
    openedAt?: string;
    claimRequested?: boolean;
  }

  // State variables for inventory management
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [livePreview, setLivePreview] = useState<InventoryItem[]>([]);
  const livePreviewRef = useRef<InventoryItem[]>([]);
  
  const [spinning, setSpinning] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [openingState, setOpeningState] = useState('idle'); // Add missing openingState
  const [showConfetti, setShowConfetti] = useState(false); // Add missing showConfetti state
  const [showDialog, setShowDialog] = useState(false);
  const [rewardItem, setRewardItem] = useState<InventoryItem | null>(null);
  const [farmCoins, setFarmCoins] = useState(100); // Start with 100 farm coins
  const [showWinCard, setShowWinCard] = useState(false); // Add state for win card
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  
  // Animation and rendering references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  // NOOT token integration
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [nootBalance, setNootBalance] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState("farm-coins"); // "farm-coins" or "noot-token"
  const [isSellingToken, setIsSellingToken] = useState(false);
  
  // Transaction state
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [showTxDialog, setShowTxDialog] = useState<boolean>(false);
  const [isClaimingToken, setIsClaimingToken] = useState<boolean>(false);
  
  // Important: Use refs instead of state for animation variables
  // This is critical to match solcasenft's direct variable manipulation
  const speedRef = useRef(0);
  const stateRef = useRef(STATE.RETURN);
  const startIndexRef = useRef(0);
  const startTimeRef = useRef(0);
  const accelerationDurationRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const winnerIndexRef = useRef<number | null>(null);
  
  // Sound references
  const openCaseSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveItemSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Additional refs for precise control
  const scrollCountRef = useRef<number>(0);
  const totalScrollItemsRef = useRef<number>(0);
  
  // CRITICAL FIX: Completely redesign the animation to be deterministic with no jumps
  const scrollPositionRef = useRef<number>(0);
  const totalScrollStepsRef = useRef<number>(0);
  const receiveItemSoundPlayedRef = useRef<boolean>(false); // Add ref for tracking if sound was played
  const normalizedTimeRef = useRef<number>(0); // Track animation progress globally
  
  // Inline styles for highlight effects
  const styles = {
    '@keyframes winnerPulse': {
      '0%': { boxShadow: '0 0 10px 5px rgba(255, 215, 0, 0.4)' },
      '50%': { boxShadow: '0 0 20px 10px rgba(255, 215, 0, 0.8)' },
      '100%': { boxShadow: '0 0 10px 5px rgba(255, 215, 0, 0.4)' }
    },
    winnerHighlight: {
      animation: 'winnerPulse 1s ease-in-out 3',
      borderRadius: '8px',
      position: 'relative',
      zIndex: 10
    }
  };
  
  // Add the styles to document
  useEffect(() => {
    // Create style element if it doesn't exist
    let styleEl = document.getElementById('winner-highlight-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'winner-highlight-style';
      styleEl.innerHTML = `
        @keyframes winnerPulse {
          0% { box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.4); }
          50% { box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.8); }
          100% { box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.4); }
        }
        .winner-highlight {
          animation: winnerPulse 0.5s ease-in-out 3;
          border-radius: 8px;
          position: relative;
          z-index: 10;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // Clean up on component unmount
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);
  
  // Initialize sound function
  const initSounds = () => {
    // Initialize audio if browser supports it
    if (typeof Audio !== 'undefined') {
      try {
        // Create audio elements with inline base64 data instead of loading files
        // This is a simple click/beep sound for opening cases
        const openCaseBase64 = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        
        // This is a simple success sound effect for receiving items
        const receiveItemBase64 = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRaAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
        
        // Create audio elements with the base64 data
        openCaseSoundRef.current = new Audio(openCaseBase64);
        receiveItemSoundRef.current = new Audio(receiveItemBase64);
        
        // Set volume
        if (openCaseSoundRef.current) {
          openCaseSoundRef.current.volume = 0.5;
        }
        
        if (receiveItemSoundRef.current) {
          receiveItemSoundRef.current.volume = 0.5;
        }
        
        console.log('Audio initialized with inline base64 sounds');
      } catch (err) {
        console.log('Audio initialization failed:', err);
      }
    }
  };
  
  useEffect(() => {
    // Initialize sound effects
    initSounds();
    
    // Initialize livePreviewRef with empty array
    livePreviewRef.current = [];
    
    // Initialize canvas with correct dimensions
    if (canvasRef.current) {
      // Set canvas width to be exactly IMAGE_COUNT * IMAGE_WIDTH
      canvasRef.current.width = IMAGE_COUNT * IMAGE_WIDTH;
      canvasRef.current.height = IMAGE_HEIGHT;
      
      // Ensure the style width matches the canvas width for proper rendering
      canvasRef.current.style.width = `${IMAGE_COUNT * IMAGE_WIDTH}px`;
      canvasRef.current.style.height = `${IMAGE_HEIGHT}px`;
    }
    
    // Initialize the slot machine images
    const loadImages = async () => {
      try {
        console.log('Starting to load item images...');
        
        // Log each image that we're trying to load for debugging
        Object.entries(itemDetails).forEach(([rarity, item]) => {
          console.log(`Attempting to load ${rarity} image from: ${item.image}`);
        });
        
        // Create a fallback image that we'll use if others fail to load
        const fallbackImage = document.createElement('img');
        fallbackImage.src = '/case%20items/bronze/Chester.jpg'; // Use a simple image path
        fallbackImage.width = IMAGE_WIDTH;
        fallbackImage.height = IMAGE_HEIGHT;
        
        // Wait for the fallback to load first (or timeout after 5 seconds)
        const fallbackPromise = new Promise<HTMLImageElement>((resolve) => {
          fallbackImage.onload = () => {
            console.log('Fallback image loaded successfully');
            resolve(fallbackImage);
          };
          fallbackImage.onerror = () => {
            console.error('Failed to load even the fallback image');
            // Create a basic canvas element as fallback for the fallback
            const canvas = document.createElement('canvas');
            canvas.width = IMAGE_WIDTH;
            canvas.height = IMAGE_HEIGHT;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#333';
              ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
              ctx.font = '14px Arial';
              ctx.fillStyle = '#FFF';
              ctx.textAlign = 'center';
              ctx.fillText('Image Error', IMAGE_WIDTH/2, IMAGE_HEIGHT/2);
            }
            // Convert canvas to image
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.width = IMAGE_WIDTH;
            img.height = IMAGE_HEIGHT;
            resolve(img);
          };
          // Set a timeout as fallback for the fallback
          setTimeout(() => {
            if (!fallbackImage.complete) {
              fallbackImage.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
            }
          }, 5000);
        });
        
        // Wait for fallback to be ready
        const fallback = await fallbackPromise;
        
        // Create an array to store loaded images with their rarity reference
        const rawImages: {image: HTMLImageElement, rarity: string}[] = [];
        
        // Try loading all images
        for (const [rarity, item] of Object.entries(itemDetails)) {
          try {
            console.log(`Loading image for ${rarity}: ${item.image}`);
            const image = await createImageFromSrc(item.image);
            // @ts-ignore - Store rarity info directly on the image
            image.rarityInfo = { rarity, name: item.name, image: item.image };
            console.log(`Successfully loaded image for ${item.name} (${rarity})`);
            
            rawImages.push({ image, rarity });
          } catch (error) {
            console.error(`Failed to load image for ${rarity} from ${item.image}`, error);
            
            // Use a cloned fallback image
            const fallbackClone = fallback.cloneNode() as HTMLImageElement;
            // @ts-ignore - Store rarity info directly on the fallback image
            fallbackClone.rarityInfo = { rarity, name: item.name, image: item.image };
            console.log(`Using fallback image for ${item.name} (${rarity})`);
            
            rawImages.push({ image: fallbackClone, rarity });
          }
        }
        
        // Ensure images are in the correct order per the imageRarities array
        const sortedImages = imageRarities.map(rarity => {
          const match = rawImages.find(item => item.rarity === rarity);
          if (!match) {
            console.error(`No image found for rarity: ${rarity}`);
            // If somehow this rarity is missing, use the first available image
            return rawImages[0]?.image || fallback.cloneNode() as HTMLImageElement;
          }
          return match.image;
        });
        
        console.log(`Loaded ${sortedImages.length} images for slot machine`);
        // Verify the order
        sortedImages.forEach((img, idx) => {
          // @ts-ignore
          console.log(`Image ${idx}: ${img.rarityInfo?.rarity || 'unknown'} - ${img.rarityInfo?.name || 'Unknown Item'}`);
        });
        
        imagesRef.current = sortedImages;
        
        // Force an immediate first draw
        setTimeout(() => {
          console.log('Drawing initial slot machine state');
          renderSlotMachine();
        }, 100);
      } catch (error) {
        console.error('Critical error loading images:', error);
        toast.error('Failed to load item images. Please refresh and try again.');
      }
    };
    
    loadImages();
    
    // Simulate live preview with random items
    const interval = setInterval(() => {
      if (imageRarities.length > 0 && itemDetails) {
        // Select random rarity
        const randomIndex = Math.floor(Math.random() * imageRarities.length);
        const rarity = imageRarities[randomIndex];
        if (rarity) {
          const itemData = itemDetails[rarity as keyof typeof itemDetails];
          if (itemData) {
            // Add item data with the correct rarity information
            addToLivePreview({
              ...itemData,
              rarity: rarity
            });
          }
        }
      }
    }, 3000); // Shorter interval to show more items
    
    // Check if user has a connected wallet
    checkWalletConnection();
    
    // Cleanup function
    return () => {
      clearInterval(interval);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);
  
  // Connect wallet and fetch NOOT balance
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
      console.error(`Error connecting to wallet:`, error);
      toast.error(`Failed to connect wallet. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connect to AGW
  const connectAGW = async () => {
    try {
      await loginWithAbstract();
      setActiveWallet(WALLET_OPTIONS.AGW);
      setIsWalletConnected(true);
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
      if (activeWallet === WALLET_OPTIONS.AGW) {
        // Using window object instead of hook due to hook limitations
        if (typeof window !== 'undefined' && (window as any).abstract?.logout) {
          await (window as any).abstract.logout();
        }
      }
      // Reset connection state
      setIsWalletConnected(false);
      setActiveWallet(null);
      setWalletAddress('');
      setNootBalance("0");
      
      toast.success("Wallet disconnected");
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
    
    // If using AGW, no need to switch networks - it's already on Abstract Testnet
    if (activeWallet === WALLET_OPTIONS.AGW) {
      return true;
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
  
  // Check wallet connection on load
  const checkWalletConnection = async () => {
    try {
      // Check for AGW connection first
      if (isAGWConnected && agwAddress) {
        setWalletAddress(agwAddress);
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.AGW);
        
        // Fetch NOOT balance
        fetchNootBalance(agwAddress);
        return;
      }
      
      // Otherwise check for MetaMask
      if (typeof window.ethereum === "undefined") {
        return;
      }
      
      // Check if already connected to MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
        setActiveWallet(WALLET_OPTIONS.METAMASK);
        setMetamaskProvider(window.ethereum);
        
        // Fetch NOOT balance
        fetchNootBalance(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };
  
  // Wallet connection dialog component
  const WalletOptionsDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#121212] border border-[#333] rounded-lg p-8 max-w-md w-full shadow-xl animation-fadeIn">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 text-sm">Select a wallet to continue</p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => connectWallet(WALLET_OPTIONS.AGW)}
            className="flex items-center justify-between p-4 bg-black text-white border border-gray-700 rounded-lg hover:bg-white hover:text-black transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-black p-2 rounded-full mr-3">
                <Image src="/agw-logo.png" alt="AGW" width={28} height={28} />
              </div>
              <div>
                <p className="font-medium">Abstract Gaming Wallet</p>
                <p className="text-xs opacity-70">Connect using AGW</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
          
          <button
            onClick={() => connectWallet(WALLET_OPTIONS.METAMASK)}
            className="flex items-center justify-between p-4 bg-black text-white border border-gray-700 rounded-lg hover:bg-white hover:text-black transition-all duration-200 transform hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className="bg-gray-100 p-2 rounded-full mr-3">
                <Image src="/metamask-logo.png" alt="MetaMask" width={28} height={28} />
              </div>
              <div>
                <p className="font-medium">MetaMask</p>
                <p className="text-xs opacity-70">Connect using browser extension</p>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowWalletOptions(false)}
            className="text-gray-400 text-sm hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  
  const fetchNootBalance = async (address: string): Promise<void> => {
    try {
      if (!address) return;
      
      // Get the network ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // If we're not on Abstract Testnet, show placeholder balance
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) { 
        setNootBalance("0");
        return;
      }
      
      // Create provider and contract instance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nootContract = new ethers.Contract(
        getChecksumAddress(NOOT_TOKEN_ADDRESS), 
        TOKEN_ABI, 
        provider
      );
      
      // Get NOOT balance
      const balance = await nootContract.balanceOf(getChecksumAddress(address));
      const formattedBalance = etherUtils.formatUnits(balance, 18);
      setNootBalance(formattedBalance);
      
    } catch (error) {
      console.error("Error fetching NOOT balance:", error);
      setNootBalance("0");
    }
  };
  
  // Add function to monitor transaction status
  const monitorTransaction = async (hash: string): Promise<boolean> => {
    try {
      setTxStatus("pending");
      setTxHash(hash);
      setShowTxDialog(true);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
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
      
      // Wait for confirmation with timeout handling
      try {
        const receipt = await Promise.race([
          tx.wait(1), // Wait for 1 confirmation
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Transaction confirmation timeout")), 120000)
          ) // 2 minute timeout
        ]) as ethers.TransactionReceipt;
        
        // Check if transaction was successful
        if (receipt && receipt.status === 1) {
          setTxStatus("confirmed");
          toast.success("Transaction confirmed!");
          
          // Update balances after successful transaction
          if (walletAddress) {
            await fetchNootBalance(walletAddress);
            
            // Add a short delay before dismissing the transaction dialog
            setTimeout(() => {
              setShowTxDialog(false);
            }, 3000);
          }
          
          return true;
        } else {
          setTxStatus("failed");
          toast.error("Transaction failed. Please check the block explorer.");
          return false;
        }
      } catch (timeoutError) {
        console.error("Transaction confirmation timeout:", timeoutError);
        toast("Transaction is taking longer than expected. You can check its status on the block explorer.", {
          duration: 10000,
        });
        
        // Don't mark as failed, but return false to avoid proceeding
        return false;
      }
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      setTxStatus("failed");
      toast.error("Error tracking transaction. Please check your wallet.");
      return false;
    }
  };
  
  // Function to transfer NOOT tokens to contract
  const transferNootToContract = async (): Promise<boolean> => {
    try {
      if (!isWalletConnected || !walletAddress) {
        toast.error("Please connect your wallet first");
        return false;
      }
      
      // Check if user has enough NOOT tokens
      if (parseFloat(nootBalance) < NOOT_CASE_COST) {
        toast.error(`Not enough NOOT tokens. You have ${nootBalance} NOOT.`);
        return false;
      }
      
      // Get the network ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      // If we're not on Abstract Testnet, show error
      if (chainId !== ABSTRACT_TESTNET_CHAIN_ID) { 
        toast.error("Please switch to Abstract Testnet network");
        return false;
      }
      
      // Create provider and get signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instances
      const nootContract = new ethers.Contract(
        getChecksumAddress(NOOT_TOKEN_ADDRESS), 
        TOKEN_ABI, 
        signer
      );
      
      // Calculate amount with proper decimals
      const nootAmount = etherUtils.parseUnits(NOOT_CASE_COST.toString(), 18);
      
      // STEP 1: Check approval
      const currentAllowance = await nootContract.allowance(
        getChecksumAddress(walletAddress),
        getChecksumAddress(NOOT_SWAP_ADDRESS)
      );
      
      // STEP 2: Approve tokens if needed
      if (currentAllowance < nootAmount) {
        toast.loading("Approving NOOT tokens...", { id: "approve-toast" });
        
        // Use a larger allowance to prevent frequent approvals
        const largerAllowance = etherUtils.parseUnits("1000", 18); // 1000 NOOT
        
        // Send approval transaction
        const approveTx = await nootContract.approve(
          getChecksumAddress(NOOT_SWAP_ADDRESS),
          largerAllowance
        );
        
        toast.loading("Waiting for approval confirmation...", { id: "approve-toast" });
        
        // Wait for approval confirmation
        const approveReceipt = await approveTx.wait();
        if (!approveReceipt || approveReceipt.status !== 1) {
          toast.error("Approval failed. Please try again.", { id: "approve-toast" });
          return false;
        }
        
        toast.success("NOOT tokens approved!", { id: "approve-toast" });
      }
      
      // STEP 3: Transfer NOOT tokens to contract
      toast.loading("Sending NOOT tokens...", { id: "transfer-toast" });
      
      // Direct transfer to contract
      const transferTx = await nootContract.transfer(
        getChecksumAddress(NOOT_SWAP_ADDRESS),
        nootAmount
      );
      
      toast.loading("Processing transaction...", { id: "transfer-toast" });
      
      // Monitor transaction
      const success = await monitorTransaction(transferTx.hash);
      
      if (success) {
        toast.success("Payment successful!", { id: "transfer-toast" });
        return true;
      } else {
        toast.error("Payment failed. Please try again.", { id: "transfer-toast" });
        return false;
      }
    } catch (error) {
      console.error("Error transferring NOOT:", error);
      toast.error("Transaction failed. Please try again.");
      return false;
    }
  };
  
  // Update the openCase function to handle blockchain transactions
  const openCase = async () => {
    if (spinning) return;
    
    if (paymentMethod === "farm-coins") {
      if (farmCoins < CASE_COST) {
        toast.error("Not enough farm coins!");
        return;
      }
      
      // Deduct farm coins
      setFarmCoins(prev => prev - CASE_COST);
      
      // Continue with case opening
      startCaseOpening();
    } else {
      // NOOT token payment with real blockchain transaction
      const success = await transferNootToContract();
      
      if (!success) {
        return;
      }
      
      // Continue with case opening
      startCaseOpening();
    }
  };
  
  // CRITICAL FIX: Completely redesign the animation to be deterministic with no jumps
  const startCaseOpening = (): void => {
    // Play sound when case is opened
    if (openCaseSoundRef.current) {
      try {
        openCaseSoundRef.current.currentTime = 0;
        openCaseSoundRef.current.play().catch(err => console.log("Error playing sound"));
      } catch (err) {
        console.error("Failed to play sound:", err);
      }
    }
    
    setSpinning(true);
    
    // Determine the winner before animation starts
    // This is the definitive winner and must be respected throughout the animation
    const winnerIndex = shuffleItems();
    winnerIndexRef.current = winnerIndex;
    
    const imagesLength = imagesRef.current.length;
    
    // FIX: Instead of trying to manipulate the animation during runtime,
    // we'll set up the exact path from start to finish ahead of time
    
    // 1. Calculate exactly how many full rotations we want
    const rotationsCount = 0.5; // Reduced to half a rotation for speed
    const centerPosition = Math.floor(IMAGE_COUNT / 2);
    
    // 2. Calculate where to start so we'll land perfectly on the winning index
    // This is the key to ensuring no jumps - we're setting up a path that naturally
    // leads to the winner being in the center when the animation stops
    const extraSteps = Math.floor(Math.random() * 2) + 1; // Reduced to 1-3 steps
    const totalSteps = Math.max(8, Math.floor(rotationsCount * imagesLength) + extraSteps);
    
    // Working backwards from where we want to end (the winner in center position)
    // we need to start at an index that, after traveling totalSteps, will place
    // the winner at the center position
    const startIndex = (winnerIndex - totalSteps - centerPosition + imagesLength * 100) % imagesLength;
    
    // Store this starting point
    startIndexRef.current = startIndex;
    offsetRef.current = 0;
    
    console.log('ANIMATION SETUP:');
    console.log('Winner item:', winnerIndex, imageRarities[winnerIndex]);
    console.log('Starting at index:', startIndex);
    console.log('Will travel exactly', totalSteps, 'steps');
    console.log('Expected end center item index:', (startIndex + totalSteps + centerPosition) % imagesLength);
    
    // Store the total number of steps to monitor progress
    scrollPositionRef.current = 0;
    totalScrollStepsRef.current = totalSteps;
    
    // Reset animation state
    stateRef.current = STATE.ACCELERATION;
    startTimeRef.current = performance.now();
    speedRef.current = BASE_SPEED;
    
    // Use a random acceleration duration for more natural feel
    accelerationDurationRef.current = 
      Math.random() * (ACCELERATION_DURATION_MAX - ACCELERATION_DURATION_MIN) + ACCELERATION_DURATION_MIN;
    
    // Start animation
    setTimeout(() => {
      renderSlotMachine();
      animationFrameIdRef.current = requestAnimationFrame(deterministic_updateSlotMachine);
    }, 50);
  };
  
  // New animation update function that guarantees the path
  const deterministic_updateSlotMachine = () => {
    if (!canvasRef.current) return;
    
    const imagesLength = imagesRef.current.length;
    const deltaTime = performance.now() - startTimeRef.current;
    const totalDuration = 7000; // 7 seconds total animation time
    // Custom easing function - fast start (first 30% of time), then extreme slowdown
    // This creates a more satisfying reveal effect
    const customEasing = (t: number): number => {
      if (t < 0.3) {
        // First 30% of animation (2.1 seconds) - very rapid acceleration
        // Use a linear curve for faster start
        return t * 3.0; // Much faster start (0-0.9 in first 30%)
      } else {
        // Last 70% of animation - extreme deceleration using higher power
        // Map t from 0.3-1.0 range to 0-1 range for the second half calculations
        const adjustedT = (t - 0.3) / 0.7;
        // Use a higher power for more dramatic slowdown
        return 0.9 + 0.1 * (1 - Math.pow(1 - adjustedT, 5)); // More extreme exponential slowdown
      }
    };
    
    // Calculate animation progress using the custom easing function
    const normalizedTime = Math.min(deltaTime / totalDuration, 1);
    const easedProgress = customEasing(normalizedTime);
    
    // Update the global normalized time reference for other functions to use
    normalizedTimeRef.current = normalizedTime;
    
    // Calculate target steps based on eased progress
   
    
    // Change state based on animation progress
  
    
    // HARD STOP - ONLY force animation to end if we've reached the full time limit
   
    
    // Calculate dynamic speed based on animation phase and progress - MUCH SLOWER
    if (stateRef.current === STATE.ACCELERATION) {
      // Fast initial speed (20-40 pixels per frame) for first 30%
      speedRef.current = 20 + 20 * (easedProgress / 0.9); 
    } else {
      // Extreme speed reduction in deceleration phase
      const remainingProgress = 1 - easedProgress;
      // Use a stronger power for more dramatic slowdown
      const decelerationCurve = Math.pow(remainingProgress, 3); // Less aggressive base curve
      
      // Check if we're approaching the winning item
      let winnerSlowdownFactor = 1.0;
      
      // Apply special slowdown when nearing the end of animation AND approaching winner
      if (typeof winnerIndexRef.current === 'number' && normalizedTime > 0.5) {
        const centerPosition = Math.floor(IMAGE_COUNT / 2);
        const currentCenterIndex = (startIndexRef.current + centerPosition) % imagesLength;
        const distanceToWinner = (winnerIndexRef.current - currentCenterIndex + imagesLength) % imagesLength;
        
        // Log winner detection details periodically
        if (scrollPositionRef.current % 10 === 0 || distanceToWinner < 5) {
          console.log(`🔍 Winner detection: distance=${distanceToWinner}, currentCenter=${currentCenterIndex}, winnerIndex=${winnerIndexRef.current}, time=${normalizedTime.toFixed(2)}`);
        }
        
        // Apply extreme slowdown when getting very close to winner
        if (distanceToWinner < 5) {
          // Even more dramatic slowdown as we get closer to winner
          winnerSlowdownFactor = Math.pow(0.05, (5 - distanceToWinner) / 5);
          
          // Almost stop completely when exactly on winner
          if (distanceToWinner === 0) {
            // Super extreme slowdown - almost a complete stop when winning item is centered
            winnerSlowdownFactor = 0.0005; // Even more stopped - virtually frozen
            
            // Add a dramatic visual pause at the winner - more permissive conditions
            if (normalizedTime > 0.7) {
              console.log('🏆🏆🏆 WINNER CENTERED - EXTREME SLOWDOWN 🏆🏆🏆');
              
              // Play a subtle sound to emphasize the winning item if late in animation
              if (receiveItemSoundRef.current && 
                  receiveItemSoundRef.current.readyState > 0 && 
                  !receiveItemSoundPlayedRef.current) {
                receiveItemSoundRef.current.currentTime = 0;
                receiveItemSoundRef.current.play().catch(err => console.log("Error playing sound"));
                receiveItemSoundPlayedRef.current = true;
                
                // Add subtle visual highlight effect when winning item is displayed
                const slotContainer = canvasRef.current.parentElement;
                if (slotContainer) {
                  // Add a more noticeable highlight
                  slotContainer.classList.add('winner-highlight');
                  slotContainer.style.outline = '3px solid gold';
                  setTimeout(() => {
                    slotContainer.classList.remove('winner-highlight');
                    slotContainer.style.outline = '';
                  }, 1500);
                  
                  // Log DOM element for debugging
                  console.log('Applied highlight to element:', slotContainer);
                } else {
                  console.error('Could not find slot container for highlight effect');
                }
                
                // Force a longer pause by temporarily increasing the animation time
                if (normalizedTime < 0.95) {
                  console.log('Extending animation time for dramatic pause...');
                  // Artificially slow down by reducing progress
                  startTimeRef.current = performance.now() - totalDuration * 0.85;
                }
              }
            }
          } else if (distanceToWinner === 1 && normalizedTime > 0.7) {
            // Add a warning log when approaching winner
            console.log('⚠️ APPROACHING WINNER - SLOWING DOWN ⚠️');
          }
        }
      }
      
      // Calculate final speed - start with higher base speed that dramatically slows
      const baseSpeed = 15 * decelerationCurve;
      speedRef.current = Math.max(baseSpeed * winnerSlowdownFactor, 0.01);
    }
    
    // Update offset based on current speed
    offsetRef.current += speedRef.current;
    
    // Handle crossing item boundaries
    if (offsetRef.current > IMAGE_WIDTH) {
      // We've moved past one full item
      scrollPositionRef.current++;
      
      startIndexRef.current = (startIndexRef.current + 1) % imagesLength;
      offsetRef.current %= IMAGE_WIDTH;
      
      // Log progress periodically
      if (scrollPositionRef.current % 2 === 0 || 
          Math.abs(scrollPositionRef.current - totalScrollStepsRef.current) < 5) {
        const progress = Math.floor((scrollPositionRef.current / totalScrollStepsRef.current) * 100);
        console.log(`Animation progress: ${progress}% (${scrollPositionRef.current}/${totalScrollStepsRef.current})`);
      }
      
      // REMOVED: Don't complete based on reaching steps alone
      // Let the animation run for the full 7 seconds regardless of steps
    }
    
    // Draw current state for smooth visuals
    renderSlotMachine();
    
    // Final approach - ONLY when we're at 99% of the animation time
    // This ensures we complete the full 7 seconds
    if (normalizedTime > 0.99) {
      // Final positioning - ensure we land exactly on winner
      const centerPosition = Math.floor(IMAGE_COUNT / 2);
      const finalCenterIndex = (startIndexRef.current + centerPosition) % imagesLength;
      
      if (finalCenterIndex !== winnerIndexRef.current && 
          typeof winnerIndexRef.current === 'number') {
        // Make final adjustment to ensure winner is centered
        const adjustment = (winnerIndexRef.current - finalCenterIndex + imagesLength) % imagesLength;
        startIndexRef.current = (startIndexRef.current + adjustment) % imagesLength;
        offsetRef.current = 0;
        renderSlotMachine();
        
        // Complete the animation
        console.log('Animation completed with final adjustment at full time');
        finishOpening();
        return;
      }
    }
    
    // Continue animation if not at end - ensure we keep going for the full time
    if (normalizedTime < 1) {
      animationFrameIdRef.current = requestAnimationFrame(deterministic_updateSlotMachine);
    } else {
      // Animation has reached full duration - ensure winner is displayed
      console.log('Animation completed at full time - Ensuring winner display');
      
      // Force the winner to be in the center position
      const centerPosition = Math.floor(IMAGE_COUNT / 2);
      if (winnerIndexRef.current !== null && typeof winnerIndexRef.current === 'number') {
        startIndexRef.current = (winnerIndexRef.current - centerPosition + imagesLength * 100) % imagesLength;
        offsetRef.current = 0;
        renderSlotMachine();
      }
      
      // Play sound
      if (receiveItemSoundRef.current && receiveItemSoundRef.current.readyState > 0) {
        receiveItemSoundRef.current.play().catch(err => console.log("Error playing sound"));
      }
      
      animationFrameIdRef.current = null;
      
      // Get what's actually visible in the center after animation completes
      const centerItem = getCenterItem();
      if (!centerItem) {
        console.error("ERROR: No center item found at end of animation!");
        finishOpening();
        return;
      }
      
      console.log("FINAL ITEM DISPLAYED:", centerItem.index, centerItem.rarity, centerItem.name);
      
      // User gets what they see - that's the principle
      if (centerItem.index !== undefined && winnerIndexRef.current !== null &&
          typeof winnerIndexRef.current === 'number' && centerItem.index !== winnerIndexRef.current) {
        console.error("ERROR: Final displayed item does not match winner");
        console.log(`Correcting winner from ${winnerIndexRef.current} to ${centerItem.index}`);
        winnerIndexRef.current = centerItem.index;
      }
      
      // Finish opening the case
      finishOpening();
    }
  };
  
  // Update the createImageFromSrc function to log the image creation process
  const createImageFromSrc = (src: string): Promise<HTMLImageElement> => {
    console.log(`Creating image from src: ${src}`);
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = "anonymous"; // Prevent CORS issues
      
      img.onload = () => {
        console.log(`Successfully loaded original image: ${src} (${img.width}x${img.height})`);
        
        // Create an offscreen canvas to handle image scaling and quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas to desired item dimensions
        canvas.width = IMAGE_WIDTH;
        canvas.height = IMAGE_HEIGHT;
        
        if (ctx) {
          // Apply higher quality bicubic interpolation
          // @ts-ignore
          ctx.imageSmoothingQuality = 'high';
          ctx.imageSmoothingEnabled = true;
          
          // Center and scale the image to fit nicely in the frame
          // Calculate scaling to maintain aspect ratio
          const widthRatio = IMAGE_WIDTH / img.width;
          const heightRatio = IMAGE_HEIGHT / img.height;
          const scale = Math.min(widthRatio, heightRatio) * 0.9; // 0.9 adds a bit of padding
          
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (IMAGE_WIDTH - scaledWidth) / 2;
          const y = (IMAGE_HEIGHT - scaledHeight) / 2;
          
          // Fill with background
          ctx.fillStyle = '#111';
          ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
          
          // Draw the image centered and scaled
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Create a new image from the processed canvas
          const processedImg = document.createElement('img');
          processedImg.src = canvas.toDataURL('image/png');
          
          // Store the original source path on the image for reference
          // @ts-ignore
          processedImg.originalSrc = src;
          
          processedImg.onload = () => {
            console.log(`Created processed image from: ${src}`);
            resolve(processedImg);
          };
          processedImg.onerror = (e) => {
            console.error(`Failed to create processed image from: ${src}`, e);
            reject(e);
          };
        } else {
          // Fallback to original image if canvas context fails
          console.log(`Using original image: ${src} (no canvas context)`);
          resolve(img);
        }
      };
      
      img.onerror = (e) => {
        console.error(`Failed to load image: ${src}`);
        // Create a placeholder for failed images
        const placeholder = document.createElement('img');
        placeholder.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAAQlBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////BBxTBAAAAFXRSTlMABAgMEBQYHCAkKCwwNDg8QERISEQE7MwsAAABLklEQVR4nO3Z7Y6DIBCGYdQPEFhFbvX+L3XXrK27SWOmTUPH5X3+E+aJggzDAAAAAAAAAAAAAAAAADtSXuxQe7FDdzbPZXudoYtJ0XVn805JVZqIXMmf9dbPR1o9V6Y0GSu1kZoKs5EjNZHe+Sm5LK3Ml7+n1vCz/uuWVYudbzlZr5O2Uv1c1Hs/+XCvNvKUGi82Ut9cUdRr1YmqWZJo3WLVfXpTqTy5MBT2gLZSt2CeQmW3R9BRatK5SJWdHsEnNZz7SZu42+cYfFIz52DUWUbdwqSjDsLh0+zzcFz8NQ9e/MdE1PU57udWHXXtNnbGbrMKO6M2zz327LCRzXzAyHZOG3V05/zMZ3dj1zDc0dn5YtX7/I7gkzr/wNb2v0YAAAAAAAAAAAAAAADgz7wB+s8XgZ3QQcAAAAAASUVORK5CYII=';
        // @ts-ignore
        placeholder.originalSrc = src; // Keep track of the original source
        placeholder.onload = () => {
          console.log(`Using placeholder image for: ${src}`);
          resolve(placeholder);
        };
      };
      
      img.src = src;
    });
  };
  
  // Random number generator helper function (from solcasenft)
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
  
  // Show visual effects for high-value wins (copied from solcasenft)
  const showWinEffects = () => {
    // Create confetti container if it doesn't exist
    let confettiContainer = document.querySelector('.confetti-container');
    if (!confettiContainer) {
      confettiContainer = document.createElement('div');
      confettiContainer.className = 'confetti-container';
      document.body.appendChild(confettiContainer);
    } else {
      // Clear existing confetti
      confettiContainer.innerHTML = '';
    }
    
    // Add confetti pieces
    for (let i = 0; i < 100; i++) {
      const confettiElem = document.createElement('div');
      confettiElem.className = 'confetti';
      confettiElem.style.left = `${Math.random() * 100}vw`;
      confettiElem.style.animationDelay = `${Math.random() * 3}s`;
      confettiElem.style.animationDuration = `${Math.random() * 2 + 2}s`;
      
      // Random colors for confetti
      const colors = ['#FFD700', '#FFC107', '#FFEB3B', '#FFEE58', '#FFF59D'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      confettiElem.style.backgroundColor = randomColor;
      
      confettiContainer.appendChild(confettiElem);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
      if (confettiContainer && confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
    }, 5000);
  };
  
  // Update the renderSlotMachine function to be more responsive
  const renderSlotMachine = () => {
    if (!canvasRef.current) {
      console.error('Canvas ref is null in renderSlotMachine');
      return;
    }
    
    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.error('Failed to get 2d context from canvas');
      return;
    }
    
    const imagesLength = imagesRef.current.length;
    if (imagesLength === 0) {
      console.error('No images loaded for slot machine');
      return;
    }
    
    // Make the canvas width responsive to the container
    const containerWidth = canvasRef.current.parentElement?.clientWidth || IMAGE_WIDTH * IMAGE_COUNT;
    const scale = Math.min(1, containerWidth / (IMAGE_WIDTH * IMAGE_COUNT));
    const scaledWidth = Math.floor(IMAGE_WIDTH * IMAGE_COUNT * scale);
    const scaledHeight = Math.floor(IMAGE_HEIGHT * scale);
    
    if (canvasRef.current.width !== scaledWidth || canvasRef.current.height !== scaledHeight) {
      canvasRef.current.width = scaledWidth;
      canvasRef.current.height = scaledHeight;
      canvasRef.current.style.width = `${scaledWidth}px`;
      canvasRef.current.style.height = `${scaledHeight}px`;
    }
    
    // Calculate center of canvas for indicator line
    const center = Math.floor(canvasRef.current.width / 2);
    
    // Set the background - dark instead of white
    context.fillStyle = '#111111';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const centralPosition = Math.floor(IMAGE_COUNT / 2);
    const scaledImageWidth = Math.floor(IMAGE_WIDTH * scale);
    const scaledImageHeight = Math.floor(IMAGE_HEIGHT * scale);
    
    // Check if we're in slow reveal phase - use normalizedTimeRef to know animation progress
    const isInSlowRevealPhase = typeof winnerIndexRef.current === 'number' && 
      normalizedTimeRef.current > 0.7;
    
    // Calculate which item is in the center right now
    const currentCenterItem = (startIndexRef.current + centralPosition) % imagesLength;
    
    // Check if center has the winning item
    const isWinnerInCenter = typeof winnerIndexRef.current === 'number' && 
      currentCenterItem === winnerIndexRef.current;
    
    // Add pulsing effect timing
    const pulseIntensity = 0.5 + 0.5 * Math.sin(performance.now() / 300);
    
    for (let index = -OFFSET; index < IMAGE_COUNT + OFFSET; index++) {
      const imageIndex = index < 0 ? index + imagesLength : index;
      const image = imagesRef.current[(imageIndex + startIndexRef.current) % imagesLength];
      if (image) {
        try {
          const x = scaledImageWidth * index - Math.floor(offsetRef.current * scale);
          const y = 0;
          
          // Check if this specific slot position holds the winning item
          const isThisWinningItem = typeof winnerIndexRef.current === 'number' && 
            (imageIndex + startIndexRef.current) % imagesLength === winnerIndexRef.current;
          
          // Draw the image with proper scaling
          context.drawImage(
            image,
            x,
            y,
            scaledImageWidth,
            scaledImageHeight
          );
          
          // Special effect for winning item in slow phase
          if (isThisWinningItem && index === centralPosition && isInSlowRevealPhase) {
            // Draw a golden glow effect around the winning item
            context.save();
            
            // Draw glowing border - stronger when more centered
            context.strokeStyle = `rgba(255, 215, 0, ${0.7 * pulseIntensity})`;
            context.lineWidth = 5;
            context.strokeRect(x + 5, y + 5, scaledImageWidth - 10, scaledImageHeight - 10);
            
            // Add a second, outer glow
            context.strokeStyle = `rgba(255, 215, 0, ${0.3 * pulseIntensity})`;
            context.lineWidth = 3;
            context.strokeRect(x, y, scaledImageWidth, scaledImageHeight);
            
            // Add "WINNER!" text at the bottom for clarity
            if (normalizedTimeRef.current > 0.9) {
              context.font = 'bold 18px Arial';
              context.textAlign = 'center';
              context.fillStyle = `rgba(255, 215, 0, ${pulseIntensity})`;
              context.fillText('YOU WIN!', x + scaledImageWidth/2, y + scaledImageHeight - 10);
            }
            
            context.restore();
          } 
          // Standard frame for non-winning or non-center items
          else {
            // Add a nice frame around each item
            context.strokeStyle = 'rgba(255, 215, 0, 0.3)';
            context.lineWidth = 2;
            context.strokeRect(x + 2, y + 2, scaledImageWidth - 4, scaledImageHeight - 4);
            
            // Highlight the center position
            if (index === centralPosition) {
              context.strokeStyle = 'rgba(255, 215, 0, 0.8)';
              context.lineWidth = 3;
              context.strokeRect(x + 5, y + 5, scaledImageWidth - 10, scaledImageHeight - 10);
            }
          }
        } catch (error) {
          console.error('Error drawing image:', error, image);
        }
      } else {
        console.warn(`No image found at index ${(imageIndex + startIndexRef.current) % imagesLength}`);
      }
    }
  };

  // Function to contact support for NFT claims
  const contactSupport = (item: InventoryItem, nftAddress: string) => {
    const subject = encodeURIComponent(`NFT Claim Assistance - ${item.name}`);
    
    const body = encodeURIComponent(
      `Hello Nooters Support Team,\n\n` +
      `I need assistance claiming my NFT. Here are the details:\n\n` +
      `NFT Name: ${item.name}\n` +
      `Token ID: ${item.tokenId}\n` +
      `NFT Contract Address: ${nftAddress}\n` +
      `My Wallet Address: ${walletAddress}\n\n` +
      `Thank you for your help!\n\n`
    );
    
    window.open(`mailto:support@nooters.farm?subject=${subject}&body=${body}`);
  };

  // Add a new function to claim NFTs
  const claimNFTToWallet = async (item: InventoryItem) => {
    if (!item.isNFT || item.tokenId === undefined) {
      toast.error("Invalid NFT data", { id: "claim-toast" });
      setIsClaimingToken(false);
      return;
    }

    try {
      setIsClaimingToken(true);
      
      // Determine the correct NFT address
      let nftAddress;
      if (item.nftAddress && item.nftAddress.trim() !== '') {
        nftAddress = getChecksumAddress(item.nftAddress);
      } else if (item.tokenKey && NFT_ADDRESSES[item.tokenKey as keyof typeof NFT_ADDRESSES]) {
        nftAddress = getChecksumAddress(NFT_ADDRESSES[item.tokenKey as keyof typeof NFT_ADDRESSES]);
      } else if (item.name) {
        // Try to extract key from name (e.g., "Bearish NFT" -> "BEARISH")
        const possibleKey = item.name.split(' ')[0].toUpperCase();
        if (NFT_ADDRESSES[possibleKey as keyof typeof NFT_ADDRESSES]) {
          nftAddress = getChecksumAddress(NFT_ADDRESSES[possibleKey as keyof typeof NFT_ADDRESSES]);
        } else {
          console.error("Could not determine NFT address from name", item);
          toast.error("Invalid NFT configuration. Please contact support.", { id: "claim-toast" });
          setIsClaimingToken(false);
          return;
        }
      } else {
        console.error("Could not determine NFT address", item);
        toast.error("Invalid NFT configuration. Please contact support.", { id: "claim-toast" });
        setIsClaimingToken(false);
        return;
      }
      
      console.log(`[DEBUG] NFT claim details:
        - NFT name: ${item.name}
        - Token Key: ${item.tokenKey}
        - Item NFT address: ${item.nftAddress}
        - Selected NFT address: ${nftAddress}
        - Token ID: ${item.tokenId}
        - Recipient: ${walletAddress}
        - Handler Address: ${NFT_HANDLER_ADDRESS}
      `);
      
      // Verify handler contract supports this NFT
      try {
        // Create NFT and handler contract instances
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const nftContract = new ethers.Contract(
          nftAddress,
          NFT_ABI,
          signer
        );
        
        // Create NFT handler contract instance
        const nftHandlerContract = new ethers.Contract(
          getChecksumAddress(NFT_HANDLER_ADDRESS),
          NFT_HANDLER_ABI,
          signer
        );
        
        const isNFTSupported = await nftHandlerContract.isNFTSupported(nftAddress);
        console.log(`[DEBUG] Is NFT ${nftAddress} supported by handler? ${isNFTSupported}`);
        
        if (!isNFTSupported) {
          console.error(`NFT ${nftAddress} is not supported by the handler contract`);
          toast.error("This NFT is not supported by the handler contract. Please contact support.", { id: "claim-toast" });
          setIsClaimingToken(false);
          return;
        }
        
        // Check NFT balance in the handler contract
        const nftBalance = await nftHandlerContract.getNFTBalance(nftAddress, item.tokenId);
        console.log(`[DEBUG] NFT balance in handler: ${nftBalance}`);
        
        if (nftBalance <= 0) {
          console.error(`NFT ${nftAddress} with token ID ${item.tokenId} is not available in the handler contract`);
          toast.error("This NFT is not available for claiming. Please contact support.", { id: "claim-toast" });
          setIsClaimingToken(false);
          return;
        }
        
        toast.loading(`Claiming ${item.name} NFT to your wallet...`, { id: "claim-toast" });
        
        // Transfer the NFT using the handler contract
        const claimTx = await nftHandlerContract.transferNFT(
          nftAddress,
          item.tokenId,
          getChecksumAddress(walletAddress),
          1, // Amount is 1 for ERC1155 NFTs
          { gasLimit: 3000000 }
        );
        
        toast.loading(`Finalizing NFT claim...`, { id: "claim-toast" });
        
        // Monitor the transaction
        const claimSuccess = await monitorTransaction(claimTx.hash);
       
        if (claimSuccess) {
          // Verify the transfer was successful by checking balance
          try {
            const balanceAfter = await nftContract.balanceOf(walletAddress, item.tokenId);
            console.log(`[DEBUG] NFT balance after transfer: ${balanceAfter}`);
            
            if (balanceAfter > 0) {
              console.log(`NFT #${item.tokenId} successfully transferred to ${walletAddress}`);
              
              // Update the item to show it's been claimed
              setInventory(prev => 
                prev.map(invItem => 
                  invItem.id === item.id 
                    ? {...invItem, claimed: true} 
                    : invItem
                )
              );
              
              toast.success(`Successfully claimed ${item.name} NFT!`, { id: "claim-toast" });
              
              // Ask if they want to add the NFT to their wallet (MetaMask)
              setTimeout(() => {
                if (window.confirm(`Would you like to add ${item.name} to your wallet for easy viewing?`)) {
                  // Call function to add NFT to wallet
                  addNFTToWallet(nftAddress, item.tokenId || 1, item.name);
                }
              }, 1000);
            } else {
              console.error(`Transfer seemed successful but balance check failed for NFT #${item.tokenId}`);
              toast.error("Transfer completed, but unable to verify. Check your wallet or contact support.", { id: "claim-toast" });
            }
          } catch (error: any) {
            console.error("Error verifying NFT transfer:", error);
            toast.error("Transaction completed but unable to verify. Please check your wallet.", { id: "claim-toast" });
          }
        } else {
          console.error(`NFT claim transaction failed`);
          toast.error("Failed to claim NFT. Please try again or contact support.", { id: "claim-toast" });
        }
      } catch (error: any) {
        console.error("Error claiming NFT:", error);
        toast.error(`Failed to claim NFT: ${error.message || "Unknown error"}`, { id: "claim-toast" });
      } finally {
        setIsClaimingToken(false);
      }
    } catch (error: any) {
      console.error("Error in NFT claim process:", error);
      toast.error(`Error: ${error.message || "Unknown error"}`, { id: "claim-toast" });
      setIsClaimingToken(false);
    }
  };
  
  // Helper function to add NFT to wallet (MetaMask)
  const addNFTToWallet = async (nftAddress: string, tokenId: number, name: string) => {
    try {
      // Only works with MetaMask
      if (!window.ethereum?.isMetaMask) {
        toast.error("This feature is only available with MetaMask wallet", { id: "add-nft-toast" });
        return;
      }
      
      toast.loading("Adding NFT to your wallet...", { id: "add-nft-toast" });
      
      // Request to add the NFT to the wallet
      const wasAdded = await (window.ethereum.request as any)({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC1155',
          options: {
            address: nftAddress,
            tokenId: tokenId.toString(16), // Convert to hex without 0x prefix
          },
        },
      });

      if (wasAdded) {
        toast.success(`${name} was added to your wallet!`, { id: "add-nft-toast" });
      } else {
        toast.error("Failed to add NFT to wallet", { id: "add-nft-toast" });
      }
    } catch (error: any) {
      console.error("Error adding NFT to wallet:", error);
      toast.error(`Error adding NFT to wallet: ${error.message || "Unknown error"}`, { id: "add-nft-toast" });
    }
  };

  // Add token to wallet function - using pattern from token-swap.tsx
  const addTokenToWallet = async (tokenAddress: string, tokenKey: string) => {
    try {
      // Get checksummed address
      const checksummedAddress = getChecksumAddress(tokenAddress);
      console.log("Adding token to wallet:", checksummedAddress, tokenKey);
      
      if (!window.ethereum) {
        toast.error("No wallet provider detected");
        return;
      }
      
      // Get token info
      const tokenInfo = {
        symbol: tokenKey,
        name: tokenKey,
        decimals: 18
      };
      
      // Try to use wallet_watchAsset method first
      try {
        console.log("Attempting to add token using wallet_watchAsset method");
        
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: [
            {
              type: 'ERC20',
              options: {
                address: checksummedAddress,
                symbol: tokenInfo.symbol,
                decimals: 18,
                image: `https://nooters.farm/tokens/${tokenKey.toLowerCase()}.png`,
              },
            }
          ]
        });
        
        if (wasAdded) {
          console.log('Token was added successfully!');
          toast.success(`${tokenInfo.symbol} token added to your wallet!`);
          return;
        } else {
          console.log('User rejected adding the token, using fallback method');
          fallbackToManualMethod(checksummedAddress, tokenInfo);
        }
      } catch (error) {
        console.error("Error using wallet_watchAsset:", error);
        
        // Try alternative format for wallet_watchAsset (MetaMask requires array format)
        try {
          const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: [
              {
                type: 'ERC20',
                options: {
                  address: checksummedAddress,
                  symbol: tokenInfo.symbol,
                  decimals: 18,
                  image: `https://nooters.farm/tokens/${tokenKey.toLowerCase()}.png`,
                },
              }
            ]
          });
          
          if (wasAdded) {
            console.log('Token was added successfully with alternative format!');
            toast.success(`${tokenInfo.symbol} token added to your wallet!`);
            return;
          }
        } catch (altError) {
          console.error("Error with alternative wallet_watchAsset format:", altError);
        }
        
        // Use fallback method if both attempts fail
        console.log("wallet_watchAsset not supported, using fallback method");
        fallbackToManualMethod(checksummedAddress, tokenInfo);
      }
    } catch (error) {
      console.error("Token addition error:", error);
      toast.error("Error adding token to wallet", {
        duration: 5000,
      });
      // Still try the fallback method
      if (tokenAddress) {
        fallbackToManualMethod(tokenAddress, { symbol: tokenKey, name: tokenKey });
      }
    }
  };
  
  // Fallback method for adding tokens
  const fallbackToManualMethod = (tokenAddress: string, tokenInfo: {symbol: string, name: string}) => {
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
            <p className="font-bold">Add ${tokenInfo.symbol} to your wallet:</p>
            <p>1. Open your wallet</p>
            <p>2. Select "Import token" or "Add token"</p>
            <p>3. Paste the address</p>
            <p>4. Enter "{tokenInfo.symbol}" for symbol and "18" for decimals</p>
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
          <p>Symbol: {tokenInfo.symbol} | Decimals: 18</p>
        </div>,
        { duration: 10000 }
      );
    });
  };

  // Function to sell token for Farm Coins
  const sellTokenForFarmCoins = async (item: InventoryItem) => {
    try {
      setIsSellingToken(true);
      
      // Calculate farm coins based on token amount and rarity
      const farmCoinsToAdd = calculateFarmCoinsFromTokens(
        item.tokenAmount || getTokenAmountForRarity(item.rarity),
        item.rarity
      );
      
      // Update user's farm coin balance
      const newBalance = (farmCoins || 0) + farmCoinsToAdd;
      setFarmCoins(newBalance);
      
      // Save updated balance to local storage
      localStorage.setItem('farmCoins', newBalance.toString());
      
      // Remove item from inventory
      setInventory(prev => prev.filter(invItem => invItem.id !== item.id));
      
      toast.success(`Sold ${item.tokenAmount} ${item.tokenKey} tokens for ${farmCoinsToAdd} Farm Coins!`);
    } catch (error) {
      console.error("Error selling token:", error);
      toast.error("Error selling token. Please try again.");
    } finally {
      setIsSellingToken(false);
    }
  };
  
  // Function to calculate farm coins from tokens based on token amount and rarity
  const calculateFarmCoinsFromTokens = (tokenAmount: number, rarity: string): number => {
    // Base conversion rate
    let rate = 1;
    
    // Adjust rate based on rarity
    switch (rarity) {
      case 'blue1':
      case 'blue2':
      case 'blue3':
        rate = 1.5; // Common tokens
        break;
      case 'purple1':
      case 'purple2':
      case 'purple3':
        rate = 2; // Uncommon tokens
        break;
      case 'pink1':
      case 'pink2':
        rate = 3; // Rare tokens
        break;
      case 'red1':
      case 'red2':
        rate = 4; // Epic tokens
        break;
      case 'yellow1':
      case 'yellow2':
      case 'yellow3':
        rate = 5; // Legendary tokens
        break;
      default:
        rate = 1;
    }
    
    return Math.floor(tokenAmount * rate);
  };
  
  // Function to render inventory items and their claim/sell buttons
  const renderInventoryItem = (item: InventoryItem) => (
    <div 
      key={item.id} 
      className={`noot-card inventory-item relative p-4 mb-4 ${getRarityBg(item.rarity)} transition-all`}
    >
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Item image */}
        <div className="w-20 h-20 overflow-hidden rounded-lg flex-shrink-0 border border-gray-700">
          <Image 
            src={item.imageUrl || '/case%20items/bronze/Chester.jpg'}
            alt={item.name}
            width={80}
            height={80}
            className="object-cover w-full h-full"
          />
        </div>
        
        {/* Item details */}
        <div className="flex-grow">
          <h3 className={`font-bold ${getRarityColor(item.rarity)} text-lg`}>
            {item.name}
            {item.isNFT && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-white border border-gray-700">
                NFT
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {item.isNFT ? 'Unique NFT #' + item.tokenId : `${item.tokenAmount} tokens`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Opened: {new Date(item.openedAt || '').toLocaleDateString()}
          </p>
        </div>
        
        {/* Claim/Sell buttons */}
        <div className="flex flex-col xs:flex-row gap-2 mt-3 md:mt-0">
          {item.claimed ? (
            <span className="text-green-400 text-xs flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              {item.isNFT ? 'NFT Claimed' : 'Tokens Claimed'}
            </span>
          ) : (
            <>
              <button
                onClick={() => claimTokenToWallet(item)}
                disabled={isClaimingToken}
                className="py-2 px-4 text-sm bg-black text-white border border-gray-700 hover:bg-white hover:text-black rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Wallet className="w-4 h-4" />
                {item.isNFT ? 'Claim NFT' : 'Claim Tokens'}
              </button>
              
              <button
                onClick={() => sellTokenForFarmCoins(item)}
                disabled={isSellingToken}
                className="py-2 px-4 text-sm bg-white text-black hover:bg-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <CircleDollarSign className="w-4 h-4" />
                Sell
              </button>
            </>
          )}
        </div>
      </div>
      {/* Add this to the renderInventoryItem function to show the requested status */}
      {item.claimRequested && (
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          Admin Requested
        </div>
      )}
    </div>
  );
  
  // Add function to add items to the live preview
  const addToLivePreview = (item: any) => {
    // This function is used to update the live preview with random items
    // during the idle state of the case opening
    
    // Create a new preview item
    const newItem = {
      id: uuidv4(),
      name: item.name,
      rarity: item.rarity || 'preview',
      imageUrl: normalizeImagePath(item.image),
      image: normalizeImagePath(item.image), // Add the image property for display
      tokenKey: item.tokenKey || 'PREVIEW',
      claimed: false
    };
    
    // Update both state and ref to keep them in sync
    setLivePreview(prev => {
      const updated = [...prev, newItem].slice(-5);
      livePreviewRef.current = updated;
      return updated;
    });
  };

  // Function to determine the winner
  const shuffleItems = (): number => {
    console.log('Available rarities with indices:');
    imageRarities.forEach((rarity, idx) => {
      if (itemDetails[rarity]) {
        console.log(`${idx}: ${rarity} - ${itemDetails[rarity].name}`);
      }
    });
    
    // Log some debug info about key items
    console.log('DEBUG - Item indices:', 
      `Chester=${imageRarities.indexOf('blue1')}`,
      `Dojo3=${imageRarities.indexOf('blue2')}`,
      `MOP=${imageRarities.indexOf('legendary1')}`
    );
    
    // Force specific items for testing based on query params
    const params = new URLSearchParams(window.location.search);
    const forceRarity = params.get('rarity');
    
    if (forceRarity) {
      // Debugging: force a specific rarity for testing
      const matchingRarities = imageRarities.filter(r => r.startsWith(forceRarity));
      
      if (matchingRarities.length > 0) {
        // Force the first matching item
        const forcedItem = matchingRarities[0];
        const forcedIndex = imageRarities.indexOf(forcedItem);
        let forcedItemName = itemDetails[forcedItem]?.name || forcedItem;
        
        if (forceRarity === 'legendary') {
          console.log(`DEBUG - Forcing legendary item: ${forcedItemName}`);
          console.log(`** CASE OPENING STARTED - FORCED LEGENDARY ITEM **`);
        } else if (forceRarity === 'yellow') {
          console.log(`DEBUG - Forcing ultra rare item: ${forcedItemName}`);
          console.log(`** CASE OPENING STARTED - FORCED ULTRA RARE ITEM **`);
        } else if (forceRarity === 'pink' || forceRarity === 'red') {
          console.log(`DEBUG - Forcing rare item: ${forcedItemName}`);
          console.log(`** CASE OPENING STARTED - FORCED RARE ITEM **`);
        } else if (forceRarity === 'blue') {
          console.log(`DEBUG - Forcing common item: ${forcedItemName}`);
          console.log(`** CASE OPENING STARTED - FORCED COMMON ITEM **`);
        } else {
          console.log(`DEBUG - Forcing item: ${forcedItemName}`);
          console.log(`** CASE OPENING STARTED - FORCED ITEM **`);
        }
      }
    }
    
    return random(0, imageRarities.length - 1);
  };

  // Function to get the center item
  const getCenterItem = () => {
    const imagesLength = imagesRef.current.length;
    const centerIndex = (startIndexRef.current + Math.floor(IMAGE_COUNT / 2)) % imagesLength;
    return {
      index: centerIndex,
      rarity: imageRarities[centerIndex],
      name: itemDetails[imageRarities[centerIndex]]?.name || 'Unknown Item'
    };
  };

  // Function to finish opening the case
  const finishOpening = () => {
    // Get the center item index
    const centerItemObj = getCenterItem();
    const centerItemIndex = centerItemObj.index;
    
    // Log winner details
    console.log("WINNER:", {
      index: centerItemIndex, 
      rarity: getItem(centerItemIndex)?.rarity, 
      name: getItem(centerItemIndex)?.name
    });
    
    // Generate ID for inventory
    const uniqueId = generateUniqueItemId();
    
    // Add to inventory
    const centerItem = getItem(centerItemIndex);
    if (centerItem) {
      const inventoryItem: InventoryItem = {
        id: uniqueId,
        name: centerItem.name,
        rarity: centerItem.rarity,
        imageUrl: centerItem.imageUrl || '',
        caseOrigin: "Noot Case",
        openedAt: new Date().toISOString(),
        tokenAddress: centerItem.tokenAddress,
        tokenKey: centerItem.tokenKey,
        tokenAmount: centerItem.tokenAmount,
        claimed: false,
        isNFT: centerItem.isNFT || false,
        nftAddress: centerItem.nftAddress, // Add NFT address
        tokenId: centerItem.tokenId     // Add token ID
      };
      
      // Debug logging for NFT items
      if (inventoryItem.isNFT) {
        console.log("Adding NFT to inventory:", {
          name: inventoryItem.name,
          isNFT: inventoryItem.isNFT,
          nftAddress: inventoryItem.nftAddress,
          tokenId: inventoryItem.tokenId
        });
      }
      
      setInventory(prev => [inventoryItem, ...prev]);
      setRewardItem(inventoryItem);
      
      // Check if high value win for special effects
      if (centerItem.rarity === 'legendary' || centerItem.rarity === 'mythical') {
        setShowConfetti(true);
        playSound('win');
      }
      
      // Show win card after a slight delay
      setTimeout(() => {
        setShowWinCard(true);
      }, 800);
    }
    
    // Reset state for next spin
    setSpinning(false);
    setIsOpening(false);
    setTimeout(() => {
      setOpeningState('idle');
    }, 500);
  };

  // Function to claim token to wallet
  const claimTokenToWallet = async (item: InventoryItem) => {
    try {
      if (item.isNFT) {
        // NFTs use a different claiming function
        claimNFTToWallet(item);
        return;
      }
      
      setIsClaimingToken(true);
      
      if (!item.tokenAddress || !item.tokenKey) {
        toast.error("Invalid token data", { id: "claim-toast" });
        setIsClaimingToken(false);
        return;
      }
      
      toast.loading(`Claiming ${item.tokenAmount} ${item.tokenKey} tokens to your wallet...`, { id: "claim-toast" });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create swap contract
      const swapContract = new ethers.Contract(
        getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"), // Use the correct contract address directly
        SWAP_CONTRACT_ABI,
        signer
      );
      
      // Get the actual contract balance for this token
      const tokenContract = new ethers.Contract(
        getChecksumAddress(item.tokenAddress),
        TOKEN_ABI,
        signer
      );
      
      const contractBalance = await tokenContract.balanceOf(getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0"));
      console.log(`Token ${item.tokenKey} contract balance: ${ethers.formatUnits(contractBalance, 18)}`);

      if (contractBalance < ethers.parseUnits(item.tokenAmount?.toString() || "0", 18)) {
        toast.error(`Contract has insufficient ${item.tokenKey} tokens. Please contact support.`, { id: "claim-toast" });
        setIsClaimingToken(false);
        return;
      }
      
      // Calculate gas limit based on token amount - larger transfers need more gas
      let gasLimit = 1000000; // Default
      if (item.tokenKey === 'MOP' || item.tokenAmount >= 10000) {
        gasLimit = 2500000; // Increase gas limit for large token amounts
        console.log("Using higher gas limit for high-value token transfer");
      }

      try {
        console.log("Trying direct token transfer from contract");
        
        // Format amount properly
        const tokenAmount = ethers.parseUnits(item.tokenAmount?.toString() || "0", 18);
        
        // Call claimTestTokens as primary method for MOP and high-value tokens
        if (item.tokenKey === 'MOP' || item.tokenAmount >= 10000) {
          console.log("Using claimTestTokens for MOP/high-value token");
          const claimTx = await swapContract.claimTestTokens(
            getChecksumAddress(item.tokenAddress),
            tokenAmount,
            { gasLimit }
          );
          
          toast.loading(`Finalizing token claim...`, { id: "claim-toast" });
          
          // Monitor the transaction
          const txResult = await monitorTransaction(claimTx.hash);
          
          if (txResult) {
            // Update the claimed state
            setInventory(prev => 
              prev.map(invItem => 
                invItem.id === item.id 
                  ? {...invItem, claimed: true} 
                  : invItem
              )
            );
            
            toast.success(`Successfully claimed ${item.tokenAmount} ${item.tokenKey} tokens!`, { id: "claim-toast" });
            
            // Offer to add token to wallet
            setTimeout(() => {
              addTokenToWallet(item.tokenAddress!, item.tokenKey!);
            }, 1000);
            return;
          }
          toast.error("High-value token claim failed. Trying alternative method...", { id: "claim-toast" });
        }
        
        // Call transferToken - this is the most reliable function in NooterSwap.sol
        const claimTx = await swapContract.transferToken(
          getChecksumAddress(item.tokenAddress),
          getChecksumAddress(walletAddress),
          tokenAmount,
          { gasLimit }
        );
        
        toast.loading(`Finalizing token transfer...`, { id: "claim-toast" });
        
        // Monitor the transaction
        const txResult = await monitorTransaction(claimTx.hash);
        
        if (txResult) {
          // Update the claimed state
          setInventory(prev => 
            prev.map(invItem => 
              invItem.id === item.id 
                ? {...invItem, claimed: true} 
                : invItem
            )
          );
          
          toast.success(`Successfully claimed ${item.tokenAmount} ${item.tokenKey} tokens!`, { id: "claim-toast" });
          
          // Offer to add token to wallet
          setTimeout(() => {
            addTokenToWallet(item.tokenAddress!, item.tokenKey!);
          }, 1000);
        } else {
          toast.error("Token claim failed. Trying alternative method...", { id: "claim-toast" });
          throw new Error("Transaction failed");
        }
      } catch (transferError) {
        console.error("Direct token transfer failed, trying claimTestTokens:", transferError);
        
        // If transferToken isn't available, try the claimTestTokens function as fallback
        try {
          toast.loading(`Trying alternative claim method...`, { id: "claim-toast" });
          
          const tokenAmount = ethers.parseUnits(item.tokenAmount?.toString() || "0", 18);
          
          // Try claimTestTokens as fallback
          const claimTx = await swapContract.claimTestTokens(
            getChecksumAddress(item.tokenAddress),
            tokenAmount,
            { gasLimit }
          );
          
          toast.loading(`Finalizing token claim...`, { id: "claim-toast" });
          
          // Monitor the transaction
          const txResult = await monitorTransaction(claimTx.hash);
          
          if (txResult) {
            // Update the claimed state
            setInventory(prev => 
              prev.map(invItem => 
                invItem.id === item.id 
                  ? {...invItem, claimed: true} 
                  : invItem
              )
            );
            
            toast.success(`Successfully claimed ${item.tokenAmount} ${item.tokenKey} tokens!`, { id: "claim-toast" });
            
            // Offer to add token to wallet
            setTimeout(() => {
              addTokenToWallet(item.tokenAddress!, item.tokenKey!);
            }, 1000);
          } else {
            toast.error("Token claim failed. Please try again.", { id: "claim-toast" });
          }
        } catch (claimError) {
          console.error("Both token transfer methods failed:", claimError);
          toast.error(
            <div className="space-y-1">
              <p>Unable to claim tokens from contract.</p>
              <p className="text-xs">Please contact support for assistance.</p>
              <button 
                onClick={() => contactSupport(item, "")} 
                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded"
              >
                Contact Support
              </button>
            </div>,
            { id: "claim-toast", duration: 10000 }
          );
        }
      }
    } catch (error) {
      console.error("Error in claim token process:", error);
      toast.error("Error claiming token. Please try again later.");
    } finally {
      setIsClaimingToken(false);
    }
  };
  
  // Transaction Dialog component for showing transaction status
  const TransactionDialog = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${showTxDialog ? 'visible opacity-100' : 'invisible opacity-0'} transition-opacity duration-300`}>
      <div className="absolute inset-0 bg-black bg-opacity-80" onClick={() => setShowTxDialog(false)}></div>
      <div className="relative bg-[#121212] border border-[#333] rounded-lg p-8 max-w-md w-full shadow-xl transform transition-all duration-300">
        <h3 className="text-white text-xl font-bold mb-6">Transaction Status</h3>
        
        <div className="space-y-6">
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full mr-3 ${txStatus === 'pending' || txStatus === 'confirming' || txStatus === 'confirmed' ? 'bg-white' : 'bg-gray-600'} transition-colors duration-300`}></div>
            <span className="text-white">Transaction Submitted</span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full mr-3 ${txStatus === 'confirming' || txStatus === 'confirmed' ? 'bg-white' : 'bg-gray-600'} transition-colors duration-300`}></div>
            <span className="text-white">Transaction Processing</span>
          </div>
          
          <div className="flex items-center">
            <div className={`w-5 h-5 rounded-full mr-3 ${txStatus === 'confirmed' ? 'bg-green-500' : txStatus === 'failed' ? 'bg-red-500' : 'bg-gray-600'} transition-colors duration-300`}></div>
            <span className={`${txStatus === 'confirmed' ? 'text-green-400' : txStatus === 'failed' ? 'text-red-400' : 'text-white'}`}>
              {txStatus === 'confirmed' ? 'Transaction Confirmed!' : txStatus === 'failed' ? 'Transaction Failed' : 'Awaiting Confirmation'}
            </span>
          </div>
        </div>
        
        {txHash && (
          <div className="mt-6 p-4 bg-black/40 rounded-lg flex items-center justify-between overflow-hidden border border-[#333]">
            <div className="truncate text-sm text-[#999]">{txHash}</div>
            <a 
              href={`${ABSTRACT_BLOCK_EXPLORER}/tx/${txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1 text-white hover:text-gray-300 transition-colors"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
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

  // Add function to generate unique ID for inventory items
  const generateUniqueItemId = (): string => {
    return uuidv4();
  };

  // Add function to get item by index
  const getItem = (index: number): InventoryItem | null => {
    if (index < 0 || index >= imageRarities.length) {
      return null;
    }
    
    const rarity = imageRarities[index];
    const itemDetail = itemDetails[rarity];
    
    if (!itemDetail) {
      return null;
    }
    
    const tokenKey = getRarityTokenMapping(rarity);
    const tokenAddress = TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES];
    
    return {
      id: generateUniqueItemId(),
      name: itemDetail.name,
      rarity: rarity,
      imageUrl: itemDetail.image,
      tokenKey: tokenKey,
      tokenAddress: tokenAddress,
      tokenAmount: getTokenAmountForRarity(rarity),
      isNFT: itemDetail.isNFT || false,
      nftAddress: itemDetail.nftAddress,
      tokenId: itemDetail.tokenId
    };
  };

  // Add function to play sounds
  const playSound = (type: string) => {
    try {
      if (type === 'open' && openCaseSoundRef.current) {
        openCaseSoundRef.current.currentTime = 0;
        openCaseSoundRef.current.play().catch(err => console.log("Error playing sound"));
      } else if (type === 'win' && receiveItemSoundRef.current) {
        receiveItemSoundRef.current.currentTime = 0;
        receiveItemSoundRef.current.play().catch(err => console.log("Error playing sound"));
      }
    } catch (err) {
      console.error("Failed to play sound:", err);
    }
  };

  // Add WinCard component
  const WinCard = () => {
    if (!rewardItem || !showWinCard) return null;
    
    const rarityColor = getRarityColorHex(rewardItem.rarity);
    const isToken = !rewardItem.isNFT;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={() => setShowWinCard(false)}></div>
        
        <div 
          className="relative max-w-md w-full transform transition-all duration-500 scale-100 overflow-hidden"
          style={{
            animation: "popIn 0.5s ease-out forwards",
          }}
        >
          <div className="bg-[#121212] border-2 border-white/20 rounded-xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
              <p className="text-gray-400">You've won a new item</p>
            </div>
            
            {/* Item display */}
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div 
                  className="w-40 h-40 rounded-xl overflow-hidden border-2 shadow-lg"
                  style={{ borderColor: rarityColor }}
                >
                  <Image 
                    src={rewardItem.imageUrl} 
                    alt={rewardItem.name} 
                    width={160} 
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="absolute -top-2 -right-2 bg-black text-xs font-bold px-2 py-1 rounded shadow-lg"
                  style={{ color: rarityColor, borderColor: rarityColor, borderWidth: "1px" }}
                >
                  {rewardItem.rarity.toUpperCase().replace(/[0-9]/g, '')}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{rewardItem.name}</h3>
              
              <div className="text-center mt-2 mb-6">
                <p className="text-gray-400 text-sm">
                  {isToken 
                    ? `${rewardItem.tokenAmount} tokens worth ${rewardItem.price} farm coins` 
                    : `Unique NFT worth ${rewardItem.price} farm coins`
                  }
                </p>
              </div>
              
              {/* Buttons */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <button
                  onClick={() => setShowWinCard(false)}
                  className="py-3 px-4 bg-black text-white border border-white/20 rounded-lg hover:bg-white hover:text-black transition-all duration-200"
                >
                  Continue
                </button>
                
                <button
                  onClick={() => {
                    claimTokenToWallet(rewardItem);
                    setShowWinCard(false);
                  }}
                  className="py-3 px-4 bg-white text-black rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Claim Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Wallet connection state
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState<boolean>(false);
  const [metamaskProvider, setMetamaskProvider] = useState<any>(null);
  
  // AGW connection hooks
  const { login: loginWithAbstract } = useLoginWithAbstract();
  const abstractClient = useAbstractClient();
  const { address: agwAddress, isConnected: isAGWConnected } = useAccount();

  // Add function to fund contract with tokens for admin use
  const fundContractWithTokens = async () => {
    try {
      setIsRefreshing(true);
      toast.loading("Funding contract with tokens...", { id: "fund-toast" });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Correct contract address
      const contractAddress = getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0");
      const swapContract = new ethers.Contract(
        contractAddress,
        SWAP_CONTRACT_ABI,
        signer
      );
      
      // Get all tokens from TOKEN_ADDRESSES, including RETSBA
      const tokensToFund = Object.keys(TOKEN_ADDRESSES);
      
      // Amount to fund per token (500 tokens)
      const fundAmount = ethers.parseUnits("500", 18);
      
      console.log(`Funding contract with tokens...`);
      
      // Fund each token
      let successCount = 0;
      for (const tokenKey of tokensToFund) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
          
          console.log(`Processing ${tokenKey} (${tokenAddress})...`);
          
          // Check if user has enough balance
          const userBalance = await tokenContract.balanceOf(walletAddress);
          const formattedBalance = ethers.formatUnits(userBalance, 18);
          console.log(`Your ${tokenKey} balance: ${formattedBalance}`);
          
          if (userBalance < fundAmount) {
            console.log(`Insufficient ${tokenKey} balance: ${formattedBalance}`);
            toast.error(`Not enough ${tokenKey} tokens. You have ${formattedBalance} ${tokenKey}`);
            continue;
          }
          
          // First approve token spending
          console.log(`Approving ${tokenKey} for contract funding...`);
          const approveTx = await tokenContract.approve(contractAddress, fundAmount);
          console.log(`Approval transaction submitted: ${approveTx.hash}`);
          
          toast.loading(`Approving ${tokenKey} tokens...`, { id: "approve-toast" });
          await approveTx.wait();
          toast.success(`${tokenKey} approved for funding`, { id: "approve-toast" });
          
          // Then fund the contract
          console.log(`Funding contract with ${tokenKey}...`);
          
          // Use fundToken method for all tokens
          const fundTx = await swapContract.fundToken(tokenAddress, fundAmount, { gasLimit: 1000000 });
          
          console.log(`Funding transaction submitted: ${fundTx.hash}`);
          
          // Monitor transaction
          const fundSuccess = await monitorTransaction(fundTx.hash);
          
          if (fundSuccess) {
            console.log(`Contract successfully funded with ${tokenKey}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error funding contract with ${tokenKey}:`, error);
        }
      }
      
      toast.dismiss("fund-toast");
      
      if (successCount > 0) {
        toast.success(`Successfully funded contract with ${successCount} tokens`);
      } else {
        toast.error("Failed to fund contract with any tokens");
      }
    } catch (error) {
      console.error("Error funding contract:", error);
      toast.error("Failed to fund contract");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Also add a function to register all tokens in the contract
  const registerAllTokens = async () => {
    try {
      setIsRefreshing(true);
      toast.loading("Registering tokens in contract...", { id: "register-toast" });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Correct contract address
      const contractAddress = getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0");
      const swapContract = new ethers.Contract(
        contractAddress,
        SWAP_CONTRACT_ABI,
        signer
      );
      
      // Get all tokens from TOKEN_ADDRESSES except NOOT
      const tokensToRegister = Object.keys(TOKEN_ADDRESSES).filter(key => key !== "NOOT");
      
      console.log(`Registering ${tokensToRegister.length} tokens...`);
      
      let successCount = 0;
      
      // Register each token
      for (const tokenKey of tokensToRegister) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          console.log(`Registering ${tokenKey} (${tokenAddress})...`);
          
          // Add token to contract
          const tx = await swapContract.addToken(tokenAddress, { gasLimit: 500000 });
          
          console.log(`Registration transaction submitted: ${tx.hash}`);
          
          // Monitor transaction
          const success = await monitorTransaction(tx.hash);
          
          if (success) {
            console.log(`${tokenKey} registered successfully`);
            successCount++;
          }
        } catch (error) {
          console.error(`Error registering ${tokenKey}:`, error);
          // Continue with other tokens even if one fails
        }
      }
      
      toast.dismiss("register-toast");
      
      if (successCount > 0) {
        toast.success(`Successfully registered ${successCount} tokens`);
      } else {
        toast.error("Failed to register any tokens");
      }
    } catch (error) {
      console.error("Error registering tokens:", error);
      toast.dismiss("register-toast");
      toast.error("Failed to register tokens");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add isRefreshing state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admin panel component near the WinCard component
  const AdminPanel = () => {
    if (!isWalletConnected) return null;
    
    return (
      <div className="mb-4 p-4 border border-yellow-500 rounded-lg bg-black/50">
        <h3 className="text-white font-bold mb-2">Admin Functions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={fundContractWithTokens}
            disabled={isRefreshing}
            className="px-3 py-2 bg-green-800 hover:bg-green-700 text-white rounded text-sm transition-all disabled:opacity-50"
          >
            {isRefreshing ? "Processing..." : "Fund Contract with Tokens"}
          </button>
          <button
            onClick={registerAllTokens}
            disabled={isRefreshing}
            className="px-3 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded text-sm transition-all disabled:opacity-50"
          >
            {isRefreshing ? "Processing..." : "Register All Tokens"}
          </button>
          <button
            onClick={checkAndDisplayContractBalances}
            disabled={isRefreshing}
            className="px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded text-sm transition-all disabled:opacity-50 col-span-2"
          >
            {isRefreshing ? "Checking..." : "Check Contract Token Balances"}
          </button>
        </div>
      </div>
    );
  };

  // Add function to check and display contract token balances
  const checkAndDisplayContractBalances = async () => {
    try {
      setIsRefreshing(true);
      toast.loading("Checking contract balances...", { id: "check-balances-toast" });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Correct contract address
      const contractAddress = getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0");
      
      // Check balances for all tokens
      const tokenBalances: Record<string, string> = {};
      
      for (const tokenKey of Object.keys(TOKEN_ADDRESSES)) {
        try {
          const tokenAddress = getChecksumAddress(TOKEN_ADDRESSES[tokenKey as keyof typeof TOKEN_ADDRESSES]);
          
          // Create token contract
          const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
          
          // Check balance
          const balance = await tokenContract.balanceOf(contractAddress);
          const formattedBalance = ethers.formatUnits(balance, 18);
          
          tokenBalances[tokenKey] = formattedBalance;
          console.log(`Contract ${tokenKey} balance: ${formattedBalance}`);
        } catch (error) {
          console.error(`Error checking ${tokenKey} balance:`, error);
          tokenBalances[tokenKey] = "Error";
        }
      }
      
      toast.dismiss("check-balances-toast");
      
      // Display balances in a custom toast
      toast.custom(
        <div className="bg-[#121212] border border-blue-500 p-4 rounded-lg shadow-lg max-w-md">
          <h3 className="font-bold text-white mb-2">Contract Token Balances</h3>
          <div className="max-h-60 overflow-y-auto pr-2">
            {Object.entries(tokenBalances).map(([token, balance]) => (
              <div key={token} className="flex justify-between py-1 border-b border-gray-700">
                <span className="text-gray-300">{token}:</span>
                <span className={`font-mono ${parseFloat(balance) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {balance}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button 
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm transition-colors"
              onClick={() => toast.dismiss()}
            >
              Close
            </button>
          </div>
        </div>,
        { duration: 15000 }
      );
    } catch (error) {
      console.error("Error checking contract balances:", error);
      toast.dismiss("check-balances-toast");
      toast.error("Failed to check contract balances");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add function to check and display contract token balances
  const checkContractTokenBalance = async (tokenAddress: string, tokenKey: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddress = getChecksumAddress("0xc2d997A8d858275260BA97bb182C67CbC8B3CBB0");
      
      // Create token contract to check balance
      const tokenContract = new ethers.Contract(
        getChecksumAddress(tokenAddress),
        TOKEN_ABI,
        provider
      );
      
      // Check contract's token balance
      const contractBalance = await tokenContract.balanceOf(contractAddress);
      const formattedBalance = ethers.formatUnits(contractBalance, 18);
      console.log(`Contract ${tokenKey} balance: ${formattedBalance}`);
      
      return { contractBalance, formattedBalance };
    } catch (error) {
      console.error("Error checking contract balance:", error);
      return { contractBalance: BigInt(0), formattedBalance: "0" };
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen">
      {/* Add the styles to the page */}
      <style jsx global>{SCROLL_ANIMATION}</style>
      <style jsx global>{NOOT_THEME_STYLES}</style>
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        @keyframes appear {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-appear {
          animation: appear 0.5s cubic-bezier(0.26, 0.53, 0.74, 1.48) forwards;
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        .sparkle {
          position: absolute;
          width: 20px;
          height: 20px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='%23FFD700'%3E%3Cpath d='M10 0L12 7H19L13 12L15 19L10 14L5 19L7 12L1 7H8L10 0Z'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
          pointer-events: none;
          z-index: 999;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100px) rotate(0deg); }
          100% { transform: translateY(calc(100vh + 100px)) rotate(360deg); }
        }
        .confetti-piece {
          position: fixed;
          width: 10px;
          height: 10px;
          pointer-events: none;
          animation: confetti-fall linear forwards;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes hueRotate {
          from { filter: hue-rotate(0deg); }
          to { filter: hue-rotate(360deg); }
        }
        .live-drop-item {
          background-color: #18191f;
          border: 1px solid rgba(34, 34, 34, 0.3);
          border-radius: 0.75rem;
          transition: all 0.3s ease;
          overflow: hidden;
          position: relative;
        }

        .live-drop-item:hover {
          transform: translateY(-5px);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .live-drop-item:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(130deg, rgba(139, 92, 246, 0.05), rgba(79, 70, 229, 0.05));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .live-drop-item:hover:after {
          opacity: 1;
        }

        .item-glow {
          animation: hue-rotate 6s linear infinite;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2),
                      0 0 20px rgba(255, 255, 255, 0.2),
                      0 0 30px rgba(255, 255, 255, 0.2),
                      0 0 40px rgba(255, 255, 255, 0.2);
          border-radius: 8px;
        }

        @keyframes hue-rotate {
          from {
            filter: hue-rotate(0deg);
          }
          to {
            filter: hue-rotate(360deg);
          }
        }
      `}</style>
      
      {/* Win Card */}
      <WinCard />
    
      <div className="mb-6">
        <Link href="/farm-cases">
          <button className="button-white noot-text border border-white text-white font-medium py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-md">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Cases</span>
          </button>
        </Link>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="font-bold text-3xl md:text-5xl text-white mb-3 noot-title"> Noot Noot CASE</h1>
        <p className="text-[#999] max-w-2xl mx-auto">
          Open special Noot Cases with $NOOT  or Farm coins to earn rare tokens and NFTs in Abstract Testnet!
        </p>
      </div>
      
      {/* Improved responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        {/* Left side - Case opening (expanded on mobile, 8 cols on desktop) */}
        <div className="noot-card flex flex-col items-center p-4 md:p-6 lg:col-span-8 order-2 lg:order-1">
          <h2 className="noot-swap-title mb-4 flex items-center">Noot Case</h2>
          
          {/* Live preview - more compact, horizontal scrolling on mobile */}
          <div className="w-full mb-4 fade-in">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm text-[#999]">Live Drops:</h3>
              {livePreview.length > 0 && (
                <button 
                  onClick={() => {
                    setLivePreview([]);
                    livePreviewRef.current = [];
                  }}
                  className="text-xs text-white hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2 p-2 border border-[#333] bg-black rounded-md overflow-hidden">
              {livePreview.map((item, i) => (
                <div 
                  key={`preview-${item.id || i}`}
                  className="live-drop-item p-2"
                >
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <div className="w-4/5 h-4/5 relative item-glow">
                      <Image 
                        src={item?.imageUrl || item?.image || '/case%20items/bronze/Chester.jpg'}
                        alt={item?.name || 'Item'}
                        fill
                        sizes="20px"
                        className="object-contain"
                        style={{ 
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 8px #0072ff) drop-shadow(0 0 12px #0072ff)'
                        }}
                        priority
                      />
                    </div>
                    
                    {/* Tooltip with item name */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-1 text-center truncate">
                      {item?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty placeholder slots */}
              {livePreview.length > 0 && livePreview.length < 6 && 
                Array.from({ length: 6 - livePreview.length }).map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="live-drop-item p-2"
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <div className="w-1/2 h-1/2 flex items-center justify-center item-glow">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 animate-pulse text-xs font-bold">•••</span>
                      </div>
                    </div>
                  </div>
                ))
              }
              
              {livePreview.length === 0 && (
                <p className="text-[#666] text-sm py-2 col-span-6 text-center">No recent drops yet...</p>
              )}
            </div>
          </div>
          
          <div className="w-full mb-6">
            {spinning && (
              <div 
                className="h-2 bg-white/30 mb-4 overflow-hidden rounded-full"
                style={{
                  width: '100%',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  animation: 'progressAnimation 3s ease-in-out forwards'
                }}
              ></div>
            )}
            
            {/* Improved slot machine container - with black/white theme */}
            <div className="bg-[#171717] border border-[#333] rounded-md p-4 relative">
              <div className="slot-machine-container relative overflow-hidden rounded-md">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                <div className="relative mx-auto flex flex-col items-center">
                  <canvas 
                    ref={canvasRef} 
                    width={IMAGE_WIDTH * IMAGE_COUNT} 
                    height={IMAGE_HEIGHT}
                    className="mx-auto border border-[#333] rounded"
                    style={{ 
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      background: '#111',
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>
                {spinning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Payment options toggle - with token-swap styling */}
          <div className="w-full mb-4">
            <div className="flex justify-center mb-4">
              <div className="flex p-1 bg-[#222] border border-[#333] rounded-lg">
                <button
                  onClick={() => setPaymentMethod("farm-coins")}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    paymentMethod === "farm-coins" 
                      ? "bg-white text-black" 
                      : "bg-transparent text-[#999] hover:text-white"
                  }`}
                >
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  Farm Coins
                </button>
                <button
                  onClick={() => {
                    setPaymentMethod("noot-token");
                    if (!isWalletConnected) {
                      connectWallet();
                    }
                  }}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    paymentMethod === "noot-token" 
                      ? "bg-white text-black" 
                      : "bg-transparent text-[#999] hover:text-white"
                  }`}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  NOOT Tokens
                </button>
              </div>
            </div>
          </div>
          
          {/* Case info and open button - with token-swap styling */}
          <div className="w-full fade-in">
            <div className="flex justify-between items-center mb-4 p-3 border border-[#333] bg-[#171717] rounded-md">
              <span className="text-[#999]">Case Cost:</span>
              <div className="flex items-center">
                {paymentMethod === "farm-coins" ? (
                  <>
                    <CircleDollarSign className="h-4 w-4 text-white mr-1" />
                    <span className="text-white">{CASE_COST} Farm Coins</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 text-white mr-1" />
                    <span className="text-white">{NOOT_CASE_COST} NOOT</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Emergency Funds Button */}
            <div className="w-full bg-black border border-white p-3 my-4 flex justify-between items-center animate-fadeIn">
              <div className="flex items-center">
                <Coins className="h-5 w-5 mr-2 text-white" />
                <span className="text-white noot-text">Need coins? Get a bonus!</span>
              </div>
              <button
                onClick={() => {
                  // Add 100 farm coins
                  setFarmCoins(prev => prev + 100);
                  toast.success("Emergency funds: +100 coins!", { 
                    icon: "💰",
                    duration: 3000 
                  });
                }}
                className="bg-white text-black hover:bg-gray-200 border-0 rounded-none px-3 py-1 text-sm"
              >
                Get 100 Coins
              </button>
            </div>
            
            {paymentMethod === "noot-token" && !isWalletConnected && (
              <button 
                onClick={() => connectWallet()}
                className="w-full py-4 mb-4 text-lg bg-white text-black font-medium transition-all duration-300 shadow-lg rounded-lg transform hover:scale-[1.01] active:scale-[0.99] border border-gray-200 hover:bg-gray-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Wallet className="h-5 w-5 mr-2" />
                    Connect Wallet to Use NOOT
                  </div>
                )}
              </button>
            )}
            
            {paymentMethod === "noot-token" && isWalletConnected && (
              <div className="w-full py-3 px-4 mb-4 bg-black text-white border border-gray-800 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center mr-3">
                      {activeWallet === WALLET_OPTIONS.AGW ? 'A' : 'M'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Connected with {activeWallet === WALLET_OPTIONS.AGW ? 'AGW' : 'MetaMask'}</p>
                      <p className="text-sm font-medium">{walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400">NOOT Balance</p>
                    <p className="text-lg font-medium">{parseFloat(nootBalance).toFixed(2)} NOOT</p>
                  </div>
                  <button
                    onClick={() => {
                      window.open(`${ABSTRACT_BLOCK_EXPLORER}/address/${walletAddress}`, '_blank');
                    }}
                    className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    View Account
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={openCase}
              disabled={spinning || 
                (paymentMethod === "farm-coins" && farmCoins < CASE_COST) || 
                (paymentMethod === "noot-token" && (!isWalletConnected || parseFloat(nootBalance) < NOOT_CASE_COST))
              }
              className={`w-full py-4 text-lg relative overflow-hidden ${
                spinning || 
                (paymentMethod === "farm-coins" && farmCoins < CASE_COST) ||
                (paymentMethod === "noot-token" && (!isWalletConnected || parseFloat(nootBalance) < NOOT_CASE_COST))
                  ? 'bg-[#333] cursor-not-allowed text-white'
                  : 'bg-white text-black hover:bg-gray-200'
              } font-medium transition-all duration-300 shadow-lg rounded-lg transform hover:scale-[1.01] active:scale-[0.99]`}
            >
              {spinning ? (
                <>Opening...</>
              ) : (
                <>
                  {!spinning && 
                   ((paymentMethod === "farm-coins" && farmCoins >= CASE_COST) || 
                    (paymentMethod === "noot-token" && isWalletConnected && parseFloat(nootBalance) >= NOOT_CASE_COST)) && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="absolute w-full h-full bg-white/10 transform rotate-12 -translate-x-12 -translate-y-2 animate-pulse"></span>
                    </span>
                  )}
                  <span className="relative z-10">Open Case</span>
                </>
              )}
            </button>
            
            <div className="mt-4 p-3 border border-[#333] bg-[#171717] rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-[#999]">Your Balance:</span>
                {paymentMethod === "farm-coins" ? (
                  <div className="flex items-center">
                    <CircleDollarSign className="h-4 w-4 text-white-500 mr-1" />
                    <span className="text-white">{farmCoins} Farm Coins</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Wallet className="h-4 w-4 text-white-500 mr-1" />
                    <span className="text-white">{parseFloat(nootBalance).toFixed(2)} NOOT</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Possible rewards - moved to bottom on mobile, displayed after case opening */}
            <div className="mt-6 block lg:hidden">
              <h3 className="text-sm mb-3 text-[#999] flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-purple-500" />
                Possible Rewards:
              </h3>
              <div className="grid grid-cols-3 gap-2 p-3 border border-[#333] bg-[#111] rounded-md">
                {Object.entries(itemDetails)
                  // Filter out duplicate items by display name to avoid showing multiple of the same token
                  .filter((entry, index, self) => {
                    const [rarity, item] = entry;
                    const displayName = item.name;
                    // Check if this is the first occurrence of this display name
                    return index === self.findIndex(([_, otherItem]) => otherItem.name === displayName);
                  })
                  .map(([rarity, item]) => {
                    // Get token key for this rarity
                    const tokenKey = getRarityTokenMapping(rarity);
                    // Get token info from TOKEN_INFO
                    const tokenInfo = TOKEN_INFO[tokenKey as keyof typeof TOKEN_INFO];
                    
                    return (
                      <div 
                        key={rarity} 
                        className={`p-2 border ${getRarityBg(rarity)} flex flex-col items-center rounded`}
                      >
                        <div className="w-10 h-10 relative mb-1 flex items-center justify-center">
                          <Image 
                            src={item?.image}
                            alt={tokenInfo?.name || item?.name || 'Item'}
                            width={40}
                            height={40}
                            className="object-contain max-w-full max-h-full"
                            style={{ objectFit: 'contain' }}
                            priority
                          />
                        </div>
                        <h4 className={`text-xs font-semibold text-center truncate w-full ${getRarityColor(rarity)}`}>
                          {item.name}
                          {item.isNFT && <span className="ml-1 text-[8px] text-purple-300">(NFT)</span>}
                        </h4>
                        <div className="flex items-center text-xs mt-1">
                          <CircleDollarSign className="h-3 w-3 mr-1 text-white" />
                          <span className="text-white/80">{item?.price}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Inventory (to top on mobile, 4 cols on desktop) */}
        <div className="noot-card p-4 md:p-6 lg:col-span-4 order-1 lg:order-2">
          <h2 className="noot-swap-title mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Your Inventory
          </h2>
          
          <div className="overflow-y-auto max-h-[360px] border border-[#333] bg-[#111] p-3 rounded-md">
            {inventory.length === 0 ? (
              <p className="text-[#666] text-center py-6">Your inventory is empty. Open cases to collect items!</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {inventory.map(renderInventoryItem)}
              </div>
            )}
          </div>
          
          {/* Possible rewards - only visible on desktop in sidebar */}
          <div className="mt-6 hidden lg:block">
            <h3 className="text-sm mb-3 text-[#999] flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-purple-500" />
              Possible Rewards:
            </h3>
            <div className="grid grid-cols-2 gap-2 p-3 border border-[#333] bg-[#111] rounded-md">
              {Object.entries(itemDetails).map(([rarity, item]) => {
                // Get token key for this rarity
                const tokenKey = getRarityTokenMapping(rarity);
                // Get token info from TOKEN_INFO
                const tokenInfo = TOKEN_INFO[tokenKey as keyof typeof TOKEN_INFO];
                
                return (
                  <div 
                    key={rarity} 
                    className={`p-2 border ${getRarityBg(rarity)} flex flex-col items-center rounded`}
                  >
                    <div className="w-12 h-12 relative mb-1 flex items-center justify-center">
                      <Image 
                        src={item?.image}
                        alt={tokenInfo?.name || item?.name || 'Item'}
                        width={48}
                        height={48}
                        className="object-contain max-w-full max-h-full"
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>
                    <h4 className={`text-xs font-semibold text-center truncate w-full ${getRarityColor(rarity)}`}>
                      {tokenInfo?.name || item?.name}
                    </h4>
                    <div className="flex items-center text-xs mt-1">
                      <CircleDollarSign className="h-3 w-3 mr-1 text-white" />
                      <span className="text-white/80">{item?.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Award dialog - improved with better responsive design */}
      {showDialog && rewardItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/90 p-4">
          <div 
            className="max-w-md w-full p-6 sm:p-8 bg-black rounded-lg border border-white pop-in shadow-xl"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <Trophy className="h-10 w-10 text-black" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6 text-white mt-6">You received:</h2>
            <div className="flex flex-col items-center">
              {/* Image display wrapper with better error handling */}
              <div 
                className="w-40 h-40 relative mb-3 flex items-center justify-center bg-black/30 p-3 rounded-lg border border-white/50"
                style={{ 
                  animation: 'popIn 0.5s ease-out forwards',
                  animationDelay: '0.2s',
                  opacity: 0,
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
                }}
              >
                {/* Use the imageUrl property to display the image */}
                <Image 
                  src={rewardItem.imageUrl || '/case%20items/bronze/Chester.jpg'}
                  alt={rewardItem?.name || 'Item'}
                  width={140}
                  height={140}
                  className="object-contain max-w-full max-h-full rounded"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
              
              <h3 
                className={`text-xl sm:text-2xl font-bold mb-2 text-center ${getRarityColor(rewardItem?.rarity?.replace(/[0-9]/g, '') || 'blue')}`}
                style={{ 
                  animation: 'popIn 0.5s ease-out forwards',
                  animationDelay: '0.4s',
                  opacity: 0
                }}
              >
                {rewardItem?.name || 'Unknown Item'}
              </h3>
              <div 
                className="flex items-center mb-6"
                style={{ 
                  animation: 'popIn 0.5s ease-out forwards',
                  animationDelay: '0.5s',
                  opacity: 0
                }}
              >
                <CircleDollarSign className="h-5 w-5 mr-2 text-white" />
                <span className="text-white text-lg">{rewardItem?.price || 0} coins</span>
              </div>
              <button 
                onClick={() => setShowDialog(false)}
                className="bg-white text-black hover:bg-gray-200 font-medium py-3 px-8 rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-200 border border-gray-300"
                style={{
                  animation: 'popIn 0.5s ease-out forwards',
                  animationDelay: '0.6s',
                  opacity: 0
                }}
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      <TransactionDialog />
      {showWalletOptions && <WalletOptionsDialog />}
      <AdminPanel />
      
      {/* Add this new section at the bottom */}
      <div className="w-full max-w-3xl mt-8">
        <details className="bg-white p-3 rounded-lg shadow">
          <summary className="font-bold text-lg cursor-pointer">NFT Claim Troubleshooting</summary>
          <div className="mt-4">
            <NFTSupport />
          </div>
        </details>
      </div>
    </div>
  );
}