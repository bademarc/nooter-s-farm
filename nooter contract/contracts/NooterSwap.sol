// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NooterSwap
 * @dev A contract for swapping NOOT tokens to other supported tokens at 1:1 ratio
 */
contract NooterSwap is Ownable {
    // NOOT token address (0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56)
    address public constant NOOT_TOKEN = 0x3d8b869eB751B63b7077A0A93D6b87a54e6C8f56;
    
    // Token information structure
    struct TokenInfo {
        bool isSupported;      // Whether the token is supported
        uint256 balance;       // Current token balance for tracking purposes
    }
    
    // Mapping of token addresses to their info
    mapping(address => TokenInfo) public supportedTokens;
    
    // List of supported token addresses for enumeration
    address[] public tokenList;
    
    // Events
    event TokenAdded(address indexed tokenAddress);
    event TokenRemoved(address indexed tokenAddress);
    event TokenSwapped(address indexed fromToken, address indexed toToken, address indexed user, uint256 amount);
    event TokenFunded(address indexed tokenAddress, address indexed funder, uint256 amount);
    event TokenClaimed(address indexed tokenAddress, address indexed player, uint256 amount);
    
    /**
     * @dev Constructor - initializes with NOOT as the first supported token
     */
    constructor() Ownable(msg.sender) {
        // Add NOOT token
        supportedTokens[NOOT_TOKEN] = TokenInfo({
            isSupported: true,
            balance: 0
        });
        
        tokenList.push(NOOT_TOKEN);
        
        emit TokenAdded(NOOT_TOKEN);
    }
    
    /**
     * @dev Add multiple tokens at once
     * @param tokenAddresses Array of token addresses to add
     */
    function addMultipleTokens(address[] memory tokenAddresses) public onlyOwner {
        for (uint i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i] != address(0) && !supportedTokens[tokenAddresses[i]].isSupported) {
                supportedTokens[tokenAddresses[i]] = TokenInfo({
                    isSupported: true,
                    balance: 0
                });
                
                tokenList.push(tokenAddresses[i]);
                
                emit TokenAdded(tokenAddresses[i]);
            }
        }
    }
    
    /**
     * @dev Add all the farm tokens from the json file to be supported
     */
    function addAllFarmTokens() external onlyOwner {
        address[] memory farmTokens = new address[](13);
        
        // Add all farm tokens from the json file
        farmTokens[0] = 0xC3f63f74501D225E0CAA6EceA2c8ee73092B3062; // ABSTER
        farmTokens[1] = 0x529aF9EbFD8612077bA6b0B72F2898EF7be337D1; // ABBY
        farmTokens[2] = 0x2460a0068A154C7F2673417dA09f6AE81Ce70e56; // CHESTER
        farmTokens[3] = 0x46BE8d4a214D6ddecE0b3251d76d42E186927781; // DOJO3
        farmTokens[4] = 0xb4e815813875366e2b4e65eA857278Ae5bEceDc3; // FEATHERS
        farmTokens[5] = 0x45955765a7898f707a523CB1B7a6e3A95DDD5CD7; // MOP
        farmTokens[6] = 0x77D29085727405340946919A88B0Ac6c9Ffb80BD; // NUTZ
        farmTokens[7] = 0x8033d82e1e0f949C0986F9102a01C405831b784A; // PAINGU
        farmTokens[8] = 0x8814046950cDA7aee1B249C1689d070C0db6E58D; // PENGUIN
        farmTokens[9] = 0xEcbC4AB2ed8fce5C04dfB1104947Ca4891597336; // PUDGY
        farmTokens[10] = 0x26707CE367C4758F73EF09fA9D8d730869a38e10; // RETSBA
        farmTokens[11] = 0x13D6CbB5f602Df7784bbb9612c5314CDC1ba9d3c; // WOJACT
        farmTokens[12] = 0xF5048aD4FB452f4E39472d085E29994f6088d96B; // YUP
        
        addMultipleTokens(farmTokens);
    }
    
    /**
     * @dev Claim test tokens for testing purposes
     * @param tokenAddress The address of the token to claim
     * @param amount The amount of tokens to claim
     */
    function claimTestTokens(address tokenAddress, uint256 amount) external {
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient token reserve");
        
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        // Update the balance in our tracking
        if (supportedTokens[tokenAddress].balance >= amount) {
            supportedTokens[tokenAddress].balance -= amount;
        } else {
            supportedTokens[tokenAddress].balance = 0;
        }
        
        emit TokenClaimed(tokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Fund the contract with tokens
     * @param tokenAddress The address of the token to fund
     * @param amount The amount of tokens to fund
     */
    function fundToken(address tokenAddress, uint256 amount) external {
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Update the balance in our tracking
        supportedTokens[tokenAddress].balance += amount;
        
        emit TokenFunded(tokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Add a new token to be supported for swap
     * @param tokenAddress The address of the token to add
     */
    function addToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(!supportedTokens[tokenAddress].isSupported, "Token already supported");
        
        supportedTokens[tokenAddress] = TokenInfo({
            isSupported: true,
            balance: 0
        });
        
        tokenList.push(tokenAddress);
        
        emit TokenAdded(tokenAddress);
    }
    
    /**
     * @dev Remove a token from being supported
     * @param tokenAddress The address of the token to remove
     */
    function removeToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != NOOT_TOKEN, "Cannot remove NOOT token");
        require(supportedTokens[tokenAddress].isSupported, "Token not supported");
        
        // Find and remove token from the list
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == tokenAddress) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        // Mark as not supported but keep the balance info
        supportedTokens[tokenAddress].isSupported = false;
        
        emit TokenRemoved(tokenAddress);
    }
    
    /**
     * @dev Swap NOOT for another token (1:1 ratio)
     * @param toTokenAddress The address of the token to receive
     * @param amount The amount of NOOT to swap
     */
    function swapNOOTForToken(address toTokenAddress, uint256 amount) external {
        require(toTokenAddress != NOOT_TOKEN, "Cannot swap NOOT for NOOT");
        require(supportedTokens[toTokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 nootToken = IERC20(NOOT_TOKEN);
        IERC20 toToken = IERC20(toTokenAddress);
        
        // Check contract has enough of the target token
        uint256 contractBalance = toToken.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient liquidity for swap");
        
        // Transfer NOOT from sender to contract
        require(nootToken.transferFrom(msg.sender, address(this), amount), "NOOT transfer failed");
        
        // Update balances in tracking
        supportedTokens[NOOT_TOKEN].balance += amount;
        
        // Transfer target token to sender (1:1 ratio)
        require(toToken.transfer(msg.sender, amount), "Token transfer failed");
        
        // Update balances in tracking
        if (supportedTokens[toTokenAddress].balance >= amount) {
            supportedTokens[toTokenAddress].balance -= amount;
        } else {
            supportedTokens[toTokenAddress].balance = 0;
        }
        
        emit TokenSwapped(NOOT_TOKEN, toTokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Swap another token for NOOT (1:1 ratio)
     * @param fromTokenAddress The address of the token to swap
     * @param amount The amount of tokens to swap
     */
    function swapTokenForNOOT(address fromTokenAddress, uint256 amount) external {
        require(fromTokenAddress != NOOT_TOKEN, "Cannot swap NOOT for NOOT");
        require(supportedTokens[fromTokenAddress].isSupported, "Token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 fromToken = IERC20(fromTokenAddress);
        IERC20 nootToken = IERC20(NOOT_TOKEN);
        
        // Check contract has enough NOOT
        uint256 contractNootBalance = nootToken.balanceOf(address(this));
        require(contractNootBalance >= amount, "Insufficient NOOT liquidity for swap");
        
        // Transfer tokens from sender to contract
        require(fromToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update balances in tracking
        supportedTokens[fromTokenAddress].balance += amount;
        
        // Transfer NOOT to sender (1:1 ratio)
        require(nootToken.transfer(msg.sender, amount), "NOOT transfer failed");
        
        // Update balances in tracking
        if (supportedTokens[NOOT_TOKEN].balance >= amount) {
            supportedTokens[NOOT_TOKEN].balance -= amount;
        } else {
            supportedTokens[NOOT_TOKEN].balance = 0;
        }
        
        emit TokenSwapped(fromTokenAddress, NOOT_TOKEN, msg.sender, amount);
    }
    
    /**
     * @dev Direct swap between any two supported tokens (1:1 ratio)
     * @param fromTokenAddress The address of the token to swap from
     * @param toTokenAddress The address of the token to receive
     * @param amount The amount of tokens to swap
     */
    function swapTokens(address fromTokenAddress, address toTokenAddress, uint256 amount) external {
        require(fromTokenAddress != toTokenAddress, "Cannot swap same token");
        require(supportedTokens[fromTokenAddress].isSupported, "From token not supported");
        require(supportedTokens[toTokenAddress].isSupported, "To token not supported");
        require(amount > 0, "Amount must be positive");
        
        IERC20 fromToken = IERC20(fromTokenAddress);
        IERC20 toToken = IERC20(toTokenAddress);
        
        // Check contract has enough of target token
        uint256 contractBalance = toToken.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient liquidity for swap");
        
        // Transfer source token from sender to contract
        require(fromToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        // Update balances in tracking for source token
        supportedTokens[fromTokenAddress].balance += amount;
        
        // Transfer target token to sender (1:1 ratio)
        require(toToken.transfer(msg.sender, amount), "Token transfer failed");
        
        // Update balances in tracking for target token
        if (supportedTokens[toTokenAddress].balance >= amount) {
            supportedTokens[toTokenAddress].balance -= amount;
        } else {
            supportedTokens[toTokenAddress].balance = 0;
        }
        
        emit TokenSwapped(fromTokenAddress, toTokenAddress, msg.sender, amount);
    }
    
    /**
     * @dev Get the list of all supported tokens
     * @return An array of token addresses
     */
    function getAllSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @dev Get token information
     * @param tokenAddress The address of the token
     * @return isSupported Whether the token is supported
     * @return balance The tracked balance of the token in the contract
     * @return actualBalance The actual balance of the token in the contract (from the token contract)
     */
    function getTokenInfo(address tokenAddress) external view returns (
        bool isSupported,
        uint256 balance,
        uint256 actualBalance
    ) {
        TokenInfo storage info = supportedTokens[tokenAddress];
        return (
            info.isSupported,
            info.balance,
            IERC20(tokenAddress).balanceOf(address(this))
        );
    }
    
    /**
     * @dev Withdraw tokens in case of emergency or migration (owner only)
     * @param tokenAddress The address of the token to withdraw
     * @param amount The amount to withdraw
     * @param recipient The address to send the tokens to
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        
        IERC20 token = IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient balance");
        
        require(token.transfer(recipient, amount), "Transfer failed");
        
        // Update the balance in our tracking if it's a supported token
        if (supportedTokens[tokenAddress].isSupported && supportedTokens[tokenAddress].balance >= amount) {
            supportedTokens[tokenAddress].balance -= amount;
        }
    }
} 