import React, { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const STATUS_LABELS = ["Pending", "Approved", "Rejected"];

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(providerOrSigner) {
  return new Contract(CONTRACT_ADDRESS, ABI, providerOrSigner);
}

export default function AdminPage() {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokeAddr, setRevokeAddr] = useState("");
  const [revoking, setRevoking] = useState(false);

  // 1) connect & check admin
  useEffect(() => {
    const init = async () => {
      try {
        const prov = getProvider();
        if (!prov) throw new Error("Install MetaMask");
        const [addr] = await prov.send("eth_requestAccounts", []);
        setAccount(addr);

        const ctr = getContract(prov);
        const u = await ctr.users(addr);
        if (!u.isAdmin) throw new Error("Not an admin");
        setIsAdmin(true);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2) load pending seller requests
  const load = useCallback(async () => {
    try {
      const prov = getProvider();
      const ctr = getContract(prov);
      const cnt = Number(await ctr.getSellerRequestCount());
      console.log(cnt);
      const arr = [];
      for (let i = 1; i <= cnt; i++) {
        const r = await ctr.getSellerRequest(i);
        console.log(r);
        if (Number(r.status) === 0) {
          // only show pending
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
    if (isAdmin) load();
  }, [isAdmin, load]);

  // 3) process one request
  const act = useCallback(
    async (id, approve) => {
      try {
        setLoading(true);
        const prov = getProvider();
        const signer = await prov.getSigner();
        const ctr = getContract(signer);
        await (await ctr.processSellerRequest(id, approve)).wait();
        await load();
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    },
    [load]
  );

  const handleRevokeSeller = useCallback(async () => {
    if (!revokeAddr) {
      setError("Enter an address to revoke");
      return;
    }
    setRevoking(true);
    try {
      const prov = getProvider();
      if (!prov) throw new Error("Install MetaMask");
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      const ctr = getContract(signer);
      await (await ctr.setSellerStatus(revokeAddr, false)).wait();
      setError(`Seller rights revoked for ${revokeAddr}`);
      setRevokeAddr("");
      // optionally reload pending requests
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRevoking(false);
    }
  }, [revokeAddr, load]);

  if (loading) return <p className="mt-8 text-center">Loading…</p>;
  if (error) return <p className="mt-8 text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6 bg-gray shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">
        Seller Verification Requests
      </h2>
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
        <h3 className="text-xl font-semibold mb-2">Revoke Seller Status</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="0xUserAddress"
            value={revokeAddr}
            onChange={(e) => setRevokeAddr(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleRevokeSeller}
            disabled={revoking}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
          >
            {revoking ? "Revoking…" : "Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}
