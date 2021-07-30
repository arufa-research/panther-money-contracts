// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Reserve = await hre.ethers.getContractFactory("Reserve");
  const reserve = await Reserve.deploy();

  console.log("Reserve: ", reserve.address);

  const ReserveRegistry = await hre.ethers.getContractFactory("Registry");
  const reserveRegistry = await ReserveRegistry.deploy();

  console.log("Reserve Registry: ", reserveRegistry.address);

  if (await reserveRegistry.lookup() != reserve.address) {
    await reserveRegistry.register(reserve.address);
  }

  console.log("Lookup: ", await reserveRegistry.lookup());

  const yieldSourcePrizePoolProxyFactory = await hre.ethers.getContractFactory("YieldSourcePrizePoolProxyFactory");
  const yieldSourcePrizePoolProxyFactoryResult = await yieldSourcePrizePoolProxyFactory.deploy();

  const controlledTokenProxyFactory = await hre.ethers.getContractFactory("ControlledTokenProxyFactory");
  const controlledTokenProxyFactoryResult = await controlledTokenProxyFactory.deploy();

  const ticketProxyFactory = await hre.ethers.getContractFactory("TicketProxyFactory");
  const ticketProxyFactoryResult = await ticketProxyFactory.deploy();

  const multipleWinnersProxyFactory = await hre.ethers.getContractFactory("MultipleWinnersProxyFactory");
  const multipleWinnersProxyFactoryResult = await multipleWinnersProxyFactory.deploy();

  const controlledTokenBuilder = await hre.ethers.getContractFactory("ControlledTokenBuilder");
  const controlledTokenBuilderResult = await controlledTokenBuilder.deploy(
    controlledTokenProxyFactoryResult.address,
    ticketProxyFactoryResult.address
  );
  
  const multipleWinnersBuilder = await hre.ethers.getContractFactory("MultipleWinnersBuilder");
  const multipleWinnersBuilderResult = await multipleWinnersBuilder.deploy(
    multipleWinnersProxyFactoryResult.address,
    controlledTokenBuilderResult.address
  );

  const poolWithMultipleWinnersBuilder = await hre.ethers.getContractFactory("PoolWithMultipleWinnersBuilder");
  const poolWithMultipleWinnersBuilderResult = await poolWithMultipleWinnersBuilder.deploy(
    reserveRegistry.address,
    yieldSourcePrizePoolProxyFactoryResult.address,
    multipleWinnersBuilderResult.address
  );

  console.log("PoolWithMultipleWinnersBuilder Deployed at: ", poolWithMultipleWinnersBuilderResult.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
