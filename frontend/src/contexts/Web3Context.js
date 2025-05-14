import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import MyContractJSON from "../contracts/MyContract.json";

export const Web3Context = createContext({ provider: null, contract: null });

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function initWeb3() {
      if (window.ethereum) {
        const prov = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setProvider(prov);

        const signer = prov.getSigner();
        const addr = process.env.REACT_APP_CONTRACT_ADDRESS;
        const ctr = new ethers.Contract(addr, MyContractJSON.abi, signer);
        setContract(ctr);
      } else {
        console.error("No injected web3 provider found");
      }
    }
    initWeb3();
  }, []);

  return (
    <Web3Context.Provider value={{ provider, contract }}>
      {children}
    </Web3Context.Provider>
  );
}
