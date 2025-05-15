// src/contexts/EthereumContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
// v6 imports
import { BrowserProvider, Contract } from "ethers";
import tokenJson from "../abi/CarbonCreditToken.json";
import systemJson from "../abi/CarbonCreditSystem.json";
import { CARBON_TOKEN_ADDRESS, CARBON_SYSTEM_ADDRESS } from "../config";

const EthereumContext = createContext(null);
export function useEthereum() {
  const ctx = useContext(EthereumContext);
  if (!ctx) throw new Error("useEthereum must be used inside EthereumProvider");
  return ctx;
}

// eslint-disable-next-line react/prop-types
export function EthereumProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    async function init() {
      if (!window.ethereum) {
        console.warn("MetaMask not detected");
        return;
      }

      // 1) Wrap window.ethereum in the v6 BrowserProvider
      const ethProvider = new BrowserProvider(window.ethereum);
      setProvider(ethProvider);

      // 2) Request user accounts
      try {
        await ethProvider.send("eth_requestAccounts", []);
      } catch {
        console.error("User denied account access");
        return;
      }

      // 3) Get a Signer for transactions
      const ethSigner = await ethProvider.getSigner();
      setSigner(ethSigner);

      // 4) Get the connected address
      try {
        const addr = await ethSigner.getAddress();
        setAccount(addr);
      } catch {
        setAccount("");
      }

      // 5) Get the network chain ID
      try {
        const network = await ethProvider.getNetwork();
        setChainId(network.chainId);
      } catch {
        setChainId(null);
      }

      // 6) React to account / chain changes
      window.ethereum.on("accountsChanged", (addrs) => {
        if (addrs.length === 0) {
          setAccount("");
          setSigner(null);
        } else {
          setAccount(addrs[0]);
          // re-create signer for new address
          setSigner(ethProvider.getSigner(addrs[0]));
        }
      });
      window.ethereum.on("chainChanged", (hexChainId) => {
        setChainId(parseInt(hexChainId, 16));
      });
    }

    init();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, []);

  // 7) Instantiate your contracts with the v6 Contract class
  const tokenContract = signer ? new Contract(CARBON_TOKEN_ADDRESS, tokenJson.abi, signer) : null;

  const systemContract = signer
    ? new Contract(CARBON_SYSTEM_ADDRESS, systemJson.abi, signer)
    : null;

  return (
    <EthereumContext.Provider
      value={{ provider, signer, account, chainId, tokenContract, systemContract }}
    >
      {children}
    </EthereumContext.Provider>
  );
}
