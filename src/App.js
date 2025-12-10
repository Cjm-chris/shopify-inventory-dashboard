const axios = require('axios');

module.exports = async (req, res) => {
  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Missing Shopify credentials' });
  }

  try {
    const shopifyAPI = axios.create({
      baseURL: `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}`,
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    // Fetch only active products
    const productsResponse = await shopifyAPI.get('/products.json', {
      params: { 
        limit: 250,
        status: 'active'
      }
    });

    // Fetch orders for sales data
    const ordersResponse = await shopifyAPI.get('/orders.json', {
      params: { 
        limit: 250,
        status: 'any',
        created_at_min: '2023-01-01'
      }
    });

    // Filter to ensure only active products (double check)
    const products = productsResponse.data.products
      .filter(p => p.status === 'active');
    
    const orders = ordersResponse.data.orders;

    // Calculate low stock items (only from active, physical products)
    const lowStockItems = products
      .map(p => {
        const variant = p.variants[0];
        return {
          sku: variant?.sku || variant?.barcode || p.id?.toString() || 'N/A',
          name: p.title,
          current: variant?.inventory_quantity || 0,
          minimum: 50,
          deficit: Math.max(0, 50 - (variant?.inventory_quantity || 0)),
          status: p.status
        };
      })
      .filter(item => item.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);

    // Calculate quarterly predictions based on actual sales (only for active, physical products)
    const predictions = products
      .filter(p => productSalesData[p.id]) // Only include products with sales history
      .slice(0, 20)
      .map(product => {
        const variant = product.variants[0];
        const avgMonthlySales = productSalesData[product.id] || 0;
        const safetyBuffer = 1.2; // 20% safety buffer
        
        // Calculate quarterly targets (3 months per quarter)
        const baseQuarterlySales = avgMonthlySales * 3;
        
        return {
          sku: variant?.sku || variant?.barcode || product.id?.toString() || 'N/A',
          product: product.title,
          currentStock: variant?.inventory_quantity || 0,
          q1Target: Math.round(baseQuarterlySales * safetyBuffer),
          q2Target: Math.round(baseQuarterlySales * safetyBuffer * 1.1), // 10% seasonal increase
          q3Target: Math.round(baseQuarterlySales * safetyBuffer * 1.05),
          q4Target: Math.round(baseQuarterlySales * safetyBuffer * 1.3), // Holiday season
          avgMonthlySales: avgMonthlySales,
          status: product.status
        };
      })
      .filter(p => p.avgMonthlySales > 0); // Only show products that actually sell

    res.json({
      lowStockItems,
      predictions,
      totalProducts: products.length,
      totalOrders: orders.length,
      productsFiltered: 'active'
    });

  } catch (error) {
    console.error('Shopify API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Shopify data',
      details: error.message 
    });
  }
};