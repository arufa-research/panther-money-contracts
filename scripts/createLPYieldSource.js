// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

MINICHEF = "0x67dA5f2FfaDDfF067AB9d5F025F8810634d84287";
SUSHIONE = "0x468dc50884962d6f81733ac0c23c04611ac219f9";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const yieldSource = await hre.ethers.getContractFactory("SushiLpYieldSource");
  const sushi = await yieldSource.deploy(
    MINICHEF,
    SUSHIONE
  );

  console.log("Sushi yield Source deployed: ", sushi.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
