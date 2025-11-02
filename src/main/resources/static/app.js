/* global marked, hljs, Chart */
const page = document.body.getAttribute('data-page') || '';

/* ---------- Utilities ---------- */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const fetchJSON = (url, opts={}) =>
  fetch(url, {headers:{'Content-Type':'application/json'}, ...opts})
    .then(r => {
      if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json ? r.json().catch(()=> ({})) : r.text();
    });

const fetchTEXT = (url, opts={}) =>
  fetch(url, {headers:{'Content-Type':'application/json'}, ...opts})
    .then(r => r.text());

/* ---------- Review Page ---------- */
async function initReviewPage(){
  const language = $('#language');
  const code = $('#code');
  const btn = $('#submitBtn');
  const emailBtn = $('#emailBtn');
  const reviewText = $('#reviewText');

  btn?.addEventListener('click', async () => {
    if(!code.value.trim()){
      reviewText.innerHTML = "<span class='error'>❌ Please paste your code first.</span>";
      return;
    }
    reviewText.innerHTML = "<span class='loading'>🧠 Reviewing your code...</span>";

    try{
      const text = await fetchTEXT('/api/review', {
        method:'POST',
        body: JSON.stringify({ language: language.value, code: code.value })
      });

      // Render markdown + highlight code
      const html = marked.parse(text, {
        breaks:true,
        highlight: (c, lang) => {
          try { return hljs.highlightAuto(c, lang ? [lang] : undefined).value; }
          catch { return hljs.highlightAuto(c).value; }
        }
      });
      reviewText.innerHTML = html;
      $$('pre code', reviewText).forEach(b => hljs.highlightElement(b));
      reviewText.scrollIntoView({behavior:'smooth', block:'start'});
    }catch(err){
      reviewText.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    }
  });

  emailBtn?.addEventListener('click', async () => {
    const to = prompt("Send review to (email):");
    if(!to) return;
    const subject = "AI Code Review Result";
    const body = reviewText.innerText || "No review rendered yet.";

    try{
      const res = await fetchTEXT(`/api/email/send?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`, {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: `body=${encodeURIComponent(body)}`
      });
      alert(res);
    }catch(e){ alert("Email error: " + e.message); }
  });
}

/* ---------- Bugs Page ---------- */
function badge(el, type){
  const span = document.createElement('span');
  span.className = `badge ${type}`;
  span.textContent = el;
  return span.outerHTML;
}
async function loadBugs(){
  const tbody = $('#bugTbody'); const empty = $('#bugEmpty');
  tbody.innerHTML = '';
  const bugs = await fetchJSON('/api/bugs');
  if(!bugs.length){ empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  for(const b of bugs){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${b.id}</td>
      <td>${b.title}</td>
      <td>${badge(b.severity, b.severity==='High'?'danger':b.severity==='Medium'?'warn':'ok')}</td>
      <td>${badge(b.status, b.status==='Resolved'?'ok':b.status==='In Progress'?'warn':'danger')}</td>
      <td>${b.language}</td>
      <td class="right">
        <button class="btn" data-act="progress" data-id="${b.id}">In Progress</button>
        <button class="btn" data-act="resolved" data-id="${b.id}">Resolve</button>
        <button class="btn danger" data-act="delete" data-id="${b.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.getAttribute('data-id'); const act = btn.getAttribute('data-act');

    if(act==='delete'){
      await fetch(`/api/bugs/${id}`, {method:'DELETE'});
    }else{
      const status = act==='progress' ? 'In Progress' : 'Resolved';
      await fetch(`/api/bugs/${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({status})
      });
    }
    await loadBugs();
  }, {once:true});
}
function initBugModal(){
  const open = $('#openModal'), close = $('#closeModal'), save = $('#saveBug');
  const backdrop = $('#modalBackdrop'); const modal = $('#bugModal');

  const show = ()=> { backdrop.classList.add('show'); }
  const hide = ()=> { backdrop.classList.remove('show'); }

  open?.addEventListener('click', show);
  close?.addEventListener('click', hide);
  backdrop?.addEventListener('click', (e)=> { if(e.target===backdrop) hide(); });

  save?.addEventListener('click', async ()=>{
    const title = $('#bTitle').value.trim();
    const description = $('#bDesc').value.trim();
    const severity = $('#bSeverity').value;
    const language = $('#bLanguage').value;
    if(!title){ alert('Title required'); return; }
    await fetch('/api/bugs', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title, description, severity, language})
    });
    hide();
    $('#bTitle').value=''; $('#bDesc').value='';
    await loadBugs();
  });
}
async function initBugsPage(){
  await loadBugs();
  initBugModal();
}

/* ---------- Insights Page ---------- */
async function initInsightsPage(){
  const bugs = await fetchJSON('/api/bugs');
  const countBy = (field) => bugs.reduce((m,b)=> (m[b[field]]=(m[b[field]]||0)+1, m), {});
  const sev = countBy('severity'), stat = countBy('status'), lang = countBy('language');

  const baseCfg = (labels, data) => ({
    type:'bar',
    data:{labels, datasets:[{label:'Count', data} ]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{x:{grid:{color:'#222'}}, y:{grid:{color:'#222'}, beginAtZero:true}}}
  });

  new Chart($('#severityChart'), baseCfg(Object.keys(sev), Object.values(sev)));
  new Chart($('#statusChart'), baseCfg(Object.keys(stat), Object.values(stat)));
  new Chart($('#langChart'), baseCfg(Object.keys(lang), Object.values(lang)));
}

/* ---------- Reports Page ---------- */
let _reportCache = [];
async function loadReportData(){
  _reportCache = await fetchJSON('/api/bugs');
  return _reportCache;
}
function applyReportFilter(){
  const sev = $('#rSeverity').value; const st = $('#rStatus').value; const lg = $('#rLang').value;
  return _reportCache.filter(b =>
    (!sev || b.severity===sev) && (!st || b.status===st) && (!lg || b.language===lg)
  );
}
function renderReportRows(rows){
  const tb = $('#rTbody'); const empty = $('#rEmpty'); tb.innerHTML='';
  if(!rows.length){ empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  for(const b of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${b.id}</td><td>${b.title}</td><td>${b.severity}</td><td>${b.status}</td><td>${b.language}</td>`;
    tb.appendChild(tr);
  }
}
function exportCSV(rows){
  const header = ['id','title','severity','status','language'];
  const csv = [header.join(',')].concat(rows.map(b => [
    b.id, `"${(b.title||'').replace(/"/g,'""')}"`, b.severity, b.status, b.language
  ].join(','))).join('\n');

  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bugs-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
async function initReportsPage(){
  await loadReportData();
  const rows = applyReportFilter();
  renderReportRows(rows);
  $('#rApply')?.addEventListener('click', ()=> renderReportRows(applyReportFilter()));
  $('#rExport')?.addEventListener('click', ()=> exportCSV(applyReportFilter()));
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if(page==='review') initReviewPage();
  if(page==='bugs') initBugsPage();
  if(page==='insights') initInsightsPage();
  if(page==='reports') initReportsPage();
});
