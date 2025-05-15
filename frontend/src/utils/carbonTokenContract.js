import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "./contractConstants";

export class CarbonTokenContract {
  constructor(provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.CarbonToken,
      CONTRACT_ABIS.CarbonToken,
      provider
    );
  }

  async mintCarbonCredits(projectId, recipient, amount) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract
        .connect(signer)
        .mintCarbonCredits(projectId, recipient, amount);
      return await tx.wait();
    } catch (error) {
      console.error("Error minting carbon credits:", error);
      throw error;
    }
  }

  async retireCarbonCredits(amount) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract.connect(signer).retireCarbonCredits(amount);
      return await tx.wait();
    } catch (error) {
      console.error("Error retiring carbon credits:", error);
      throw error;
    }
  }

  async transferCarbonCredits(to, amount) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract.connect(signer).transferCarbonCredits(to, amount);
      return await tx.wait();
    } catch (error) {
      console.error("Error transferring carbon credits:", error);
      throw error;
    }
  }

  async getBalance(address) {
    try {
      return await this.contract.balanceOf(address);
    } catch (error) {
      console.error("Error getting balance:", error);
      throw error;
    }
  }

  async getProjectMintedStatus(projectId) {
    try {
      return await this.contract.getProjectMintedStatus(projectId);
    } catch (error) {
      console.error("Error getting project minted status:", error);
      throw error;
    }
  }

  async getProjectTotalMinted(projectId) {
    try {
      return await this.contract.getProjectTotalMinted(projectId);
    } catch (error) {
      console.error("Error getting project total minted:", error);
      throw error;
    }
  }
} 