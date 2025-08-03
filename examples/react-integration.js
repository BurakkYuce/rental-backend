// examples/react-integration.js - React Frontend Integration Examples

// ====================================
// 1. API SERVICE SETUP
// ====================================

// services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Base axios configuration
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====================================
// 2. LISTING API FUNCTIONS
// ====================================

// services/listingService.js
export const listingService = {
  // Get all listings with filters
  getListings: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/listings?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  // Get single listing
  getListing: async (id) => {
    try {
      const response = await api.get(`/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  },

  // Create new listing with images
  createListing: async (listingData, images) => {
    try {
      const formData = new FormData();
      
      // Add listing data
      Object.entries(listingData).forEach(([key, value]) => {
        if (key === 'pricing' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'keywords' && Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value);
        }
      });

      // Add images
      if (images.main) {
        formData.append('mainImage', images.main);
      }
      
      if (images.gallery && images.gallery.length > 0) {
        images.gallery.forEach((file) => {
          formData.append('galleryImages', file);
        });
      }

      const response = await api.post('/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  // Update existing listing
  updateListing: async (id, listingData, newImages = {}) => {
    try {
      const formData = new FormData();
      
      Object.entries(listingData).forEach(([key, value]) => {
        if (key === 'pricing' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'keywords' && Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value);
        }
      });

      // Add new images if provided
      if (newImages.main) {
        formData.append('mainImage', newImages.main);
      }
      
      if (newImages.gallery && newImages.gallery.length > 0) {
        newImages.gallery.forEach((file) => {
          formData.append('galleryImages', file);
        });
      }

      const response = await api.put(`/listings/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  // Delete listing
  deleteListing: async (id) => {
    try {
      const response = await api.delete(`/listings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  // Get filter options
  getFilters: async () => {
    try {
      const response = await api.get('/listings/filters');
      return response.data;
    } catch (error) {
      console.error('Error fetching filters:', error);
      throw error;
    }
  }
};

// ====================================
// 3. IMAGE UPLOAD SERVICE
// ====================================

// services/imageService.js
export const imageService = {
  // Upload single image
  uploadSingle: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Upload multiple images
  uploadMultiple: async (files) => {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  // Delete image
  deleteImage: async (publicId) => {
    try {
      const response = await api.delete('/upload/delete', {
        data: { publicId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
};

// ====================================
// 4. REACT HOOKS FOR LISTINGS
// ====================================

// hooks/useListings.js
import { useState, useEffect } from 'react';

export const useListings = (initialFilters = {}) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchListings = async (newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const combinedFilters = { ...filters, ...newFilters };
      const response = await listingService.getListings(combinedFilters);
      
      setListings(response.data.listings);
      setPagination(response.data.pagination);
      setFilters(combinedFilters);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return {
    listings,
    loading,
    error,
    pagination,
    filters,
    fetchListings,
    setFilters
  };
};

// hooks/useListing.js
export const useListing = (id) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await listingService.getListing(id);
        setListing(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  return { listing, loading, error, refetch: () => fetchListing() };
};

// ====================================
// 5. REACT COMPONENTS EXAMPLES
// ====================================

// components/ListingCard.jsx
import React from 'react';

export const ListingCard = ({ listing }) => {
  const mainImage = listing.images?.main?.url || '/placeholder-car.jpg';
  const formattedPrice = listing.pricing ? 
    `₺${listing.pricing.daily}/${listing.pricing.currency === 'TRY' ? 'gün' : 'day'}` : 
    'Price on request';

  return (
    <div className="listing-card">
      <div className="image-container">
        <img src={mainImage} alt={listing.title} />
        {listing.featured && <span className="featured-badge">Featured</span>}
      </div>
      
      <div className="content">
        <h3>{listing.title}</h3>
        <p className="brand-model">{listing.brand} {listing.model} ({listing.year})</p>
        <p className="category">{listing.category}</p>
        
        <div className="specs">
          <span>{listing.transmission}</span>
          <span>{listing.fuelType}</span>
          <span>{listing.seats} seats</span>
        </div>
        
        <div className="footer">
          <span className="price">{formattedPrice}</span>
          <button className="view-details">View Details</button>
        </div>
      </div>
    </div>
  );
};

// components/ListingForm.jsx
import React, { useState } from 'react';

export const ListingForm = ({ initialData = {}, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Ekonomik',
    fuelType: 'Benzin',
    transmission: 'Manuel',
    bodyType: 'Sedan',
    seats: 5,
    doors: 4,
    description: '',
    pricing: {
      daily: 0,
      currency: 'TRY'
    },
    totalUnits: 1,
    availableUnits: 1,
    minDriverAge: 21,
    minLicenseYear: 1,
    ...initialData
  });

  const [images, setImages] = useState({
    main: null,
    gallery: []
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value
      }));
    }
  };

  const handleImageChange = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'main') {
      setImages(prev => ({ ...prev, main: files[0] }));
    } else {
      setImages(prev => ({ ...prev, gallery: files }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, images);
  };

  return (
    <form onSubmit={handleSubmit} className="listing-form">
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Brand *</label>
          <select name="brand" value={formData.brand} onChange={handleInputChange} required>
            <option value="">Select Brand</option>
            <option value="BMW">BMW</option>
            <option value="Mercedes-Benz">Mercedes-Benz</option>
            <option value="Audi">Audi</option>
            <option value="Toyota">Toyota</option>
            <option value="Honda">Honda</option>
            {/* Add more brands */}
          </select>
        </div>

        <div className="form-group">
          <label>Model *</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Year *</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            min="1980"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Daily Price (₺) *</label>
        <input
          type="number"
          name="pricing.daily"
          value={formData.pricing.daily}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label>Main Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, 'main')}
        />
      </div>

      <div className="form-group">
        <label>Gallery Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageChange(e, 'gallery')}
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={5}
        />
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Saving...' : 'Save Listing'}
      </button>
    </form>
  );
};

// ====================================
// 6. USAGE EXAMPLES IN COMPONENTS
// ====================================

// pages/ListingsPage.jsx
import React from 'react';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/ListingCard';

export const ListingsPage = () => {
  const { listings, loading, error, pagination, fetchListings } = useListings();

  const handleFilterChange = (newFilters) => {
    fetchListings({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    fetchListings({ page });
  };

  if (loading) return <div>Loading listings...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="listings-page">
      <h1>Car Listings</h1>
      
      <div className="filters">
        {/* Filter components here */}
      </div>

      <div className="listings-grid">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {pagination && (
        <div className="pagination">
          <button 
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </button>
          
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button 
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// pages/CreateListingPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListingForm } from '../components/ListingForm';
import { listingService } from '../services/listingService';

export const CreateListingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData, images) => {
    setLoading(true);
    
    try {
      const response = await listingService.createListing(formData, images);
      console.log('Listing created:', response.data);
      
      // Redirect to listing detail page
      navigate(`/listings/${response.data.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-listing-page">
      <h1>Create New Listing</h1>
      <ListingForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
};

// ====================================
// 7. EXAMPLE CSS STYLES
// ====================================

/*
.listing-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff6b35;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.content {
  padding: 16px;
}

.specs {
  display: flex;
  gap: 12px;
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.price {
  font-weight: bold;
  color: #2c5aa0;
  font-size: 18px;
}

.view-details {
  background: #2c5aa0;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
}

.listing-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.submit-btn {
  background: #2c5aa0;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
*/