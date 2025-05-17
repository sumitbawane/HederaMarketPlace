import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";
import { useNavigate } from "react-router-dom";
import { getPinataGatewayUrl } from "../utils/pinataService";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(p) {
  return new Contract(CONTRACT_ADDRESS, ABI, p);
}

export default function HomePage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  // 1) Connect wallet, fetch user & products
  useEffect(() => {
    const init = async () => {
      const prov = getProvider();
      if (!prov) {
        setError("Install MetaMask");
        setLoading(false);
        return;
      }

      try {
        const [addr] = await prov.send("eth_requestAccounts", []);
        setAccount(addr);

        const ctr = getContract(prov);
        const u = await ctr.users(addr);
        setUser({
          walletAddress: u.walletAddress,
          isSeller: u.isSeller,
          isAdmin: u.isAdmin,
        });

        // load products
        const count = Number(await ctr.getProductCount());
        const arr = [];
        for (let i = 1; i <= count; i++) {
          const p = await ctr.products(i);
          arr.push({
            id: Number(p.id),
            name: p.name,
            price: p.price,
            image: p.ipfsHash,
            available: p.isAvailable,
          });
        }
        setProducts(arr);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2) Request seller status
  const requestSeller = useCallback(async () => {
    if (!user) return;
    if (user.isSeller) {
      setError("You already have seller or admin privileges");
      return;
    }
    setRequesting(true);
    try {
      const signer = await getProvider().getSigner();
      const tx = await getContract(signer).requestSellerVerification();
      await tx.wait();
      setSuccess("Seller request submitted");
      setTimeout(() => {
        setSuccess(null);
        navigate("/HomePage");
      }, 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting(false);
    }
  }, [user]);

  // 3) Request admin role
  const requestAdmin = useCallback(async () => {
    if (!user) return;
    if (user.isAdmin) {
      setError("You already have admin privileges");
      return;
    }
    setRequesting(true);
    try {
      const signer = await getProvider().getSigner();
      const tx = await getContract(signer).requestAdminRole();
      await tx.wait();
      setSuccess("Seller request submitted");
      setTimeout(() => {
        setSuccess(null);
        navigate("/HomePage");
      }, 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting(false);
    }
  }, [user]);

  const handleBuy = useCallback(async (id, price) => {
    setError(null);
    setSuccess(null);
    setPurchasing(true);
    try {
      const signer = await getProvider().getSigner();
      const ctr = getContract(signer);
      const tx = await ctr.buyProduct(id, { value: price });
      await tx.wait();
      setSuccess("Purchase successful!");
      // reload products after a moment
      setTimeout(() => {
        setSuccess(null);
        navigate("/HomePage");
      }, 2000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => {
        setError(null);
        navigate("/HomePage");
      }, 2000);
    } finally {
      setPurchasing(false);
    }
  }, []);

  if (loading)
    return <p className="text-center mt-12 text-lg text-gray-600">Loading…</p>;
  if (error)
    return (
      <p className="text-center mt-12 text-lg text-red-600 bg-red-50 py-4 rounded-md max-w-md mx-auto">
      seller cannot buy own product
      </p>
    );
  if (success)
    return (
      <p className="text-center mt-12 text-lg text-green-600 bg-green-50 py-4 rounded-md max-w-md mx-auto">
        {success}
      </p>
    );

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-indigo-700 mb-4">Marketplace</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse and purchase products securely on the blockchain
        </p>
      </div>

      {/* products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <img
              src={getPinataGatewayUrl(p.image)}
              alt={p.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-5">
              <h2 className="font-bold text-xl text-gray-800 mb-3">{p.name}</h2>
              <p className="text-indigo-600 font-semibold mb-4">
                {formatUnits(p.price, 8)} HBAR
              </p>
              <button
                onClick={() =>
                  handleBuy(p.id, parseUnits(formatUnits(p.price, 8)))
                }
                disabled={!p.available}
                className={`w-full ${
                  p.available
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } py-2 rounded-md font-medium transition-colors duration-300`}
              >
                {p.available ? "Buy Now" : "Sold Out"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* request buttons - only if not already seller/admin */}
      {user && (
        <div className="max-w-md mx-auto space-y-4 mt-12 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Account Options
          </h3>
          {!user.isSeller && (
            <button
              onClick={requestSeller}
              disabled={requesting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-md font-medium shadow transition-all duration-200 disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Request Seller Status"}
            </button>
          )}
          {!user.isAdmin && (
            <button
              onClick={requestAdmin}
              disabled={requesting}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white py-3 rounded-md font-medium shadow transition-all duration-200 disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Request Admin Role"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
