// Simple VideoFinder script (frontend only)
// - Paste any YouTube Data API v3 key in the API Key field
// - Uses localStorage for persistent history and last results

const $ = (id)=>document.getElementById(id);
const API_INPUT = $('apiKey');
const KW = $('keyword');
const SEARCH_BTN = $('searchBtn');
const CLEAR_BTN = $('clearBtn');
const EXPORT_BTN = $('exportBtn');
const HISTORY_LIST = $('historyList');
const CLEAR_HISTORY = $('clearHistory');
const RESULTS_BODY = $('resultsBody');
const COUNT = $('count');

const HISTORY_KEY = 'videofinder_history_v1';
const RESULTS_KEY = 'videofinder_results_v1';

function loadHistory(){ try{ return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); }catch(e){return[]} }
function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); renderHistory(); }
function loadResults(){ try{ return JSON.parse(localStorage.getItem(RESULTS_KEY)||'[]'); }catch(e){return[]} }
function saveResults(r){ localStorage.setItem(RESULTS_KEY, JSON.stringify(r)); renderResults(); }

function renderHistory(){ const h = loadHistory(); HISTORY_LIST.innerHTML = ''; if(!h.length){ HISTORY_LIST.textContent='No history yet.'; return; } h.slice().reverse().forEach((it, i)=>{ const div=document.createElement('div'); div.className='hist-item'; div.innerHTML = `<div><strong>${it.keyword}</strong><div style="font-size:12px;color:#6b7280">${new Date(it.when).toLocaleString()}</div></div>`; const btns=document.createElement('div'); const run=document.createElement('button'); run.textContent='Run'; run.className='btn alt'; run.style.padding='6px'; run.onclick=()=>{ KW.value=it.keyword; API_INPUT.value=it.apiKey||''; startSearch(); }; const del=document.createElement('button'); del.textContent='Del'; del.className='btn alt'; del.style.padding='6px'; del.onclick=()=>{ const arr=loadHistory(); arr.splice(arr.length-1-i,1); saveHistory(arr); }; btns.appendChild(run); btns.appendChild(del); div.appendChild(btns); HISTORY_LIST.appendChild(div); }); }

function renderResults(){ const r = loadResults(); RESULTS_BODY.innerHTML=''; COUNT.textContent = r.length; r.forEach(ch=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td><strong>${ch.title||'—'}</strong><div style="font-size:12px;color:#6b7280">@${ch.channelId}</div></td><td>${ch.subs?Number(ch.subs).toLocaleString():'—'}</td><td>${ch.videos||'—'}</td><td>${ch.lastUpload?new Date(ch.lastUpload).toLocaleDateString():'—'}</td><td><button class="btn alt" onclick="window.open('https://www.youtube.com/channel/${ch.channelId}','_blank')">Open</button></td>`; RESULTS_BODY.appendChild(tr); }); }

function toCSV(arr){ if(!arr.length) return ''; const hdr=['channelId','title','subs','videos','lastUpload']; const lines=[hdr.join(',')]; arr.forEach(r=>{ lines.push([r.channelId,r.title,r.subs||'',r.videos||'',r.lastUpload||''].map(s=>`"${String(s).replace(/"/g,'""') }"`).join(',')); }); return lines.join('\n'); }

function downloadCSV(){ const r = loadResults(); if(!r.length){ alert('No results'); return; } const csv = toCSV(r); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='videofinder_results.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// Simple YouTube calls (minimal error handling)
async function ytFetch(url){ const res = await fetch(url); if(!res.ok) throw new Error('YT error '+res.status); return res.json(); }

async function searchChannels(apiKey, q){ const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=25&q=${encodeURIComponent(q)}&key=${apiKey}`; return ytFetch(url); }
async function getChannels(apiKey, ids){ const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${apiKey}`; return ytFetch(url); }
async function getPlaylistItems(apiKey, playlistId, maxResults=1){ const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`; return ytFetch(url); }

async function startSearch(){ const key = API_INPUT.value.trim(); const q = KW.value.trim(); if(!q){ alert('Enter keyword'); return; } if(!key){ if(!confirm('No API key provided. Searches will fail without one. Continue?')) return; } SEARCH_BTN.disabled=true; SEARCH_BTN.textContent='Searching...'; try{ const s = await searchChannels(key,q); const channelIds = (s.items||[]).map(it=>it.snippet.channelId).filter(Boolean); if(!channelIds.length){ alert('No channels found'); return; } const details = await getChannels(key, channelIds); const results = []; for(const ch of (details.items||[])){ const stats = ch.statistics||{}; const snip = ch.snippet||{}; const uploads = ch.contentDetails?.relatedPlaylists?.uploads; let last=null; if(uploads){ try{ const p = await getPlaylistItems(key, uploads, 1); if(p.items && p.items[0] && p.items[0].snippet) last = p.items[0].snippet.publishedAt; }catch(e){} } results.push({ channelId: ch.id, title: snip.title, subs: stats.subscriberCount||null, videos: stats.videoCount||null, lastUpload: last }); } saveResults(results); // save history
      const h = loadHistory(); h.push({keyword:q, when:Date.now(), apiKey:key}); while(h.length>200) h.shift(); saveHistory(h);
  }catch(err){ alert('Search failed: '+err.message); console.error(err); } finally{ SEARCH_BTN.disabled=false; SEARCH_BTN.textContent='Search'; } }

SEARCH_BTN.addEventListener('click', startSearch);
CLEAR_BTN.addEventListener('click', ()=>{ if(confirm('Clear results?')){ localStorage.removeItem(RESULTS_KEY); renderResults(); } });
EXPORT_BTN.addEventListener('click', downloadCSV);
CLEAR_HISTORY.addEventListener('click', ()=>{ if(confirm('Clear history?')){ localStorage.removeItem(HISTORY_KEY); renderHistory(); } });

// init
renderHistory();
renderResults();