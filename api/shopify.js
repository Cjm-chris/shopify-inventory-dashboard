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

    // Calculate 6 months ago dynamically
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    console.log('Fetching orders from:', sixMonthsAgo.toISOString());
    
    // Fetch orders with pagination
    let allOrders = [];
    let hasMoreOrders = true;
    let lastOrderId = null;
    
    while (hasMoreOrders && allOrders.length < 1000) {
      const params = {
        limit: 250,
        status: 'any',
        created_at_min: sixMonthsAgo.toISOString()
      };
      
      if (lastOrderId) {
        params.since_id = lastOrderId;
      }
      
      const ordersResponse = await shopifyAPI.get('/orders.json', { params });
      const fetchedOrders = ordersResponse.data.orders;
      
      if (fetchedOrders.length > 0) {
        allOrders = allOrders.concat(fetchedOrders);
        lastOrderId = fetchedOrders[fetchedOrders.length - 1].id;
        console.log('Fetched batch:', fetchedOrders.length, 'orders. Total so far:', allOrders.length);
      }
      
      if (fetchedOrders.length < 250) {
        hasMoreOrders = false;
      }
    }
    
    const orders = allOrders;
    console.log('Total orders fetched:', orders.length);

    // Filter out non-physical products
    const products = productsResponse.data.products.filter(p => {
      if (p.status !== 'active') return false;
      
      const productType = (p.product_type || '').toUpperCase();
      if (productType.includes('DIGITAL FILE') || productType.includes('DIGITAL') || productType.includes('DOWNLOAD')) {
        return false;
      }
      
      return true;
    });

    // Calculate sales by product
    const salesByProduct = {};
    let totalOrdersProcessed = 0;
    
    orders.forEach(order => {
      totalOrdersProcessed++;
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
    
    console.log('Total orders processed:', totalOrdersProcessed);
    console.log('Products with sales:', Object.keys(salesByProduct).length);
    console.log('Sample sales data:', Object.entries(salesByProduct).slice(0, 5));

    const monthsSinceStart = 6;
    const productSalesData = {};
    
    Object.keys(salesByProduct).forEach(productId => {
      const avgMonthlySales = Math.round(salesByProduct[productId] / monthsSinceStart);
      productSalesData[productId] = avgMonthlySales;
    });

    // Calculate low stock items and sort by SKU
    const lowStockItems = products
      .map(p => {
        const variant = p.variants && p.variants[0];
        const avgMonthlySales = productSalesData[p.id] || 0;
        
        // Calculate minimum: 2 months supply
        const calculatedMinimum = avgMonthlySales * 2;
        const currentStock = (variant && variant.inventory_quantity) || 0;
        
        return {
          sku: (variant && variant.sku) || p.id.toString(),
          name: p.title,
          current: currentStock,
          avgMonthlySales: avgMonthlySales,
          minimum: calculatedMinimum,
          deficit: Math.max(0, calculatedMinimum - currentStock)
        };
      })
      .filter(item => item.deficit > 0)
      .sort((a, b) => {
        // Sort by SKU alphabetically
        const skuA = (a.sku || '').toString().toLowerCase();
        const skuB = (b.sku || '').toString().toLowerCase();
        return skuA.localeCompare(skuB);
      });

    res.json({
      lowStockItems,
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