import requests
from tqdm import tqdm
from bs4 import BeautifulSoup
import json
import re


def dumps_json(d, f):
    with open(f, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)


def extract_history(soup):
    header = soup.find("h2", id="Histoire")
    content = []
    for sibling in header.parent.find_next_siblings():
        if sibling.name == "p":
            content.append(sibling.get_text())
        elif sibling.name == "div" and len(content) != 0:  # section changed
            break
    full_histoire_text = "\n".join(content)
    return re.sub(
        r"\[[0-9]+\]", "", full_histoire_text
    ).strip()  # Remove Wikipedia refs


def extract_gps(soup):
    gps = soup.find("a", {"title": "Coordonnées géographiques"}).parent.parent.td.a

    return {
        "lat": gps["data-lat"],
        "lon": gps["data-lon"],
    }


def get_station_list():
    URL = "https://fr.wikipedia.org/wiki/Liste_des_stations_du_m%C3%A9tro_de_Paris"
    html = requests.get(URL).text
    soup = BeautifulSoup(html, "html.parser")

    tab = soup.find("h2", id="Stations_en_service").parent.parent.find("table")
    stations = tab.tbody("td")[::10]  # 10 cols, we want the first elem of each rows
    station_a = [x("a")[0] for x in stations]
    station_urls = [
        {
            "name": x["title"].replace(" (métro de Paris)", ""),
            "url": "https://fr.wikipedia.org" + x["href"],
        }
        for x in station_a
    ]
    return station_urls


def extract_info(urls):
    def _handle_exceptions(f, what, who):
        try:
            return f()
        except KeyboardInterrupt:
            raise KeyboardInterrupt
        except Exception as e:
            print(f"Failed retrieving {what} for {who}. Reason: {e}")
            return None

    def _extract(d):
        name = d["name"]
        soup = _handle_exceptions(
            lambda: BeautifulSoup(requests.get(d["url"]).text, "html.parser"),
            "Wikipedia page",
            name,
        )
        d["history"] = _handle_exceptions(
            lambda: extract_history(soup), "history", name
        )
        d["gps"] = _handle_exceptions(lambda: extract_gps(soup), "GPS info", name)

        return d

    data = [_extract(x) for x in tqdm(urls)]
    return data


if __name__ == "__main__":
    urls = get_station_list()
    data = extract_info(urls)
    dumps_json(data, "stations.json")
