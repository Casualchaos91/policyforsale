import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWF4cml3YXVnenJ3d2Z1Z3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTMzMDUsImV4cCI6MjA1NTI4OTMwNX0.vK_ph0SpbTFmt_qL5kBs6Rso3YcUI8Tu4ROF-JmKET0"
);

// Fetch politicians data
async function fetchPoliticians() {
  let { data, error } = await supabase.from('politicians').select('*');
  if (error) {
    console.error("Error fetching politicians:", error);
    return [];
  }
  return data;
}

// Fetch donations data
async function fetchDonations() {
  let { data, error } = await supabase.from('donations').select('*');
  if (error) {
    console.error("Error fetching donations:", error);
    return [];
  }
  return data;
}

// Display politicians with donation info
async function displayPoliticians() {
  const list = document.getElementById("politicianList");
  list.innerHTML = "";

  const politicians = await fetchPoliticians();
  const donations = await fetchDonations();

  if (politicians.length === 0) {
    list.innerHTML = "<p>No politicians found.</p>";
    return;
  }

  politicians.forEach(politician => {
    const relatedDonations = donations.filter(d => d.politician_id === politician.id);
    let donationHTML = relatedDonations.map(d => `
      <p><strong>${d.industry}:</strong> $${d.amount.toLocaleString()} from ${d.donor_name} (<a href='${d.source_url}' target='_blank'>source</a>)</p>
    `).join('');

    list.innerHTML += `
      <div class="politician">
        <h2 onclick="window.open('${politician.source_url}', '_blank')">
          ${politician.name} (${politician.state}) - ${politician.party}
        </h2>
        <p><strong>Donations:</strong></p>
        ${donationHTML || "<p>No recorded donations.</p>"}
      </div>
    `;
  });
}

displayPoliticians();
