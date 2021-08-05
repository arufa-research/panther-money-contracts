const YieldSourcePrizePool = require('../abis/YieldSourcePrizePool.json');

const CONTRACT = '0x4e8711fC03ae013ab51e8aA96F05B75d5e3C8534';

async function main() {
  const { ethers } = hre;
  const { constants, provider, getContractAt, getContractFactory, getSigners, utils } = ethers;
  const { AddressZero } = constants;
  const { getBlock, getBlockNumber, getTransactionReceipt, send } = provider;
 
  const prizePool = await getContractAt(
    YieldSourcePrizePool.abi,
    CONTRACT
  );

  console.log("Prize Pool: ", prizePool);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
