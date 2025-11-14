Cashier API and seed
=====================

This small API uses SQLite and serves product/price data and payment methods, and accepts sales.

Files added
- `seed.sql` — schema + sample data (from your provided SQL).
- `server.js` — minimal Express server using `better-sqlite3`.
- `package.json` — required dependencies and start script.

Quick start (Windows PowerShell)

1. Open PowerShell in the project folder (where `server.js` and `package.json` are).
2. Install dependencies:

```powershell
npm install
```

3. Start the server:

```powershell
npm start
```

The server will create `cashier.db` from `seed.sql` on first run (if `cashier.db` does not already exist).

Default server URL: http://localhost:3000

Useful endpoints
- GET  /api/payment-methods  — returns an array of payment methods (falls back to ["Telebirr","Bank","Cash"]).
- GET  /api/products         — returns products with price variants.
- POST /api/sales            — record a sale. Payload example:

```json
{
  "cashierName": "Abel",
  "paymentMethod": "Telebirr",
  "items": [
    {"productId":1,"priceId":1,"priceValue":10,"quantity":2,"subtotal":20}
  ],
  "totalAmount": 20
}
```

Integration notes
- The `cashir.js` file has been updated to fetch payment methods from `/api/payment-methods` when the page loads. If you serve the static `cashir.html` from a different host/port, either enable CORS on the server (already enabled) or change `fetch` calls to the correct base URL.

Next steps (optional)
- Replace the localStorage persistence in `cashir.js` with API calls to `POST /api/sales` so sales are stored on the server.
- Add endpoints to list sales, daily summaries, and to export reports.

If you want, I can wire the front-end to record sales to the API instead of to localStorage. Just tell me to proceed.
