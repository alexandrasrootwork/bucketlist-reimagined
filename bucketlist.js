// --- Data ---
let bucketItems = [];
let currentFilter = 'all';

// Load from localStorage
function loadData() {
  const saved = localStorage.getItem('bucketList');
  if (saved) {
    bucketItems = JSON.parse(saved);
  } else {
    bucketItems = [
      { id: Date.now(), title: "Visit Japan", completed: false, notes: "", image: "", completedDate: null },
      { id: Date.now() + 1, title: "Learn to code", completed: true, notes: "Built this website!", image: "", completedDate: "2025-03-15" }
    ];
  }
  render();
}

function saveData() {
  localStorage.setItem('bucketList', JSON.stringify(bucketItems));
  render();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function getImagePath(path) {
  if (!path) return '';
  if (!path.startsWith('images/') && !path.startsWith('http') && !path.startsWith('data:')) {
    return 'images/' + path;
  }
  return path;
}

function render() {
  const container = document.getElementById('bucketContainer');
  if (!container) return;
  
  const infoBox = container.querySelector('.info-box');
  container.innerHTML = '';
  if (infoBox) container.appendChild(infoBox);
  
  let filtered = currentFilter === 'completed' ? bucketItems.filter(i => i.completed) : bucketItems.filter(i => !i.completed);
  
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.padding = '30px';
    empty.style.textAlign = 'center';
    empty.style.color = '#999';
    empty.innerHTML = currentFilter === 'completed' ? '✅ No completed items yet!' : '📝 No pending items — add something!';
    container.appendChild(empty);
  }
  
  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = `bucket-item ${item.completed ? 'completed' : ''}`;
    
    div.innerHTML = `
      <div class="item-header">
        <input type="checkbox" class="checkmark" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <span class="item-title ${item.completed ? 'completed-text' : ''}" data-id="${item.id}">${escapeHtml(item.title)}</span>
        <button class="delete-btn" data-id="${item.id}">✗</button>
      </div>
      <div class="item-details">
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${escapeHtml(item.completedDate)}</div>` : ''}
        ${item.notes ? `<div class="item-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        ${item.image ? `<img src="${getImagePath(item.image)}" class="item-image" data-fullsrc="${getImagePath(item.image)}">` : ''}
        <div>
          <button class="edit-btn" data-id="${item.id}" data-type="notes">✏️ Edit Notes</button>
          <button class="edit-btn" data-id="${item.id}" data-type="image">🖼️ Add Image</button>
          <button class="edit-btn" data-id="${item.id}" data-type="date">📅 Set Date</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  
  // Update status bar
  const total = bucketItems.length;
  const completedCount = bucketItems.filter(i => i.completed).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);
  document.getElementById('itemCount').innerText = `${filtered.length} item${filtered.length !== 1 ? 's' : ''} (${completedCount} completed)`;
  document.getElementById('progressPercent').innerText = percent + '%';
  document.getElementById('progressFill').style.width = percent + '%';
  
  // Attach events
  document.querySelectorAll('.checkmark').forEach(cb => {
    cb.addEventListener('change', e => toggleComplete(parseInt(e.target.dataset.id)));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => deleteItem(parseInt(e.target.dataset.id)));
  });
  document.querySelectorAll('.item-title').forEach(title => {
    title.addEventListener('click', e => editTitle(parseInt(title.dataset.id), title));
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => openEditPopup(parseInt(btn.dataset.id), btn.dataset.type));
  });
  document.querySelectorAll('.item-image').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src));
  });
}

function toggleComplete(id) {
  const item = bucketItems.find(i => i.id === id);
  if (item) {
    item.completed = !item.completed;
    if (item.completed) {
      item.completedDate = new Date().toISOString().split('T')[0];
    } else {
      item.completedDate = null;
    }
    saveData();
  }
}

function deleteItem(id) {
  if (confirm('Delete this item?')) {
    bucketItems = bucketItems.filter(i => i.id !== id);
    saveData();
  }
}

function editTitle(id, titleSpan) {
  const current = titleSpan.innerText;
  const input = document.createElement('input');
  input.value = current;
  input.style.width = '70%';
  input.style.padding = '2px 4px';
  titleSpan.style.display = 'none';
  titleSpan.parentNode.insertBefore(input, titleSpan);
  input.focus();
  
  function save() {
    if (input.value.trim()) {
      const item = bucketItems.find(i => i.id === id);
      if (item) item.title = input.value.trim();
      saveData();
    }
    input.remove();
    titleSpan.style.display = '';
  }
  
  input.addEventListener('blur', save);
  input.addEventListener('keypress', e => { if (e.key === 'Enter') save(); });
}

function openEditPopup(id, type) {
  const item = bucketItems.find(i => i.id === id);
  if (!item) return;
  
  if (type === 'notes') {
    const val = prompt('Edit notes:', item.notes || '');
    if (val !== null) item.notes = val;
  } else if (type === 'image') {
    const val = prompt('Image path (images/photo.jpg):', item.image || '');
    if (val !== null) item.image = val;
  } else if (type === 'date') {
    const val = prompt('Completed date (YYYY-MM-DD):', item.completedDate || '');
    if (val && item.completed) {
      item.completedDate = val;
    } else if (val && confirm('Mark as completed?')) {
      item.completed = true;
      item.completedDate = val;
    }
  }
  saveData();
}

function openLightbox(src) {
  const lb = document.createElement('div');
  lb.style.position = 'fixed';
  lb.style.top = '0';
  lb.style.left = '0';
  lb.style.width = '100%';
  lb.style.height = '100%';
  lb.style.background = 'rgba(0,0,0,0.9)';
  lb.style.zIndex = '10000';
  lb.style.display = 'flex';
  lb.style.justifyContent = 'center';
  lb.style.alignItems = 'center';
  lb.style.cursor = 'pointer';
  lb.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border:3px solid #c0c0c0;"><div style="position:absolute; top:20px; right:40px; background:#c0c0c0; padding:5px 12px; border:2px solid #fff; cursor:pointer;">✗</div>`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

function addItem() {
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemNotes').value = '';
  document.getElementById('itemImage').value = '';
  document.getElementById('itemModal').style.display = 'flex';
}

function saveNewItem() {
  const title = document.getElementById('itemTitle').value.trim();
  if (!title) { alert('Enter a title!'); return; }
  bucketItems.push({
    id: Date.now(),
    title: title,
    completed: false,
    notes: document.getElementById('itemNotes').value.trim(),
    image: document.getElementById('itemImage').value.trim(),
    completedDate: null
  });
  saveData();
  document.getElementById('itemModal').style.display = 'none';
}

function bulkAdd() {
  const input = prompt('Enter one item per line.\nUse | for notes: "Visit Japan | Cherry blossoms"');
  if (!input) return;
  const lines = input.split(/\r?\n/);
  let added = 0;
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    let title = line, notes = '';
    if (line.includes('|')) {
      const parts = line.split('|');
      title = parts[0].trim();
      notes = parts.slice(1).join('|').trim();
    }
    bucketItems.push({ id: Date.now() + added, title, completed: false, notes, image: '', completedDate: null });
    added++;
  });
  if (added) saveData();
}

