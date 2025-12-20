'use client';

import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import styles from './CreateListing.module.css';

interface CreateListingFormData {
  tokenId: string;
  price: string;
  expiryBlocks: string;
}

export function CreateListing() {
  const { address, isConnected } = useWallet();
  const [formData, setFormData] = useState<CreateListingFormData>({
    tokenId: '',
    price: '',
    expiryBlocks: '1000',
  });
  const [errors, setErrors] = useState<Partial<CreateListingFormData>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateListingFormData> = {};

    if (!formData.tokenId) {
      newErrors.tokenId = 'Token ID is required';
    } else if (isNaN(Number(formData.tokenId))) {
      newErrors.tokenId = 'Token ID must be a number';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.expiryBlocks) {
      newErrors.expiryBlocks = 'Expiry blocks is required';
    } else if (isNaN(Number(formData.expiryBlocks)) || Number(formData.expiryBlocks) <= 0) {
      newErrors.expiryBlocks = 'Expiry blocks must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof CreateListingFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement contract call
      // const result = await createListing(
      //   Number(formData.tokenId),
      //   Number(formData.price),
      //   Number(formData.expiryBlocks)
      // );

      setSuccess(true);
      setFormData({ tokenId: '', price: '', expiryBlocks: '1000' });

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating listing:', error);
      setErrors({ tokenId: 'Failed to create listing' });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.notConnected}>
          <p>Please connect your wallet to create a listing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Listing</h2>
        <p>List your Bitdap Pass NFT on the marketplace</p>
      </div>

      {success && (
        <div className={styles.successMessage}>
          ✓ Listing created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="tokenId">Token ID</label>
          <input
            type="number"
            id="tokenId"
            name="tokenId"
            value={formData.tokenId}
            onChange={handleChange}
            placeholder="Enter token ID"
            min="1"
            disabled={loading}
          />
          {errors.tokenId && <span className={styles.error}>{errors.tokenId}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="price">Price (STX)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Enter price in STX"
            step="0.000001"
            min="0"
            disabled={loading}
          />
          {errors.price && <span className={styles.error}>{errors.price}</span>}
          <span className={styles.hint}>Minimum price: 0.000001 STX</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="expiryBlocks">Expiry (Blocks)</label>
          <input
            type="number"
            id="expiryBlocks"
            name="expiryBlocks"
            value={formData.expiryBlocks}
            onChange={handleChange}
            placeholder="Enter expiry in blocks"
            min="1"
            disabled={loading}
          />
          {errors.expiryBlocks && (
            <span className={styles.error}>{errors.expiryBlocks}</span>
          )}
          <span className={styles.hint}>~10 minutes = 100 blocks</span>
        </div>

        <div className={styles.preview}>
          <h3>Preview</h3>
          <div className={styles.previewItem}>
            <span>Token ID:</span>
            <span>{formData.tokenId || '-'}</span>
          </div>
          <div className={styles.previewItem}>
            <span>Price:</span>
            <span>{formData.price ? `${formData.price} STX` : '-'}</span>
          </div>
          <div className={styles.previewItem}>
            <span>Expires in:</span>
            <span>{formData.expiryBlocks ? `${formData.expiryBlocks} blocks` : '-'}</span>
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Creating Listing...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
