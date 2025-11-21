// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract Kicks is Ownable {
  using SafeERC20 for IERC20;

  struct Challenge {
    address user;
    uint256 targetKm;
    uint256 depositAmount;
    uint256 startTime;
    uint256 endTime;
    bool completed;
    bool exists;
  }

  IERC20 public immutable usdtToken;
  address public oracleAddress;

  mapping(address => Challenge) public challenges;
  mapping(address => bool) public hasActiveChallenge;

  event ChallengeJoined(address indexed user, uint256 targetKm, uint256 depositAmount);
  event ChallengeCompleted(address indexed user, uint256 actualKm);
  event DepositSlashed(address indexed user, uint256 amount);

  constructor(address _usdtToken, address _oracleAddress) Ownable(msg.sender) {
    usdtToken = IERC20(_usdtToken);
    oracleAddress = _oracleAddress;
  }

  function joinChallenge(uint256 targetKm, uint256 depositAmount) external {
    require(!hasActiveChallenge[msg.sender], 'User already has active challenge');
    require(targetKm > 0, 'Target must be greater than 0');
    require(depositAmount > 0, 'Deposit must be greater than 0');

    usdtToken.safeTransferFrom(msg.sender, address(this), depositAmount);

    uint256 startTime = block.timestamp;
    uint256 endTime = startTime + 7 days;

    challenges[msg.sender] = Challenge({
      user: msg.sender,
      targetKm: targetKm,
      depositAmount: depositAmount,
      startTime: startTime,
      endTime: endTime,
      completed: false,
      exists: true
    });

    hasActiveChallenge[msg.sender] = true;

    emit ChallengeJoined(msg.sender, targetKm, depositAmount);
  }

  function completeChallenge(uint256 actualKm, bytes memory signature) external {
    require(hasActiveChallenge[msg.sender], 'No active challenge');
    Challenge storage challenge = challenges[msg.sender];
    require(!challenge.completed, 'Challenge already completed');
    require(block.timestamp <= challenge.endTime, 'Challenge period ended');

    bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, actualKm));
    bytes32 ethSignedMessageHash = keccak256(
      abi.encodePacked('\x19Ethereum Signed Message:\n32', messageHash)
    );

    address signer = recoverSigner(ethSignedMessageHash, signature);
    require(signer == oracleAddress, 'Invalid signature');

    require(actualKm >= challenge.targetKm, 'Target not reached');

    challenge.completed = true;
    hasActiveChallenge[msg.sender] = false;

    usdtToken.safeTransfer(msg.sender, challenge.depositAmount);

    emit ChallengeCompleted(msg.sender, actualKm);
  }

  function slashDeposit(address userAddress) external onlyOwner {
    require(hasActiveChallenge[userAddress], 'No active challenge');
    Challenge storage challenge = challenges[userAddress];
    require(!challenge.completed, 'Challenge already completed');
    require(block.timestamp > challenge.endTime, 'Challenge period not ended');

    uint256 amount = challenge.depositAmount;
    challenge.completed = true;
    hasActiveChallenge[userAddress] = false;

    usdtToken.safeTransfer(owner(), amount);

    emit DepositSlashed(userAddress, amount);
  }

  function setOracleAddress(address _oracleAddress) external onlyOwner {
    oracleAddress = _oracleAddress;
  }

  function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
    require(signature.length == 65, 'Invalid signature length');

    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
      r := mload(add(signature, 32))
      s := mload(add(signature, 64))
      v := byte(0, mload(add(signature, 96)))
    }

    if (v < 27) {
      v += 27;
    }

    require(v == 27 || v == 28, 'Invalid signature v value');

    return ecrecover(messageHash, v, r, s);
  }

  function getUserChallenge(address user) external view returns (Challenge memory) {
    return challenges[user];
  }
}

