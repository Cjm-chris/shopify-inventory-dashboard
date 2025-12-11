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

   // Calculate 6 months ago from today
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    console.log('Today:', new Date().toISOString());
    console.log('Fetching orders from:', sixMonthsAgo.toISOString());
    
    // Fetch orders with pagination - get up to 1000 orders
    let allOrders = [];
    let hasMoreOrders = true;
    let pageInfo = null;
    
    while (hasMoreOrders && allOrders.length < 1000) {
      const params = {
        limit: 250,
        status: 'any',
        created_at_min: sixMonthsAgo.toISOString(),
        order: 'created_at desc'
      };
      
      if (pageInfo) {
        params.page_info = pageInfo;
      }
      
      const ordersResponse = await shopifyAPI.get('/orders.json', { params });
      const fetchedOrders = ordersResponse.data.orders;
      
      if (fetchedOrders.length > 0) {
        allOrders = allOrders.concat(fetchedOrders);
        console.log('Fetched batch:', fetchedOrders.length, 'orders. Total so far:', allOrders.length);
        
        // Check for pagination link in headers
        const linkHeader = ordersResponse.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
          // Extract page_info from link header
          const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)/);
          pageInfo = nextMatch ? nextMatch[1] : null;
        } else {
          pageInfo = null;
        }
      }
      
      if (fetchedOrders.length < 250 || !pageInfo) {
        hasMoreOrders = false;
      }
    }
    
    const orders = allOrders;
    console.log('Total orders fetched:', orders.length);
    console.log('Date range:', orders.length > 0 ? 
      `${orders[orders.length - 1].created_at} to ${orders[0].created_at}` : 'No orders');

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
    let totalItemsSold = 0;
    
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
            totalItemsSold += item.quantity;
          }
        });
      }
    });
    
    console.log('Total orders processed:', totalOrdersProcessed);
    console.log('Total items sold across all products:', totalItemsSold);
    console.log('Products with sales:', Object.keys(salesByProduct).length);
    console.log('Top 5 selling products:', 
      Object.entries(salesByProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, qty]) => `Product ${id}: ${qty} units`)
    );

    // Calculate average monthly sales (6 months of data)
    const monthsOfData = 6;
    const productSalesData = {};
    
    Object.keys(salesByProduct).forEach(productId => {
      const totalSold = salesByProduct[productId];
      const avgMonthlySales = totalSold / monthsOfData;
      productSalesData[productId] = Math.round(avgMonthlySales);
      
      // Log a sample product for debugging
      if (productId === '7999121686774') {
        console.log(`Sample product ${productId}:`, {
          totalSold,
          monthsOfData,
          avgMonthlySales,
          rounded: Math.round(avgMonthlySales)
        });
      }
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