function randomSuggestion() {
  const pending = bucketItems.filter(i => !i.completed);
  const body = document.getElementById('randomModalBody');
  if (!pending.length) {
    body.innerHTML = '<div style="text-align:center; padding:20px;">🎉 You\'ve completed everything! 🎉</div>';
    document.getElementById('randomModal').style.display = 'flex';
    return;
  }
  const r = pending[Math.floor(Math.random() * pending.length)];
  body.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:16px; margin-bottom:10px;">🎲 Try this:</div>
      <div style="font-size:14px; margin-bottom:10px;"><strong>${escapeHtml(r.title)}</strong></div>
      ${r.notes ? `<div style="font-size:11px; color:#555;">📝 ${escapeHtml(r.notes)}</div>` : ''}
      <button id="closeRandomBtn" class="retro-btn" style="margin-top:15px;">Close</button>
    </div>
  `;
  document.getElementById('randomModal').style.display = 'flex';
  document.getElementById('closeRandomBtn')?.addEventListener('click', () => {
    document.getElementById('randomModal').style.display = 'none';
  });
}

function exportData() {
  const data = JSON.stringify(bucketItems, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bucketlist-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported) && confirm(`Import ${imported.length} items? Replace current list.`)) {
          bucketItems = imported;
          saveData();
        }
      } catch(err) { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-option').forEach(el => {
    if (el.getAttribute('data-filter') === filter) el.classList.add('filter-active');
    else el.classList.remove('filter-active');
  });
  render();
}

function howToUse() {
  alert("📖 How to Use:\n\n• Click any title to edit it\n• Check the box to mark complete\n• File menu: Import/Export\n• View menu: Filter items\n• Click images to enlarge");
}

function about() {
  alert("📝 Bucket List\nVersion 2.0\n\nWindows 95-style personal hub.\nKeep dreaming, keep doing.");
}

function exit() {
  if (confirm('Close this window?')) window.location.href = 'index.html';
}

// Drag window
function makeDraggable() {
  const win = document.getElementById('mainWindow');
  const header = document.getElementById('windowTitleBar');
  if (!win || !header) return;
  let p1=0,p2=0,p3=0,p4=0;
  header.onmousedown = dragDown;
  function dragDown(e) { e.preventDefault(); p3 = e.clientX; p4 = e.clientY; document.onmouseup = closeDrag; document.onmousemove = drag; }
  function drag(e) { e.preventDefault(); p1 = p3 - e.clientX; p2 = p4 - e.clientY; p3 = e.clientX; p4 = e.clientY; win.style.top = (win.offsetTop - p2) + "px"; win.style.left = (win.offsetLeft - p1) + "px"; win.style.position = 'absolute'; }
  function closeDrag() { document.onmouseup = null; document.onmousemove = null; }
}

function makeModalDraggable(modalId, titleId) {
  const modal = document.getElementById(modalId);
  const header = document.getElementById(titleId);
  if (!modal || !header) return;
  let p1=0,p2=0,p3=0,p4=0;
  header.onmousedown = dragDown;
  function dragDown(e) { e.preventDefault(); p3 = e.clientX; p4 = e.clientY; document.onmouseup = closeDrag; document.onmousemove = drag; }
  function drag(e) { e.preventDefault(); p1 = p3 - e.clientX; p2 = p4 - e.clientY; p3 = e.clientX; p4 = e.clientY; modal.style.top = (modal.offsetTop - p2) + "px"; modal.style.left = (modal.offsetLeft - p1) + "px"; modal.style.position = 'absolute'; }
  function closeDrag() { document.onmouseup = null; document.onmousemove = null; }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  makeDraggable();
  makeModalDraggable('modalContent', 'modalTitleBar');
  makeModalDraggable('randomModalContent', 'randomModalTitleBar');
  
  document.getElementById('addItemMenu').addEventListener('click', addItem);
  document.getElementById('bulkAddMenu').addEventListener('click', bulkAdd);
  document.getElementById('exportMenu').addEventListener('click', exportData);
  document.getElementById('importMenu').addEventListener('click', importData);
  document.getElementById('exitMenu').addEventListener('click', exit);
  document.getElementById('randomMenu').addEventListener('click', randomSuggestion);
  document.getElementById('howToMenu').addEventListener('click', howToUse);
  document.getElementById('aboutMenu').addEventListener('click', about);
  document.getElementById('saveItemBtn').addEventListener('click', saveNewItem);
  document.getElementById('closeItemModal').addEventListener('click', () => {
    document.getElementById('itemModal').style.display = 'none';
  });
  document.getElementById('closeRandomModal').addEventListener('click', () => {
    document.getElementById('randomModal').style.display = 'none';
  });
  document.getElementById('minimizeBtn').addEventListener('click', exit);
  document.getElementById('closeBtn').addEventListener('click', exit);
  
  document.querySelectorAll('.filter-option').forEach(el => {
    el.addEventListener('click', () => setFilter(el.getAttribute('data-filter')));
  });
  
  document.getElementById('itemModal').addEventListener('click', e => {
    if (e.target === document.getElementById('itemModal')) {
      document.getElementById('itemModal').style.display = 'none';
    }
  });
  document.getElementById('randomModal').addEventListener('click', e => {
    if (e.target === document.getElementById('randomModal')) {
      document.getElementById('randomModal').style.display = 'none';
    }
  });
});
