const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NooterSwap", function () {
  let NooterSwap;
  let nooterSwap;
  let NootToken;
  let nootToken;
  let FarmToken;
  let farmToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const INITIAL_TOKEN_SUPPLY = ethers.utils.parseEther("1000000"); // 1 million tokens

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy NOOT token
    NootToken = await ethers.getContractFactory("NooterToken");
    nootToken = await NootToken.deploy("Nooter Token", "NOOT", 1000000);
    await nootToken.deployed();

    // Deploy a farm token for testing
    FarmToken = await ethers.getContractFactory("NooterToken"); // Reusing NooterToken for simplicity
    farmToken = await FarmToken.deploy("Farm Token", "FARM", 1000000);
    await farmToken.deployed();

    // Deploy NooterSwap 
    NooterSwap = await ethers.getContractFactory("NooterSwap");
    nooterSwap = await NooterSwap.deploy();
    await nooterSwap.deployed();

    // Add farm token to supported tokens
    await nooterSwap.addToken(farmToken.address);

    // Fund the swap contract with tokens for liquidity
    await nootToken.approve(nooterSwap.address, INITIAL_TOKEN_SUPPLY);
    await nooterSwap.fundToken(nootToken.address, INITIAL_TOKEN_SUPPLY);

    await farmToken.approve(nooterSwap.address, INITIAL_TOKEN_SUPPLY);
    await nooterSwap.fundToken(farmToken.address, INITIAL_TOKEN_SUPPLY);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nooterSwap.owner()).to.equal(owner.address);
    });

    it("Should support NOOT token by default", async function () {
      const tokens = await nooterSwap.getAllSupportedTokens();
      expect(tokens).to.include(nootToken.address);
    });

    it("Should allow adding new tokens", async function () {
      const newToken = await NootToken.deploy("Another Token", "ANOT", 1000000);
      await newToken.deployed();

      await nooterSwap.addToken(newToken.address);
      const tokens = await nooterSwap.getAllSupportedTokens();
      expect(tokens).to.include(newToken.address);
    });
  });

  describe("Token Swapping", function () {
    beforeEach(async function () {
      // Transfer some tokens to addr1 for testing
      await nootToken.transfer(addr1.address, ethers.utils.parseEther("10000"));
      await farmToken.transfer(addr1.address, ethers.utils.parseEther("10000"));
    });

    it("Should swap NOOT for farm token at 1:1 ratio", async function () {
      const swapAmount = ethers.utils.parseEther("1000");
      
      // Initial balances
      const initialNootBalance = await nootToken.balanceOf(addr1.address);
      const initialFarmBalance = await farmToken.balanceOf(addr1.address);
      
      // Approve and swap
      await nootToken.connect(addr1).approve(nooterSwap.address, swapAmount);
      await nooterSwap.connect(addr1).swapNOOTForToken(farmToken.address, swapAmount);
      
      // Final balances
      const finalNootBalance = await nootToken.balanceOf(addr1.address);
      const finalFarmBalance = await farmToken.balanceOf(addr1.address);
      
      // Verify balances changed correctly
      expect(initialNootBalance.sub(finalNootBalance)).to.equal(swapAmount);
      expect(finalFarmBalance.sub(initialFarmBalance)).to.equal(swapAmount);
    });

    it("Should swap farm token for NOOT at 1:1 ratio", async function () {
      const swapAmount = ethers.utils.parseEther("1000");
      
      // Initial balances
      const initialNootBalance = await nootToken.balanceOf(addr1.address);
      const initialFarmBalance = await farmToken.balanceOf(addr1.address);
      
      // Approve and swap
      await farmToken.connect(addr1).approve(nooterSwap.address, swapAmount);
      await nooterSwap.connect(addr1).swapTokenForNOOT(farmToken.address, swapAmount);
      
      // Final balances
      const finalNootBalance = await nootToken.balanceOf(addr1.address);
      const finalFarmBalance = await farmToken.balanceOf(addr1.address);
      
      // Verify balances changed correctly
      expect(finalNootBalance.sub(initialNootBalance)).to.equal(swapAmount);
      expect(initialFarmBalance.sub(finalFarmBalance)).to.equal(swapAmount);
    });

    it("Should allow direct token to token swaps at 1:1 ratio", async function () {
      // Deploy another test token
      const anotherToken = await NootToken.deploy("Another Token", "ANOT", 1000000);
      await anotherToken.deployed();
      
      // Add token to swap and fund it
      await nooterSwap.addToken(anotherToken.address);
      await anotherToken.approve(nooterSwap.address, INITIAL_TOKEN_SUPPLY);
      await nooterSwap.fundToken(anotherToken.address, INITIAL_TOKEN_SUPPLY);
      
      // Transfer some tokens to addr1
      await anotherToken.transfer(addr1.address, ethers.utils.parseEther("10000"));
      
      const swapAmount = ethers.utils.parseEther("1000");
      
      // Initial balances
      const initialFarmBalance = await farmToken.balanceOf(addr1.address);
      const initialAnotherBalance = await anotherToken.balanceOf(addr1.address);
      
      // Approve and swap
      await anotherToken.connect(addr1).approve(nooterSwap.address, swapAmount);
      await nooterSwap.connect(addr1).swapTokens(anotherToken.address, farmToken.address, swapAmount);
      
      // Final balances
      const finalFarmBalance = await farmToken.balanceOf(addr1.address);
      const finalAnotherBalance = await anotherToken.balanceOf(addr1.address);
      
      // Verify balances changed correctly
      expect(finalFarmBalance.sub(initialFarmBalance)).to.equal(swapAmount);
      expect(initialAnotherBalance.sub(finalAnotherBalance)).to.equal(swapAmount);
    });
  });

  describe("Token Management", function () {
    it("Should allow the owner to remove supported tokens", async function () {
      await nooterSwap.removeToken(farmToken.address);
      
      const tokenInfo = await nooterSwap.getTokenInfo(farmToken.address);
      expect(tokenInfo.isSupported).to.equal(false);
      
      // Should not allow swapping with removed tokens
      await nootToken.connect(addr1).approve(nooterSwap.address, ethers.utils.parseEther("100"));
      await expect(
        nooterSwap.connect(addr1).swapNOOTForToken(farmToken.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Token not supported");
    });

    it("Should not allow removing the NOOT token", async function () {
      await expect(
        nooterSwap.removeToken(nootToken.address)
      ).to.be.revertedWith("Cannot remove NOOT token");
    });

    it("Should allow emergency withdrawal by owner", async function () {
      const withdrawAmount = ethers.utils.parseEther("1000");
      
      const initialBalance = await nootToken.balanceOf(owner.address);
      
      await nooterSwap.emergencyWithdraw(
        nootToken.address,
        withdrawAmount,
        owner.address
      );
      
      const finalBalance = await nootToken.balanceOf(owner.address);
      
      expect(finalBalance.sub(initialBalance)).to.equal(withdrawAmount);
    });

    it("Should not allow emergency withdrawal by non-owners", async function () {
      await expect(
        nooterSwap.connect(addr1).emergencyWithdraw(
          nootToken.address,
          ethers.utils.parseEther("1000"),
          addr1.address
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 