# Carbon Credit Verification System

A decentralized carbon credit verification system built on Ethereum using smart contracts. This system allows for the creation, verification, and trading of carbon credits through NFTs and ERC-20 tokens.

## Features

- **ProjectNFT**: ERC-721 contract for representing carbon projects as NFTs
  - Project registration with metadata
  - Project verification system
  - Role-based access control
  - Pausable functionality
  - Staking mechanism

- **CarbonToken**: ERC-20 contract for carbon credits
  - Minting tied to verified projects
  - Credit retirement mechanism
  - Transfer functionality
  - Role-based access control
  - Pausable functionality

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Hardhat

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd carbon-verifier
```

2. Install dependencies:
```bash
npm install
```

3. Compile the contracts:
```bash
npx hardhat compile
```

## Testing

Run the test suite:
```bash
npx hardhat test
```

## Contract Architecture

### ProjectNFT.sol
- Inherits from ERC721, AccessControl, and Pausable
- Manages carbon project NFTs
- Handles project verification status
- Stores project metadata
- Implements staking mechanism

### CarbonToken.sol
- Inherits from ERC20, AccessControl, and Pausable
- Mints tokens for verified projects
- Handles credit retirement
- Manages token transfers
- Implements staking mechanism

## Roles

- **DEFAULT_ADMIN_ROLE**: Can manage roles and pause/unpause contracts
- **VALIDATOR_ROLE**: Can verify carbon projects
- **MINTER_ROLE**: Can mint carbon credits for verified projects

## Metadata Structure

Project NFTs use the following metadata structure:
```json
{
  "name": "Project Name",
  "description": "AI-verified carbon offset project",
  "image": "ipfs://Qm...",
  "external_url": "...",
  "attributes": [
    { "trait_type": "Location", "value": "Amazon, Brazil" },
    { "trait_type": "CO2 Reduction", "value": "10,000 tons" },
    { "trait_type": "Verification Method", "value": "AI + IoT + Satellite" },
    { "trait_type": "Verification Date", "value": "2025-05-14" },
    { "trait_type": "Validator", "value": "AI Engine v2.1" }
  ]
}
```

## Security

- Uses OpenZeppelin contracts for standard implementations
- Implements role-based access control
- Includes pausable functionality for emergency situations
- Implements staking and slashing mechanisms

## License

MIT 





I'll help you build the AI-powered audit engine for carbon credit verification. Let's create a modular, cloud-based system that integrates with your existing smart contracts.


I've created a complete AI-powered audit engine for carbon credit verification. Here's a summary of the components:

1. **Core Validation Engine** (`validation_engine.py`):
   - Rule-based validation for data integrity
   - ML-based anomaly detection using Isolation Forest
   - Modular design for future upgrades
   - Comprehensive validation rules

2. **FastAPI Backend** (`api.py`):
   - REST API endpoint for project validation
   - IPFS integration for audit logs
   - Blockchain integration for project verification
   - Signature verification

3. **Web3 Bridge** (`web3_bridge.py`):
   - Smart contract interaction
   - Transaction signing and sending
   - Role verification
   - Project status checking

4. **Signature Utilities** (`signature_utils.py`):
   - Cryptographic signing of validation results
   - Signature verification
   - Deterministic data hashing

5. **Tests and Sample Data**:
   - Comprehensive test suite
   - Sample project data
   - Test cases for all validation scenarios

To run the system:

1. Install dependencies:
```bash
cd validation_engine
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run the API:
```bash
python api.py
```

4. Run tests:
```bash
pytest tests/
```

The system is designed to be:
- **Modular**: Easy to upgrade components
- **Secure**: Cryptographic signatures and IPFS storage
- **Scalable**: Cloud-ready architecture
- **Maintainable**: Comprehensive tests and documentation

Would you like me to explain any specific part in more detail or help you set up additional components?
