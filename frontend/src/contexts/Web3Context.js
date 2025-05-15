import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import PropTypes from 'prop-types';
import { ProjectNFTContract } from '../utils/projectNFTContract';
import { CarbonTokenContract } from '../utils/carbonTokenContract';

const Web3Context = createContext();

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [projectNFTContract, setProjectNFTContract] = useState(null);
  const [carbonTokenContract, setCarbonTokenContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        setAccount(accounts[0]);
        setProvider(web3Provider);
        setIsConnected(true);

        // Initialize contract instances
        const projectNFT = new ProjectNFTContract(web3Provider);
        const carbonToken = new CarbonTokenContract(web3Provider);
        
        setProjectNFTContract(projectNFT);
        setCarbonTokenContract(carbonToken);
      } else {
        throw new Error('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setProjectNFTContract(null);
    setCarbonTokenContract(null);
    setIsConnected(false);
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    account,
    provider,
    projectNFTContract,
    carbonTokenContract,
    isConnected,
    connectWallet,
    disconnectWallet
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

Web3Provider.propTypes = {
  children: PropTypes.node.isRequired,
};
