import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Package, Calendar } from 'lucide-react';

const ShopifyInventoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('lowStock');
  
  // Sample data - this would come from Shopify API
  const lowStockItems = [
    { name: 'Premium T-Shirt', current: 15, minimum: 50, deficit: 35, category: 'Apparel' },
    { name: 'Coffee Mug Set', current: 8, minimum: 30, deficit: 22, category: 'Home' },
    { name: 'Wireless Headphones', current: 3, minimum: 20, deficit: 17, category: 'Electronics' },
    { name: 'Yoga Mat', current: 12, minimum: 40, deficit: 28, category: 'Fitness' },
    { name: 'Water Bottle', current: 25, minimum: 60, deficit: 35, category: 'Accessories' },
  ];

  const quarterlyPredictions = [
    { 
      product: 'Premium T-Shirt',
      currentStock: 15,
      q1Target: 180,
      q2Target: 240,
      q3Target: 200,
      q4Target: 320,
      avgMonthlySales: 60
    },
    { 
      product: 'Coffee Mug Set',
      currentStock: 8,
      q1Target: 96,
      q2Target: 84,
      q3Target: 72,
      q4Target: 144,
      avgMonthlySales: 24
    },
    { 
      product: 'Wireless Headphones',
      currentStock: 3,
      q1Target: 72,
      q2Target: 60,
      q3Target: 84,
      q4Target: 108,
      avgMonthlySales: 22
    },
    { 
      product: 'Yoga Mat',
      currentStock: 12,
      q1Target: 144,
      q2Target: 168,
      q3Target: 132,
      q4Target: 120,
      avgMonthlySales: 42
    },
    { 
      product: 'Water Bottle',
      currentStock: 25,
      q1Target: 192,
      q2Target: 228,
      q3Target: 264,
      q4Target: 204,
      avgMonthlySales: 64
    },
  ];

  const salesTrendData = [
    { quarter: 'Q1 2024', sales: 1250 },
    { quarter: 'Q2 2024', sales: 1480 },
    { quarter: 'Q3 2024', sales: 1620 },
    { quarter: 'Q4 2024', sales: 2100 },
  ];

  const exportToPDF = () => {
    alert('In a production app, this would generate a PDF report for your manufacturing team');
  };

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
              <p className="text-slate-600 mt-2">Manufacturing Team Report - Generated from Shopify Data</p>
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
                <p className="text-3xl font-bold text-slate-800 mt-2">247</p>
              </div>
              <Package className="text-blue-600" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg. Growth Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">+23%</p>
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
              Low Stock Alert
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="text-left p-4 font-semibold text-slate-700">Product Name</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Category</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Current Stock</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Minimum Level</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Units Needed</th>
                        <th className="text-center p-4 font-semibold text-slate-700">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-slate-50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4">{item.category}</td>
                          <td className="p-4 text-center">
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                              {item.current}
                            </span>
                          </td>
                          <td className="p-4 text-center">{item.minimum}</td>
                          <td className="p-4 text-center">
                            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                              {item.deficit}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full font-semibold ${
                              item.deficit > 30 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                            }`}>
                              {item.deficit > 30 ? 'URGENT' : 'HIGH'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Recommended Quarterly Stock Levels</h2>
                <p className="text-slate-600 mb-6">Based on 2 years of sales data with 20% safety buffer</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
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
                          <td className="p-4 font-medium">{item.product}</td>
                          <td className="p-4 text-center">
                            <span className="bg-slate-200 px-3 py-1 rounded-full font-semibold">
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="p-4 text-center bg-blue-50 font-semibold">{item.q1Target}</td>
                          <td className="p-4 text-center bg-green-50 font-semibold">{item.q2Target}</td>
                          <td className="p-4 text-center bg-yellow-50 font-semibold">{item.q3Target}</td>
                          <td className="p-4 text-center bg-orange-50 font-semibold">{item.q4Target}</td>
                          <td className="p-4 text-center text-slate-600">{item.avgMonthlySales}</td>
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
          <p>Data synchronized from Shopify • Last updated: {new Date().toLocaleString()} • Report generated automatically</p>
        </div>
      </div>
    </div>
  );
};

export default ShopifyInventoryDashboard;
