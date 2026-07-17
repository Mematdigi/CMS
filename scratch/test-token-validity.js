const fs = require("fs");
const path = require("path");

// Load .env file manually
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

if (!token || token.startsWith("mock_")) {
  console.log("❌ Error: No real META_PAGE_ACCESS_TOKEN found in .env.");
  process.exit(1);
}

async function verifyToken() {
  console.log("=== VERIFYING META ACCESS TOKEN VALIDITY ===");
  console.log(`Token Prefix: ${token.substring(0, 15)}...`);
  
  // 1. Fetch token info / debug_token or /me
  // For Page Access Tokens, calling /me gives the Page info, and calling /me/accounts lists pages.
  try {
    const url = `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok) {
      console.log("✅ Token is VALID!");
      console.log(`Associated Name: "${data.name}"`);
      console.log(`ID: ${data.id}`);

      // Check pages managed if this is a user token or page list
      const accountsUrl = `https://graph.facebook.com/v20.0/me/accounts?fields=name,id,tasks,access_token&access_token=${encodeURIComponent(token)}`;
      const accountsRes = await fetch(accountsUrl);
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        console.log("\n=== MANAGED PAGES ===");
        if (accountsData.data && accountsData.data.length > 0) {
          accountsData.data.forEach(page => {
            console.log(`- Page Name: "${page.name}"`);
            console.log(`  Page ID: ${page.id}`);
            console.log(`  Tasks/Permissions: ${JSON.stringify(page.tasks || page.perms || [])}`);
            if (page.access_token) {
              console.log(`  Page Access Token: ${page.access_token.substring(0, 15)}... (Configure this as META_PAGE_ACCESS_TOKEN for production)`);
            } else {
              console.log("  Page Access Token: [NOT RETURNED - Need pages_read_engagement / pages_manage_ads permissions]");
            }
          });
        } else {
          console.log("No managed pages found for this token (or it is a Page token itself).");
        }
      } else {
        const errText = await accountsRes.text();
        console.log("\nCould not query managed accounts (this token is likely a Page Access Token directly).");
      }
    } else {
      console.log("❌ Token Verification Failed!");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Network or request error:", error.message);
  }
}

verifyToken();
