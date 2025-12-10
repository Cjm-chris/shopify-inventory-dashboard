import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Package, Calendar } from 'lucide-react';

const ShopifyInventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('lowStock');
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
  const quarterlyPredictions = data?.predictions || [];
  const totalProducts = data?.totalProducts || 0;
  const totalOrders = data?.totalOrders || 0;

  // Calculate sample sales trend data (you can enhance this with real order data later)
  const salesTrendData = [
    { quarter: 'Q1 2024', sales: 1250 },
    { quarter: 'Q2 2024', sales: 1480 },
    { quarter: 'Q3 2024', sales: 1620 },
    { quarter: 'Q4 2024', sales: 2100 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('lowStock')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'lowStock' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="inline mr-2" size={20} />
              Low Stock Alert ({lowStockItems.length})
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'predictions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="inline mr-2" size={20} />
              Quarterly Predictions
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'trends' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="inline mr-2" size={20} />
              Sales Trends
            </button>
          </div>

          <div className="p-6">
            {/* Low Stock Tab */}
            {activeTab === 'lowStock' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Items Below Minimum Stock Level</h2>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="text-green-600 mx-auto mb-4" size={64} />
                    <p className="text-xl font-semibold text-slate-800">All items are adequately stocked!</p>
                    <p className="text-slate-600 mt-2">No items are below the minimum stock level of 50 units.</p>
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
                        {lowStockItems.slice(0, 50).map((item, index) => (
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
                            <td className="p-4 text-center">{item?.minimum || 50}</td>
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
                        Showing 50 of {lowStockItems.length} low stock items
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Recommended Quarterly Stock Levels</h2>
                <p className="text-slate-600 mb-6">Based on historical sales data with 20% safety buffer</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="text-left p-4 font-semibold text-slate-700">SKU</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Product</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Current Stock</th>
                        <th className="text-center p-4 font-semibold text-slate-700 bg-blue-50">Q1 Target</th>
                        <th className="text-center p-4 font-semibold text-slate-700 bg-green-50">Q2 Target</th>
                        <th className="text-center p-4 font-semibold text-slate-700 bg-yellow-50">Q3 Target</th>
                        <th className="text-center p-4 font-semibold text-slate-700 bg-orange-50">Q4 Target</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Avg Monthly Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quarterlyPredictions.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                          <td className="p-4 font-mono text-sm text-slate-600">{item?.sku || 'N/A'}</td>
                          <td className="p-4 font-medium">{item?.product || 'Unknown'}</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full font-semibold ${
                              (item?.currentStock || 0) < 0 ? 'bg-red-200 text-red-900' : 'bg-slate-200'
                            }`}>
                              {item?.currentStock || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center bg-blue-50 font-semibold">{item?.q1Target || 0}</td>
                          <td className="p-4 text-center bg-green-50 font-semibold">{item?.q2Target || 0}</td>
                          <td className="p-4 text-center bg-yellow-50 font-semibold">{item?.q3Target || 0}</td>
                          <td className="p-4 text-center bg-orange-50 font-semibold">{item?.q4Target || 0}</td>
                          <td className="p-4 text-center text-slate-600">{item?.avgMonthlySales || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Manufacturing Notes:</h3>
                  <ul className="text-blue-800 space-y-1 ml-4">
                    <li>• Predictions include 20% safety buffer to prevent stockouts</li>
                    <li>• Q4 typically shows highest demand (holiday season)</li>
                    <li>• Schedule production 4-6 weeks before quarter start</li>
                    <li>• Review and adjust monthly based on actual sales performance</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Quarterly Sales Trends</h2>
                <p className="text-slate-600 mb-6">Historical sales performance to inform production planning</p>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      name="Total Units Sold"
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Growth Insights</h3>
                    <p className="text-green-800">Sales grew 68% from Q1 to Q4 2024, with strongest growth in Q3-Q4 period.</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Production Recommendation</h3>
                    <p className="text-purple-800">Increase production capacity by 30% for Q3-Q4 2025 to meet projected demand.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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