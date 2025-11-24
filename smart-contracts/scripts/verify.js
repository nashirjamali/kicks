const hre = require('hardhat');

async function main() {
  const contractAddress = '0x9e4CE4fD5856277D59d099DF46D5b34e7719a6aD';
  const usdtAddress = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
  const oracleAddress = '0x90CF06B13A56879b6FB2CBbC086ec937f35EFE7e';

  console.log('Verifying contract on Sepolia...');
  console.log('Contract Address:', contractAddress);
  console.log('USDT Address:', usdtAddress);
  console.log('Oracle Address:', oracleAddress);
  console.log('');

  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: [usdtAddress, oracleAddress],
    });
    console.log('Contract verified successfully on Etherscan!');
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log('Contract is already verified on Etherscan.');
    } else {
      console.error('Verification failed:', error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
