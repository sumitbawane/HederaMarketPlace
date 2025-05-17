import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatUnits } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const TX_TYPE_LABELS   = ["List", "Purchase"];

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}
function getContract(p) {
  return new Contract(CONTRACT_ADDRESS, ABI, p);
}

export default function Transactions() {
  const [account,      setAccount]      = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prov = getProvider();
      if (!prov) throw new Error("Install MetaMask");
      const [addr] = await prov.send("eth_requestAccounts", []);
      setAccount(addr.toLowerCase());

      const ctr   = getContract(prov);
      const total = Number(await ctr.getTransactionCount());
      const txs   = [];

      for (let i = 1; i <= total; i++) {
        const rec    = await ctr.getTransactionDetails(i);
        const buyer  = rec.buyer.toLowerCase();
        const seller = rec.seller.toLowerCase();
        const me     = addr.toLowerCase();
        if (buyer !== me && seller !== me) continue;

        const details = await ctr.getProductDetails(rec.productId);
        const status  = details.isAvailable ? "Available" : "Sold Out";

        txs.push({
          id:           Number(rec.id),
          txType:       TX_TYPE_LABELS[Number(rec.txType)] || `Type ${rec.txType}`,
          productId:    Number(rec.productId),
          buyer:       buyer,
          seller:     seller,
          price:        formatUnits(rec.price, 8),
          when:         new Date(Number(rec.timestamp) * 1000).toLocaleString(),
          status
        });
      }
      setTransactions(txs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  if (loading) return <div>Loading…</div>;
  if (error)   return <div className="text-red-600">{error}</div>;
  if (!transactions.length) return <div>No transactions found.</div>;

  // split into listings/sales vs purchases
  const sellingTxs  = transactions.filter(tx => tx.txType === "List");
  const purchaseTxs = transactions.filter(tx => tx.txType === "Purchase");

  return (
    <div className="max-w-6xl mx-auto mt-8 mb-16 p-8 bg-white shadow-lg rounded-lg border border-indigo-100 space-y-12">

      {/* Listings / Sales */}
      <section>
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">Your Listings / Sales</h2>
        {sellingTxs.length === 0 ? (
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded text-center">
            You haven't created any listings yet
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Txn ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Price (HBAR)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sellingTxs.map(tx => (
                  <tr key={tx.id} className="hover:bg-indigo-50 transition-colors duration-150">
                    <td className="px-4 py-3">{tx.id}</td>
                    <td className="px-4 py-3">{tx.productId}</td>
                    <td className="px-4 py-3 font-medium">{tx.status}</td>
                    <td className="px-4 py-3 text-right font-medium text-indigo-700">{tx.price}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Purchase History */}
      <section>
        <h2 className="text-3xl font-bold text-green-700 mb-4">Your Purchases</h2>
        {purchaseTxs.length === 0 ? (
          <div className="p-4 bg-green-50 text-green-600 rounded text-center">
            You haven't purchased any products yet
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-green-50 to-teal-50 text-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Txn ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Seller</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Price (HBAR)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseTxs.map(tx => (
                  <tr key={tx.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-4 py-3">{tx.id}</td>
                    <td className="px-4 py-3 font-mono">{tx.seller}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{tx.price}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tx.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 text-center">
        <button
          onClick={loadTransactions}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-md shadow"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}