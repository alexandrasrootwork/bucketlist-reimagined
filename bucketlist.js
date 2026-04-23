// --- Data storage ---
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

// Save to localStorage
function saveData() {
  localStorage.setItem('bucketList', JSON.stringify(bucketItems));
  render();
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Get image path
function getImagePath(path) {
  if (!path) return '';
  if (!path.startsWith('images/') && !path.startsWith('http') && !path.startsWith('data:')) {
    return 'images/' + path;
  }
  return path;
}

// Render all items
function render() {
  const container = document.getElementById('bucketContainer');
  if (!container) return;
  
  const infoBox = container.querySelector('.info-box');
  container.innerHTML = '';
  if (infoBox) container.appendChild(infoBox);
  
  let filtered = currentFilter === 'completed' ? bucketItems.filter(i => i.completed) : bucketItems.filter(i => !i.completed);
  
  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.padding = '20px';
    empty.style.textAlign = 'center';
    empty.style.color = '#999';
    empty.innerHTML = currentFilter === 'completed' ? '✅ No completed items yet!' : '📝 Add your first bucket list item!';
    container.appendChild(empty);
  }
  
  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = `bucket-item ${item.completed ? 'completed' : ''}`;
    const completedClass = item.completed ? 'completed-text' : '';
    const imagePath = getImagePath(item.image);
    
    div.innerHTML = `
      <div class="item-header">
        <input type="checkbox" class="checkmark" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <span class="item-title ${completedClass}" data-id="${item.id}">${escapeHtml(item.title)}</span>
        <button class="delete-btn" data-id="${item.id}">✗</button>
      </div>
      <div class="item-details">
        ${item.completedDate ? `<div class="completed-date">✅ Completed: ${escapeHtml(item.completedDate)}</div>` : ''}
        ${item.notes ? `<div class="item-notes">📝 ${escapeHtml(item.notes)}</div>` : ''}
        ${item.image ? `<img src="${escapeHtml(imagePath)}" class="item-image" data-fullsrc="${escapeHtml(imagePath)}">` : ''}
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
  document.getElementById('itemCount').innerText = `${filtered.length} items showing (${completedCount} completed)`;
  document.getElementById('progressPercent').innerText = percent + '%';
  document.getElementById('progressFill').style.width = percent + '%';
  
  // Attach events
  document.querySelectorAll('.checkmark').forEach(cb => {
    cb.addEventListener('change', (e) => toggleComplete(parseInt(e.target.dataset.id)));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteItem(parseInt(e.target.dataset.id)));
  });
  document.querySelectorAll('.item-title').forEach(title => {
    title.addEventListener('click', (e) => editTitle(parseInt(title.dataset.id), title));
  });
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openEditPopup(parseInt(btn.dataset.id), btn.dataset.type));
  });
  document.querySelectorAll('.item-image').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src));
  });
}

// Toggle complete status
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

// Delete item
function deleteItem(id) {
  if (confirm('Delete this item?')) {
    bucketItems = bucketItems.filter(i => i.id !== id);
    saveData();
  }
}

// Edit title inline
function editTitle(id, titleSpan) {
  const current = titleSpan.innerText;
  const input = document.createElement('input');
  input.value = current;
  input.style.width = '70%';
  input.style.padding = '2px 4px';
  titleSpan.style.display = 'none';
  titleSpan.parentNode.insertBefore(input, titleSpan);
  input.focus();
  
  function saveEdit() {
    if (input.value.trim()) {
      const item = bucketItems.find(i => i.id === id);
      if (item) item.title = input.value.trim();
      saveData();
    }
    input.remove();
    titleSpan.style.display = '';
  }
  
  input.addEventListener('blur', saveEdit);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveEdit(); });
}

// Open edit popup for notes/image/date
function openEditPopup(id, type) {
  const item = bucketItems.find(i => i.id === id);
  if (!item) return;
  
  if (type === 'notes') {
    const newNotes = prompt('Edit notes:', item.notes || '');
    if (newNotes !== null) item.notes = newNotes;
  } else if (type === 'image') {
    const newImage = prompt('Image path (e.g., images/photo.jpg):', item.image || '');
    if (newImage !== null) item.image = newImage;
  } else if (type === 'date') {
    const newDate = prompt('Completed date (YYYY-MM-DD):', item.completedDate || '');
    if (newDate && item.completed) {
      item.completedDate = newDate;
    } else if (newDate && confirm('Mark this item as completed?')) {
      item.completed = true;
      item.completedDate = newDate;
    }
  }
  saveData();
}

// Lightbox for images
function openLightbox(src) {
  const lightbox = document.createElement('div');
  lightbox.style.position = 'fixed';
  lightbox.style.top = '0';
  lightbox.style.left = '0';
  lightbox.style.width = '100%';
  lightbox.style.height = '100%';
  lightbox.style.background = 'rgba(0,0,0,0.9)';
  lightbox.style.zIndex = '10000';
  lightbox.style.display = 'flex';
  lightbox.style.justifyContent = 'center';
  lightbox.style.alignItems = 'center';
  lightbox.style.cursor = 'pointer';
  lightbox.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border:3px solid #c0c0c0;"><div style="position:absolute; top:20px; right:40px; color:white; font-size:30px; cursor:pointer; background:#c0c0c0; padding:5px 12px;">✗</div>`;
  lightbox.addEventListener('click', () => lightbox.remove());
  document.body.appendChild(lightbox);
}

