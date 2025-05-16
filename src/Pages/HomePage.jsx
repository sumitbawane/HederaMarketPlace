import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";
import { useNavigate } from "react-router-dom";
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
  const[success, setSuccess] = useState(null);
  const [requesting, setRequesting] = useState(false);

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
      },2000)
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
      },2000)
    } catch (e) {
      setError(e.message);
    } finally {
      setRequesting(false);
    }
  }, [user]);

  if (loading) return <p className="text-center mt-8">Loading…</p>;
  if (error)   return <p className="text-red-500 text-center mt-8">{error}</p>;
  if (success) return <p className="text-green-600 text-center mt-8">{success}</p>;

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-semibold mb-6 text-center">Marketplace</h1>

      {/* products grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {products.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg overflow-hidden shadow hover:shadow-md transition"
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="font-bold text-xl mb-2">{p.name}</h2>
              <p className="text-gray-700 mb-4">
                Price: {formatEther(p.price)} ETH
              </p>
              <button
                disabled={!p.available}
                className={`w-full ${
                  p.available
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                } py-2 rounded`}
              >
                {p.available ? "Buy Now" : "Sold Out"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* request buttons - only if not already seller/admin */}
      {user && (
        <div className="max-w-sm mx-auto space-y-4">
          {!user.isSeller && (
            <button
              onClick={requestSeller}
              disabled={requesting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Request Seller Status"}
            </button>
          )}
          {!user.isAdmin && (
            <button
              onClick={requestAdmin}
              disabled={requesting}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded disabled:opacity-50"
            >
              {requesting ? "Submitting…" : "Request Admin Role"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
