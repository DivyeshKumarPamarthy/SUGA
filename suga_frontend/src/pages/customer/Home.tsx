import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="bg-background text-on-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 sm:px-12 lg:px-24 text-center max-w-7xl mx-auto">
        <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-6 tracking-tight leading-tight">
          Where Heritage Meets Couture
        </h1>
        <p className="font-body text-base sm:text-lg text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover certified Indian handlooms, connect with master tailors, and co-create bespoke apparel customized to your fit.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="px-8 py-3 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-md text-center"
          >
            Explore Handloom Products
          </Link>
          <Link
            to="/ateliers"
            className="px-8 py-3 border border-primary text-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary/5 transition-colors text-center"
          >
            Find Custom Ateliers
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-10 text-center">Bespoke Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">dry_cleaning</span>
            <h3 className="font-headline text-xl font-bold mb-2">Artisan Weaving</h3>
            <p className="font-body text-sm text-secondary">
              Pure Banarasi silk, Kanjeevarams, and hand-woven cotton fabrics direct from certified Indian weavers.
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">straighten</span>
            <h3 className="font-headline text-xl font-bold mb-2">Bespoke Tailoring</h3>
            <p className="font-body text-sm text-secondary">
              Book digital appointments, share measurements, and get outfits crafted by custom alteration specialists.
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-8 hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-4xl text-primary mb-4">verified</span>
            <h3 className="font-headline text-xl font-bold mb-2">Handmade Accessories</h3>
            <p className="font-body text-sm text-secondary">
              Boutique items, embroidered borders, and custom ornaments built to support local craft ecosystems.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
