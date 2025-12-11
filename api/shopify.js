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

    // Calculate 6 months ago from YESTERDAY (not today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999); // End of yesterday
    
    const sixMonthsAgo = new Date(yesterday);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setHours(0, 0, 0, 0); // Start of that day
    
    console.log('Fetching orders from:', sixMonthsAgo.toISOString(), 'to', yesterday.toISOString());
    
    // Fetch orders with pagination - get at least 1000 orders
    let allOrders = [];
    let hasMoreOrders = true;
    let lastOrderId = null;
    const MIN_ORDERS = 1000;
    
    while (hasMoreOrders) {
      const params = {
        limit: 250,
        status: 'any',
        created_at_min: sixMonthsAgo.toISOString(),
        created_at_max: yesterday.toISOString()
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
      
      // Continue if we have less than MIN_ORDERS or if there are more orders in the current date range
      if (fetchedOrders.length < 250) {
        // No more orders in this batch
        if (allOrders.length < MIN_ORDERS) {
          // We need more orders - expand the date range backwards
          console.log('Only', allOrders.length, 'orders found in 6 months. Fetching older orders to reach', MIN_ORDERS);
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 3); // Go back another 3 months
          lastOrderId = null; // Reset pagination
          hasMoreOrders = true;
        } else {
          hasMoreOrders = false;
        }
      }
      
      // Safety limit to prevent infinite loops
      if (allOrders.length >= 5000) {
        console.log('Reached safety limit of 5000 orders');
        hasMoreOrders = false;
      }
    }
    
    const orders = allOrders;
    console.log('Total orders fetched:', orders.length);

    // Calculate the actual time period covered by the orders
    let oldestOrderDate = sixMonthsAgo;
    let newestOrderDate = yesterday;
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < oldestOrderDate) oldestOrderDate = orderDate;
      if (orderDate > newestOrderDate) newestOrderDate = orderDate;
    });
    
    // Calculate months between oldest and newest order
    const monthsDiff = (newestOrderDate - oldestOrderDate) / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
    const monthsSinceStart = Math.max(1, monthsDiff); // At least 1 month, keep as decimal for accuracy
    
    console.log('Date range of orders:', oldestOrderDate.toISOString(), 'to', newestOrderDate.toISOString());
    console.log('Months covered:', monthsSinceStart);

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
        
        // Calculate minimum: 1 month supply
        const calculatedMinimum = avgMonthlySales * 1;
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
      totalOrders: orders.length,
      dateRange: {
        from: oldestOrderDate.toISOString(),
        to: newestOrderDate.toISOString(),
        monthsCovered: monthsSinceStart
      }
    });

  } catch (error) {
    console.error('Shopify API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Shopify data',
      details: error.message 
    });
  }
};