async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const MyContract = await ethers.getContractFactory("MyContract");
  const instance = await MyContract.deploy(/* constructor args */);
  await instance.deployed();

  console.log("MyContract deployed to:", instance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
