import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { AlertTriangle, TrendingUp, Package } from 'lucide-react';

const ShopifyInventoryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Password protection - CHANGE THIS PASSWORD
  const CORRECT_PASSWORD = 'Manufacturing2024!';

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('authenticated', 'true');
    } else {
      alert('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Check if already authenticated in this browser session
  useEffect(() => {
    if (sessionStorage.getItem('authenticated') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  // Fetch data only when authenticated
  useEffect(() => {
    if (authenticated) {
      fetch('/api/shopify')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setData(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching Shopify data:', err);
          setError('Failed to load data');
          setLoading(false);
        });
    }
  }, [authenticated]);

  const exportToPDF = () => {
    alert('In a production app, this would generate a PDF report for your manufacturing team');
  };

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          
          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Inventory Dashboard</h2>
          <p className="text-slate-600 mb-6 text-center">Please enter the password to access the dashboard</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">Loading inventory data from Shopify...</div>
          <div className="text-slate-600 mt-2">This may take a few moments</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertTriangle className="text-red-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const lowStockItems = data?.lowStockItems || [];
  const totalProducts = data?.totalProducts || 0;
  const totalOrders = data?.totalOrders || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <Analytics />
      <div className="max-w-7xl mx-auto" style={{paddingLeft: '80px', paddingRight: '40px', paddingTop: '32px', paddingBottom: '32px'}}>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
             <h1 className="text-3xl font-bold text-slate-800">
                Stock to Assemble - CJM
              </h1>
              
            </div>
            

          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">       
          {lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="text-green-600 mx-auto mb-4" size={64} />
              <p className="text-xl font-semibold text-slate-800">All items are adequately stocked!</p>
              <p className="text-slate-600 mt-2">No items are below the minimum stock level.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{borderCollapse: 'collapse', border: '2px solid black'}} className="w-full">
                <thead>
                  <tr style={{backgroundColor: '#e2e8f0'}}>
                    <th style={{border: '1px solid black', padding: '16px', textAlign: 'center'}} className="font-semibold text-slate-800">SKU</th>
                    <th style={{border: '1px solid black', padding: '16px', textAlign: 'Left'}} className="font-semibold text-slate-800">Product Name</th>
                    <th style={{border: '1px solid black', padding: '16px', textAlign: 'center'}} className="font-semibold text-slate-800">Units Needed</th>
                    <th style={{border: '1px solid black', padding: '16px', textAlign: 'center'}} className="font-semibold text-slate-800">On Shelf</th>
                    <th style={{border: '1px solid black', padding: '16px', textAlign: 'center'}} className="font-semibold text-slate-800">Target Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'center'}} className="font-mono text-sm text-slate-600">{item?.sku || 'N/A'}</td>
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'left'}} className="font-medium">{item?.name || 'Unknown'}</td>
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'center'}}>
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                          {Math.round(item?.deficit || 0)}
                        </span>
                      </td>
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'center'}}>
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          (item?.current || 0) < 0 ? 'bg-red-200 text-red-900' : 'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(item?.current || 0)}
                        </span>
                      </td>
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'center', backgroundColor: '#eff6ff'}} className="font-semibold">
                        {Math.round(item?.avgMonthlySales || 0)}
                      </td>
                      <td style={{border: '1px solid black', padding: '16px', textAlign: 'center'}}>{Math.round(item?.minimum || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lowStockItems.length > 50 && (
                <div className="mt-4 text-center text-slate-600">
                  Showing first 50 of {lowStockItems.length} low stock items
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4 text-center text-slate-600 text-sm">
          <p>Last updated: {new Date().toLocaleString()} • {totalProducts} products tracked </p>
        </div>
      </div>
    </div>
  );
};

export default ShopifyInventoryDashboard;