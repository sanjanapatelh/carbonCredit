// src/ethereum.js
import Web3 from "web3";
import tokenJson from "./abi/CarbonCreditToken.json";
import systemJson from "./abi/CarbonCreditSystem.json";
import { CARBON_TOKEN_ADDRESS, CARBON_SYSTEM_ADDRESS } from "./config";

let web3;
let accounts = [];

// Call this once (e.g. in App.js useEffect) before using any contracts
export async function initWeb3() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
  } else {
    web3 = new Web3("http://127.0.0.1:8545");
  }
  accounts = await web3.eth.getAccounts();
}

// Returns the current connected accounts
export function getAccounts() {
  return accounts;
}

// Lazily instantiate the token contract (only valid AFTER initWeb3())
export function tokenContract() {
  if (!web3) throw new Error("web3 not initialized, call initWeb3() first");
  return new web3.eth.Contract(tokenJson.abi, CARBON_TOKEN_ADDRESS);
}

// Lazily instantiate the system contract (only valid AFTER initWeb3())
export function systemContract() {
  if (!web3) throw new Error("web3 not initialized, call initWeb3() first");
  return new web3.eth.Contract(systemJson.abi, CARBON_SYSTEM_ADDRESS);
}
