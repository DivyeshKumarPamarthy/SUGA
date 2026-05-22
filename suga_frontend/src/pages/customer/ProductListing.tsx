import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  price: string;
  compare_at_price?: string;
  vendor_name: string;
  category_name: string;
  primary_image?: string;
  avg_rating: number;
  total_sold: number;
  is_customizable: boolean;
}

const ProductListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const searchQ = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '-created_at';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const [localSearch, setLocalSearch] = useState(searchQ);

  useEffect(() => {
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await api.get<any>('products/categories/');
        setCategories(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (searchQ) params.q = searchQ;
        if (categorySlug) params.category = categorySlug;
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (sort) params.sort = sort;

        const res = await api.get<any>('products/', { params });
        setProducts(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQ, categorySlug, minPrice, maxPrice, sort]);

  const updateFilters = (newParams: any) => {
    const updated = new URLSearchParams(searchParams);
    Object.keys(newParams).forEach(key => {
      const value = newParams[key];
      if (value === null || value === '') {
        updated.delete(key);
      } else {
        updated.set(key, value);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: localSearch });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setLocalSearch('');
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Category Header Banner */}
      <section className="bg-surface-container-low border-b border-outline-variant/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-headline text-4xl font-bold text-primary mb-2">
              Certified Weaves & Couture
            </h1>
            <p className="font-body text-sm text-secondary max-w-xl">
              Browse genuine sarees, custom tailored kurtas, sherwanis, and handcrafted fabric catalogs direct from India's finest artisans.
            </p>
          </div>
          {/* Quick Category Chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilters({ category: '' })}
              className={`px-4 py-2 rounded-full text-xs font-label uppercase tracking-wider font-bold transition-all ${
                !categorySlug
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface border border-outline-variant/30 text-secondary hover:bg-surface-variant/20'
              }`}
            >
              All Weaves
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateFilters({ category: cat.slug })}
                className={`px-4 py-2 rounded-full text-xs font-label uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                  categorySlug === cat.slug
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface border border-outline-variant/30 text-secondary hover:bg-surface-variant/20'
                }`}
              >
                {cat.icon && <span className="material-symbols-outlined text-sm">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Browse Layout */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 space-y-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 h-fit">
          <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
            <h2 className="font-headline text-lg font-bold text-on-surface">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-xs text-primary font-bold uppercase tracking-wider hover:underline"
            >
              Clear All
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="space-y-2">
            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">Search Catalog</label>
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-surface border border-outline-variant/30 rounded-lg pl-3 pr-10 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-secondary hover:text-primary">
                <span className="material-symbols-outlined text-sm">search</span>
              </button>
            </div>
          </form>

          {/* Sorting */}
          <div className="space-y-2">
            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sort By</label>
            <select
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="-created_at">New Arrivals</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-total_sold">Best Sellers</option>
              <option value="-avg_rating">Top Rated</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <label className="block font-body text-xs font-bold text-on-surface-variant uppercase tracking-wider">Price Range (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => updateFilters({ min_price: e.target.value })}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-body text-on-surface focus:outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => updateFilters({ max_price: e.target.value })}
                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-xs font-body text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-secondary mb-4">search_off</span>
              <h3 className="font-headline text-xl font-bold mb-1">No couture items found</h3>
              <p className="font-body text-sm text-secondary mb-6">Try adjusting your keywords or clearing filters.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group bg-surface-container-lowest border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200"
                >
                  {/* Image Holder */}
                  <div className="relative aspect-[4/5] bg-surface-variant flex items-center justify-center overflow-hidden">
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt={product.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-secondary">image</span>
                    )}
                    {product.is_customizable && (
                      <div className="absolute bottom-3 left-3 bg-primary/95 text-on-primary text-[9px] font-label font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                        Custom Fit
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="p-5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-wider text-secondary">
                      <span>{product.category_name}</span>
                      <span className="font-semibold text-primary">{product.vendor_name}</span>
                    </div>

                    <h3 className="font-headline text-base font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>

                    {/* Rating */}
                    {product.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                        <span className="material-symbols-outlined text-sm fill-yellow-600">star</span>
                        <span>{product.avg_rating}</span>
                        <span className="text-[10px] text-secondary font-normal">({product.total_sold} sold)</span>
                      </div>
                    )}

                    {/* Price and Sale */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="font-body text-sm font-bold text-on-surface">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                      {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                        <span className="font-body text-xs text-secondary line-through">
                          ₹{Number(product.compare_at_price).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
