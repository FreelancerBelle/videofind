
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
