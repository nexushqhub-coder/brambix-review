const els = {
  status: document.getElementById('statusLine'),
  refreshBtn: document.getElementById('refreshBtn'),
  empty: document.getElementById('emptyState'),
  toast: document.getElementById('toast'),
  sections: {
    cms: document.getElementById('section-cms'),
    pages: document.getElementById('section-pages'),
    scripts: document.getElementById('section-scripts'),
    ready: document.getElementById('section-ready'),
  },
  lists: {
    cms: document.getElementById('list-cms'),
    pages: document.getElementById('list-pages'),
    scripts: document.getElementById('list-scripts'),
    ready: document.getElementById('list-ready'),
  },
  counts: {
    cms: document.getElementById('count-cms'),
    pages: document.getElementById('count-pages'),
    scripts: document.getElementById('count-scripts'),
    ready: document.getElementById('count-ready'),
  },
};

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

async function loadEscalations() {
  els.status.textContent = 'Loading…';
  try {
    const res = await fetch(`${N8N_BASE}/escalations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    render(data);
    const time = new Date(data.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    els.status.textContent = `Updated ${time}`;
  } catch (err) {
    els.status.textContent = 'Could not load — check your connection';
    console.error(err);
  }
}

function render(data) {
  const cms = data.escalated_character_masters || [];
  const pages = data.escalated_pages || [];
  const scripts = data.escalated_scripts || [];
  const ready = data.ready_for_review || [];

  const totalItems = cms.length + pages.length + scripts.length + ready.length;
  els.empty.classList.toggle('hidden', totalItems > 0);

  renderCMs(cms);
  renderPages(pages);
  renderScripts(scripts);
  renderReady(ready);
}

function renderCMs(items) {
  els.sections.cms.classList.toggle('hidden', items.length === 0);
  els.counts.cms.textContent = items.length;
  els.lists.cms.innerHTML = items.map(c => `
    <div class="card card-danger" data-id="${escapeHtml(c.character_master_id)}">
      <img class="card-thumb" src="${escapeHtml(c.image_url || '')}" alt="" onerror="this.style.display='none'">
      <div class="card-body">
        <div class="card-order">Order ${escapeHtml(c.order_id)}</div>
        <div class="card-title">Character Master escalated</div>
        <div class="card-notes">${escapeHtml(c.qc_notes) || 'Rejected after retry — needs manual decision.'}</div>
        <div class="card-actions">
          <button class="btn btn-approve" onclick="decideCM('${escapeHtml(c.order_id)}', 'approve', this)">Approve</button>
          <button class="btn btn-retry" onclick="decideCM('${escapeHtml(c.order_id)}', 'retry', this)">Give another retry</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPages(items) {
  els.sections.pages.classList.toggle('hidden', items.length === 0);
  els.counts.pages.textContent = items.length;
  els.lists.pages.innerHTML = items.map(p => `
    <div class="card card-danger">
      <img class="card-thumb" src="${escapeHtml(p.image_url || '')}" alt="" onerror="this.style.display='none'">
      <div class="card-body">
        <div class="card-order">Order ${escapeHtml(p.order_id)} · ${escapeHtml(p.page_id)}</div>
        <div class="card-title">Page escalated</div>
        <div class="card-notes">${escapeHtml(p.qc_notes) || 'Failed QC twice — regenerate manually in Airtable.'}</div>
      </div>
    </div>
  `).join('');
}

function renderScripts(items) {
  els.sections.scripts.classList.toggle('hidden', items.length === 0);
  els.counts.scripts.textContent = items.length;
  els.lists.scripts.innerHTML = items.map(s => `
    <div class="card card-danger" data-id="${escapeHtml(s.order_id)}">
      <div class="card-body">
        <div class="card-order">Order ${escapeHtml(s.order_id)} · ${escapeHtml(s.child_name)}</div>
        <div class="card-title">Custom script escalated</div>
        <div class="story-preview">${escapeHtml((s.story_outline || '').slice(0, 400))}${(s.story_outline || '').length > 400 ? '…' : ''}</div>
        <div class="card-actions">
          <button class="btn btn-approve" onclick="decideScript('${escapeHtml(s.order_id)}', 'approve', this)">Approve</button>
          <button class="btn btn-retry" onclick="decideScript('${escapeHtml(s.order_id)}', 'retry', this)">Give another retry</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderReady(items) {
  els.sections.ready.classList.toggle('hidden', items.length === 0);
  els.counts.ready.textContent = items.length;
  els.lists.ready.innerHTML = items.map(d => `
    <div class="card card-success">
      <div class="card-body">
        <div class="card-order">Order ${escapeHtml(d.order_id)}</div>
        <div class="card-title">Ready to email</div>
        <div class="card-actions">
          ${d.drive_pdf ? `<a class="btn btn-link" href="${escapeHtml(d.drive_pdf)}" target="_blank" rel="noopener">Open PDF in Drive</a>` : ''}
          ${d.preview_pdf ? `<a class="btn btn-link" href="${escapeHtml(d.preview_pdf)}" target="_blank" rel="noopener">Quick preview</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function decideCM(orderId, decision, btn) {
  await sendDecision(`${N8N_BASE}/character-decision`, orderId, decision, btn);
}

async function decideScript(orderId, decision, btn) {
  await sendDecision(`${N8N_BASE}/script-decision`, orderId, decision, btn);
}

async function sendDecision(url, orderId, decision, btn) {
  const card = btn.closest('.card');
  const allButtons = card.querySelectorAll('button');
  allButtons.forEach(b => b.disabled = true);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, decision }),
    });
    const result = await res.json();

    if (result.result === 'approved') {
      showToast(`Order ${orderId} approved`);
    } else if (result.result === 'retry_allowed') {
      showToast(`Retry queued for ${orderId}`);
    } else {
      showToast(`Order ${orderId} escalated further`);
    }

    card.style.opacity = '0.4';
    setTimeout(() => loadEscalations(), 800);
  } catch (err) {
    showToast('Something went wrong — try again');
    allButtons.forEach(b => b.disabled = false);
    console.error(err);
  }
}

els.refreshBtn.addEventListener('click', loadEscalations);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

loadEscalations();
setInterval(loadEscalations, 60000); // auto-refresh every 60s
