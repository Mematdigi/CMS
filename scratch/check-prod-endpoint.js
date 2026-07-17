async function checkProd() {
  const url = "https://crm.mematdigi.com/api/meta/webhook?hub.mode=subscribe&hub.verify_token=memat_leads_2026_secure&hub.challenge=test_challenge";
  console.log(`Sending GET request to production URL: ${url}`);
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log(`Response Status: ${res.status}`);
    console.log(`Response Body: "${body}"`);
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

checkProd();
