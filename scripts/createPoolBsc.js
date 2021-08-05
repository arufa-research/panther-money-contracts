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

COBRAPIT_TESTNET_ADDRESS = "0x11110118d34FdE9c609E072D05C017C74190B758";
COBRA_TOKEN_TESTNET_ADDRESS = "0x6d88599555beda404f8df2b9484e867e7d03eddf";

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
    "0x184fA7083264229D3A92Bd56F1C253ff7580B10C"
  );

  const block = await getBlock(await getBlockNumber());

  //console.log("Block number: ", block);

  const viperPrizePoolConfig = {
    yieldSource: "0xCf998cDA27262137Dc864F2a1ABb14A1bFA9299f",
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

  /*const viperPrizePoolConfig = {
    yieldSource: "0xCf998cDA27262137Dc864F2a1ABb14A1bFA9299f",
    maxExitFeeMantissa: ethers.utils.parseUnits('0.5', 8)
  };

  const block = await getBlock(await getBlockNumber());

  console.log("Block number: ", block);

  const multipleWinnersConfig = {
    prizePeriodStart: block.timestamp,
    prizePeriodSeconds: 600,
    ticketName: 'VIPER',
    ticketSymbol: 'VIP',
    sponsorshipName: 'Sponsorship',
    sponsorshipSymbol: 'SPON',
    ticketCreditLimitMantissa: utils.parseEther('0.1'),
    ticketCreditRateMantissa: utils.parseEther('0.001'),
    numberOfWinners: 1,
    prizeSplits: []
  };*/
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
  console.log("Event: ", yieldSourcePrizePoolInitializedEvent);
  console.log("Prize pool address: ", yieldSourcePrizePoolInitializedEvent[yieldSourcePrizePoolInitializedEvent.length - 1]?.args[
    'prizePool'
  ]);

  const prizePool = await getContractAt(
    YieldSourcePrizePool,
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
