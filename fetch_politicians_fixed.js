
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Initialize Supabase client with corrected API key
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "YOUR_CORRECT_SUPABASE_ANON_KEY"
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
