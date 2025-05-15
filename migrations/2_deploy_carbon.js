const CarbonCreditToken   = artifacts.require("CarbonCreditToken");
const CarbonCreditSystem  = artifacts.require("CarbonCreditSystem");

module.exports = async function(deployer, network, accounts) {
  // 1. Deploy the ERC20 token
  await deployer.deploy(CarbonCreditToken);
  const token = await CarbonCreditToken.deployed();

  // 2. Deploy the system, passing in the token's address
  await deployer.deploy(CarbonCreditSystem, token.address);
  const system = await CarbonCreditSystem.deployed();

  // 3. Grant MINTER_ROLE on the token to the system contract
  //    We need the bytes32 hash of "MINTER_ROLE"
  const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");

  await token.grantRole(MINTER_ROLE, system.address, { from: accounts[0] });

  console.log("✅  CarbonCreditToken deployed at", token.address);
  console.log("✅  CarbonCreditSystem deployed at", system.address);
  console.log("✅  Granted MINTER_ROLE to system");
};
