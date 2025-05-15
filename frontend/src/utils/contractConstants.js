import ProjectNFTArtifact from "../../artifacts/contracts/ProjectNFT.sol/ProjectNFT.json";
import CarbonTokenArtifact from "../../artifacts/contracts/CarbonToken.sol/CarbonToken.json";

export const CONTRACT_ADDRESSES = {
  ProjectNFT: "YOUR_PROJECT_NFT_CONTRACT_ADDRESS",
  CarbonToken: "YOUR_CARBON_TOKEN_CONTRACT_ADDRESS"
};

// Import ABIs from your contract artifacts
export const CONTRACT_ABIS = {
  ProjectNFT: ProjectNFTArtifact.abi,
  CarbonToken: CarbonTokenArtifact.abi
}; 