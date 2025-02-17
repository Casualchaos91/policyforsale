document.addEventListener("DOMContentLoaded", function () {
    var ctx = document.getElementById('donationChart').getContext('2d');
    var donationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Private Prisons', 'Alcohol & Tobacco', 'Anti-Marijuana'],
            datasets: [{
                label: 'Millions USD',
                data: [12, 8.5, 6.5],
                backgroundColor: ['blue', 'red', 'green']
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
