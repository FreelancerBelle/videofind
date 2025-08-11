
async function searchVideos() {
    const query = document.getElementById("searchInput").value;
    const apiKey = document.getElementById("apiKeyInput").value;
    const maxResults = 10;

    if (!query || !apiKey) {
        alert("Please enter both search query and API key.");
        return;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        alert("Error: " + data.error.message);
        return;
    }

    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    const videoData = [];

    for (const item of data.items) {
        const videoId = item.id.videoId;
        const channelId = item.snippet.channelId;
        const title = item.snippet.title;
        const channelTitle = item.snippet.channelTitle;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();

        let subs = "N/A", videos = "N/A", lastUpload = "N/A";
        if (statsData.items.length > 0) {
            subs = statsData.items[0].statistics.subscriberCount || "N/A";
            videos = statsData.items[0].statistics.videoCount || "N/A";
            lastUpload = statsData.items[0].snippet.publishedAt || "N/A";
        }

        videoData.push({ videoUrl, channelId, title, subs, videos, lastUpload });

        const div = document.createElement("div");
        div.classList.add("video-item");
        div.innerHTML = `<a href="${videoUrl}" target="_blank">${title}</a><br>
                         Channel: ${channelTitle} (${subs} subs, ${videos} videos)<br>
                         Last Upload: ${lastUpload}<br><br>`;
        resultsContainer.appendChild(div);
    }

    window.latestResults = videoData;
}

function downloadCSV() {
    if (!window.latestResults || window.latestResults.length === 0) {
        alert("No results to download.");
        return;
    }

    let csv = "videoUrl,channelId,title,subs,videos,lastUpload\n";
    window.latestResults.forEach(item => {
        csv += `${item.videoUrl},${item.channelId},${item.title},${item.subs},${item.videos},${item.lastUpload}\n`;
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
