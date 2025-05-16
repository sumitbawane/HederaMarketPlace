import React, { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, Contract, formatEther } from 'ethers'
import ABI from '../../ABI/MarketPlaceContract.json'
import { getPinataGatewayUrl } from '../utils/pinataService';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null
}

function getContract(providerOrSigner) {
  return new Contract(CONTRACT_ADDRESS, ABI, providerOrSigner)
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const loadProducts = useCallback(async () => {
    const provider = getProvider()
    if (!provider) {
      setError('Please install MetaMask')
      setLoading(false)
      return
    }

    try {
      // ensure wallet is connected
      await provider.send('eth_requestAccounts', [])

      const contract = getContract(provider)
      var total    = await contract.getProductCount()
      total=Number(total)
      console.log('Total products:', total)
      const items    = []

      for (let i = 1; i <= total; i++) {
        const p = await contract.products(i)
        items.push({
          id:       Number(p.id),
          name:     p.name,
          price:    p.price,
          image:    p.imageUrl
        })
      }
      setProducts(items)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  if (loading) return <p className="text-center mt-8">Loading products…</p>
  if (error)   return <p className="text-red-500 text-center mt-8">{error}</p>

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-semibold mb-6 text-center">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id}
               className="border rounded-lg overflow-hidden shadow hover:shadow-md transition">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}