const hre = require('hardhat');

async function main() {
  const usdtAddress = process.env.USDT_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS;

  if (!usdtAddress || !oracleAddress) {
    throw new Error('USDT_ADDRESS and ORACLE_ADDRESS must be set in .env');
  }

  const Kicks = await hre.ethers.getContractFactory('Kicks');
  const kicks = await Kicks.deploy(usdtAddress, oracleAddress);

  await kicks.waitForDeployment();

  console.log('Kicks deployed to:', await kicks.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

