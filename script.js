/* VideoFind dashboard script
 - Left: search configuration
 - Right: history, progress
 - Results table at bottom
 - Uses YouTube Data API v3 (no key bundled)
 - Persists history & last results in localStorage
*/

// DOM helpers
const $ = id => document.getElementById(id);
const apiKeyInput = $('apiKey');
const keywordInput = $('keyword');
const resultsPerPage = $('resultsPerPage');
const maxTotal = $('maxTotal');
const minSubsChk = $('minSubs');
const recentVideosChk = $('recentVideos');
const stopOnQuotaChk = $('stopOnQuota');
const startBtn = $('startSearch');
const exportBtn = $('exportCsv');
const resultsBody = $('resultsBody');
const resultsCount = $('resultsCount');
const historyList = $('historyList');
const clearHistoryBtn = $('clearHistory');
const progressBar = $('progressBar');
const progressText = $('progressText');
const quotaInfo = $('quotaInfo');
const clearResultsBtn = $('clearResults');
const showFilter = $('showFilter');
const reRunBtn = $('reRun');
const loadLastBtn = $('loadLast');
const copyResultsBtn = $('copyResults');

// storage keys
const HISTORY_KEY = 'videofind_history_v1';
const RESULTS_KEY = 'videofind_results_v1';

// app state
let appState = { results: [], running:false, fetched:0, totalToFetch:0 };

function loadHistory(){ try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch(e){return[]} }
function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); renderHistory(); }
function loadResults(){ try{return JSON.parse(localStorage.getItem(RESULTS_KEY)||'[]')}catch(e){return[]} }
function saveResults(r){ localStorage.setItem(RESULTS_KEY, JSON.stringify(r)); renderResults(); }

// render history
function renderHistory(){
  const hist = loadHistory();
  historyList.innerHTML = '';
  if(!hist.length){ historyList.innerHTML = '<div class="small">No search history yet.</div>'; return; }
  hist.slice().reverse().forEach((h, idx)=>{
    const el = document.createElement('div'); el.className='history-item';
    el.innerHTML = `<div><strong>${h.keyword}</strong><div class="small">${new Date(h.when).toLocaleString()}</div></div>`;
    const actions = document.createElement('div');
    const run = document.createElement('button'); run.className='btn light'; run.style.padding='6px'; run.textContent='Run'; run.onclick=()=>{ loadFromHistory(h); startSearch(); };
    const del = document.createElement('button'); del.className='btn light'; del.style.padding='6px'; del.textContent='Del'; del.onclick=()=>{ removeHistoryEntry(hist.length-1-idx); };
    actions.appendChild(run); actions.appendChild(del);
    el.appendChild(actions);
    historyList.appendChild(el);
  });
}

