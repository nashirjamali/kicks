# KICKS Smart Contracts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Compile contracts:
```bash
npm run compile
```

4. Deploy to Sepolia:
```bash
npm run deploy
```

## Contract Addresses

After deployment, update the contract addresses in:
- `frontend/.env.local` - `NEXT_PUBLIC_KICKS_CONTRACT_ADDRESS`
- `backend/.env` - (if needed)

## USDT on Sepolia

You'll need a USDT testnet token address. You can deploy your own test USDT token or use an existing one.

