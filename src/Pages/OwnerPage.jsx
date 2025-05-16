import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import abi from "../../ABI/MarketPlaceContract.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(providerOrSigner) {
  return new Contract(CONTRACT_ADDRESS, abi, providerOrSigner);
}

export default function OwnerPage() {
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokeAdmin, setRevokeAdmin] = useState("");
  const [revokingAdmin, setRevokingAdmin] = useState(false);
  // 1) connect & check owner
  useEffect(() => {
    const init = async () => {
      try {
        const prov = getProvider();
        if (!prov) throw new Error("Install MetaMask");
        const [addr] = await prov.send("eth_requestAccounts", []);
        setAccount(addr);

        const ctr = getContract(prov);
        const o = await ctr.owner();
        if (o.toLowerCase() !== addr.toLowerCase()) {
          throw new Error("Only contract owner");
        }
        setIsOwner(true);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2) load pending admin requests
  const load = useCallback(async () => {
    try {
      const prov = getProvider();
      const ctr = getContract(prov);
      const cnt = Number(await ctr.getAdminRequestCount());
      const arr = [];
      for (let i = 1; i <= cnt; i++) {
        const r = await ctr.adminRequests(i);
        if (Number(r.status) === 0) {
          arr.push({
            id: Number(r.id),
            applicant: r.applicant,
          });
        }
      }
      setRequests(arr);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) load();
  }, [isOwner, load]);

  // 3) process admin request
  const act = useCallback(
    async (id, approve) => {
      try {
        setLoading(true);
        const prov = getProvider();
        const signer = await prov.getSigner();
        const ctr = getContract(signer);
        await (await ctr.processAdminRequest(id, approve)).wait();
        await load();
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    },
    [load]
  );

  const handleRevokeAdmin = useCallback(async () => {
    if (!revokeAdmin) {
      setError("Enter an address to revoke");
      return;
    }
    setRevokingAdmin(true);
    try {
      const prov = getProvider();
      if (!prov) throw new Error("Install MetaMask");
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      const ctr = getContract(signer);
      await (await ctr.setAdminStatus(revokeAdmin, false)).wait();
      setError(`Admin rights revoked for ${revokeAdmin}`);
      setRevokeAdmin("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRevokingAdmin(false);
    }
  }, [revokeAdmin, load]);

  if (loading) return <p className="text-center mt-12 text-lg text-gray-600">Loading…</p>;
  if (error) return <p className="text-center mt-12 text-lg text-red-600 bg-red-50 py-4 rounded-md max-w-md mx-auto">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-12 mb-16 p-8 bg-white shadow-lg rounded-lg border border-indigo-100">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Admin Role Requests</h2>
      
      {requests.length === 0 ? (
        <div className="p-6 bg-gray-50 text-gray-600 rounded-md border border-gray-200 text-center">
          No pending requests.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-5 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <p className="mb-1">
                  <span className="text-indigo-700 font-semibold">Request #{r.id}</span>
                </p>
                <p className="text-gray-700 font-mono text-sm">{r.applicant}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => act(r.id, true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-md transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(r.id, false)}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-md transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-12 pt-6 border-t border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-indigo-700">Revoke Admin Status</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="0xUserAddress"
            value={revokeAdmin}
            onChange={(e) => setRevokeAdmin(e.target.value)}
            className="flex-1 border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <button
            onClick={handleRevokeAdmin}
            disabled={revokingAdmin}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revokingAdmin ? "Revoking…" : "Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}
