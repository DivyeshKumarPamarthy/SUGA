import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-6 text-center text-on-background">
      <h1 className="font-headline text-5xl font-bold text-primary mb-4">403</h1>
      <h2 className="font-headline text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="font-body text-sm text-secondary mb-8 max-w-md">
        You do not have permissions to view this page. If you believe this is an error, please contact administration.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary text-on-primary rounded font-label text-xs uppercase tracking-widest font-bold hover:bg-primary-container transition-colors shadow-sm"
      >
        Return Home
      </Link>
    </div>
  );
};

export default Unauthorized;
