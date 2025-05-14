const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProjectNFT", function () {
    let ProjectNFT;
    let projectNFT;
    let owner;
    let validator;
    let user;
    let metadataURI = "ipfs://QmTest123";

    beforeEach(async function () {
        [owner, validator, user] = await ethers.getSigners();
        ProjectNFT = await ethers.getContractFactory("ProjectNFT");
        projectNFT = await ProjectNFT.deploy();
        await projectNFT.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await projectNFT.hasRole(await projectNFT.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true);
        });

        it("Should set the right validator", async function () {
            expect(await projectNFT.hasRole(await projectNFT.VALIDATOR_ROLE(), owner.address)).to.equal(true);
        });
    });

    describe("Project Registration", function () {
        it("Should register a new project", async function () {
            await expect(projectNFT.registerProject(user.address, metadataURI))
                .to.emit(projectNFT, "ProjectRegistered")
                .withArgs(1, user.address, metadataURI);

            expect(await projectNFT.ownerOf(1)).to.equal(user.address);
            expect(await projectNFT.getProjectStatus(1)).to.equal(0); // Unverified
        });

        it("Should not register project when paused", async function () {
            await projectNFT.pause();
            await expect(projectNFT.registerProject(user.address, metadataURI))
                .to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Project Verification", function () {
        beforeEach(async function () {
            await projectNFT.registerProject(user.address, metadataURI);
        });

        it("Should verify project by validator", async function () {
            await projectNFT.verifyProjectStatus(1);
            expect(await projectNFT.getProjectStatus(1)).to.equal(2); // Verified
        });

        it("Should not verify project by non-validator", async function () {
            await expect(projectNFT.connect(user).verifyProjectStatus(1))
                .to.be.revertedWith("AccessControl: account");
        });
    });

    describe("Metadata Updates", function () {
        const newMetadataURI = "ipfs://QmNew123";

        beforeEach(async function () {
            await projectNFT.registerProject(user.address, metadataURI);
        });

        it("Should update metadata by owner", async function () {
            await projectNFT.connect(user).updateProjectMetadata(1, newMetadataURI);
            expect(await projectNFT.getProjectMetadata(1)).to.equal(newMetadataURI);
        });

        it("Should update metadata by admin", async function () {
            await projectNFT.updateProjectMetadata(1, newMetadataURI);
            expect(await projectNFT.getProjectMetadata(1)).to.equal(newMetadataURI);
        });

        it("Should not update metadata by unauthorized user", async function () {
            await expect(projectNFT.connect(validator).updateProjectMetadata(1, newMetadataURI))
                .to.be.revertedWith("Not authorized to update metadata");
        });
    });

    describe("Pausable", function () {
        it("Should pause and unpause by admin", async function () {
            await projectNFT.pause();
            expect(await projectNFT.paused()).to.equal(true);

            await projectNFT.unpause();
            expect(await projectNFT.paused()).to.equal(false);
        });

        it("Should not pause by non-admin", async function () {
            await expect(projectNFT.connect(user).pause())
                .to.be.revertedWith("AccessControl: account");
        });
    });

    describe("Staking", function () {
        it("Should allow staking", async function () {
            const stakeAmount = ethers.utils.parseEther("1.0");
            await expect(projectNFT.connect(user).stake({ value: stakeAmount }))
                .to.emit(projectNFT, "Staked")
                .withArgs(user.address, stakeAmount);
        });

        it("Should not allow zero stake", async function () {
            await expect(projectNFT.connect(user).stake({ value: 0 }))
                .to.be.revertedWith("Must stake some ETH");
        });
    });
}); 