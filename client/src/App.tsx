import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
};

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading products</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {data?.products?.map((product: Product) => (
        <div key={product.id} className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
          <p className="text-gray-300 mb-4">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-green-400">${product.price}</span>
            <span className="text-sm text-gray-400">{product.stock} in stock</span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{product.rating} ({product.reviews} reviews)</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(data => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-center">
              Clean & Flip
            </h1>
            <p className="text-center text-gray-300 mt-2">
              Premium Weightlifting Equipment Marketplace
            </p>
            <div className="text-center mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                apiStatus === 'connected' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                API: {apiStatus}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-400">
              Discover our selection of premium weightlifting equipment
            </p>
          </div>

          <ProductList />

          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-gray-400 mb-6">
              Join thousands of fitness enthusiasts who trust Clean & Flip for their equipment needs
            </p>
            <div className="space-x-4">
              <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
                Browse All Products
              </button>
              <button className="border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-lg font-semibold transition-colors">
                Sell Your Equipment
              </button>
            </div>
          </div>
        </main>

        <footer className="bg-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-400">
              © 2025 Clean & Flip. Professional weightlifting equipment marketplace.
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;