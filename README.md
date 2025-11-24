# KICKS - Commitment Staking dApp

Web2.5 Lifestyle DApp that combines Web2 data (Strava) with Web3 trust (Smart Contracts) for commitment staking.

## Overview

KICKS is a commitment staking platform where users:
1. Deposit USDT as collateral
2. Set a weekly activity goal (e.g., 50 KM)
3. Complete activities tracked on Strava
4. Get their deposit back when the goal is reached

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Wagmi, RainbowKit
- **Smart Contract**: Solidity (Hardhat) deployed on Sepolia
- **Backend**: Node.js Oracle Bridge for Strava API integration and proof signing
- **Token**: USDT (ERC20) for deposits

## Project Structure

```
kicks/
├── frontend/          # Next.js app
├── smart-contracts/   # Solidity smart contracts
├── backend/           # Node.js oracle bridge
└── README.md
```

## Setup Instructions

### 0. Generate Oracle Key (First Step!)

The oracle private key is used by the backend to sign proofs. You need to generate it first:

```bash
cd backend
npm install
node generate-oracle-key.js
```

This will output:
- **Private Key**: Save this to `backend/.env` as `ORACLE_PRIVATE_KEY`
- **Address**: Save this to `smart-contracts/.env` as `ORACLE_ADDRESS`

**Important**: 
- Never commit the private key to git
- Keep it secure - it's used to sign all verification proofs
- The address must match when deploying the contract

### 1. Smart Contracts

```bash
cd smart-contracts
npm install
cp .env.example .env
# Edit .env with your configuration (including ORACLE_ADDRESS from step 0)
npm run compile
npm run deploy
```

**Deployed Contract (Sepolia)**:
- **Kicks Contract**: [`0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD`](https://sepolia.etherscan.io/address/0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD)
- **USDT Address**: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- **Oracle Address**: `0x90CF06B13A56879b6FB2CBbC086ec937f35EFE7e`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with ORACLE_PRIVATE_KEY from step 0
npm start
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

## Environment Variables

### Contracts
- `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
- `PRIVATE_KEY`: Deployer wallet private key
- `USDT_ADDRESS`: USDT contract address on Sepolia
- `ORACLE_ADDRESS`: Oracle wallet address (generated in step 0, must match backend's ORACLE_PRIVATE_KEY)

### Backend
- `PORT`: Server port (default: 3001)
- `ORACLE_PRIVATE_KEY`: Private key for signing proofs (generate using `node generate-oracle-key.js`)

### Frontend
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- `NEXT_PUBLIC_KICKS_CONTRACT_ADDRESS`: Deployed contract address (`0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD`)
- `NEXT_PUBLIC_USDT_ADDRESS`: USDT contract address (`0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`)
- `NEXT_PUBLIC_BACKEND_URL`: Backend server URL
- `NEXT_PUBLIC_STRAVA_CLIENT_ID`: Strava OAuth client ID
- `STRAVA_CLIENT_SECRET`: Strava OAuth client secret

## Deployed Contracts (Sepolia)

- **Kicks Contract**: [`0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD`](https://sepolia.etherscan.io/address/0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD)
- **USDT Address**: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- **Oracle Address**: `0x90CF06B13A56879b6FB2CBbC086ec937f35EFE7e`

## Smart Contract Functions

- `joinChallenge(uint256 targetKm, uint256 depositAmount)`: Join a challenge with target distance and deposit
- `completeChallenge(uint256 actualKm, bytes signature)`: Complete challenge with oracle signature
- `slashDeposit(address userAddress)`: Admin function to slash failed challenges
- `getUserChallenge(address user)`: Get user's challenge details

## API Endpoints

### Backend
- `POST /api/verify-activity`: Verify Strava activities and generate signature
- `GET /api/challenge-status`: Get challenge status with activity details
- `GET /health`: Health check

### Frontend API Routes
- `GET /api/strava/callback`: Strava OAuth callback handler
- `POST /api/verify-activity`: Proxy to backend verification

## Development

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Deploy contracts: `cd smart-contracts && npm run deploy`

## License

MIT

