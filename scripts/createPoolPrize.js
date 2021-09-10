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
const yieldProxy = require('../artifacts/contracts/prize-pool/yield-source/YieldSourcePrizePoolProxyFactory.sol/YieldSourcePrizePoolProxyFactory.json');
const multipleWinnerBuilder = require('../artifacts/contracts/builders/MultipleWinnersBuilder.sol/MultipleWinnersBuilder.json');

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
    "0x184fA7083264229D3A92Bd56F1C253ff7580B10C"
  );

  const yield = "0xd1817F6a05bEa63bd2473de773c041e126D20E70";
  const multiple = "0xFE4d57A13566cbd995C2eBf32A1F702932694f1C";
  const reserveReg= "0x02F8513B2C0DAb8a747e2Ee09e47aD3EdA2Ac4B1";

  const yieldCreator = await getContractAt(
    yieldProxy.abi,
    yield
  );

  const multipleStrat = await getContractAt(
    multipleWinnerBuilder.abi,
    multiple
  );

  //console.log("YIELD: ", await poolBuilder.yieldSourcePrizePoolProxyFactory());
  //console.log("Multiple: ", await poolBuilder.multipleWinnersBuilder());
  //console.log("Reserve: ", await poolBuilder.reserveRegistry());
  const block = await getBlock(await getBlockNumber());

  //console.log("Block number: ", block);

  const viperPrizePoolConfig = {
    yieldSource: "0xCf998cDA27262137Dc864F2a1ABb14A1bFA9299f",
    maxExitFeeMantissa: ethers.utils.parseEther("0.1"),
    maxTimelockDuration: 300,
  };

  const multipleWinnersConfig = {
    prizePeriodStart: block.timestamp,
    prizePeriodSeconds: 10,
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

  // const prizePool = await yieldCreator.create();
  // console.log(prizePool);
  // const yieldSourceMultipleWinnersReceipt = await getTransactionReceipt(
  //   prizePool.hash,
  // );
  // console.log(yieldSourceMultipleWinnersReceipt);
  const poolAddress = "0x4e8711fC03ae013ab51e8aA96F05B75d5e3C8534";
  const prizePool = getContractAt(
    YieldSourcePrizePool.abi,
    poolAddress
  );

  const prizeStrategy = await multipleStrat.createMultipleWinners(
    poolAddress,
    multipleWinnersConfig,
    18,
    '0xa4c384c151ab32258A3e5216465725edEa6e5a11'
  );

  console.log(prizeStrategy);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
