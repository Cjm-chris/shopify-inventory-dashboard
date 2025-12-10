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

    // Filter out non-physical products
    const products = productsResponse.data.products.filter(p => {
      if (p.status !== 'active') return false;
      
      const productType = (p.product_type || '').toUpperCase();
      if (productType.includes('DIGITAL FILE') || productType.includes('DIGITAL') || productType.includes('DOWNLOAD')) {
        return false;
      }
      
      return true;
    });
    
    const orders = ordersResponse.data.orders;

    // Calculate sales by product
    const salesByProduct = {};
    orders.forEach(order => {
      if (order.line_items) {
        order.line_items.forEach(item => {
          const productId = item.product_id;
          if (productId) {
            if (!salesByProduct[productId]) {
              salesByProduct[productId] = 0;
            }
            salesByProduct[productId] += item.quantity;
          }
        });
      }
    });

    const monthsSinceStart = 24;
    const productSalesData = {};
    
    Object.keys(salesByProduct).forEach(productId => {
      const avgMonthlySales = Math.round(salesByProduct[productId] / monthsSinceStart);
      productSalesData[productId] = avgMonthlySales;
    });

    // Calculate low stock items
    const lowStockItems = products
      .map(p => {
        const variant = p.variants && p.variants[0];
        const avgMonthlySales = productSalesData[p.id] || 0;
        const calculatedMinimum = Math.max(avgMonthlySales * 2, 10);
        const currentStock = (variant && variant.inventory_quantity) || 0;
        
        return {
          sku: (variant && variant.sku) || p.id.toString(),
          name: p.title,
          current: currentStock,
          minimum: calculatedMinimum,
          deficit: Math.max(0, calculatedMinimum - currentStock),
          avgMonthlySales: avgMonthlySales
        };
      })
      .filter(item => item.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit);

    // Calculate predictions
    const predictions = products
      .filter(p => productSalesData[p.id])
      .slice(0, 20)
      .map(product => {
        const variant = product.variants && product.variants[0];
        const avgMonthlySales = productSalesData[product.id] || 0;
        const safetyBuffer = 1.2;
        const baseQuarterlySales = avgMonthlySales * 3;
        
        return {
          sku: (variant && variant.sku) || product.id.toString(),
          product: product.title,
          currentStock: (variant && variant.inventory_quantity) || 0,
          q1Target: Math.round(baseQuarterlySales * safetyBuffer),
          q2Target: Math.round(baseQuarterlySales * safetyBuffer * 1.1),
          q3Target: Math.round(baseQuarterlySales * safetyBuffer * 1.05),
          q4Target: Math.round(baseQuarterlySales * safetyBuffer * 1.3),
          avgMonthlySales: avgMonthlySales
        };
      })
      .filter(p => p.avgMonthlySales > 0);

    res.json({
      lowStockItems,
      predictions,
      totalProducts: products.length,
      totalOrders: orders.length
    });

  } catch (error) {
    console.error('Shopify API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Shopify data',
      details: error.message 
    });
  }
};