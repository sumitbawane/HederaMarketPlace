import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserProvider, Contract, parseUnits } from 'ethers'
import ABI from '../../ABI/MarketPlaceContract.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null
}

function getContract(signerOrProvider) {
  return new Contract(CONTRACT_ADDRESS, ABI, signerOrProvider)
}

export default function SellerProducts() {
  // 1) Hooks always run in the same order
  const [account,  setAccount]  = useState(null)
  const [isSeller, setIsSeller] = useState(false)
  const [form,     setForm]     = useState({
    name: '', price: '', imageUrl: ''
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(null)
  const navigate = useNavigate()

  // 2) Handlers defined before any conditional returns
  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(null)
  }

  const onSubmit = useCallback(async e => {
    e.preventDefault()
    if (!form.name || !form.price || !form.imageUrl) {
      setError('All fields are required')
      return
    }
    const provider = getProvider()
    if (!provider) {
      setError('MetaMask not found')
      return
    }
    setLoading(true)
    try {
      const signer   = await provider.getSigner()
      const contract = getContract(signer)
      await (await contract.listProduct(
        form.name,
        form.imageUrl,
        parseUnits(form.price,8)
      )).wait()
      setSuccess('Product listed successfully!')
      setForm({ name: '', price: '', imageUrl: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [form])

  // 3) Check connection & role on mount
  useEffect(() => {
    const init = async () => {
      const provider = getProvider()
      if (!provider) {
        setError('Please install MetaMask')
        return
      }
      try {
        const [addr] = await provider.send('eth_requestAccounts', [])
        setAccount(addr)
        const user = await getContract(provider).users(addr)
        setIsSeller(user.isSeller)
        if (!user.isSeller) {
          navigate('/')
        }
      } catch (e) {
        setError(e.message)
      }
    }
    init()
  }, [navigate])

   if (!isSeller) {
    return <p className="text-center mt-12 text-lg text-red-600 bg-red-50 py-4 rounded-md max-w-md mx-auto">You must be a seller to list products</p>
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-16 p-8 bg-white shadow-lg rounded-lg border border-indigo-100">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">
        List a New Product
      </h2>

      {error && 
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      }
      
      {success && 
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
          {success}
        </div>
      }

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Price (HBAR)</label>
          <input
            name="price"
            value={form.price}
            onChange={onChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="e.g. 0.05"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
            className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md font-medium shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Listing…' : 'List Product'}
        </button>
      </form>
    </div>
  )

}