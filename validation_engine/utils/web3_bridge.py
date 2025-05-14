from web3 import Web3
from eth_account import Account
import json
import logging
from typing import Optional
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Web3Bridge:
    def __init__(self, rpc_url: str, contract_address: str, private_key: str):
        """
        Initialize Web3 bridge with contract connection
        
        Args:
            rpc_url: Ethereum node RPC URL
            contract_address: ProjectNFT contract address
            private_key: Validator's private key for signing transactions
        """
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.contract_address = contract_address
        self.private_key = private_key
        
        # Load contract ABI
        with open('contracts/ProjectNFT.json', 'r') as f:
            contract_json = json.load(f)
            self.contract_abi = contract_json['abi']
        
        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=self.contract_abi
        )
        
        # Get validator address from private key
        self.validator_address = Account.from_key(private_key).address
        
        logger.info(f"Web3Bridge initialized for validator: {self.validator_address}")

    async def verify_project(self, project_id: int) -> str:
        """
        Call verifyProjectStatus on the smart contract
        
        Args:
            project_id: ID of the project to verify
            
        Returns:
            Transaction hash
        """
        try:
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.validator_address)
            
            # Get gas price
            gas_price = self.w3.eth.gas_price
            
            # Build transaction
            transaction = self.contract.functions.verifyProjectStatus(
                project_id
            ).build_transaction({
                'from': self.validator_address,
                'nonce': nonce,
                'gas': 200000,  # Gas limit
                'gasPrice': gas_price
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(
                transaction,
                self.private_key
            )
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt['status'] == 1:
                logger.info(f"Project {project_id} verified successfully")
                return receipt['transactionHash'].hex()
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            logger.error(f"Error verifying project: {str(e)}")
            raise

    async def get_project_status(self, project_id: int) -> str:
        """
        Get the current status of a project
        
        Args:
            project_id: ID of the project to check
            
        Returns:
            Project status as string
        """
        try:
            status = self.contract.functions.getProjectStatus(project_id).call()
            status_map = {0: "Unverified", 1: "UnderReview", 2: "Verified"}
            return status_map[status]
        except Exception as e:
            logger.error(f"Error getting project status: {str(e)}")
            raise

    async def check_validator_role(self) -> bool:
        """
        Check if the current validator has the VALIDATOR_ROLE
        
        Returns:
            True if validator has role, False otherwise
        """
        try:
            validator_role = self.contract.functions.VALIDATOR_ROLE().call()
            has_role = self.contract.functions.hasRole(
                validator_role,
                self.validator_address
            ).call()
            return has_role
        except Exception as e:
            logger.error(f"Error checking validator role: {str(e)}")
            raise 