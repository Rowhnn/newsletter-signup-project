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
app.use(express.static("public"));

// --- Ignore favicon requests ---
app.get("/favicon.ico", (req, res) => res.status(204).end());

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
    let responseData = "";
    response.on("data", (chunk) => {
      responseData += chunk;
    });
    response.on("end", () => {
      console.log("Mailchimp API Response:", responseData);
      if (response.statusCode === 200) {
        res.sendFile(__dirname + "/public/success.html");
      } else {
        console.error(
          "Mailchimp Error Status:",
          response.statusCode,
          responseData
        );
        res.sendFile(__dirname + "/public/failure.html");
      }
    });
  });

  request.on("error", (err) => {
    console.error("Request Error:", err);
    res.sendFile(__dirname + "/public/failure.html");
  });

  request.write(jsonData);
  request.end();
});

// Retry route
app.post("/failure", (req, res) => {
  res.redirect("/");
});

// --- Start Server ---
// CHANGE: Add '0.0.0.0' as host for Railway compatibility
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${port}`);
});
