const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const axios = require("axios");

admin.initializeApp();

// --- CONFIGURATION ---
// Store these in Firebase Config: firebase functions:config:set mono.secret="YOUR_SECRET" gocardless.id="ID" ...
// For now, using placeholders or process.env if you set them locally.

const MONO_SECRET_KEY = process.env.MONO_SECRET_KEY || "test_sk_bvvcz48a2h5pmlert5l1";
const GOCARDLESS_SECRET_ID = process.env.GOCARDLESS_ID || "secret_id";
const GOCARDLESS_SECRET_KEY = process.env.GOCARDLESS_KEY || "live_UwIkRBGMrlKakCNHk0CK0JqOpMeTDJo-LlCeJkWK";

// --- MONO (Africa) Integration ---

exports.exchangeTokenMono = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { code } = req.body;
    if (!code) return res.status(400).send("Missing code");

    try {
      const response = await axios.post("https://api.withmono.com/account/auth", { code }, {
        headers: { "mono-sec-key": MONO_SECRET_KEY }
      });
      res.json(response.data);
    } catch (error) {
      console.error("Mono Error:", error.response?.data || error.message);
      res.status(500).send("Failed to exchange token");
    }
  });
});

exports.fetchMonoBalance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
     // Implementation for fetching balance
     // Requires passing the Account ID stored in Frontend/Firestore
     const { accountId } = req.body;
     // ...
     res.json({ balance: 50000, currency: "XAF" }); // Mock for now until real keys
  });
});


// --- GOCARDLESS (Europe) Integration ---

exports.createRequisitionGoCardless = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
     // 1. Get Access Token
     // 2. Create Requisition
     // 3. Return Link
     res.json({ link: "https://bankaccounts.gocardless.com/..." }); // Mock
  });
});

exports.fetchGoCardlessBalance = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Fetch real balance
    res.json({ balance: 1250.50, currency: "EUR" }); // Mock
  });
});
