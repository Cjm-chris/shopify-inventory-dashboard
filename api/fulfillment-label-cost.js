// api/fulfillment-label-cost.js
// Vercel serverless function
// Triggered by Shopify Flow via "Send HTTP Request" action on Fulfillment Created
//
// Flow HTTP Request setup:
//   URL: https://your-vercel-app.vercel.app/api/fulfillment-label-cost
//   Method: POST
//   Headers: Content-Type: application/json
//             x-webhook-secret: <your WEBHOOK_SECRET value>
//   Body: { "order_id": "{{order.id}}", "fulfillment_id": "{{fulfillment.id}}" }

const SHOPIFY_STORE         = process.env.SHOPIFY_STORE;          // e.g. "cjmindustries.myshopify.com"
const SHOPIFY_CLIENT_ID     = process.env.SHOPIFY_CLIENT_ID;      // From Dev Dashboard → Settings
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;  // From Dev Dashboard → Settings
const WEBHOOK_SECRET        = process.env.WEBHOOK_SECRET;         // Shared secret with Flow
const API_VERSION           = "2025-01";

// ─── Token Cache (client credentials grant — expires every 24h) ─────────────
let _token = null;
let _tokenExpiresAt = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiresAt - 60_000) return _token;

  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
      }),
    }
  );

  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);

  const { access_token, expires_in } = await response.json();
  _token = access_token;
  _tokenExpiresAt = Date.now() + expires_in * 1000;
  return _token;
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const incomingSecret = req.headers["x-webhook-secret"];
  if (incomingSecret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { order_id, fulfillment_id } = req.body;
  if (!order_id || !fulfillment_id) {
    return res.status(400).json({ error: "Missing order_id or fulfillment_id" });
  }

  const cleanOrderId       = String(order_id).replace(/\D/g, "").replace(/^.*(\d{10,})$/, "$1");
  const cleanFulfillmentId = String(fulfillment_id).replace(/\D/g, "").replace(/^.*(\d{10,})$/, "$1");

  try {
    await sleep(5000);

    const labelCost = await getShippingLabelCost(cleanOrderId, cleanFulfillmentId);
    if (labelCost === null) {
      console.log(`No label cost found for fulfillment ${cleanFulfillmentId}`);
      return res.status(200).json({ message: "No label cost found, metafield not updated" });
    }

    const existingCost = await getExistingMetafieldValue(cleanOrderId);
    const newTotal = parseFloat(existingCost || 0) + parseFloat(labelCost);
    const rounded = Math.round(newTotal * 100) / 100;

    await writeMetafield(cleanOrderId, rounded);

    console.log(`Set custom.ship_label_cost_r2 = ${rounded} on order ${cleanOrderId}`);
    return res.status(200).json({ success: true, order_id: cleanOrderId, label_cost_added: labelCost, total: rounded });

  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getShippingLabelCost(orderId, fulfillmentId) {
  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/shipping_labels.json?fulfillment_id=${fulfillmentId}`;
  const response = await shopifyFetch(url);
  const data = await response.json();

  if (!data.shipping_labels || data.shipping_labels.length === 0) {
    return await getFulfillmentReceiptCost(orderId, fulfillmentId);
  }

  const label = data.shipping_labels[0];
  return label.price ?? label.rate?.price ?? null;
}

async function getFulfillmentReceiptCost(orderId, fulfillmentId) {
  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders/${orderId}/fulfillments/${fulfillmentId}.json`;
  const response = await shopifyFetch(url);
  const data = await response.json();

  const receipt = data.fulfillment?.receipt;
  if (!receipt) return null;
  return receipt.total_charge ?? receipt.actual_rate ?? receipt.rate ?? null;
}

async function getExistingMetafieldValue(orderId) {
  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders/${orderId}/metafields.json?namespace=custom&key=ship_label_cost_r2`;
  const response = await shopifyFetch(url);
  const data = await response.json();

  const metafield = data.metafields?.[0];
  return metafield ? parseFloat(metafield.value) : null;
}

async function writeMetafield(orderId, cost) {
  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders/${orderId}/metafields.json`;

  const body = {
    metafield: {
      namespace: "custom",
      key: "ship_label_cost_r2",
      value: String(cost),
      type: "number_decimal",
    },
  };

  const response = await shopifyFetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Metafield write failed: ${err}`);
  }
  return response.json();
}

async function shopifyFetch(url, options = {}) {
  const token = await getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...(options.headers || {}),
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
