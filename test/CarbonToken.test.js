const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonToken", function () {
    let ProjectNFT;
    let CarbonToken;
    let projectNFT;
    let carbonToken;
    let owner;
    let validator;
    let user;
    let metadataURI = "ipfs://QmTest123";
    const mintAmount = ethers.utils.parseEther("1000");

    beforeEach(async function () {
        [owner, validator, user] = await ethers.getSigners();
        
        // Deploy ProjectNFT
        ProjectNFT = await ethers.getContractFactory("ProjectNFT");
        projectNFT = await ProjectNFT.deploy();
        await projectNFT.deployed();

        // Deploy CarbonToken
        CarbonToken = await ethers.getContractFactory("CarbonToken");
        carbonToken = await CarbonToken.deploy(projectNFT.address);
        await carbonToken.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await carbonToken.hasRole(await carbonToken.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
        });

        it("Should set the right minter", async function () {
            expect(await carbonToken.hasRole(await carbonToken.MINTER_ROLE(), owner.address)).to.equal(true);
        });

        it("Should set the right validator", async function () {
            expect(await carbonToken.hasRole(await carbonToken.VALIDATOR_ROLE(), owner.address)).to.equal(true);
        });
    });

    describe("Carbon Credit Minting", function () {
        beforeEach(async function () {
            // Register and verify a project
            await projectNFT.registerProject(user.address, metadataURI);
            await projectNFT.verifyProjectStatus(1);
        });

        it("Should mint carbon credits for verified project", async function () {
            await expect(carbonToken.mintCarbonCredits(1, user.address, mintAmount))
                .to.emit(carbonToken, "CreditsMinted")
                .withArgs(1, user.address, mintAmount);

            expect(await carbonToken.balanceOf(user.address)).to.equal(mintAmount);
            expect(await carbonToken.getProjectMintedStatus(1)).to.equal(true);
            expect(await carbonToken.getProjectTotalMinted(1)).to.equal(mintAmount);
        });

        it("Should not mint for unverified project", async function () {
            await projectNFT.registerProject(user.address, metadataURI);
            await expect(carbonToken.mintCarbonCredits(2, user.address, mintAmount))
                .to.be.revertedWith("Project not verified");
        });

        it("Should not mint twice for same project", async function () {
            await carbonToken.mintCarbonCredits(1, user.address, mintAmount);
            await expect(carbonToken.mintCarbonCredits(1, user.address, mintAmount))
                .to.be.revertedWith("Project already minted");
        });

        it("Should not mint when paused", async function () {
            await carbonToken.pause();
            await expect(carbonToken.mintCarbonCredits(1, user.address, mintAmount))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Carbon Credit Retirement", function () {
        beforeEach(async function () {
            // Register, verify, and mint credits
            await projectNFT.registerProject(user.address, metadataURI);
            await projectNFT.verifyProjectStatus(1);
            await carbonToken.mintCarbonCredits(1, user.address, mintAmount);
        });

        it("Should retire carbon credits", async function () {
            const retireAmount = ethers.utils.parseEther("100");
            await expect(carbonToken.connect(user).retireCarbonCredits(retireAmount))
                .to.emit(carbonToken, "CreditsRetired")
                .withArgs(user.address, retireAmount);

            expect(await carbonToken.balanceOf(user.address)).to.equal(mintAmount.sub(retireAmount));
        });

        it("Should not retire more than balance", async function () {
            const tooMuch = mintAmount.add(1);
            await expect(carbonToken.connect(user).retireCarbonCredits(tooMuch))
                .to.be.revertedWith("Insufficient balance");
        });

        it("Should not retire when paused", async function () {
            await carbonToken.pause();
            await expect(carbonToken.connect(user).retireCarbonCredits(100))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Carbon Credit Transfers", function () {
        beforeEach(async function () {
            // Register, verify, and mint credits
            await projectNFT.registerProject(user.address, metadataURI);
            await projectNFT.verifyProjectStatus(1);
            await carbonToken.mintCarbonCredits(1, user.address, mintAmount);
        });

        it("Should transfer carbon credits", async function () {
            const transferAmount = ethers.utils.parseEther("100");
            await expect(carbonToken.connect(user).transferCarbonCredits(validator.address, transferAmount))
                .to.emit(carbonToken, "CreditsTransferred")
                .withArgs(user.address, validator.address, transferAmount);

            expect(await carbonToken.balanceOf(validator.address)).to.equal(transferAmount);
        });

        it("Should not transfer when paused", async function () {
            await carbonToken.pause();
            await expect(carbonToken.connect(user).transferCarbonCredits(validator.address, 100))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Pausable", function () {
        it("Should pause and unpause by admin", async function () {
            await carbonToken.pause();
            expect(await carbonToken.paused()).to.equal(true);

            await carbonToken.unpause();
            expect(await carbonToken.paused()).to.equal(false);
        });

        it("Should not pause by non-admin", async function () {
            await expect(carbonToken.connect(user).pause())
                .to.be.revertedWith("AccessControl: account");
        });
    });

    describe("Staking", function () {
        it("Should allow staking", async function () {
            const stakeAmount = ethers.utils.parseEther("1.0");
            await expect(carbonToken.connect(user).stake({ value: stakeAmount }))
                .to.emit(carbonToken, "Staked")
                .withArgs(user.address, stakeAmount);
        });

        it("Should not allow zero stake", async function () {
            await expect(carbonToken.connect(user).stake({ value: 0 }))
                .to.be.revertedWith("Must stake some ETH");
        });
    });
}); 