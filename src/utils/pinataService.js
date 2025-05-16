import axios from 'axios';

// Load environment variables (store these in .env file)
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

/**
 * Upload a file to Pinata IPFS
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The IPFS hash (CID)
 */
export const uploadToPinata = async (file) => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        application: 'blockchain-marketplace'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Set pinning options
    const pinataOptions = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', pinataOptions);
    
    // Make API request to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity', // Required for large files
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );
    
    // Return the IPFS hash (CID)
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

/**
 * Get a gateway URL for a Pinata-pinned file
 * @param {string} hash - The IPFS hash/CID
 * @returns {string} - The gateway URL
 */
export const getPinataGatewayUrl = (hash) => {
  if (!hash) return '';
  
  // Handle ipfs:// protocol
  if (hash.startsWith('ipfs://')) {
    hash = hash.split('ipfs://')[1];
  }
  
  // You can use Pinata's gateway or public gateways
  // Public gateway (free)
  return `https://gateway.ipfs.io/ipfs/${hash}`;
  
  // Pinata gateway (requires subscription for dedicated gateway)
  // return `https://gateway.pinata.cloud/ipfs/${hash}`;
};