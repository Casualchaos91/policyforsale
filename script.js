document.addEventListener("DOMContentLoaded", function () {
    var ctx = document.getElementById('donationChart').getContext('2d');
    var donationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Private Prisons', 'Alcohol & Tobacco', 'Anti-Marijuana', 'Big Pharma', 'Fossil Fuels'],
            datasets: [{
                label: 'Millions USD',
                data: [12, 8.5, 6.5, 10, 14],
                backgroundColor: ['blue', 'red', 'green', 'purple', 'orange']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});

function copyToClipboard(button) {
    var address = button.getAttribute("data-address");
    navigator.clipboard.writeText(address).then(() => {
        button.innerText = "Copied!";
        setTimeout(() => button.innerText = "Copy", 1000);
    });
}
