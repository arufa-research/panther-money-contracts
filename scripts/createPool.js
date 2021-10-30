const hre = require("hardhat");
const PoolWithMultipleWinnersBuilder = require('../abis/PoolWithMultipleWinnersBuilder.json');
const YieldSourcePrizePool = require('../abis/YieldSourcePrizePool.json');

VIPERPIT_TESTNET_ADDRESS = "0x98b792BD73E10CF96b9f7b3A34baCdCe06349e3b";
VIPER_TOKEN_TESTNET_ADDRESS = "0x11F477aE5f42335928fC94601a8A81ec77b27b2b";

async function main() {
  const { ethers } = hre;
  const { provider, getContractAt } = ethers;
  const { getBlock, getBlockNumber, getTransactionReceipt } = provider;
  const poolBuilder = await getContractAt(
    PoolWithMultipleWinnersBuilder.abi,
    "0x7B8000A8A9e238E7648d84ec5E043235762128D2"
  );

  const block = await getBlock(await getBlockNumber());

  //console.log("Block number: ", block);

  const viperPrizePoolConfig = {
    yieldSource: "0xA11ec9B761E30eeE8D5aE4E7567f22CEDAf5CCB3",
    maxExitFeeMantissa: ethers.utils.parseEther("0.1"),
    maxTimelockDuration: 300,
  };

  const multipleWinnersConfig = {
    prizePeriodStart: 1628604603,
    prizePeriodSeconds: 604800, // 7 days
    ticketName: "PANTHERVIPERPPOOL",
    ticketSymbol: "PNTR-VIPER",
    sponsorshipName: "SPONSORSHIP",
    sponsorshipSymbol: "SHIP",
    ticketCreditLimitMantissa: ethers.utils.parseEther("0.1"),
    ticketCreditRateMantissa: "166666666666666",
    numberOfWinners: 1,
    splitExternalErc20Awards: false,
    prizeSplits: []
  };
  console.log("OK");
  const yieldSourceMultipleWinnersTx = await poolBuilder.createYieldSourceMultipleWinners(
    viperPrizePoolConfig,
    multipleWinnersConfig,
    18
  );

  console.log(yieldSourceMultipleWinnersTx.hash);

  await new Promise(r => setTimeout(r, 12000));

  const yieldSourceMultipleWinnersReceipt = await getTransactionReceipt(
    yieldSourceMultipleWinnersTx.hash,
  );
  console.log(yieldSourceMultipleWinnersReceipt);

  const yieldSourcePrizePoolInitializedEvent = yieldSourceMultipleWinnersReceipt.logs.map(
    (log) => {
      try {
        return poolBuilder.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    },
  );
  console.log(yieldSourcePrizePoolInitializedEvent);
  console.log("Prize pool address: ", yieldSourcePrizePoolInitializedEvent[yieldSourcePrizePoolInitializedEvent.length - 1]?.args[
    'prizePool'
  ]);

  const prizePool = await getContractAt(
    YieldSourcePrizePool.abi,
    yieldSourcePrizePoolInitializedEvent[yieldSourcePrizePoolInitializedEvent.length - 1]?.args[
      'prizePool'
    ]
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
