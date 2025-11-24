const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('Kicks', function () {
  let kicks;
  let mockUSDT;
  let owner;
  let oracle;
  let user1;
  let user2;

  const TARGET_KM = 50n;
  const DEPOSIT_AMOUNT = ethers.parseEther('100');

  async function createSignature(userAddress, actualKm, signer) {
    const messageHash = ethers.keccak256(
      ethers.solidityPacked(['address', 'uint256'], [userAddress, actualKm])
    );
    return await signer.signMessage(ethers.getBytes(messageHash));
  }

  beforeEach(async function () {
    [owner, oracle, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory('MockERC20');
    mockUSDT = await MockERC20.deploy('Mock USDT', 'USDT');
    await mockUSDT.waitForDeployment();

    const Kicks = await ethers.getContractFactory('Kicks');
    kicks = await Kicks.deploy(await mockUSDT.getAddress(), oracle.address);
    await kicks.waitForDeployment();

    await mockUSDT.mint(user1.address, ethers.parseEther('1000'));
    await mockUSDT.mint(user2.address, ethers.parseEther('1000'));
  });

  describe('Deployment', function () {
    it('Should set the correct USDT token address', async function () {
      expect(await kicks.usdtToken()).to.equal(await mockUSDT.getAddress());
    });

    it('Should set the correct oracle address', async function () {
      expect(await kicks.oracleAddress()).to.equal(oracle.address);
    });

    it('Should set the correct owner', async function () {
      expect(await kicks.owner()).to.equal(owner.address);
    });
  });

  describe('joinChallenge', function () {
    it('Should allow user to join a challenge', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);

      await expect(kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT))
        .to.emit(kicks, 'ChallengeJoined')
        .withArgs(user1.address, TARGET_KM, DEPOSIT_AMOUNT);

      const challenge = await kicks.getUserChallenge(user1.address);
      expect(challenge.user).to.equal(user1.address);
      expect(challenge.targetKm).to.equal(TARGET_KM);
      expect(challenge.depositAmount).to.equal(DEPOSIT_AMOUNT);
      expect(challenge.completed).to.be.false;
      expect(challenge.exists).to.be.true;

      expect(await kicks.hasActiveChallenge(user1.address)).to.be.true;
      expect(await mockUSDT.balanceOf(await kicks.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it('Should transfer USDT from user to contract', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      const userBalanceBefore = await mockUSDT.balanceOf(user1.address);
      const contractBalanceBefore = await mockUSDT.balanceOf(await kicks.getAddress());

      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);

      expect(await mockUSDT.balanceOf(user1.address)).to.equal(userBalanceBefore - DEPOSIT_AMOUNT);
      expect(await mockUSDT.balanceOf(await kicks.getAddress())).to.equal(contractBalanceBefore + DEPOSIT_AMOUNT);
    });

    it('Should set correct start and end times', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      const blockTimestamp = BigInt(await time.latest());

      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);

      const challenge = await kicks.getUserChallenge(user1.address);
      const sevenDays = 7n * 24n * 60n * 60n;
      expect(Number(challenge.startTime)).to.be.closeTo(Number(blockTimestamp), 5);
      expect(Number(challenge.endTime)).to.be.closeTo(Number(blockTimestamp + sevenDays), 5);
    });

    it('Should revert if user already has active challenge', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);

      const newTarget = TARGET_KM + 10n;
      await expect(
        kicks.connect(user1).joinChallenge(newTarget, DEPOSIT_AMOUNT)
      ).to.be.revertedWith('User already has active challenge');
    });

    it('Should revert if targetKm is zero', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);

      await expect(
        kicks.connect(user1).joinChallenge(0, DEPOSIT_AMOUNT)
      ).to.be.revertedWith('Target must be greater than 0');
    });

    it('Should revert if depositAmount is zero', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);

      await expect(
        kicks.connect(user1).joinChallenge(TARGET_KM, 0)
      ).to.be.revertedWith('Deposit must be greater than 0');
    });

    it('Should revert if user has insufficient allowance', async function () {
      await expect(
        kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT)
      ).to.be.reverted;
    });

    it('Should revert if user has insufficient balance', async function () {
      const largeAmount = ethers.parseEther('10000');
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), largeAmount);

      await expect(
        kicks.connect(user1).joinChallenge(TARGET_KM, largeAmount)
      ).to.be.reverted;
    });
  });

  describe('completeChallenge', function () {
    let signature;

    beforeEach(async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);
    });

    it('Should allow user to complete challenge when target is reached', async function () {
      const actualKm = TARGET_KM;
      signature = await createSignature(user1.address, actualKm, oracle);

      const userBalanceBefore = await mockUSDT.balanceOf(user1.address);
      const contractBalanceBefore = await mockUSDT.balanceOf(await kicks.getAddress());

      await expect(kicks.connect(user1).completeChallenge(actualKm, signature))
        .to.emit(kicks, 'ChallengeCompleted')
        .withArgs(user1.address, actualKm);

      const challenge = await kicks.getUserChallenge(user1.address);
      expect(challenge.completed).to.be.true;
      expect(await kicks.hasActiveChallenge(user1.address)).to.be.false;

      expect(await mockUSDT.balanceOf(user1.address)).to.equal(userBalanceBefore + DEPOSIT_AMOUNT);
      expect(await mockUSDT.balanceOf(await kicks.getAddress())).to.equal(contractBalanceBefore - DEPOSIT_AMOUNT);
    });

    it('Should allow user to complete challenge when target is exceeded', async function () {
      const exceededKm = TARGET_KM + 10n;
      signature = await createSignature(user1.address, exceededKm, oracle);

      await expect(kicks.connect(user1).completeChallenge(exceededKm, signature))
        .to.emit(kicks, 'ChallengeCompleted')
        .withArgs(user1.address, exceededKm);

      const challenge = await kicks.getUserChallenge(user1.address);
      expect(challenge.completed).to.be.true;
    });

    it('Should revert if user has no active challenge', async function () {
      const actualKm = TARGET_KM;
      signature = await createSignature(user2.address, actualKm, oracle);

      await expect(
        kicks.connect(user2).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('No active challenge');
    });

    it('Should revert if challenge already completed', async function () {
      const actualKm = TARGET_KM;
      signature = await createSignature(user1.address, actualKm, oracle);
      await kicks.connect(user1).completeChallenge(actualKm, signature);

      await expect(
        kicks.connect(user1).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('No active challenge');
    });

    it('Should revert if challenge period has ended', async function () {
      const challenge = await kicks.getUserChallenge(user1.address);
      await time.increaseTo(challenge.endTime + 1n);

      const actualKm = TARGET_KM;
      signature = await createSignature(user1.address, actualKm, oracle);

      await expect(
        kicks.connect(user1).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('Challenge period ended');
    });

    it('Should revert if signature is invalid', async function () {
      const actualKm = TARGET_KM;
      signature = await createSignature(user1.address, actualKm, user2);

      await expect(
        kicks.connect(user1).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('Invalid signature');
    });

    it('Should revert if target not reached', async function () {
      const insufficientKm = TARGET_KM - 1n;
      signature = await createSignature(user1.address, insufficientKm, oracle);

      await expect(
        kicks.connect(user1).completeChallenge(insufficientKm, signature)
      ).to.be.revertedWith('Target not reached');
    });

    it('Should revert if signature is for different km value', async function () {
      const actualKm = TARGET_KM;
      const wrongKm = TARGET_KM + 5n;
      signature = await createSignature(user1.address, wrongKm, oracle);

      await expect(
        kicks.connect(user1).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('Invalid signature');
    });

    it('Should revert if signature is for different user', async function () {
      const actualKm = TARGET_KM;
      signature = await createSignature(user2.address, actualKm, oracle);

      await expect(
        kicks.connect(user1).completeChallenge(actualKm, signature)
      ).to.be.revertedWith('Invalid signature');
    });
  });

  describe('slashDeposit', function () {
    beforeEach(async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);
    });

    it('Should allow owner to slash deposit after challenge period ends', async function () {
      const challenge = await kicks.getUserChallenge(user1.address);
      await time.increaseTo(challenge.endTime + 1n);

      const ownerBalanceBefore = await mockUSDT.balanceOf(owner.address);
      const contractBalanceBefore = await mockUSDT.balanceOf(await kicks.getAddress());

      await expect(kicks.connect(owner).slashDeposit(user1.address))
        .to.emit(kicks, 'DepositSlashed')
        .withArgs(user1.address, DEPOSIT_AMOUNT);

      const challengeAfter = await kicks.getUserChallenge(user1.address);
      expect(challengeAfter.completed).to.be.true;
      expect(await kicks.hasActiveChallenge(user1.address)).to.be.false;

      expect(await mockUSDT.balanceOf(owner.address)).to.equal(ownerBalanceBefore + DEPOSIT_AMOUNT);
      expect(await mockUSDT.balanceOf(await kicks.getAddress())).to.equal(contractBalanceBefore - DEPOSIT_AMOUNT);
    });

    it('Should revert if called by non-owner', async function () {
      const challenge = await kicks.getUserChallenge(user1.address);
      await time.increaseTo(challenge.endTime + 1n);

      await expect(
        kicks.connect(user1).slashDeposit(user1.address)
      ).to.be.revertedWithCustomError(kicks, 'OwnableUnauthorizedAccount');
    });

    it('Should revert if user has no active challenge', async function () {
      const challenge = await kicks.getUserChallenge(user1.address);
      await time.increaseTo(challenge.endTime + 1n);

      await expect(
        kicks.connect(owner).slashDeposit(user2.address)
      ).to.be.revertedWith('No active challenge');
    });

    it('Should revert if challenge already completed', async function () {
      const actualKm = TARGET_KM;
      const signature = await createSignature(user1.address, actualKm, oracle);
      await kicks.connect(user1).completeChallenge(actualKm, signature);

      await expect(
        kicks.connect(owner).slashDeposit(user1.address)
      ).to.be.revertedWith('No active challenge');
    });

    it('Should revert if challenge period has not ended', async function () {
      await expect(
        kicks.connect(owner).slashDeposit(user1.address)
      ).to.be.revertedWith('Challenge period not ended');
    });
  });

  describe('setOracleAddress', function () {
    it('Should allow owner to update oracle address', async function () {
      const newOracle = user2.address;
      await kicks.connect(owner).setOracleAddress(newOracle);
      expect(await kicks.oracleAddress()).to.equal(newOracle);
    });

    it('Should revert if called by non-owner', async function () {
      const newOracle = user2.address;
      await expect(
        kicks.connect(user1).setOracleAddress(newOracle)
      ).to.be.revertedWithCustomError(kicks, 'OwnableUnauthorizedAccount');
    });
  });

  describe('getUserChallenge', function () {
    it('Should return challenge for user who joined', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);

      const challenge = await kicks.getUserChallenge(user1.address);
      expect(challenge.user).to.equal(user1.address);
      expect(challenge.targetKm).to.equal(TARGET_KM);
      expect(challenge.depositAmount).to.equal(DEPOSIT_AMOUNT);
      expect(challenge.exists).to.be.true;
    });

    it('Should return empty challenge for user who never joined', async function () {
      const challenge = await kicks.getUserChallenge(user2.address);
      expect(challenge.exists).to.be.false;
      expect(challenge.user).to.equal(ethers.ZeroAddress);
      expect(challenge.targetKm).to.equal(0n);
      expect(challenge.depositAmount).to.equal(0n);
    });
  });

  describe('Multiple users', function () {
    it('Should allow multiple users to join challenges simultaneously', async function () {
      await mockUSDT.connect(user1).approve(await kicks.getAddress(), DEPOSIT_AMOUNT);
      const target2 = TARGET_KM + 10n;
      const deposit2 = DEPOSIT_AMOUNT * 2n;
      await mockUSDT.connect(user2).approve(await kicks.getAddress(), deposit2);

      await kicks.connect(user1).joinChallenge(TARGET_KM, DEPOSIT_AMOUNT);
      await kicks.connect(user2).joinChallenge(target2, deposit2);

      expect(await kicks.hasActiveChallenge(user1.address)).to.be.true;
      expect(await kicks.hasActiveChallenge(user2.address)).to.be.true;

      const challenge1 = await kicks.getUserChallenge(user1.address);
      const challenge2 = await kicks.getUserChallenge(user2.address);

      expect(challenge1.targetKm).to.equal(TARGET_KM);
      expect(challenge2.targetKm).to.equal(target2);
      expect(challenge1.depositAmount).to.equal(DEPOSIT_AMOUNT);
      expect(challenge2.depositAmount).to.equal(deposit2);
    });
  });
});

