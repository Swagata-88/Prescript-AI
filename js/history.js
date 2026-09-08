/**
 * PRESCRIPT AI — HISTORY CONTROLLER
 * Loads, filters, and searches through prescription history records.
 */

document.addEventListener('DOMContentLoaded', () => {
    initHistoryPage();
});

let allRecords = [];
let currentFilter = 'all';
let searchQuery = '';

async function initHistoryPage() {
    const searchInput = document.getElementById('history-search-input');
    const filterPills = document.querySelectorAll('.filter-pill');

    try {
        allRecords = await window.ApiService.getPrescriptionHistory();
    } catch (e) {
        allRecords = window.MOCK_DATA.history;
    }

    renderRecords();

    // Search input handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderRecords();
        });
    }

    // Filter pills handler
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter') || 'all';
            renderRecords();
        });
    });
}

function renderRecords() {
    const tableBody = document.getElementById('history-table-body');
    const emptyState = document.getElementById('history-empty-state');
    const tableContainer = document.getElementById('history-table-container');

    if (!tableBody) return;

    // Filter records
    const filtered = allRecords.filter(item => {
        const matchesSearch = item.id.toLowerCase().includes(searchQuery) ||
                              item.doctor.toLowerCase().includes(searchQuery) ||
                              item.date.toLowerCase().includes(searchQuery);

        const matchesFilter = currentFilter === 'all' ||
                              (currentFilter === 'processed' && item.status.toLowerCase() === 'processed') ||
                              (currentFilter === 'verification' && item.status.toLowerCase().includes('verification'));

        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    tableContainer.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    filtered.forEach(rx => {
        const isWarning = rx.status.toLowerCase().includes('verification');
        const badgeClass = isWarning ? 'badge-warning' : 'badge-success';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="flex items-center gap-3">
                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background-color: var(--surface-soft); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-style: italic; font-weight: bold; color: var(--primary-deep);">℞</div>
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary);">${rx.id}</div>
                        <div style="font-size: 0.775rem; color: var(--text-light);">${rx.doctor}</div>
                    </div>
                </div>
            </td>
            <td>
                <span style="color: var(--text-secondary);">${rx.date}</span>
            </td>
            <td>
                <span style="font-weight: 500;">${rx.medicinesCount} medicines</span>
            </td>
            <td>
                <span class="badge ${badgeClass}">
                    <span class="badge-dot"></span>
                    ${rx.status}
                </span>
            </td>
            <td style="text-align: right;">
                <a href="result.html?id=${rx.id}" class="btn btn-secondary btn-sm">
                    View
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}
