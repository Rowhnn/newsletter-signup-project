const express = require("express");
const https = require("https");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
const listId = process.env.MAILCHIMP_LIST_ID;
if (!mailchimpApiKey) {
  throw new Error(
    "MAILCHIMP_API_KEY is missing. Set it in your cloud environment!"
  );
}
const dc = mailchimpApiKey.split("-")[1];

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/", (req, res) => {
  const firstName = req.body.fname;
  const lastName = req.body.lname;
  const email = req.body.email;

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

  const url = `https://us4.api.mailchimp.com/3.0/lists/${listId}`;
  const options = {
    method: "POST",
    auth: `anystring:${mailchimpApiKey}`,
  };

  const request = https.request(url, options, function (response) {
    if (response.statusCode === 200) {
      res.sendFile(__dirname + "/success.html");
    } else {
      res.sendFile(__dirname + "/failure.html");
    }
    response.on("data", function (data) {
      console.log("Mailchimp API:", JSON.parse(data));
    });
  });

  request.write(jsonData);
  request.end();
});

app.post("/failure", (req, res) => {
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
