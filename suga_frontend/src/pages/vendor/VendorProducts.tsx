import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: number;
  title: string;
  slug: string;
  price: string;
  compare_at_price?: string;
  category_name: string;
  primary_image?: string;
  avg_rating: number;
  total_sold: number;
  is_customizable: boolean;
  status: 'draft' | 'active' | 'out_of_stock' | 'archived';
}

const VendorProducts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isApproved = user?.vendor_profile?.verification_status === 'approved';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await api.get<any>('vendor/products/');
      setProducts(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error('Failed to fetch vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setDeleteLoading(id);
    try {
      await api.delete(`vendor/products/${id}/`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Could not delete product. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'archived':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-secondary/10 text-secondary border-secondary/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-headline text-sm text-primary italic">Loading studio inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">My Shop Catalog</h2>
          <p className="font-body text-sm text-secondary mt-1">
            Publish products, set custom fit specifications, and manage your inventory.
          </p>
        </div>
        {isApproved && (
          <Link
            to="/vendor/products/add"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label text-xs uppercase tracking-widest font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add New Product</span>
          </Link>
        )}
      </div>

      {/* Verification Warning Banner */}
      {!isApproved && (
        <div className="bg-error-container text-on-error-container border border-error/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm backdrop-blur-md bg-opacity-80">
          <span className="material-symbols-outlined text-error text-3xl shrink-0">warning</span>
          <div>
            <h4 className="font-headline text-lg font-bold">Verification Pending</h4>
            <p className="font-body text-sm mt-1 opacity-90">
              Your vendor account is currently pending verification. You cannot add new products or modify your catalog until your account has been reviewed and approved by the administrator.
            </p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-surface-container-low border border-dashed border-outline-variant/30 rounded-2xl p-16 text-center space-y-4 max-w-xl mx-auto">
          <span className="material-symbols-outlined text-6xl text-secondary">shopping_bag</span>
          <h3 className="font-headline text-xl font-bold text-on-surface">No products listed yet</h3>
          <p className="font-body text-xs text-secondary leading-relaxed">
            Begin showcasing your craftsmanship! Add your first custom weave, saree, suit, or boutique design to start receiving orders.
          </p>
          {isApproved && (
            <Link
              to="/vendor/products/add"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label text-xs uppercase tracking-widest font-bold transition-all shadow-sm"
            >
              <span>Create First Listing</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/10 text-xs font-label text-secondary uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Product</th>
                  <th className="py-4 px-6 font-bold">Category</th>
                  <th className="py-4 px-6 font-bold">Price</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold">Fit Consultation</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body text-sm text-on-surface">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="h-12 w-10 bg-surface-container rounded-md overflow-hidden flex-shrink-0 border border-outline-variant/20 flex items-center justify-center">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt={p.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-secondary text-sm">image</span>
                        )}
                      </div>
                      <span className="font-semibold line-clamp-1">{p.title}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-secondary">{p.category_name || 'Uncategorized'}</td>
                    <td className="py-4 px-6 font-medium">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-label font-bold uppercase tracking-wider border ${getStatusStyle(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {p.is_customizable ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Yes
                        </span>
                      ) : (
                        <span className="text-secondary text-xs">Standard Only</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/vendor/products/${p.id}/edit`)}
                          disabled={!isApproved}
                          className="p-2 text-secondary hover:text-primary hover:bg-surface-variant/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit Product"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleteLoading === p.id || !isApproved}
                          className="p-2 text-secondary hover:text-error hover:bg-error/5 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Listing"
                        >
                          {deleteLoading === p.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-error border-t-transparent"></div>
                          ) : (
                            <span className="material-symbols-outlined text-sm">delete</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
