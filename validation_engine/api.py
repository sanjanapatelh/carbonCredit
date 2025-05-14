from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from datetime import datetime
import json
import logging
from web3 import Web3
from eth_account import Account
import ipfshttpclient
import os
from dotenv import load_dotenv

from engine.validation_engine import ValidationEngine
from utils.signature_utils import sign_validation_result
from utils.web3_bridge import Web3Bridge

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Carbon Credit Validation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
validation_engine = ValidationEngine()
web3_bridge = Web3Bridge(
    rpc_url=os.getenv("ETHEREUM_RPC_URL"),
    contract_address=os.getenv("PROJECT_NFT_CONTRACT_ADDRESS"),
    private_key=os.getenv("VALIDATOR_PRIVATE_KEY")
)

# Initialize IPFS client
ipfs_client = ipfshttpclient.connect(os.getenv("IPFS_API_URL", "/ip4/127.0.0.1/tcp/5001"))

class ProjectData(BaseModel):
    tokenId: int
    estimated_emission_reduction: float
    project_start_date: str
    project_end_date: str
    location: Dict[str, float]
    data_sources: List[str]
    additional_data: Optional[Dict] = None

class ValidationResponse(BaseModel):
    projectId: int
    status: str
    reason: str
    signature: str
    ipfsHash: str
    timestamp: str

@app.post("/validate-project", response_model=ValidationResponse)
async def validate_project(project_data: ProjectData):
    """
    Validate a carbon project and update blockchain if valid
    """
    try:
        # Convert Pydantic model to dict
        data_dict = project_data.dict()
        
        # Perform validation
        is_valid, reason, validation_details = validation_engine.validate_project(data_dict)
        
        # Prepare response data
        response_data = {
            "projectId": project_data.tokenId,
            "status": "VERIFIED" if is_valid else "REJECTED",
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat(),
            "validation_details": validation_details
        }
        
        # Store validation result in IPFS
        ipfs_hash = await store_in_ipfs(response_data)
        
        # Sign the validation result
        signature = sign_validation_result(response_data)
        
        # If valid, update blockchain
        if is_valid:
            try:
                tx_hash = await web3_bridge.verify_project(project_data.tokenId)
                response_data["tx_hash"] = tx_hash
            except Exception as e:
                logger.error(f"Blockchain update failed: {str(e)}")
                raise HTTPException(status_code=500, detail="Blockchain update failed")
        
        return ValidationResponse(
            projectId=project_data.tokenId,
            status=response_data["status"],
            reason=reason,
            signature=signature,
            ipfsHash=ipfs_hash,
            timestamp=response_data["timestamp"]
        )
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def store_in_ipfs(data: Dict) -> str:
    """Store validation data in IPFS"""
    try:
        # Convert data to JSON string
        json_data = json.dumps(data)
        
        # Add to IPFS
        result = ipfs_client.add_json(json_data)
        return result
        
    except Exception as e:
        logger.error(f"IPFS storage error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store data in IPFS")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True) 