// Add new item
function addItem() {
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemNotes').value = '';
  document.getElementById('itemImage').value = '';
  document.getElementById('itemModal').style.display = 'flex';
}

function saveNewItem() {
  const title = document.getElementById('itemTitle').value.trim();
  if (!title) {
    alert('Please enter a title!');
    return;
  }
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

// Bulk add
function bulkAdd() {
  const items = prompt('Enter one item per line.\nUse | for notes (e.g., "Visit Japan | Cherry blossoms")');
  if (!items) return;
  const lines = items.split(/\r?\n/);
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
    bucketItems.push({
      id: Date.now() + added,
      title: title,
      completed: false,
      notes: notes,
      image: '',
      completedDate: null
    });
    added++;
  });
  if (added > 0) saveData();
}

// Random suggestion
function randomSuggestion() {
  const pending = bucketItems.filter(i => !i.completed);
  const modalBody = document.getElementById('randomModalBody');
  
  if (pending.length === 0) {
    modalBody.innerHTML = '<div style="text-align:center; padding:20px;">🎉 You\'ve completed everything! 🎉</div>';
    document.getElementById('randomModal').style.display = 'flex';
    return;
  }
  
  const random = pending[Math.floor(Math.random() * pending.length)];
  modalBody.innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:16px; margin-bottom:10px;">🎲 Try this:</div>
      <div style="font-size:14px; margin-bottom:10px;"><strong>${escapeHtml(random.title)}</strong></div>
      ${random.notes ? `<div style="font-size:11px; color:#555; margin-top:5px;">📝 ${escapeHtml(random.notes)}</div>` : ''}
      <button id="closeRandomBtn" class="retro-button" style="margin-top:15px;">Close</button>
    </div>
  `;
  document.getElementById('randomModal').style.display = 'flex';
  document.getElementById('closeRandomBtn')?.addEventListener('click', () => {
    document.getElementById('randomModal').style.display = 'none';
  });
}

// Export data
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

// Import data
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (Array.isArray(imported) && confirm(`Import ${imported.length} items? This will replace your current list.`)) {
          bucketItems = imported;
          saveData();
        }
      } catch(err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Set filter
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-option').forEach(el => {
    if (el.getAttribute('data-filter') === filter) {
      el.classList.add('filter-active');
    } else {
      el.classList.remove('filter-active');
    }
  });
  render();
}

// How to use
function howToUse() {
  alert("📖 How to Use:\n\n• Click any title to edit it\n• Check the box to mark complete\n• Use File menu for Import/Export\n• View menu to filter items\n• Click images to enlarge");
}

// About
function about() {
  alert("📝 Bucket List Program\nVersion 2.0\n\nPart of your Windows 95-style personal hub.\nKeep dreaming, keep doing.");
}

// Exit to desktop
function exit() {
  if (confirm('Close this window? You will return to the desktop.')) {
    window.location.href = 'index.html';
  }
}

// --- Drag window function ---
function makeDraggable() {
  const windowEl = document.getElementById('mainWindow');
  const header = document.getElementById('windowTitleBar');
  if (!windowEl || !header) return;
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDrag;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    windowEl.style.top = (windowEl.offsetTop - pos2) + "px";
    windowEl.style.left = (windowEl.offsetLeft - pos1) + "px";
    windowEl.style.position = 'absolute';
  }
  
  function closeDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// --- Make modal draggable ---
function makeModalDraggable(modalId, titleId) {
  const modal = document.getElementById(modalId);
  const header = document.getElementById(titleId);
  if (!modal || !header) return;
  
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;
  
  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDrag;
    document.onmousemove = elementDrag;
  }
  
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    modal.style.top = (modal.offsetTop - pos2) + "px";
    modal.style.left = (modal.offsetLeft - pos1) + "px";
    modal.style.position = 'absolute';
  }
  
  function closeDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// --- Initialize everything when page loads ---
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  makeDraggable();
  makeModalDraggable('itemModalContent', 'itemModalTitleBar');
  makeModalDraggable('randomModalContent', 'randomModalTitleBar');
  
  // Menu event listeners
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
  
  // Filter options
  document.querySelectorAll('.filter-option').forEach(el => {
    el.addEventListener('click', () => setFilter(el.getAttribute('data-filter')));
  });
  
  // Close modals when clicking outside
  document.getElementById('itemModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('itemModal')) {
      document.getElementById('itemModal').style.display = 'none';
    }
  });
  document.getElementById('randomModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('randomModal')) {
      document.getElementById('randomModal').style.display = 'none';
    }
  });
});
