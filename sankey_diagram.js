import { createClient } from "https://esm.sh/@supabase/supabase-js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Initialize Supabase client
const supabase = createClient(
  "https://uiqaxriwaugzrwwfugpn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcWF4cml3YXVnenJ3d2Z1Z3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTMzMDUsImV4cCI6MjA1NTI4OTMwNX0.vK_ph0SpbTFmt_qL5kBs6Rso3YcUI8Tu4ROF-JmKET0"
);

// Fetch donations data
async function fetchSankeyData() {
    let { data, error } = await supabase.from('donations').select('*');

    if (error) {
        console.error("Error fetching donation data:", error);
        return [];
    }

    let sankeyData = {
        nodes: [],
        links: []
    };

    let nodeIndex = {};
    
    data.forEach(donation => {
        if (!nodeIndex[donation.industry]) {
            nodeIndex[donation.industry] = sankeyData.nodes.length;
            sankeyData.nodes.push({ name: donation.industry });
        }
        
        if (!nodeIndex[donation.politician_name]) {
            nodeIndex[donation.politician_name] = sankeyData.nodes.length;
            sankeyData.nodes.push({ name: donation.politician_name });
        }

        sankeyData.links.push({
            source: nodeIndex[donation.industry],
            target: nodeIndex[donation.politician_name],
            value: donation.amount
        });
    });

    return sankeyData;
}

// Render Sankey Diagram
async function renderSankey() {
    const width = 800, height = 500;
    const sankeyData = await fetchSankeyData();

    const svg = d3.select("#sankeyChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

    const { nodes, links } = sankey({
        nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
        links: sankeyData.links.map(d => Object.assign({}, d))
    });

    svg.append("g")
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .attr("fill", "steelblue")
        .append("title")
        .text(d => `${d.name}\n${d.value}`);

    svg.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "gray")
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("opacity", 0.7);
}

// Run the function on page load
document.addEventListener("DOMContentLoaded", renderSankey);
