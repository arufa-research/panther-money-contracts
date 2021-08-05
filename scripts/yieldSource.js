// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

VIPERPIT_TESTNET_ADDRESS = "0x122A621c2fEC177Cf72a802afbB8bDD99d524C95";
VIPER_TOKEN_TESTNET_ADDRESS = "0x7466d7d0C21Fa05F32F5a0Fa27e12bdC06348Ce2";

COBRAPIT_TESTNET_ADDRESS = "0x11110118d34FdE9c609E072D05C017C74190B758";
COBRA_TOKEN_TESTNET_ADDRESS = "0x6d88599555beda404f8df2b9484e867e7d03eddf";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const yieldSource = await hre.ethers.getContractFactory("ViperPitSource");
  const viper = await yieldSource.deploy(
    COBRAPIT_TESTNET_ADDRESS,
    COBRA_TOKEN_TESTNET_ADDRESS
  );

  console.log("Yield Source deployed: ", viper.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
});
