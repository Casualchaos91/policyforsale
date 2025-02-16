
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with provided credentials
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
