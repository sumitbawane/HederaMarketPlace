import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(p) {
  return new Contract(CONTRACT_ADDRESS, ABI, p);
}

export default function Login() {
  const [account, setAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 1) Log In: connect & check registration
  const handleLogin = useCallback(async () => {
    setError(null);
    const provider = getProvider();
    if (!provider) {
      setError("MetaMask is not installed");
      return;
    }
    try {
      const [addr] = await provider.send("eth_requestAccounts", []);
      setAccount(addr);
      const user = await getContract(provider).users(addr);
      setIsRegistered(user.walletAddress.toLowerCase() !== ADDRESS_ZERO);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // 2) If logged in but not registered, allow on-chain registration
  const registerOnChain = useCallback(async () => {
    if (!account) {
      setError("Connect your wallet first");
      return;
    }
    const provider = getProvider();
    if (!provider) return;

    setIsRegistering(true);
    try {
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      await (await contract.registerUser()).wait();
      setIsRegistered(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsRegistering(false);
    }
  }, [account]);

  // 3) Once registered, redirect
  useEffect(() => {
    if (account && isRegistered) {
      navigate("/HomePage");
    }
  }, [account, isRegistered, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl border border-indigo-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">DappMarket</h1>
          <p className="text-gray-600 mt-2">Decentralized Marketplace</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Log In */}
          {!account ? (
            <button
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Connect with MetaMask
            </button>
          ) : (
            <div className="p-4 bg-indigo-50 rounded-md border border-indigo-200">
              <p className="text-gray-700 font-medium mb-1">Connected Account:</p>
              <p className="text-indigo-700 break-all">{account}</p>
            </div>
          )}

          {/* Step 2: Register if needed */}
          {account && !isRegistered && (
            <button
              onClick={registerOnChain}
              disabled={isRegistering}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegistering ? "Registering…" : "Register on Network"}
            </button>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
