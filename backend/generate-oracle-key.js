import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const wallet = ethers.Wallet.createRandom();

console.log('='.repeat(60));
console.log('ORACLE WALLET GENERATED');
console.log('='.repeat(60));
console.log('Private Key:', wallet.privateKey);
console.log('Address (Oracle Address):', wallet.address);
console.log('='.repeat(60));
console.log('');
console.log('IMPORTANT:');
console.log('1. Save the Private Key to backend/.env as ORACLE_PRIVATE_KEY');
console.log('2. Save the Address to smart-contracts/.env as ORACLE_ADDRESS');
console.log('3. NEVER commit these values to git!');
console.log('4. Fund this address with some ETH on Sepolia for gas (if needed)');
console.log('='.repeat(60));

