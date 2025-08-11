
let resultsData = [];

async function searchVideos() {
    const query = document.getElementById('searchInput').value.trim();
    const apiKey = document.getElementById('apiKeyInput').value.trim();

    if (!query || !apiKey) {
        alert('Please enter both a search term and an API key.');
        return;
    }

    try {
        const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`);
        const searchData = await searchResponse.json();

        resultsData = [];

        const tableBody = document.querySelector("#resultsTable tbody");
        tableBody.innerHTML = "";

        for (let item of searchData.items) {
            const videoId = item.id.videoId;
            const channelId = item.snippet.channelId;
            const title = item.snippet.title;

            // Dummy data for subs, videos, last upload (since requires more API calls)
            const subs = "N/A";
            const videos = "N/A";
            const lastUpload = item.snippet.publishedAt.split("T")[0];

            resultsData.push({ videoId, channelId, title, subs, videos, lastUpload });

            const row = `<tr>
                <td><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Link</a></td>
                <td>${channelId}</td>
                <td>${title}</td>
                <td>${subs}</td>
                <td>${videos}</td>
                <td>${lastUpload}</td>
            </tr>`;
            tableBody.innerHTML += row;
        }
    } catch (error) {
        console.error('Error fetching data', error);
        alert('Error fetching videos. Check API key and internet connection.');
    }
}

function downloadCSV(data) {
    let csv = "videoUrl,channelId,title,subs,videos,lastUpload\n";
    data.forEach(item => {
        let videoUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
        csv += `${videoUrl},${item.channelId},${item.title},${item.subs},${item.videos},${item.lastUpload}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "results.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
