const pageToken = "EAAYtJasOqbUBR4m0N1wdMWLqGzwZAVDlqOLJlrlKZCnGN3GiIA7ZCeCbNCkRW4hBWlyMWrPofl0vtfvS0BEuiCh0sxBHhOxD1yhwrLlCzaZBKEkVyYGdRSJYsNGJ5CN5RYzdZCdxIwp33qEG6eQTZBoRzwMbgfEaP7MdjJxuufkU6jW9uP5t3cxxiVOB6u0neKCWUO";
const pageId = "1156746024190311";

async function checkForms() {
  console.log(`=== CHECKING LEAD GEN FORMS FOR PAGE: ${pageId} ===`);
  try {
    const url = `https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?fields=id,name,status,created_time,questions&access_token=${encodeURIComponent(pageToken)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok) {
      if (data.data && data.data.length > 0) {
        console.log(`Found ${data.data.length} form(s):`);
        data.data.forEach(form => {
          console.log(`\n- Form Name: "${form.name}"`);
          console.log(`  Form ID:   ${form.id}`);
          console.log(`  Status:    ${form.status}`);
          console.log(`  Created:   ${form.created_time}`);
          console.log(`  Questions:`);
          if (form.questions && form.questions.length > 0) {
            form.questions.forEach(q => {
              console.log(`    * [${q.type}] ${q.key}: "${q.label}"`);
            });
          } else {
            console.log("    (No questions found)");
          }
        });
      } else {
        console.log("No lead gen forms found on this page. Please create a form in the Meta Business Suite first.");
      }
    } else {
      console.log("Error querying leadgen forms:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Request failed:", error.message);
  }
}

checkForms();
