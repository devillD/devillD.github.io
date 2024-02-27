async function get_torrent() {
    let siteName = document.getElementById("torrents").value;
    if (siteName === '') {
        siteName = '1337x';
    }
    const query = document.getElementById("query").value;
    if (query !== '') {
        const api = "https://api.api-zero.workers.dev/" + siteName + "/" + query;
        try {
            const response = await axios.get(api);
            const torrents = response.data;
            const div = document.getElementById("data");
            div.innerHTML = "";
            if (Object.keys(torrents).length === 0) {
                let error = document.createElement('p');
                error.textContent = "No results found.";
                div.appendChild(error);
            } else {
                for (let i = 0; i < Object.keys(torrents).length; i++) {
                    const torrent = torrents[i];
                    let magnet = document.createElement("a");
                    let name = document.createElement("p");
                    let size = document.createElement("span");
                    let category = document.createElement("span");
                    let type = document.createElement("span");
                    let lang = document.createElement("span");
                    let dateUpload = document.createElement("span");
                    let seed = document.createElement("span");
                    let leech = document.createElement("span");
                    let lastChecked = document.createElement("span");
                    let downloads = document.createElement("span");

                    magnet.setAttribute("href", torrent["Magnet"]);
                    magnet.setAttribute("target", "_blank");
                    magnet.textContent = "Magnet";

                    name.textContent = torrent["Name"] || '';
                    size.textContent = "Size: " + (torrent["Size"] || '');
                    category.textContent = "Category: " + (torrent["Category"] || '');
                    type.textContent = "Type: " + (torrent["Type"] || '');
                    lang.textContent = "Language: " + (torrent["Language"] || '');
                    dateUpload.textContent = "Date Upload: " + (torrent["DateUpload"] || torrent["Date"] || '');
                    seed.textContent = "Seeders: " + (torrent["Seeders"] || torrent["Seeder"] || '');
                    leech.textContent = "Leechers: " + (torrent["Leechers"] || torrent["Leecher"] || '');
                    lastChecked.textContent = "Last Checked: " + (torrent["LastChecked"] || '');
                    downloads.textContent = "Downloads: " + (torrent["Downloads"] || '');

                    name.appendChild(magnet);
                    div.appendChild(name);
                    div.appendChild(size);
                    div.appendChild(category);
                    div.appendChild(type);
                    div.appendChild(lang);
                    div.appendChild(dateUpload);
                    div.appendChild(seed);
                    div.appendChild(leech);
                    div.appendChild(lastChecked);
                    div.appendChild(downloads);
                }
            }
        } catch (error) {
            console.error("Error fetching torrents:", error);
        }
    }
}
