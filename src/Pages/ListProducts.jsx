import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowserProvider, Contract, parseEther } from 'ethers'
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
        parseEther(form.price)
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

  // 4) Early return for non-sellers
  if (!isSeller) {
    return <p className="text-center mt-8">You must be a seller to list products</p>
  }

  // 5) Render form for sellers
  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        List a New Product
      </h2>

      {error   && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-600 mb-2">{success}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Price (ETH)</label>
          <input
            name="price"
            value={form.price}
            onChange={onChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="e.g. 0.05"
          />
        </div>

        <div>
          <label className="block mb-1">Image URL</label>
          <input
            name="imageUrl"
            value={form.imageUrl}
            onChange={onChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Listing…' : 'List Product'}
        </button>
      </form>
    </div>
  )
}