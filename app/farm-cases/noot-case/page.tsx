"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, CircleDollarSign, Trophy } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Prices for items based on rarity
const prices = {
  legendary: 1,
  yellow: 0.75,
  red: 0.5,
  pink: 0.2,
  purple: 0.1,
  blue: 0.05
};

// Cost to open a case
const CASE_COST = 10; // Farm coins

// Item rarities - expanded to include more items
const imageRarities = [
  // Common (Blue) - 40%
  'blue1', 'blue2', 'blue3',
  // Uncommon (Purple) - 30%
  'purple1', 'purple2', 'purple3',
  // Rare (Pink) - 15%
  'pink1', 'pink2',
  // Very Rare (Red) - 8%
  'red1', 'red2',
  // Ultra Rare (Yellow) - 5%
  'yellow1', 'yellow2', 'yellow3',
  // Legendary (Gold) - 2%
  'legendary1', 'legendary2', 'legendary3', 'legendary4', 'legendary5'
];

// Mapping for the items with rarities and prices - expanded with all available images
const itemDetails = {
  // COMMON ITEMS (BLUE) - BRONZE TIER
  blue1: { 
    name: 'Chester Farming Hat', 
    price: prices.blue, 
    image: '/case%20items/bronze/Chester.jpg' 
  },
  blue2: { 
    name: 'Dojo Farmer Badge', 
    price: prices.blue, 
    image: '/case%20items/bronze/Dojo3.jpg' 
  },
  blue3: { 
    name: '77-Bit Common Tool', 
    price: prices.blue, 
    image: '/case%20items/bronze/77-Bit.jpg' 
  },
  
  // UNCOMMON ITEMS (PURPLE) - MIXED TIER
  purple1: { 
    name: 'Wojak Action Figure', 
    price: prices.purple, 
    image: '/case%20items/golden/Wojact.jpg' 
  },
  purple2: { 
    name: 'Yup Farming Statue', 
    price: prices.purple, 
    image: '/case%20items/golden/yup.jpg' 
  },
  purple3: { 
    name: 'Nutz Collection', 
    price: prices.purple, 
    image: '/case%20items/golden/nutz.jpg' 
  },
  
  // RARE ITEMS (PINK) - SILVER TIER
  pink1: { 
    name: 'Rare Paingu Fertilizer', 
    price: prices.pink, 
    image: '/case%20items/silver/PAINGU.jpg' 
  },
  pink2: { 
    name: 'Penguin Farm Booster', 
    price: prices.pink, 
    image: '/case%20items/silver/PENGUIN.jpg' 
  },
  
  // VERY RARE ITEMS (RED) - GOLDEN TIER
  red1: { 
    name: 'Feathers Abstract NFT', 
    price: prices.red, 
    image: '/case%20items/golden/Feathersabstract.jpg' 
  },
  red2: { 
    name: 'Retsba Premium Seed', 
    price: prices.red, 
    image: '/case%20items/golden/RETSBA.jpg' 
  },
  
  // ULTRA RARE ITEMS (YELLOW) - TOP TIER
  yellow1: { 
    name: 'Abby Ultra Rare Collectible', 
    price: prices.yellow, 
    image: '/case%20items/golden/Abby.jpg' 
  },
  yellow2: { 
    name: 'Bearish Market Guardian', 
    price: prices.yellow, 
    image: '/case%20items/golden/bearish.jpg' 
  },
  yellow3: { 
    name: '77-Bit NFT Limited Edition', 
    price: prices.yellow, 
    image: '/case%20items/NFTs/77-Bit.jpg' 
  },
  
  // LEGENDARY ITEMS (LEGENDARY) - ULTIMATE TIER
  legendary1: { 
    name: 'MOP Legendary Noot', 
    price: prices.legendary, 
    image: '/case%20items/golden/MOP.png' 
  },
  legendary2: { 
    name: 'Bearish NFT Genesis', 
    price: prices.legendary, 
    image: '/case%20items/NFTs/bearish.jpg' 
  },
  legendary3: { 
    name: 'Abby Legendary Collection', 
    price: prices.legendary * 1.5, // Extra valuable
    image: '/case%20items/golden/Abby.jpg' 
  },
  legendary4: { 
    name: 'Wojak Platinum Edition', 
    price: prices.legendary * 1.3, // More valuable
    image: '/case%20items/golden/Wojact.jpg' 
  },
  legendary5: { 
    name: 'RETSBA Mythic Artifact', 
    price: prices.legendary * 1.7, // Most valuable
    image: '/case%20items/golden/RETSBA.jpg' 
  }
};

