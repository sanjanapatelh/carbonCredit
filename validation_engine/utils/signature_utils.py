from eth_account import Account
import json
import hashlib
from typing import Dict
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def sign_validation_result(data: Dict) -> str:
    """
    Sign validation result data using validator's private key
    
    Args:
        data: Dictionary containing validation result
        
    Returns:
        Hex-encoded signature
    """
    try:
        # Get validator's private key
        private_key = os.getenv("VALIDATOR_PRIVATE_KEY")
        if not private_key:
            raise ValueError("Validator private key not found in environment variables")
        
        # Create deterministic string representation of data
        data_str = json.dumps(data, sort_keys=True)
        
        # Hash the data
        data_hash = hashlib.sha256(data_str.encode()).hexdigest()
        
        # Sign the hash
        signed_message = Account.sign_message(
            message=data_hash,
            private_key=private_key
        )
        
        return signed_message.signature.hex()
        
    except Exception as e:
        raise Exception(f"Error signing validation result: {str(e)}")

def verify_signature(data: Dict, signature: str) -> bool:
    """
    Verify the signature of a validation result
    
    Args:
        data: Dictionary containing validation result
        signature: Hex-encoded signature to verify
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Create deterministic string representation of data
        data_str = json.dumps(data, sort_keys=True)
        
        # Hash the data
        data_hash = hashlib.sha256(data_str.encode()).hexdigest()
        
        # Get validator's address
        validator_address = os.getenv("VALIDATOR_ADDRESS")
        if not validator_address:
            raise ValueError("Validator address not found in environment variables")
        
        # Verify signature
        return Account.recover_message(
            message=data_hash,
            signature=signature
        ) == validator_address
        
    except Exception as e:
        raise Exception(f"Error verifying signature: {str(e)}") 