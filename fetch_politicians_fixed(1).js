
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client with provided credentials
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWF4cml3YXVnenJ3d2Z1Z3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTMzMDUsImV4cCI6MjA1NTI4OTMwNX0.vK_ph0SpbTFmt_qL5kBs6Rso3YcUI8Tu4ROF-JmKET0"
);

async function fetchPoliticians() {
  let { data, error } = await supabase
    .from('politicians')
    .select('*');

  if (error) {
    console.error("Error fetching politicians:", error);
    return [];
  }

  return data;
}

async function displayPoliticians() {
  const list = document.getElementById("politicianList");
  list.innerHTML = "";

  const politicians = await fetchPoliticians();
  if (politicians.length === 0) {
    list.innerHTML = "<p>No politicians found.</p>";
    return;
  }

  politicians.forEach(politician => {
    list.innerHTML += `
      <div class="politician">
        <h2 onclick="window.open('${politician.source_url}', '_blank')">
          ${politician.name} (${politician.state}) - ${politician.party}
        </h2>
        <p><strong>Donations:</strong> ${politician.donations}</p>
        <p><strong>Industry:</strong> ${politician.industry}</p>
        <p><strong>Voting Record:</strong> ${politician.vote_record}</p>
      </div>
    `;
  });
}

displayPoliticians();
