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

VIPERPIT_TESTNET_ADDRESS = "0x122A621c2fEC177Cf72a802afbB8bDD99d524C95";
VIPER_TOKEN_TESTNET_ADDRESS = "0x7466d7d0C21Fa05F32F5a0Fa27e12bdC06348Ce2";

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
    "0x024C92186810d17Eb37EE00ee9e09a3aE4217323"
  );

  const block = await getBlock(await getBlockNumber());

  //console.log("Block number: ", block);

  const viperPrizePoolConfig = {
    yieldSource: "0xBb7a17DA58c9aE5C9BC3790276106550eFDab806",
    maxExitFeeMantissa: ethers.utils.parseEther("0.1"),
    maxTimelockDuration: 300,
  };

  const multipleWinnersConfig = {
    prizePeriodStart: block.timestamp,
    prizePeriodSeconds: 1,
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
    8
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
