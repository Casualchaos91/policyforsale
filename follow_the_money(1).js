import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWF4cml3YXVnenJ3d2Z1Z3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTMzMDUsImV4cCI6MjA1NTI4OTMwNX0.vK_ph0SpbTFmt_qL5kBs6Rso3YcUI8Tu4ROF-JmKET0"
);

// Fetch politicians and donations
async function fetchData() {
    let { data: politicians, error: poliError } = await supabase.from('politicians').select('*');
    let { data: donations, error: donError } = await supabase.from('donations').select('*');

    if (poliError) console.error("Error fetching politicians:", poliError);
    if (donError) console.error("Error fetching donations:", donError);

    return { politicians, donations };
}

// Display politicians without duplicates
async function displayPoliticians() {
    const list = document.getElementById("politicianList");
    list.innerHTML = "";

    const { politicians, donations } = await fetchData();

    if (!politicians || politicians.length === 0) {
        list.innerHTML = "<p>No politicians found.</p>";
        return;
    }

    // Use a Map to track unique politician IDs
    const uniquePoliticians = new Map();

    politicians.forEach(politician => {
        if (!uniquePoliticians.has(politician.id)) {
            uniquePoliticians.set(politician.id, politician);
        }
    });

    uniquePoliticians.forEach(politician => {
        const relatedDonations = donations.filter(d => d.politician_id === politician.id);

        let donationHTML = relatedDonations.length > 0
            ? relatedDonations.map(d => `
                <p><strong>${d.industry}:</strong> $${d.amount.toLocaleString()} from ${d.donor_name} 
                (<a href='${d.source_url}' target='_blank'>source</a>)</p>
              `).join('')
            : "<p>No recorded donations.</p>";

        list.innerHTML += `
            <div class="politician">
                <h2 onclick="window.open('${politician.source_url}', '_blank')">
                    ${politician.name} (${politician.state}) - ${politician.party}
                </h2>
                <p><strong>Donations:</strong></p>
                ${donationHTML}
            </div>
        `;
    });
}

// Load politicians on page load
displayPoliticians();
