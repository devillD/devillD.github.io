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
                torrents.forEach(torrent => {
                    const torrentItem = document.createElement('div');
                    torrentItem.classList.add('torrent-item');

                    const torrentLink = document.createElement('a');
                    torrentLink.classList.add('torrent-link');
                    torrentLink.href = torrent['Magnet'];
                    torrentLink.textContent = torrent['Name'] || 'Unknown';

                    const torrentInfo = document.createElement('div');
                    torrentInfo.classList.add('torrent-info');

                    const sizeSpan = document.createElement('span');
                    sizeSpan.textContent = 'Size: ' + (torrent['Size'] || 'Unknown');

                    const categorySpan = document.createElement('span');
                    categorySpan.textContent = 'Category: ' + (torrent['Category'] || 'Unknown');

                    const seedSpan = document.createElement('span');
                    seedSpan.textContent = 'Seeders: ' + (torrent['Seeders'] || torrent['Seeder'] || 'Unknown');

                    const leechSpan = document.createElement('span');
                    leechSpan.textContent = 'Leechers: ' + (torrent['Leechers'] || torrent['Leecher'] || 'Unknown');

                    torrentInfo.appendChild(sizeSpan);
                    torrentInfo.appendChild(categorySpan);
                    torrentInfo.appendChild(seedSpan);
                    torrentInfo.appendChild(leechSpan);

                    torrentItem.appendChild(torrentLink);
                    torrentItem.appendChild(torrentInfo);

                    div.appendChild(torrentItem);
                });
            }
        } catch (error) {
            console.error("Error fetching torrents:", error);
        }
    }
}
