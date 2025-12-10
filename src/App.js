import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Package } from 'lucide-react';

const ShopifyInventoryDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, []);

  const exportToPDF = () => {
    alert('In a production app, this would generate a PDF report for your manufacturing team');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="text-blue-600 mx-auto mb-4 animate-pulse" size={64} />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Package className="text-blue-600" size={36} />
                Inventory Planning Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manufacturing Team Report - Live Shopify Data</p>
            </div>
            <button 
              onClick={exportToPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Export PDF Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{lowStockItems.length}</p>
              </div>
              <AlertTriangle className="text-red-600" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Products Tracked</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{totalProducts}</p>
              </div>
              <Package className="text-blue-600" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalOrders}</p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Items Below Minimum Stock Level</h2>
          <p className="text-slate-600 mb-6">Minimum stock calculated from 1 year of sales data (2 months supply)</p>
          
          {lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="text-green-600 mx-auto mb-4" size={64} />
              <p className="text-xl font-semibold text-slate-800">All items are adequately stocked!</p>
              <p className="text-slate-600 mt-2">No items are below the minimum stock level.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left p-4 font-semibold text-slate-700">SKU</th>
                    <th className="text-left p-4 font-semibold text-slate-700">Product Name</th>
                    <th className="text-center p-4 font-semibold text-slate-700">Current Stock</th>
                    <th className="text-center p-4 font-semibold text-slate-700">Minimum Level</th>
                    <th className="text-center p-4 font-semibold text-slate-700">Units Needed</th>
                    <th className="text-center p-4 font-semibold text-slate-700">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-mono text-sm text-slate-600">{item?.sku || 'N/A'}</td>
                      <td className="p-4 font-medium">{item?.name || 'Unknown'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          (item?.current || 0) < 0 ? 'bg-red-200 text-red-900' : 'bg-red-100 text-red-800'
                        }`}>
                          {item?.current || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">{item?.minimum || 10}</td>
                      <td className="p-4 text-center">
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                          {item?.deficit || 0}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          (item?.deficit || 0) > 50 ? 'bg-red-500 text-white' : 
                          (item?.deficit || 0) > 30 ? 'bg-orange-500 text-white' : 
                          'bg-yellow-500 text-white'
                        }`}>
                          {(item?.deficit || 0) > 50 ? 'CRITICAL' : (item?.deficit || 0) > 30 ? 'URGENT' : 'HIGH'}
                        </span>
                      </td>
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

        {/* Footer Info */}
        <div className="mt-6 bg-white rounded-lg shadow p-4 text-center text-slate-600 text-sm">
          <p>Data synchronized from Shopify • Last updated: {new Date().toLocaleString()} • {totalProducts} products tracked • {lowStockItems.length} items need restocking</p>
        </div>
      </div>
    </div>
  );
};

export default ShopifyInventoryDashboard;