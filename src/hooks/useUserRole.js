import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import ABI from "../../ABI/MarketPlaceContract.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(providerOrSigner) {
  return new Contract(CONTRACT_ADDRESS, ABI, providerOrSigner);
}

export function useUserRole() {
  const [role, setRole] = useState({
    isSeller: false,
    isAdmin: false,
    isOwner: false,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const prov = getProvider();
        if (!prov) throw new Error("Install MetaMask");
        const [addr] = await prov.send("eth_requestAccounts", []);
        const ctr = getContract(prov);

        // fetch on-chain user struct
        const u = await ctr.users(addr);
        // fetch owner()
        const ownerAddr = await ctr.owner();

        setRole({
          isSeller: u.isSeller,
          isAdmin: u.isAdmin,
          isOwner: ownerAddr.toLowerCase() === addr.toLowerCase(),
          loading: false,
        });
      } catch {
        setRole((r) => ({ ...r, loading: false }));
      }
    })();
  }, []);

  return role;
}
