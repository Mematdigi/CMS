const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      envConfig[key] = value;
    }
  });
}

const token = envConfig.META_PAGE_ACCESS_TOKEN;

async function printPageTokens() {
  try {
    const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=name,id,access_token&access_token=${encodeURIComponent(token)}`;
    const accountsRes = await fetch(accountsUrl);
    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      if (accountsData.data && accountsData.data.length > 0) {
        console.log("=== FULL PAGE ACCESS TOKENS ===");
        accountsData.data.forEach(page => {
          console.log(`\nPage Name: ${page.name}`);
          console.log(`Page ID:   ${page.id}`);
          console.log(`Token:     ${page.access_token}`);
        });
      } else {
        console.log("No pages found or token is not a user token.");
      }
    } else {
      console.log("Error fetching accounts:", await accountsRes.text());
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

printPageTokens();
