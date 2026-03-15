
import requests
from bs4 import BeautifulSoup

def scrape_site(url):

    r = requests.get(url)

    soup = BeautifulSoup(r.text,"html.parser")

    titles = [t.text for t in soup.find_all("title")]

    return titles
