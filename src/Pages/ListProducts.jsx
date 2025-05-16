import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract, parseEther,formatUnits, parseUnits } from 'ethers';
import ABI from '../../ABI/MarketPlaceContract.json';
import { uploadToPinata, getPinataGatewayUrl } from '../utils/pinataService';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function getProvider() {
  return window.ethereum ? new BrowserProvider(window.ethereum) : null;
}

function getContract(signerOrProvider) {
  return new Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

export default function ListProducts() {
  const [account, setAccount] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [form, setForm] = useState({
    name: '', 
    price: '', 
    imageFile: null,
    ipfsHash: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Handle form field changes
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    // Update state and create preview
    setForm({
      ...form,
      imageFile: file
    });
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload to Pinata
  const handlePinataUpload = async () => {
    if (!form.imageFile) {
      setError('Please select an image file first');
      return;
    }
    
    setUploadStatus('uploading');
    setError(null);
    
    try {
      const hash = await uploadToPinata(form.imageFile);
      setForm({
        ...form,
        ipfsHash: hash
      });
      setUploadStatus('success');
      setSuccess(`Image successfully uploaded to IPFS with hash: ${hash}`);
    } catch (err) {
      console.error('Pinata upload error:', err);
      setError(`Failed to upload: ${err.message}`);
      setUploadStatus('error');
    }
  };

  // Submit form (list product)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name || !form.price) {
      setError('Product name and price are required');
      return;
    }
    
    if (!form.ipfsHash) {
      setError('Please upload an image to IPFS first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const provider = getProvider();
      if (!provider) throw new Error('MetaMask not found');
      
      const signer = await provider.getSigner();
      const contract = getContract(signer);
      
      const tx = await contract.listProduct(
        form.name,
        form.ipfsHash,
        parseUnits(form.price,8)
      );
      
      await tx.wait();
      
      setSuccess('Product listed successfully!');
      setForm({
        name: '',
        price: '',
        imageFile: null,
        ipfsHash: ''
      });
      setImagePreview('');
    } catch (err) {
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is a seller on component mount
  useEffect(() => {
    const checkSellerStatus = async () => {
      try {
        const provider = getProvider();
        if (!provider) {
          setError('Please install MetaMask');
          return;
        }
        
        const [addr] = await provider.send('eth_requestAccounts', []);
        setAccount(addr);
        
        const contract = getContract(provider);
        const user = await contract.users(addr);
        
        setIsSeller(user.isSeller);
        if (!user.isSeller) {
          navigate('/');
        }
      } catch (err) {
        setError(`Authentication error: ${err.message}`);
      }
    };
    
    checkSellerStatus();
  }, [navigate]);

  if (!isSeller) {
    return <p className="text-center mt-8">You must be a seller to list products</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        List a New Product
      </h2>
      
      {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded mb-4">{success}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Price (ETH)</label>
          <input
            type="text"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. 0.05"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
          />
          
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-40 object-cover rounded border"
              />
              
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePinataUpload}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                  className={`px-3 py-1 rounded text-white ${
                    uploadStatus === 'success' 
                      ? 'bg-green-500' 
                      : uploadStatus === 'uploading'
                        ? 'bg-gray-400'
                        : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {uploadStatus === 'uploading' ? 'Uploading...' : 
                   uploadStatus === 'success' ? 'Uploaded ✓' : 
                   'Upload to IPFS'}
                </button>
                
                {form.ipfsHash && (
                  <span className="text-sm text-green-600 truncate max-w-[200px]">
                    Hash: {form.ipfsHash.slice(0, 10)}...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || !form.ipfsHash}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'List Product'}
        </button>
      </form>
    </div>
  );
}