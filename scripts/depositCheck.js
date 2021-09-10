const YieldSourcePrizePool = require('../abis/YieldSourcePrizePool.json');
const MultipleWinners = require('../abis/MultipleWinners.json');
const IERC20 = require('../abis/IERC20.json');

const CONTRACT_PRIZE = '0xbeccfc610Dd575Cb8F044E44724DDb3CD3CE2CE3';
const PRIZE_STRAT = '0x1F764F5Fa45eC5537CB354510D1C118bA3D33cCA';

async function main() {
  const { ethers } = hre;
  const { constants, provider, getContractAt, getContractFactory, getSigners, utils } = ethers;
  const { AddressZero } = constants;
  const { getBlock, getBlockNumber, getTransactionReceipt, send } = provider;
 
  const prizePool = await getContractAt(
    YieldSourcePrizePool.abi,
    CONTRACT_PRIZE
  );

  const strat = await getContractAt(
    MultipleWinners.abi,
    PRIZE_STRAT
  );
  console.log(await strat.ticket());
  const viperContract = await getContractAt(IERC20.abi, '0x11F477aE5f42335928fC94601a8A81ec77b27b2b');
  const tcc = await viperContract.approve(CONTRACT_PRIZE, ethers.utils.parseEther("5"));
  console.log(tcc);
  console.log("OKsd");
  const tx1 = await prizePool.depositTo(
    '0xa4c384c151ab32258A3e5216465725edEa6e5a11',
    ethers.utils.parseEther("4"),
    await strat.ticket(),
    AddressZero,
  );
  console.log(tx1);
  //console.log("Prize Pool: ", prizePool);
  //await prizePool.depositTo()

  let tx = await strat.completeAward();
  console.log(tx);

  const receipt = await getTransactionReceipt(
    tx.hash,
  );
  console.log(receipt);

  const yieldSourcePrizePoolInitializedEvent = receipt.logs.map(
    (log) => {
      try {
        return MultipleWinners.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    },
  );
  console.log(yieldSourcePrizePoolInitializedEvent);

  let val = await strat.prizePeriodEndAt();
  console.log(val);

  await new Promise(r => setTimeout(r, 35000));

  tx = await strat.completeAward();
  console.log(tx);

  val = await strat.prizePeriodEndAt();
  console.log(val);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
