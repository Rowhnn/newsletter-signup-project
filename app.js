const express = require("express");
const https = require("https");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// --- Environment Variables ---
const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
const listId = process.env.MAILCHIMP_LIST_ID;

if (!mailchimpApiKey) {
  throw new Error("MAILCHIMP_API_KEY is missing. Set it in Railway Variables.");
}
if (!listId) {
  throw new Error("MAILCHIMP_LIST_ID is missing. Set it in Railway Variables.");
}

// Mailchimp data center (e.g., 'us21')
const dc = mailchimpApiKey.split("-")[1];
if (!dc) {
  throw new Error(
    "Mailchimp API key missing data center suffix (e.g., -us21)."
  );
}

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // serves favicon, css, html, etc.

// --- Routes ---
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
});

app.post("/", (req, res) => {
  const { fname: firstName, lname: lastName, email } = req.body;

  const data = {
    members: [
      {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
    ],
  };

  const jsonData = JSON.stringify(data);
  const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}`;
  const options = {
    method: "POST",
    auth: `anystring:${mailchimpApiKey}`,
  };

  const request = https.request(url, options, (response) => {
    if (response.statusCode === 200) {
      res.sendFile(__dirname + "/public/success.html");
    } else {
      res.sendFile(__dirname + "/public/failure.html");
    }

    response.on("data", (data) => {
      console.log("Mailchimp API Response:", data.toString());
    });
  });

  request.on("error", (err) => {
    console.error("Request Error:", err);
    res.sendFile(__dirname + "/public/failure.html");
  });

  request.write(jsonData);
  request.end();
});

// Route for "Try Again" button on failure.html
app.post("/failure", (req, res) => {
  res.redirect("/");
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