// render results
function renderResults(){
  const data = appState.results.slice();
  const filter = showFilter.value;
  let filtered = data;
  if(filter==='1000plus') filtered = data.filter(r=> Number(r.subscribers||0) >= 1000);
  resultsBody.innerHTML='';
  filtered.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div style="font-weight:600">${r.title||'—'}</div><div class="small">@${r.customUrl||r.channelId}</div></td>
      <td>${formatNum(r.subscribers)}</td>
      <td>${r.country||'—'}</td>
      <td>${r.videosCount||'—'}</td>
      <td>${r.lastUploadLabel||'—'}</td>
      <td>${r.avgViews?formatNum(Math.round(r.avgViews)):'—'}</td>
      <td style="display:flex;gap:6px">
        <button class="btn light" onclick="window.open('https://www.youtube.com/channel/${r.channelId}','_blank')">Open</button>
        <button class="btn light" onclick="navigator.clipboard?.writeText('https://www.youtube.com/channel/${r.channelId}')">Copy</button>
      </td>`;
    resultsBody.appendChild(tr);
  });
  resultsCount.textContent = filtered.length;
}

// helpers
function formatNum(n){ if(n==null) return '—'; n=Number(n); if(isNaN(n)) return '—'; if(n>=1e9) return (n/1e9).toFixed(1)+'B'; if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }
function humanDate(iso){ if(!iso) return '—'; const d=new Date(iso); const diff=(Date.now()-d.getTime())/(1000*60*60*24); if(diff<1) return Math.round(diff*24)+' hrs ago'; if(diff<7) return Math.round(diff)+' days ago'; if(diff<30) return Math.round(diff/7)+' wks ago'; return d.toLocaleDateString(); }

// push history
function pushHistory(entry){ const h=loadHistory(); h.push(entry); while(h.length>200) h.shift(); saveHistory(h); }
function removeHistoryEntry(i){ const h=loadHistory(); h.splice(i,1); saveHistory(h); }
function loadFromHistory(entry){ apiKeyInput.value = entry.apiKey||''; keywordInput.value = entry.keyword||''; resultsPerPage.value = entry.resultsPerPage||'50'; maxTotal.value = entry.maxTotal||'500'; minSubsChk.checked = !!entry.minSubs; recentVideosChk.checked = !!entry.recentVideos; }

// progress UI
function setProgress(fetched,total){ appState.fetched = fetched; appState.totalToFetch = total; const pct = total? Math.min(100, Math.round((fetched/total)*100)) : 0; progressBar.style.width = pct+'%'; progressText.textContent = `${fetched} / ${total}`; }

// CSV export
function exportCSV(){
  if(!appState.results.length){ alert('No results to export'); return; }
  const headers = ['channelUrl','channelId','title','subscribers','country','videosCount','lastUpload','avgViews'];
  const rows = [headers.join(',')];
  appState.results.forEach(r=>{
    const line = [ `https://www.youtube.com/channel/${r.channelId}`, r.channelId, (r.title||''), (r.subscribers||''), (r.country||''), (r.videosCount||''), (r.lastUpload||''), (r.avgViews?Math.round(r.avgViews):'') ].map(s=>`"${String(s).replace(/"/g,'""')}"`).join(',');
    rows.push(line);
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `videofind_results_${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// YouTube API helpers
async function ytFetch(url){
  const res = await fetch(url);
  if(!res.ok){
    const txt = await res.text().catch(()=>res.statusText); throw new Error('YT API error: '+res.status+' '+txt);
  }
  return res.json();
}
async function searchChannels(apiKey, q, pageToken, perPage=50){
  const esc = encodeURIComponent(q); const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${perPage}&q=${esc}&key=${apiKey}` + (pageToken?`&pageToken=${pageToken}`:'');
  return ytFetch(url);
}
async function getChannelDetails(apiKey, ids){ const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${apiKey}`; return ytFetch(url); }
async function getPlaylistItems(apiKey, playlistId, maxResults=5){ const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`; return ytFetch(url); }
async function getVideoStats(apiKey, ids){ if(!ids.length) return {items:[]}; const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids.join(',')}&key=${apiKey}`; return ytFetch(url); }

// main search flow (channel search)
async function startSearch(){
  if(appState.running) { if(!confirm('A search is already running. Stop it?')) return; else appState.running=false; }
  const apiKey = apiKeyInput.value.trim(); const keyword = keywordInput.value.trim();
  if(!keyword){ alert('Please enter a search keyword'); return; }
  pushHistory({keyword, when:Date.now(), apiKey, resultsPerPage:resultsPerPage.value, maxTotal:maxTotal.value, minSubs: minSubsChk.checked, recentVideos: recentVideosChk.checked});
  appState.results = []; renderResults(); saveResults(appState.results);
  setProgress(0, Number(maxTotal.value));
  appState.running = true; startBtn.disabled=true; startBtn.textContent='Searching...';

  const perPage = Number(resultsPerPage.value); const maxTotalCount = Number(maxTotal.value);
  let nextPageToken = null; let totalFetched = 0; const stopOnQuota = stopOnQuotaChk.checked;
  try{
    while(appState.running && totalFetched < maxTotalCount){
      const left = Math.min(perPage, maxTotalCount - totalFetched);
      let searchRes;
      try{ searchRes = await searchChannels(apiKey, keyword, nextPageToken, left); } catch(err){ console.error(err); if(stopOnQuota) throw err; else { alert('Search API error: '+err.message); break; } }
      if(searchRes && searchRes.pageInfo) quotaInfo.textContent = `${searchRes.pageInfo.totalResults} possible`;
      const ids = (searchRes.items||[]).map(it=>it.snippet?.channelId).filter(Boolean);
      if(!ids.length) break;
      let details;
      try{ details = await getChannelDetails(apiKey, ids); } catch(err){ console.error(err); if(stopOnQuota) throw err; else { alert('Channels API error: '+err.message); break; } }
      for(const ch of (details.items||[])){
        const stats = ch.statistics||{}; const snip = ch.snippet||{}; const cont = ch.contentDetails||{};
        const obj = { channelId: ch.id, title: snip.title, customUrl: snip.customUrl||'', subscribers: stats.subscriberCount?Number(stats.subscriberCount):null, videosCount: stats.videoCount?Number(stats.videoCount):null, country: snip.country||'', uploadsPlaylist: cont.relatedPlaylists?.uploads||null, lastUpload:null, avgViews:null };
        if(minSubsChk.checked && (obj.subscribers==null || obj.subscribers < 1000)) continue;
        if(obj.uploadsPlaylist){
          try{
            const recent = await getPlaylistItems(apiKey, obj.uploadsPlaylist, 5);
            const vids = (recent.items||[]).map(it=>it.contentDetails?.videoId).filter(Boolean);
            if(vids.length){
              const vstats = await getVideoStats(apiKey, vids);
              const items = vstats.items || [];
              // last upload from playlist snippet publishedAt
              if(recent.items && recent.items[0] && recent.items[0].snippet && recent.items[0].snippet.publishedAt){
                obj.lastUpload = recent.items[0].snippet.publishedAt;
                obj.lastUploadLabel = humanDate(obj.lastUpload);
              }
              const views = items.map(it=>Number(it.statistics?.viewCount||0)).filter(v=>v>0);
              if(views.length) obj.avgViews = views.reduce((a,b)=>a+b,0)/views.length;
            }
          } catch(err){ console.warn('recent fetch failed', err); if(stopOnQuota) throw err; }
        }
        if(recentVideosChk.checked && obj.lastUpload){
          const sixMonthsAgo = Date.now() - (1000*60*60*24*30*6);
          if(new Date(obj.lastUpload).getTime() < sixMonthsAgo) continue;
        } else if(recentVideosChk.checked && !obj.lastUpload){
          continue;
        }
        appState.results.push(obj);
      }
      totalFetched = appState.results.length;
      setProgress(totalFetched, maxTotalCount);
      renderResults(); saveResults(appState.results);
      nextPageToken = searchRes.nextPageToken;
      if(!nextPageToken) break;
      await new Promise(r=>setTimeout(r, 200));
    }
  } catch(err){
    console.error(err);
    alert('Search stopped: ' + (err.message||err));
  } finally{
    appState.running=false; startBtn.disabled=false; startBtn.textContent='Start Search'; setProgress(appState.results.length, Number(maxTotal.value)); saveResults(appState.results);
  }
}

// wiring
startBtn.addEventListener('click', startSearch);
exportBtn.addEventListener('click', exportCSV);
clearHistoryBtn.addEventListener('click', ()=>{ if(confirm('Clear search history?')){ localStorage.removeItem(HISTORY_KEY); renderHistory(); } });
clearResultsBtn.addEventListener('click', ()=>{ if(confirm('Clear current results?')){ appState.results=[]; renderResults(); saveResults(appState.results); } });
showFilter.addEventListener('change', renderResults);
reRunBtn.addEventListener('click', ()=>{ const h=loadHistory(); if(!h.length) return alert('No history'); loadFromHistory(h[h.length-1]); startSearch(); });
loadLastBtn.addEventListener('click', ()=>{ const h=loadHistory(); if(!h.length) return alert('No history'); loadFromHistory(h[h.length-1]); alert('Loaded last search into the form. Click Start Search to run.'); });
copyResultsBtn.addEventListener('click', ()=>{ if(!appState.results.length) return alert('No results to copy'); const headers=['channelUrl','channelId','title','subscribers','country','videosCount','lastUpload','avgViews']; const rows=[headers.join(',')]; appState.results.forEach(r=>{ rows.push([`https://www.youtube.com/channel/${r.channelId}`, r.channelId, r.title||'', r.subscribers||'', r.country||'', r.videosCount||'', r.lastUpload||'', r.avgViews?Math.round(r.avgViews):''].map(s=>`"${String(s).replace(/"/g,'""')}"`).join(',')); }); navigator.clipboard.writeText(rows.join('\n')).then(()=>alert('CSV copied to clipboard'), ()=>alert('Copy failed')); });

// init
(function init(){ renderHistory(); const rs = loadResults(); appState.results = rs || []; renderResults(); setProgress(0, Number(maxTotal.value)); })();
