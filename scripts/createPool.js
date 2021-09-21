// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const PoolWithMultipleWinnersBuilder = require('../abis/PoolWithMultipleWinnersBuilder.json');
const ControlledToken = require('../abis/ControlledToken.json');
const MultipleWinners = require('../abis/MultipleWinners.json');
const YieldSourcePrizePool = require('../abis/YieldSourcePrizePool.json');

VIPERPIT_TESTNET_ADDRESS = "0x98b792BD73E10CF96b9f7b3A34baCdCe06349e3b";
VIPER_TOKEN_TESTNET_ADDRESS = "0x11F477aE5f42335928fC94601a8A81ec77b27b2b";

async function main() {
  const { ethers } = hre;
  const { constants, provider, getContractAt, getContractFactory, getSigners, utils } = ethers;
  const { AddressZero } = constants;
  const { getBlock, getBlockNumber, getTransactionReceipt, send } = provider;
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const poolBuilder = await getContractAt(
    PoolWithMultipleWinnersBuilder.abi,
    "0xA36430d678C387fa4334E480abA4eCe2e72Ec0ad"
  );

  const block = await getBlock(await getBlockNumber());

  //console.log("Block number: ", block);

  const viperPrizePoolConfig = {
    yieldSource: "0x1EA0a6bCF36cD2A2cA42C9c42730dA86A0365067",
    maxExitFeeMantissa: ethers.utils.parseEther("0.1"),
    maxTimelockDuration: 300,
  };

  const multipleWinnersConfig = {
    prizePeriodStart: 1628604603,
    prizePeriodSeconds: 604800, // 7 days
    ticketName: "TICKET",
    ticketSymbol: "TICK",
    sponsorshipName: "SPONSORSHIP",
    sponsorshipSymbol: "SPON",
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
