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
    <div className="max-w-sm mx-auto mt-12 p-6 bg-black shadow-lg rounded-lg text-center">
      <h2 className="text-2xl font-semibold mb-6 text-white">
        Login / Register
      </h2>

      {/* Step 1: Log In */}
      {!account ? (
        <button
          onClick={handleLogin}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Log In
        </button>
      ) : (
        <p className="text-green-400 mb-4 break-words">Connected: {account}</p>
      )}

      {/* Step 2: Register if needed */}
      {account && !isRegistered && (
        <button
          onClick={registerOnChain}
          disabled={isRegistering}
          className="mb-4 bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-4 rounded disabled:opacity-50"
        >
          {isRegistering ? "Registering…" : "Register on Network"}
        </button>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}
