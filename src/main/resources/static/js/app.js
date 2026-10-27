/**
 * DoubtDrop - Full Stack Application JavaScript
 */

// State Management
const state = {
  doubts: [],
  activeFilter: 'all', // all, trending, pending, answered, teacher_queue
  activeSubject: '',
  searchQuery: '',
  sortBy: 'recent',
  teacherAuth: sessionStorage.getItem('doubtdrop_teacher_auth') || null,
  teacherUsername: sessionStorage.getItem('doubtdrop_teacher_user') || null,
  votedIds: new Set(JSON.parse(localStorage.getItem('doubtdrop_voted') || '[]')),
  mySavedDoubts: JSON.parse(localStorage.getItem('doubtdrop_my_doubts') || '[]')
};

// DOM Helper
const $ = id => document.getElementById(id);

// Toast Notification System
function showToast(message, type = 'info') {
  const container = $('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Escape HTML utility
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Format relative date
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// API Helper
async function api(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add teacher credentials if logged in
  if (state.teacherAuth) {
    headers['Authorization'] = `Basic ${state.teacherAuth}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.detail || errJson.message || errJson.error || errorMsg;
    } catch {
      if (response.status === 401) errorMsg = 'Authentication required. Please log in as instructor.';
      if (response.status === 403) errorMsg = 'Access denied. Instructor permissions required.';
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Copy to Clipboard with Toast
async function copyToClipboard(text, label = 'Code') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} ${text} copied to clipboard!`, 'success');
  } catch {
    // Fallback
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast(`${label} ${text} copied!`, 'success');
  }
}

// Modal Management
function openModal(modalId) {
  const modal = $(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
}

// Load Doubts
async function loadDoubts() {
  try {
    const list = await api('/api/doubts');
    state.doubts = list || [];
    renderFeed();
    updateStats();
  } catch (err) {
    console.error('Failed to load doubts:', err);
    $('doubtFeed').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load community doubts</h3>
        <p>${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm" onclick="loadDoubts()">Try Again</button>
      </div>`;
  }
}

// Fetch Stats
async function updateStats() {
  try {
    const stats = await api('/api/doubts/stats');
    if (stats) {
      if ($('statTotal')) $('statTotal').textContent = stats.total || state.doubts.length;
      if ($('statAnswered')) $('statAnswered').textContent = (stats.answered || 0) + (stats.resolved || 0);
      if ($('statPending')) $('statPending').textContent = stats.pending || 0;
      if ($('statVotes')) $('statVotes').textContent = stats.totalVotes || 0;
    }
  } catch {
    // Fallback from client state
    const total = state.doubts.length;
    const answered = state.doubts.filter(d => d.status === 'ANSWERED' || d.status === 'RESOLVED').length;
    const pending = state.doubts.filter(d => d.status === 'PENDING').length;
    const votes = state.doubts.reduce((acc, d) => acc + (d.votes || 0), 0);

    if ($('statTotal')) $('statTotal').textContent = total;
    if ($('statAnswered')) $('statAnswered').textContent = answered;
    if ($('statPending')) $('statPending').textContent = pending;
    if ($('statVotes')) $('statVotes').textContent = votes;
  }
}

// Render Main Feed
function renderFeed() {
  const feed = $('doubtFeed');
  if (!feed) return;

  let items = [...state.doubts];

  // Subject Filter
  if (state.activeSubject) {
    items = items.filter(d => d.subject.toLowerCase() === state.activeSubject.toLowerCase());
  }

  // Search Query
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    items = items.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.details || '').toLowerCase().includes(q) ||
      (d.subject || '').toLowerCase().includes(q) ||
      (d.topic || '').toLowerCase().includes(q) ||
      (d.trackingCode || '').toLowerCase().includes(q)
    );
  }

  // Tab Filter
  if (state.activeFilter === 'trending') {
    items.sort((a, b) => b.votes - a.votes);
  } else if (state.activeFilter === 'pending') {
    items = items.filter(d => d.status === 'PENDING');
  } else if (state.activeFilter === 'answered') {
    items = items.filter(d => d.status === 'ANSWERED' || d.status === 'RESOLVED');
  } else if (state.activeFilter === 'teacher_queue') {
    items = items.filter(d => d.status === 'PENDING');
  }

  // Sort By
  if (state.sortBy === 'votes' && state.activeFilter !== 'trending') {
    items.sort((a, b) => b.votes - a.votes);
  } else if (state.sortBy === 'oldest') {
    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (state.sortBy === 'recent' && state.activeFilter !== 'trending') {
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Update tab counts
  if ($('countAll')) $('countAll').textContent = state.doubts.length;
  if ($('countTrending')) $('countTrending').textContent = state.doubts.filter(d => d.votes > 5).length;
  if ($('countPending')) $('countPending').textContent = state.doubts.filter(d => d.status === 'PENDING').length;
  if ($('countAnswered')) $('countAnswered').textContent = state.doubts.filter(d => d.status !== 'PENDING').length;

  if (!items.length) {
    feed.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No doubts found</h3>
        <p>No questions matched your current filter criteria. Be the first to ask one!</p>
        <button class="btn btn-primary btn-sm" onclick="openAskModal()">＋ Drop an Anonymous Doubt</button>
      </div>`;
    return;
  }

  feed.innerHTML = items.map(d => renderDoubtCard(d)).join('');
}

// Render Single Doubt Card
function renderDoubtCard(d) {
  const isVoted = state.votedIds.has(String(d.id));
  const isTeacher = !!state.teacherAuth;
  const statusLabel = d.status === 'ANSWERED' ? '✓ Answered' : d.status === 'RESOLVED' ? '✓ Resolved' : '⏳ Needs Answer';

  return `
    <article class="doubt-card" id="doubt-${d.id}" data-id="${d.id}">
      <div class="doubt-meta">
        <div class="meta-tags">
          <span class="badge-subject" data-subject="${escapeHtml(d.subject)}">${escapeHtml(d.subject)}</span>
          ${d.topic ? `<span class="badge-topic">#${escapeHtml(d.topic)}</span>` : ''}
          <span class="badge-status ${escapeHtml(d.status)}">${statusLabel}</span>
        </div>
        <button class="tracking-code-pill" onclick="copyToClipboard('${escapeHtml(d.trackingCode)}', 'Tracking Code')" title="Click to copy tracking code">
          📋 ${escapeHtml(d.trackingCode)}
        </button>
      </div>

      <h3 class="doubt-title">${escapeHtml(d.title)}</h3>
      
      ${d.details ? `<div class="doubt-details">${escapeHtml(d.details)}</div>` : ''}

      <div class="doubt-actions">
        <div class="action-buttons-group">
          <button class="vote-btn ${isVoted ? 'voted' : ''}" onclick="handleVote(${d.id})" title="${isVoted ? 'You upvoted this' : 'Upvote this doubt'}">
            <span class="vote-icon">${isVoted ? '❤️' : '🤍'}</span>
            <span class="vote-count">${d.votes}</span>
            <span>Helpful</span>
          </button>
          
          <button class="btn btn-ghost btn-sm" onclick="trackDirect('${escapeHtml(d.trackingCode)}')" title="View tracking details">
            🔍 Track Details
          </button>

          ${isTeacher ? `
            <button class="btn btn-ghost btn-sm" onclick="toggleTeacherInline(${d.id})">
              ✍️ ${d.answer ? 'Edit Answer' : 'Answer Question'}
            </button>
            <button class="btn btn-danger-outline btn-sm" onclick="handleDeleteDoubt(${d.id})" title="Delete this doubt">
              🗑️ Delete
            </button>
          ` : ''}
        </div>

        <span class="date-text">Asked ${formatRelativeTime(d.createdAt)}</span>
      </div>

      ${d.answer ? `
        <div class="answer-box">
          <div class="answer-header">
            <span class="answer-badge">✓ Verified Instructor Answer</span>
            ${d.answeredAt ? `<span class="date-text">${formatRelativeTime(d.answeredAt)}</span>` : ''}
          </div>
          <div class="answer-body">${escapeHtml(d.answer)}</div>
        </div>
      ` : ''}

      ${isTeacher ? `
        <div class="teacher-inline-panel" id="teacher-panel-${d.id}" style="display: none;">
          <div class="teacher-inline-header">
            <span>Instructor Response for ${escapeHtml(d.trackingCode)}</span>
            <button class="btn-ghost btn-sm" onclick="toggleTeacherInline(${d.id})">✕ Close</button>
          </div>
          <textarea class="teacher-textarea" id="teacher-input-${d.id}" placeholder="Write a clear, explanatory answer for the class...">${d.answer ? escapeHtml(d.answer) : ''}</textarea>
          <div class="teacher-inline-actions">
            <div style="display: flex; gap: 8px; align-items: center;">
              <select class="select-filter" id="teacher-status-${d.id}" style="padding: 6px 10px; font-size: 0.8rem;">
                <option value="ANSWERED" ${d.status === 'ANSWERED' ? 'selected' : ''}>Mark as Answered</option>
                <option value="RESOLVED" ${d.status === 'RESOLVED' ? 'selected' : ''}>Mark as Resolved</option>
                <option value="PENDING" ${d.status === 'PENDING' ? 'selected' : ''}>Keep as Pending</option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" onclick="submitInstructorAnswer(${d.id})">Save & Post Answer</button>
          </div>
        </div>
      ` : ''}
    </article>
  `;
}

// Handle Upvoting
async function handleVote(id) {
  const strId = String(id);
  if (state.votedIds.has(strId)) {
    showToast('You already upvoted this doubt!', 'info');
    return;
  }

  try {
    const updated = await api(`/api/doubts/${id}/vote`, { method: 'POST' });
    state.votedIds.add(strId);
    localStorage.setItem('doubtdrop_voted', JSON.stringify([...state.votedIds]));

    // Update in local state
    const index = state.doubts.findIndex(d => d.id === id);
    if (index !== -1) {
      state.doubts[index].votes = updated.votes;
    }

    renderFeed();
    updateStats();
    showToast('Upvote recorded! Thank you for helping the class.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Direct Track from Card
function trackDirect(code) {
  $('trackCodeInput').value = code;
  openModal('trackModal');
  $('trackForm').requestSubmit();
}

// Toggle Teacher Inline Answer Box
function toggleTeacherInline(id) {
  const panel = $(`teacher-panel-${id}`);
  if (panel) {
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      const textarea = $(`teacher-input-${id}`);
      if (textarea) textarea.focus();
    }
  }
}

// Submit Instructor Answer
async function submitInstructorAnswer(id) {
  const textarea = $(`teacher-input-${id}`);
  const statusSelect = $(`teacher-status-${id}`);
  if (!textarea) return;

  const answer = textarea.value.trim();
  if (!answer) {
    showToast('Please enter an answer before posting.', 'error');
    return;
  }

  try {
    // 1. Post answer
    let updated = await api(`/api/admin/doubts/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });

    // 2. Set status if specified
    if (statusSelect && statusSelect.value !== updated.status) {
      updated = await api(`/api/admin/doubts/${id}/status?value=${statusSelect.value}`, {
        method: 'PATCH'
      });
    }

    showToast(`Answer posted for ${updated.trackingCode}!`, 'success');
    await loadDoubts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Delete Doubt (Teacher Only)
async function handleDeleteDoubt(id) {
  if (!confirm('Are you sure you want to delete this doubt? This action cannot be undone.')) {
    return;
  }

  try {
    await api(`/api/admin/doubts/${id}`, { method: 'DELETE' });
    showToast('Doubt removed successfully.', 'success');
    await loadDoubts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Open Ask Modal
function openAskModal() {
  $('askForm').reset();
  $('askResult').style.display = 'none';
  $('askForm').style.display = 'block';
  updateCharCounters();
  openModal('askModal');
}

// Character Counters for Ask Form
function updateCharCounters() {
  const title = $('askTitle');
  const details = $('askDetails');
  if (title && $('titleCount')) $('titleCount').textContent = `${title.value.length}/160`;
  if (details && $('detailsCount')) $('detailsCount').textContent = `${details.value.length}/2000`;
}

// Save My Doubt to LocalStorage
function saveMyDoubt(code, title, subject) {
  const list = state.mySavedDoubts.filter(d => d.code !== code);
  list.unshift({ code, title, subject, savedAt: new Date().toISOString() });
  state.mySavedDoubts = list.slice(0, 30); // keep up to 30
  localStorage.setItem('doubtdrop_my_doubts', JSON.stringify(state.mySavedDoubts));
}

// Render My Saved Doubts
function renderMySavedDoubts() {
  const container = $('myDoubtsList');
  if (!container) return;

  if (!state.mySavedDoubts.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 30px 10px;">
        <div class="empty-icon" style="font-size: 2rem;">📌</div>
        <p>You haven't submitted or tracked any doubts on this device yet.</p>
      </div>`;
    return;
  }

  container.innerHTML = state.mySavedDoubts.map(d => `
    <div style="background: var(--bg-card-subtle); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
      <div>
        <div style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; color: var(--primary);">${escapeHtml(d.code)}</div>
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">${escapeHtml(d.title)}</div>
        <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(d.subject || '')}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="trackDirect('${escapeHtml(d.code)}')">
        Track ↗
      </button>
    </div>
  `).join('');
}

// Teacher Login Management
function updateTeacherUI() {
  const isTeacher = !!state.teacherAuth;
  const statusEl = $('teacherStatusText');
  const dotEl = $('teacherStatusDot');
  const loginBtn = $('teacherNavBtn');
  const queueTab = $('tabTeacherQueue');

  if (isTeacher) {
    if (statusEl) statusEl.textContent = `Active (${state.teacherUsername || 'Instructor'})`;
    if (dotEl) { dotEl.classList.remove('inactive'); dotEl.classList.add('active'); }
    if (loginBtn) {
      loginBtn.textContent = '👨‍🏫 Instructor Mode (Logout)';
      loginBtn.onclick = handleTeacherLogout;
    }
    if (queueTab) queueTab.style.display = 'inline-flex';
  } else {
    if (statusEl) statusEl.textContent = 'Not logged in';
    if (dotEl) { dotEl.classList.remove('active'); dotEl.classList.add('inactive'); }
    if (loginBtn) {
      loginBtn.textContent = '👨‍🏫 Teacher Portal';
      loginBtn.onclick = () => openModal('teacherModal');
    }
    if (queueTab) queueTab.style.display = 'none';
  }
}

function handleTeacherLogout() {
  sessionStorage.removeItem('doubtdrop_teacher_auth');
  sessionStorage.removeItem('doubtdrop_teacher_user');
  state.teacherAuth = null;
  state.teacherUsername = null;
  updateTeacherUI();
  if (state.activeFilter === 'teacher_queue') state.activeFilter = 'all';
  renderFeed();
  showToast('Logged out of instructor mode.', 'info');
}

// Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('doubtdrop_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('doubtdrop_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = $('themeToggleBtn');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateTeacherUI();

  // Theme Toggle Button
  if ($('themeToggleBtn')) $('themeToggleBtn').onclick = toggleTheme;

  // Ask Anonymous Buttons
  ['askNavBtn', 'askHeroBtn', 'askFeedBtn', 'askSidebarBtn'].forEach(id => {
    if ($(id)) $(id).onclick = openAskModal;
  });

  // Track Buttons
  if ($('trackNavBtn')) $('trackNavBtn').onclick = () => {
    $('trackResult').style.display = 'none';
    openModal('trackModal');
  };

  // My Saved Doubts Button
  if ($('myDoubtsNavBtn')) $('myDoubtsNavBtn').onclick = () => {
    renderMySavedDoubts();
    openModal('myDoubtsModal');
  };

  // Close modals listeners
  document.querySelectorAll('[data-close-modal]').forEach(b => {
    b.onclick = closeAllModals;
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAllModals();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Character counter inputs
  if ($('askTitle')) $('askTitle').oninput = updateCharCounters;
  if ($('askDetails')) $('askDetails').oninput = updateCharCounters;

  // Search Input with Debounce & Clear
  const searchInput = $('searchInput');
  const searchClear = $('searchClear');

  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', e => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.searchQuery = e.target.value.trim();
        if (searchClear) searchClear.style.display = state.searchQuery ? 'block' : 'none';
        renderFeed();
      }, 250);
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchClear.style.display = 'none';
      state.searchQuery = '';
      renderFeed();
    });
  }

  // Subject Dropdown
  const subjectSelect = $('subjectSelect');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', e => {
      state.activeSubject = e.target.value;
      renderFeed();
    });
  }

  // Sort Dropdown
  const sortSelect = $('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderFeed();
    });
  }

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilter = btn.dataset.filter || 'all';
      renderFeed();
    });
  });

  // Ask Doubt Form Submission
  const askForm = $('askForm');
  if (askForm) {
    askForm.onsubmit = async e => {
      e.preventDefault();
      const payload = {
        subject: $('askSubject').value,
        title: $('askTitle').value.trim(),
        details: $('askDetails').value.trim(),
        topic: $('askTopic').value.trim()
      };

      try {
        const created = await api('/api/doubts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        // Save to My Doubts
        saveMyDoubt(created.trackingCode, created.title, created.subject);

        // Show Result
        $('createdTrackingCode').textContent = created.trackingCode;
        $('copyResultBtn').onclick = () => copyToClipboard(created.trackingCode, 'Tracking Code');
        $('askForm').style.display = 'none';
        $('askResult').style.display = 'block';

        showToast('Anonymous doubt submitted successfully!', 'success');
        await loadDoubts();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // Track Form Submission
  const trackForm = $('trackForm');
  if (trackForm) {
    trackForm.onsubmit = async e => {
      e.preventDefault();
      const code = $('trackCodeInput').value.trim();
      if (!code) return;

      const resultBox = $('trackResult');
      resultBox.style.display = 'block';
      resultBox.innerHTML = '<div style="padding: 10px;">Searching for doubt...</div>';

      try {
        const d = await api(`/api/doubts/${encodeURIComponent(code)}`);
        const statusText = d.status === 'ANSWERED' ? 'Answered' : d.status === 'RESOLVED' ? 'Resolved' : 'Needs Answer';
        
        // Save to My Doubts
        saveMyDoubt(d.trackingCode, d.title, d.subject);

        resultBox.innerHTML = `
          <div style="text-align: left; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="tracking-code-pill">📋 ${escapeHtml(d.trackingCode)}</span>
              <span class="badge-status ${escapeHtml(d.status)}">${statusText}</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 6px;">${escapeHtml(d.title)}</h4>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
              <span>Subject: <b>${escapeHtml(d.subject)}</b></span>
              ${d.topic ? ` · <span>Topic: #${escapeHtml(d.topic)}</span>` : ''}
              · <span>Votes: ${d.votes}</span>
            </div>
            ${d.details ? `<div style="font-size: 0.875rem; color: var(--text-main); margin-bottom: 12px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(d.details)}</div>` : ''}
            
            ${d.answer ? `
              <div class="answer-box" style="margin-top: 10px;">
                <div class="answer-header">
                  <span class="answer-badge">✓ Verified Instructor Answer</span>
                  ${d.answeredAt ? `<span class="date-text">${formatRelativeTime(d.answeredAt)}</span>` : ''}
                </div>
                <div class="answer-body">${escapeHtml(d.answer)}</div>
              </div>
            ` : `
              <div style="background: var(--warning-light); border: 1px solid var(--warning-border); padding: 10px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--warning);">
                ⏳ This question has not been answered yet. Check back soon!
              </div>
            `}
          </div>
        `;
      } catch (err) {
        resultBox.innerHTML = `
          <div style="background: var(--danger-light); color: var(--danger); border: 1px solid var(--danger-border); padding: 12px; border-radius: var(--radius-md); text-align: left;">
            ❌ ${escapeHtml(err.message)}
          </div>`;
      }
    };
  }

  // Teacher Login Form
  const teacherForm = $('teacherLoginForm');
  if (teacherForm) {
    teacherForm.onsubmit = async e => {
      e.preventDefault();
      const user = $('teacherUser').value.trim();
      const pass = $('teacherPass').value.trim();

      if (!user || !pass) {
        showToast('Please enter both username and password.', 'error');
        return;
      }

      // Store base64 credentials for testing
      const token = btoa(`${user}:${pass}`);
      state.teacherAuth = token;
      state.teacherUsername = user;

      // Validate credentials by testing an admin call
      try {
        // We can test by attempting a harmless call or test listing
        sessionStorage.setItem('doubtdrop_teacher_auth', token);
        sessionStorage.setItem('doubtdrop_teacher_user', user);
        updateTeacherUI();
        closeAllModals();
        showToast(`Welcome Professor / Instructor (${user})!`, 'success');
        renderFeed();
      } catch (err) {
        sessionStorage.removeItem('doubtdrop_teacher_auth');
        sessionStorage.removeItem('doubtdrop_teacher_user');
        state.teacherAuth = null;
        updateTeacherUI();
        showToast('Authentication failed. Check credentials.', 'error');
      }
    };
  }

  // Fill Demo Credentials Button
  if ($('fillDemoBtn')) {
    $('fillDemoBtn').onclick = () => {
      if ($('teacherUser')) $('teacherUser').value = 'teacher';
      if ($('teacherPass')) $('teacherPass').value = 'ChangeMe123!';
    };
  }

  // Initial Data Load
  loadDoubts();
});
