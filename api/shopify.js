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

    const productsResponse = await shopifyAPI.get('/products.json', {
      params: { limit: 250 }
    });

    const ordersResponse = await shopifyAPI.get('/orders.json', {
      params: { 
        limit: 250,
        status: 'any',
        created_at_min: '2023-01-01'
      }
    });

    const products = productsResponse.data.products
.filter(p => p.status === 'active');
    const orders = ordersResponse.data.orders;

    const lowStockItems = products
      .map(p => ({
        name: p.title,
        current: p.variants[0]?.inventory_quantity || 0,
        minimum: 50,
        deficit: Math.max(0, 50 - (p.variants[0]?.inventory_quantity || 0)),
        category: p.product_type || 'Uncategorized'
      }))
      .filter(item => item.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);

    const predictions = products.slice(0, 10).map(product => ({
      product: product.title,
      currentStock: product.variants[0]?.inventory_quantity || 0,
      q1Target: 180,
      q2Target: 240,
      q3Target: 200,
      q4Target: 320,
      avgMonthlySales: 60
    }));

    res.json({
      lowStockItems,
      predictions,
      totalProducts: products.length,
      totalOrders: orders.length
    });

  } catch (error) {
    console.error('Shopify API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Shopify data',
      details: error.message 
    });
  }
};
// Updated Wed Dec 10 14:43:18 EST 2025
