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

  if (loading) return <p className="mt-8 text-center">Loading…</p>;
  if (error) return <p className="mt-8 text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Admin Role Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-600">No pending requests.</p>
      ) : (
        requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between mb-3 p-3 border rounded"
          >
            <div>
              <p>
                <strong>#{r.id}</strong> – {r.applicant}
              </p>
              <p className="text-sm text-gray-500">{r.when}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => act(r.id, true)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => act(r.id, false)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-semibold mb-2">Revoke Admin Status</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="0xUserAddress"
            value={revokeAdmin}
            onChange={(e) => setRevokeAdmin(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleRevokeAdmin}
            disabled={revokingAdmin}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
          >
            {revokingAdmin ? "Revoking…" : "Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}
