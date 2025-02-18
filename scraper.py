import requests
from bs4 import BeautifulSoup
import json

# Define sources (OpenSecrets industry pages)
SOURCES = {
    "Big Pharma": "https://www.opensecrets.org/industries/summary.php?ind=H04",
    "Tobacco & Alcohol": "https://www.opensecrets.org/industries/summary.php?ind=A02",
    "Environmental": "https://www.opensecrets.org/industries/summary.php?ind=E01",
    "Private Prisons": "https://www.opensecrets.org/industries/summary.php?ind=N02"
}

# Function to scrape donation data
def scrape_donations():
    donation_data = {}
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    for industry, url in SOURCES.items():
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            amount = extract_donation_amount(soup)
            donation_data[industry] = amount
        else:
            donation_data[industry] = "Error fetching data"
    
    return donation_data

# Extract the donation amount from OpenSecrets page
def extract_donation_amount(soup):
    try:
        donation_section = soup.find("div", class_="amount") or soup.find("span", class_="number")
        return donation_section.text.strip() if donation_section else "N/A"
    except AttributeError:
        return "N/A"

# Run scraper and save results
donation_results = scrape_donations()

# Save the data in JSON format
with open("donations.json", "w") as file:
    json.dump(donation_results, file, indent=4)

print("Scraping complete. Data saved to donations.json")