// Slot machine constants - improved for better responsiveness
const IMAGE_WIDTH = 160; // Adjusted for better display
const IMAGE_HEIGHT = 160;
const IMAGE_COUNT = 5;
const OFFSET = 1;
const BASE_SPEED = 2;
const ACCELERATION_DURATION_MIN = 2000;
const ACCELERATION_DURATION_MAX = 3000;
const ACCELERATION_STEP = 0.5;
const DECELERATION_MULTIPLIER = 0.98;
const RETURN_MULTIPLIER = 0.05;

// Add sound effect variables - same as solcasenft
const STATE = {
  ACCELERATION: 1,
  DECELERATION: 2,
  RETURN: 3
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

export default function NootCasePage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [rewardItem, setRewardItem] = useState<any>(null);
  const [farmCoins, setFarmCoins] = useState(100); // Start with 100 farm coins
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [livePreview, setLivePreview] = useState<any[]>([]);
  
  // Important: Use refs instead of state for animation variables
  // This is critical to match solcasenft's direct variable manipulation
  const imagesRef = useRef<HTMLImageElement[]>([]);
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
  
  useEffect(() => {
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
          drawSlotMachine();
        }, 100);
      } catch (error) {
        console.error('Critical error loading images:', error);
        toast.error('Failed to load item images. Please refresh and try again.');
      }
    };
    
    loadImages();
    
    // Simulate live preview with random items
    const interval = setInterval(() => {
      simulateLivePreview();
    }, 5000);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);
  
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

  // Update the drawSlotMachine function to be more responsive
  const drawSlotMachine = () => {
    if (!canvasRef.current) {
      console.error('Canvas ref is null in drawSlotMachine');
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
    
    for (let index = -OFFSET; index < IMAGE_COUNT + OFFSET; index++) {
      const imageIndex = index < 0 ? index + imagesLength : index;
      const image = imagesRef.current[(imageIndex + startIndexRef.current) % imagesLength];
      if (image) {
        try {
          const x = scaledImageWidth * index - Math.floor(offsetRef.current * scale);
          const y = 0;
          
          // Draw the image with proper scaling
          context.drawImage(
            image,
            x,
            y,
            scaledImageWidth,
            scaledImageHeight
          );
          
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
        } catch (error) {
          console.error('Error drawing image:', error, image);
        }
      } else {
        console.warn(`No image found at index ${(imageIndex + startIndexRef.current) % imagesLength}`);
      }
    }
    
    // Draw the center indicator line
    const exactCenter = canvasRef.current.width / 2;
    
    // Draw a more visible and attractive indicator
    const gradient = context.createLinearGradient(exactCenter - 10, 0, exactCenter + 10, 0);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(exactCenter - 10, 0, 20, canvasRef.current.height);
    
    // Then the main line
    context.beginPath();
    context.moveTo(exactCenter, 0);
    context.lineTo(exactCenter, canvasRef.current.height);
    context.closePath();
    context.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    context.lineWidth = 2;
    context.stroke();
    
    // Add small arrow indicators at top and bottom
    context.beginPath();
    context.moveTo(exactCenter - 8, 15);
    context.lineTo(exactCenter, 5);
    context.lineTo(exactCenter + 8, 15);
    context.fillStyle = 'rgba(255, 215, 0, 0.9)';
    context.fill();
    
    context.beginPath();
    context.moveTo(exactCenter - 8, canvasRef.current.height - 15);
    context.lineTo(exactCenter, canvasRef.current.height - 5);
    context.lineTo(exactCenter + 8, canvasRef.current.height - 15);
    context.fillStyle = 'rgba(255, 215, 0, 0.9)';
    context.fill();
  };
  
  // Add a function to determine the exact center item
  const getCenterItem = () => {
    // Calculate center position
    const centerPosition = Math.floor(IMAGE_COUNT / 2); 
    
    // Calculate the item that should be in the center
    const imagesLength = imagesRef.current.length;
    if (imagesLength === 0) return null;
    
    // The item at the center position depends on the current startIndex
    const centerItemIndex = (startIndexRef.current + centerPosition) % imagesLength;
    
    // Get the rarity of the center item
    const centerItemRarity = imageRarities[centerItemIndex];
    if (!centerItemRarity) return null;
    
    // Get the item details
    return {
      index: centerItemIndex,
      rarity: centerItemRarity,
      ...itemDetails[centerItemRarity as keyof typeof itemDetails]
    };
  };

  // Modify the updateSlotMachine function to ensure the winning item is aligned properly
  const updateSlotMachine = () => {
    if (!canvasRef.current) return;
    
    const imagesLength = imagesRef.current.length;
    const deltaTime = performance.now() - startTimeRef.current;
    
    // Handle the state transition from acceleration to deceleration
    if (deltaTime > accelerationDurationRef.current && stateRef.current === STATE.ACCELERATION) {
      console.log('Transitioning to DECELERATION phase');
      stateRef.current = STATE.DECELERATION;
      
      // Force the pre-selected winner to be in the center when the animation stops
      if (winnerIndexRef.current !== null) {
        console.log('Pre-selected winner:', winnerIndexRef.current);
        
        // Calculate the position that will ensure the winner is in the center
        const centerPosition = Math.floor(IMAGE_COUNT / 2);
        
        // Calculate precise positioning to ensure the winner appears in the center
        // This is the critical calculation to ensure the right item is displayed
        const adjustedStartIndex = (winnerIndexRef.current - centerPosition + imagesLength * 10) % imagesLength;
        
        console.log('Adjusted startIndex from', startIndexRef.current, 'to', adjustedStartIndex);
        console.log('Center position:', centerPosition);
        console.log('Calculation: (' + adjustedStartIndex + ' + ' + centerPosition + ') % ' + imagesLength + ' = ' + ((adjustedStartIndex + centerPosition) % imagesLength));
        console.log('Winner index:', winnerIndexRef.current);
        
        // Force alignment by setting the startIndex to the correct position
        startIndexRef.current = adjustedStartIndex;
        
        // Ensure we're perfectly aligned
        offsetRef.current = 0;
        
        // Set a fixed deceleration speed to ensure consistent stopping
        speedRef.current = Math.min(speedRef.current, 10);
      }
    }
    
    // Update offset and handle wrapping of items
    offsetRef.current += speedRef.current;
    
    if (offsetRef.current > IMAGE_WIDTH) {
      startIndexRef.current = (startIndexRef.current + 1) % imagesLength;
      offsetRef.current %= IMAGE_WIDTH;
    }
    
    // Draw the current state
    drawSlotMachine();
    
    // Calculate current position for return adjustment
    const center = IMAGE_WIDTH * (IMAGE_COUNT / 2);
    const index = Math.floor((center + offsetRef.current) / IMAGE_WIDTH);
    
    // Update speed based on state - acceleration, deceleration, return to center
    if (stateRef.current === STATE.ACCELERATION) {
      speedRef.current += ACCELERATION_STEP;
    } else if (stateRef.current === STATE.DECELERATION) {
      speedRef.current *= DECELERATION_MULTIPLIER;
      
      if (speedRef.current < 1e-2) {
        speedRef.current = 0;
        stateRef.current = STATE.RETURN;
        
        console.log('Transitioning to RETURN phase');
        console.log('Current startIndex:', startIndexRef.current);
        console.log('Current offset:', offsetRef.current);
        
        // Calculate what item is currently in the center
        const centerPosition = Math.floor(IMAGE_COUNT / 2);
        const currentCenterItem = (startIndexRef.current + centerPosition) % imagesLength;
        console.log('Current center item:', currentCenterItem, imageRarities[currentCenterItem]);
        console.log('Target winner:', winnerIndexRef.current, winnerIndexRef.current !== null ? imageRarities[winnerIndexRef.current] : 'none');
        
        // IMPORTANT: Make sure winner index is what's actually in the center
        winnerIndexRef.current = currentCenterItem;
      }
    } else if (stateRef.current === STATE.RETURN) {
      // This is critical for perfect alignment
      const halfCount = Math.floor(IMAGE_COUNT / 2);
      const distance = IMAGE_WIDTH * (index - halfCount) - offsetRef.current;
      const step = distance * RETURN_MULTIPLIER;
      
      offsetRef.current += Math.max(0.1, Math.abs(step)) * Math.sign(step);
      
      if (Math.abs(distance) <= 0.1) {
        // Reset offset to exactly zero for perfect alignment
        offsetRef.current = 0;
        
        // Ensure we end on the exact position needed
        if (winnerIndexRef.current !== null) {
          const centerPosition = Math.floor(IMAGE_COUNT / 2);
          // In the RETURN phase, we need to calculate the startIndex that will position
          // the winning item exactly in the center
          // We add a multiple of imagesLength to ensure positive modulo
          const targetStartIndex = (winnerIndexRef.current - centerPosition + imagesLength * 10) % imagesLength;
          
          // Force startIndex to the correct position for perfect alignment
          if (startIndexRef.current !== targetStartIndex) {
            console.log("Final adjustment - aligning to winning position");
            console.log('Adjusting startIndex from', startIndexRef.current, 'to', targetStartIndex);
            startIndexRef.current = targetStartIndex;
            
            // Verify our calculation is correct
            const finalCenterItem = (startIndexRef.current + centerPosition) % imagesLength;
            console.log('Final center item should be:', finalCenterItem, imageRarities[finalCenterItem]);
            console.log('Winner is:', winnerIndexRef.current, imageRarities[winnerIndexRef.current]);
            
            // Force redraw immediately to ensure correct display
            drawSlotMachine();
            
            // CRITICAL: update the winner to match what's ACTUALLY in the center
            winnerIndexRef.current = finalCenterItem;
            
            if (finalCenterItem !== winnerIndexRef.current) {
              console.error("ERROR: Center item does not match winner after adjustment!");
              winnerIndexRef.current = finalCenterItem;
            }
          }
        }
      }
    }
    
    // Continue animation if needed
    if (speedRef.current > 0 || offsetRef.current !== 0) {
      animationFrameIdRef.current = requestAnimationFrame(updateSlotMachine);
    } else {
      // Animation has stopped, play sound and show result
      if (receiveItemSoundRef.current && receiveItemSoundRef.current.readyState > 0) {
        receiveItemSoundRef.current.play().catch(err => console.log("Error playing sound"));
      }
      
      // Clear the animation frame ID
      animationFrameIdRef.current = null;
      
      // Get the FINAL item that's visible in the center
      const centerItem = getCenterItem();
      if (centerItem && centerItem.index !== winnerIndexRef.current) {
        console.log("WARNING: Fixing mismatch between winner and center item");
        console.log("Current winner:", winnerIndexRef.current);
        console.log("Visible center item:", centerItem.index);
        winnerIndexRef.current = centerItem.index;
      }
      
      // Finish the case opening
      finishOpening();
    }
  };
  
  const addToLivePreview = (item: any) => {
    setLivePreview(prev => {
      const newPreview = [...prev, item];
      if (newPreview.length > 5) {
        return newPreview.slice(newPreview.length - 5);
      }
      return newPreview;
    });
  };
  
  const simulateLivePreview = () => {
    if (livePreview.length >= 5) return;
    
    // Ensure all rarities are valid
    if (imageRarities.length === 0 || !itemDetails) {
      console.error('No rarities or item details available');
      return;
    }
    
    try {
      const randomIndex = Math.floor(Math.random() * imageRarities.length);
      const rarity = imageRarities[randomIndex];
      if (!rarity) {
        console.error('Invalid rarity selected');
        return;
      }
      
      const item = itemDetails[rarity as keyof typeof itemDetails];
      if (!item) {
        console.error(`No item found for rarity: ${rarity}`);
        return;
      }
      
      addToLivePreview(item);
    } catch (error) {
      console.error('Error in simulateLivePreview:', error);
    }
  };
  
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    try {
      if (audioRef.current) {
        // Reset the audio to ensure it plays from the beginning
        audioRef.current.currentTime = 0;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing sound:", error);
            // Try playing again with user interaction
            document.addEventListener('click', function playOnce() {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error("Second attempt failed:", e));
              }
              document.removeEventListener('click', playOnce);
            }, { once: true });
          });
        }
      }
    } catch (err) {
      console.error("Failed to play sound:", err);
    }
  };
  
  const finishOpening = () => {
    // Use the final winning item shown in the center
    if (winnerIndexRef.current === null) {
      console.error('No winner was selected during the case opening');
      return;
    }
    
    // Double check what's actually in the center of the display
    const centerItem = getCenterItem();
    if (centerItem && centerItem.index !== winnerIndexRef.current) {
      console.log("WARNING: Mismatch between winner index and visible center item - fixing");
      winnerIndexRef.current = centerItem.index;
    }
    
    // Get the winner index and rarity
    const winnerIndex = winnerIndexRef.current;
    const winningRarity = imageRarities[winnerIndex];
    
    console.log('** CASE OPENING FINISHED **');
    console.log(`Final winner index: ${winnerIndex}`);
    console.log(`Final winning rarity: ${winningRarity}`);
    
    // Get the item details for the winning rarity
    const winningItem = itemDetails[winningRarity as keyof typeof itemDetails];
    if (!winningItem) {
      console.error(`No item details found for rarity ${winningRarity}`);
      return;
    }
    
    console.log(`Final winning item: ${winningItem.name}`);
    console.log(`Item image: ${winningItem.image}`);
    
    // Create the new item object for inventory and display - EXACTLY what's shown
    const newItem = {
      id: Date.now().toString(),
      name: winningItem.name,
      rarity: winningRarity,
      image: winningItem.image,
      price: winningItem.price
    };
    
    console.log('Adding item to inventory:', newItem);
    
    // Add to inventory
    setInventory(prev => [...prev, newItem]);
    
    // Reset state for next opening
    setSpinning(false);
    
    // Update UI with the winning item - showing EXACTLY what's in the center
    setShowDialog(true);
    setRewardItem(newItem);
    
    // Extract the rarity type (without numbers)
    const rarityType = winningRarity.replace(/[0-9]/g, '');
    
    // Play sounds and trigger effects based on rarity type
    if (rarityType === 'legendary') {
      // For legendary items, show special effects
      playSound(receiveItemSoundRef);
      
      // Trigger confetti with more particles for legendary items
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFC107', '#FFEB3B', '#F9A825']
      });
      
      // Show additional visual effects
      showWinEffects();
      
      // Notify user with a toast message
      toast.success("Wow! You got a legendary item!", {
        icon: '🏆',
        duration: 5000
      });
    } 
    else if (rarityType === 'yellow') {
      // For ultra rare items
      playSound(receiveItemSoundRef);
      
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFC107', '#FFEB3B', '#FFEE58']
      });
      
      // Notify user
      toast.success("Amazing! An ultra rare item!", {
        icon: '🌟',
        duration: 4000
      });
    } 
    else if (rarityType === 'red') {
      // For very rare items
      playSound(receiveItemSoundRef);
      
      // Some confetti
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 }
      });
      
      // Notify user
      toast.success("Great! A very rare item!", {
        icon: '✨',
        duration: 3000
      });
    } 
    else if (rarityType === 'pink') {
      // For rare items
      playSound(receiveItemSoundRef);
      
      // Small confetti
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 }
      });
      
      // Notify user
      toast("You got a rare item!", {
        icon: '🎁',
        duration: 2000
      });
    } 
    else {
      // For common and uncommon items
      playSound(receiveItemSoundRef);
    }
    
    // Add to live preview for others to see - use the same exact item
    addToLivePreview(newItem);
  };
  
  // Update shuffleItems function to handle the expanded rarity set
  const shuffleItems = () => {
    if (imagesRef.current.length === 0) {
      console.error('No images loaded for shuffling');
      return 0;
    }
    
    // Log available rarities for debugging
    console.log('Available rarities with indices:');
    imageRarities.forEach((rarity, index) => {
      console.log(`${index}: ${rarity} - ${itemDetails[rarity as keyof typeof itemDetails].name}`);
    });
    
    // Determine the item that will be selected
    // Implement weighted selection based on rarity type
    const weights = {
      blue: 40,    // 40% chance for common (blue)
      purple: 30,  // 30% chance for uncommon (purple)
      pink: 15,    // 15% chance for rare (pink)
      red: 8,      // 8% chance for very rare (red)
      yellow: 5,   // 5% chance for ultra rare (yellow)
      legendary: 2 // 2% chance for legendary
    };
    
    // Create a weighted array for rarity selection
    const weightedSelection: string[] = [];
    Object.entries(weights).forEach(([rarityPrefix, weight]) => {
      for (let i = 0; i < weight; i++) {
        weightedSelection.push(rarityPrefix);
      }
    });
    
    // First select a rarity tier
    const selectedRarityTier = weightedSelection[Math.floor(Math.random() * weightedSelection.length)];
    
    // Then find all items of that rarity tier
    const itemsInSelectedTier = imageRarities.filter(rarity => rarity.startsWith(selectedRarityTier));
    
    // If no items in this tier (should never happen), fallback to blue1
    if (itemsInSelectedTier.length === 0) {
      console.error('No items found in selected tier:', selectedRarityTier);
      const fallbackIndex = imageRarities.indexOf('blue1');
      winnerIndexRef.current = fallbackIndex >= 0 ? fallbackIndex : 0;
      return winnerIndexRef.current;
    }
    
    // Randomly select an item from the tier
    const randomItemInTier = itemsInSelectedTier[Math.floor(Math.random() * itemsInSelectedTier.length)];
    const rarityIndex = imageRarities.indexOf(randomItemInTier);
    
    if (rarityIndex === -1) {
      console.error('Selected rarity not found in imageRarities:', randomItemInTier);
      // Fallback to first item
      winnerIndexRef.current = 0;
      return 0;
    }
    
    // Store the selected winner index - this is the critical value used later
    winnerIndexRef.current = rarityIndex;
    
    // Log selection details for debugging
    console.log('** CASE OPENING STARTED **');
    console.log(`Selected winner: ${randomItemInTier} (index ${rarityIndex})`);
    console.log(`Item: ${itemDetails[randomItemInTier as keyof typeof itemDetails].name}`);
    
    // Set a random start position for animation
    const imagesLength = imagesRef.current.length;
    
    // Calculate proper start position to ensure positive indices
    const centerPosition = Math.floor(IMAGE_COUNT / 2);
    
    // We add multiple cycles (imagesLength * 100) to ensure we never get negative indices
    // Then remove enough positions to ensure the winning item ends up in the center
    const backOffset = centerPosition + 10; // Extra offset for smoother animation
    const startPos = ((rarityIndex - backOffset) + (imagesLength * 100)) % imagesLength;
    
    startIndexRef.current = startPos;
    
    console.log('Animation settings:');
    console.log(`- Start position: ${startPos}`);
    console.log(`- Center position: ${centerPosition}`);
    console.log(`- Expected final position: ${(startPos + centerPosition) % imagesLength}`);
    console.log(`- This should equal winner index: ${rarityIndex}`);
    
    return rarityIndex;
  };
  
  const openCase = () => {
    if (spinning) return;
    
    if (farmCoins < CASE_COST) {
      toast.error("Not enough farm coins!");
      return;
    }
    
    // Cancel any existing animation
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Deduct cost
    setFarmCoins(prev => prev - CASE_COST);
    
    // Play sound when case is opened
    playSound(openCaseSoundRef);
    
    setSpinning(true);
    
    // Shuffle and determine winner before animation starts
    shuffleItems();
    
    // Reset animation state - IMPORTANT: use refs directly, not state
    stateRef.current = STATE.ACCELERATION;
    startTimeRef.current = performance.now();
    speedRef.current = BASE_SPEED;
    offsetRef.current = 0;
    
    // Randomize the acceleration duration for more natural feel
    accelerationDurationRef.current = 
      Math.random() * (ACCELERATION_DURATION_MAX - ACCELERATION_DURATION_MIN) + ACCELERATION_DURATION_MIN;
    
    // Start animation with a slight delay to ensure everything is reset
    setTimeout(() => {
      // Force a redraw with the initial state to ensure animation starts correctly
      drawSlotMachine();
      animationFrameIdRef.current = requestAnimationFrame(updateSlotMachine);
    }, 50);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen bg-black">
      {/* Add the styles to the page */}
      <style jsx global>{SCROLL_ANIMATION}</style>
      
      <div className="mb-6">
        <Link href="/farm-cases">
          <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-yellow-500/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Cases</span>
          </button>
        </Link>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="font-bold text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-3 noot-title">Noot Case Simulator</h1>
        <p className="text-yellow-300/70 max-w-2xl mx-auto">
          Open special Noot Cases to earn rare farm items and collectibles
        </p>
      </div>
      
      {/* Improved responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        {/* Left side - Case opening (expanded on mobile, 8 cols on desktop) */}
        <div className="noot-card flex flex-col items-center p-4 md:p-6 lg:col-span-8 order-2 lg:order-1">
          <h2 className="text-xl font-bold mb-4 text-white">Noot Case</h2>
          
          {/* Live preview - more compact, horizontal scrolling on mobile */}
          <div className="w-full mb-4 fade-in">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm text-white/60">Live Drops:</h3>
              {livePreview.length > 0 && (
                <button 
                  onClick={() => setLivePreview([])}
                  className="text-xs text-yellow-500 hover:text-yellow-400"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex overflow-x-auto p-2 border border-[#333] bg-black scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-gray-900">
              {livePreview.map((item, i) => (
                <div 
                  key={i} 
                  className={`p-1 border mr-2 flex-shrink-0 ${item?.rarity ? getRarityBg(item.rarity) : 'border-gray-700'}`}
                >
                  <div className="w-10 h-10 relative flex items-center justify-center">
                    <Image 
                      src={item?.image || '/case%20items/bronze/Chester.jpg'}
                      alt={item?.name || 'Item'}
                      width={40}
                      height={40}
                      className="object-contain max-w-full max-h-full"
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                  </div>
                </div>
              ))}
              {livePreview.length === 0 && (
                <p className="text-white/40 text-sm py-2 w-full text-center">No recent drops yet...</p>
              )}
            </div>
          </div>
          
          <div className="w-full mb-6">
            {spinning && (
              <div 
                className="h-2 bg-yellow-500/30 mb-4 overflow-hidden rounded-full"
                style={{
                  width: '100%',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  animation: 'progressAnimation 3s ease-in-out forwards'
                }}
              ></div>
            )}
            
            {/* Improved slot machine container - fully responsive */}
            <div className="case-background relative">
              <div className="slot-machine-container" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <div className="slot-machine-shine"></div>
                <div className="relative mx-auto flex flex-col items-center">
                  <canvas 
                    ref={canvasRef} 
                    width={IMAGE_WIDTH * IMAGE_COUNT} 
                    height={IMAGE_HEIGHT}
                    className="mx-auto border-2 border-yellow-900/30"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Case info and open button */}
          <div className="w-full fade-in">
            <div className="flex justify-between items-center mb-4 p-3 border border-[#333] bg-[#111] rounded-md">
              <span className="text-white">Case Cost:</span>
              <div className="flex items-center">
                <CircleDollarSign className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-white">{CASE_COST} Farm Coins</span>
              </div>
            </div>
            
            <button 
              onClick={openCase}
              disabled={spinning || farmCoins < CASE_COST}
              className={`w-full py-4 text-lg relative overflow-hidden ${
                spinning || farmCoins < CASE_COST
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700'
              } text-black font-bold transition-all duration-300 shadow-lg hover:shadow-yellow-500/20 rounded-lg transform hover:scale-[1.01] active:scale-[0.99]`}
            >
              {spinning ? (
                <>Opening...</>
              ) : (
                <>
                  {!spinning && farmCoins >= CASE_COST && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="absolute w-full h-full bg-white/10 transform rotate-12 translate-x-12 -translate-y-2 animate-pulse"></span>
                    </span>
                  )}
                  <span className="relative z-10">Open Case</span>
                </>
              )}
            </button>
            
            <div className="mt-4 p-3 border border-[#333] bg-[#111] rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-white">Your Balance:</span>
                <div className="flex items-center">
                  <CircleDollarSign className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-white">{farmCoins} Farm Coins</span>
                </div>
              </div>
            </div>
            
            {/* Possible rewards - moved to bottom on mobile, displayed after case opening */}
            <div className="mt-6 block lg:hidden">
              <h3 className="text-sm mb-3 text-white/60 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                Possible Rewards:
              </h3>
              <div className="grid grid-cols-3 gap-2 p-3 border border-[#333] bg-black rounded-md">
                {Object.entries(itemDetails).map(([rarity, item]) => (
                  <div 
                    key={rarity} 
                    className={`p-2 border ${getRarityBg(rarity)} flex flex-col items-center rounded`}
                  >
                    <div className="w-10 h-10 relative mb-1 flex items-center justify-center">
                      <Image 
                        src={item?.image}
                        alt={item?.name || 'Item'}
                        width={40}
                        height={40}
                        className="object-contain max-w-full max-h-full"
                        style={{ objectFit: 'contain' }}
                        priority
                      />
                    </div>
                    <h4 className={`text-xs font-semibold text-center truncate w-full ${getRarityColor(rarity)}`}>
                      {item?.name}
                    </h4>
                    <div className="flex items-center text-xs mt-1">
                      <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                      <span className="text-white/80">{item?.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Inventory (to top on mobile, 4 cols on desktop) */}
        <div className="noot-card p-4 md:p-6 lg:col-span-4 order-1 lg:order-2">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Your Inventory
          </h2>
          
          <div className="overflow-y-auto max-h-[360px] border border-[#333] bg-black p-3 rounded-md">
            {inventory.length === 0 ? (
              <p className="text-white/60 text-center py-6">Your inventory is empty. Open cases to collect items!</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {inventory.map((item, index) => {
                  const rarity = item.rarity || 'blue';
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-3 border ${getRarityBg(rarity)} flex items-center rounded`}
                    >
                      <div className="w-12 h-12 relative mr-3 flex items-center justify-center">
                        <Image 
                          src={item?.image || '/case%20items/bronze/Chester.jpg'}
                          alt={item?.name || 'Item'}
                          width={48}
                          height={48}
                          className="object-contain max-w-full max-h-full"
                          style={{ objectFit: 'contain' }}
                          priority
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold truncate ${getRarityColor(rarity)}`}>{item?.name || 'Unknown Item'}</h3>
                        <div className="flex items-center text-xs text-white/60">
                          <CircleDollarSign className="h-3 w-3 mr-1" />
                          {item?.price || 0} coins
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Possible rewards - only visible on desktop in sidebar */}
          <div className="mt-6 hidden lg:block">
            <h3 className="text-sm mb-3 text-white/60 flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Possible Rewards:
            </h3>
            <div className="grid grid-cols-2 gap-2 p-3 border border-[#333] bg-black rounded-md">
              {Object.entries(itemDetails).map(([rarity, item]) => (
                <div 
                  key={rarity} 
                  className={`p-2 border ${getRarityBg(rarity)} flex flex-col items-center rounded`}
                >
                  <div className="w-12 h-12 relative mb-1 flex items-center justify-center">
                    <Image 
                      src={item?.image}
                      alt={item?.name || 'Item'}
                      width={48}
                      height={48}
                      className="object-contain max-w-full max-h-full"
                      style={{ objectFit: 'contain' }}
                      priority
                    />
                  </div>
                  <h4 className={`text-xs font-semibold text-center truncate w-full ${getRarityColor(rarity)}`}>
                    {item?.name}
                  </h4>
                  <div className="flex items-center text-xs mt-1">
                    <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                    <span className="text-white/80">{item?.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Award dialog - improved with better responsive design */}
      {showDialog && rewardItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/90 p-4">
          <div 
            className={`max-w-md w-full p-6 sm:p-8 ${
              rewardItem?.rarity?.startsWith('legendary') 
                ? 'bg-gradient-to-br from-black to-amber-950 glow-pulse' 
                : 'bg-gradient-to-br from-black to-yellow-950'
            } rounded-lg border-2 ${
              rewardItem?.rarity?.startsWith('legendary') 
                ? 'border-amber-500' 
                : rewardItem?.rarity?.startsWith('yellow') 
                  ? 'border-yellow-500'
                  : rewardItem?.rarity?.startsWith('red')
                    ? 'border-red-500'
                    : rewardItem?.rarity?.startsWith('pink')
                      ? 'border-pink-500'
                      : rewardItem?.rarity?.startsWith('purple')
                        ? 'border-purple-500'
                        : 'border-blue-500'
            } pop-in shadow-xl`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center shadow-lg">
                <Trophy className="h-10 w-10 text-black" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6 text-white mt-6">You received:</h2>
            <div className="flex flex-col items-center">
              {/* Image display wrapper with better error handling */}
              <div 
                className="w-40 h-40 relative mb-3 flex items-center justify-center bg-black/30 p-3 rounded-lg border border-yellow-900/50"
                style={{ 
                  animation: 'popIn 0.5s ease-out forwards',
                  animationDelay: '0.2s',
                  opacity: 0,
                  boxShadow: rewardItem?.rarity?.startsWith('legendary') 
                    ? '0 0 30px rgba(251, 191, 36, 0.3)' 
                    : '0 0 20px rgba(234, 179, 8, 0.2)'
                }}
              >
                {/* Get image directly from itemDetails to ensure consistency */}
                {rewardItem?.rarity && (
                  <Image 
                    src={itemDetails[rewardItem.rarity as keyof typeof itemDetails]?.image}
                    alt={rewardItem?.name || 'Item'}
                    width={140}
                    height={140}
                    className="object-contain max-w-full max-h-full rounded"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                )}
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
                <CircleDollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="text-white text-lg">{rewardItem?.price || 0} coins</span>
              </div>
              <button 
                onClick={() => setShowDialog(false)}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold py-3 px-8 rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-200"
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
    </div>
  );
}