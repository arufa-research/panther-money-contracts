// award winner flow.
const hre = require("hardhat");
const YieldSourcePrizePool = require('../abis/YieldSourcePrizePool.json');

const PRIZE_POOL = "0x07e5e1a39d2C6fb2Cd408A2a3C3791F18828DE87";

async function main() {
  const { ethers } = hre;
  const { getContractAt } = ethers;

  const prizePool = await getContractAt(
    YieldSourcePrizePool.abi,
    PRIZE_POOL
  );

  console.log("Prize Pool: ", await prizePool.yieldSource());
  console.log("Before:  ", await prizePool.awardBalance());

  await prizePool.captureAwardBalance();

  console.log("After: ", await prizePool.awardBalance());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
