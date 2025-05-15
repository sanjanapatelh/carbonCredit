import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contractConstants';

export class ProjectNFTContract {
  constructor(provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESSES.ProjectNFT,
      CONTRACT_ABIS.ProjectNFT,
      provider
    );
  }

  async registerProject(to, metadataURI) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract
        .connect(signer)
        .registerProject(to, metadataURI);
      return await tx.wait();
    } catch (error) {
      console.error('Error registering project:', error);
      throw error;
    }
  }

  async updateProjectMetadata(projectId, newMetadataURI) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract
        .connect(signer)
        .updateProjectMetadata(projectId, newMetadataURI);
      return await tx.wait();
    } catch (error) {
      console.error('Error updating project metadata:', error);
      throw error;
    }
  }

  async verifyProject(projectId) {
    try {
      const signer = this.provider.getSigner();
      const tx = await this.contract
        .connect(signer)
        .verifyProjectStatus(projectId);
      return await tx.wait();
    } catch (error) {
      console.error('Error verifying project:', error);
      throw error;
    }
  }

  async getProjectStatus(projectId) {
    try {
      return await this.contract.getProjectStatus(projectId);
    } catch (error) {
      console.error('Error getting project status:', error);
      throw error;
    }
  }

  async getProjectMetadata(projectId) {
    try {
      return await this.contract.getProjectMetadata(projectId);
    } catch (error) {
      console.error('Error getting project metadata:', error);
      throw error;
    }
  }
} 