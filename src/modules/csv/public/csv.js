// Frontend
// Handles user listing, filtering, and selection

let allUsers = [];
let currentFilter = 'all';
let selectedUsers = new Set();
let editingUserId = null;

function getCheckedUserCheckboxes() {
    return Array.from(document.querySelectorAll('.user-checkbox:checked'));
}

function getSelectedUserIds() {
    const ids = getCheckedUserCheckboxes()
        .map((checkbox) => checkbox.dataset.userId || checkbox.getAttribute('data-user-id'))
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value > 0);

    return Array.from(new Set(ids));
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadUsers('all');
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter button
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');

    filterBtn.addEventListener('click', () => {
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Filter options
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const filter = e.target.dataset.filter;
            filterBtn.textContent = `Filter: ${filter.charAt(0).toUpperCase() + filter.slice(1)}`;
            filterDropdown.style.display = 'none';
            currentFilter = filter;
            selectedUsers.clear();
            document.getElementById('selectAllCheckbox').checked = false;
            loadUsers(filter);
        });
    });

    // Select All Checkbox
    document.getElementById('selectAllCheckbox').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            const userId = checkbox.dataset.userId;
            if (isChecked) {
                selectedUsers.add(userId);
            } else {
                selectedUsers.delete(userId);
            }
        });
    });

    // Action buttons
    document.getElementById('editUserBtn').addEventListener('click', () => {
        const checked = getCheckedUserCheckboxes();

        if (checked.length === 0) {
            alert('Please select one user to edit');
            return;
        }
        if (checked.length > 1) {
            alert('Please select only one user to edit');
            return;
        }

        const selectedCheckbox = checked[0];
        const selectedId = Number.parseInt(selectedCheckbox.dataset.userId, 10);
        const selectedUser = Number.isInteger(selectedId) ? {
            userId: selectedId,
            firstname: selectedCheckbox.dataset.firstname || '',
            lastname: selectedCheckbox.dataset.lastname || '',
            position: selectedCheckbox.dataset.position || 'Player',
            status: selectedCheckbox.dataset.status || 'Active',
            riotId: selectedCheckbox.dataset.riotId || '',
            primaryRoleId: selectedCheckbox.dataset.primaryRoleId || '',
            secondaryRoleId: selectedCheckbox.dataset.secondaryRoleId || ''
        } : null;

        if (!selectedUser) {
            alert('Selected user could not be found. Please refresh and try again.');
            return;
        }

        showEditUserModal(selectedUser);
    });

    document.getElementById('deactivateBtn').addEventListener('click', () => {
        const selectedIds = getSelectedUserIds();
        if (selectedIds.length === 0) {
            alert('Please select at least one user to deactivate');
            return;
        }
        deactivateSelectedUsers(selectedIds);
    });

    // Add user dropdown handling
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserDropdown = document.getElementById('addUserDropdown');
    const csvUploadInput = document.getElementById('csvUploadInput');

    addUserBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addUserDropdown.style.display = addUserDropdown.style.display === 'none' ? 'block' : 'none';
    });

    csvUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleCsvFile(file);
        }
    });

    // Dropdown option clicks
    document.querySelectorAll('.add-user-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            addUserDropdown.style.display = 'none';
            if (action === 'upload') {
                csvUploadInput.value = null;
                csvUploadInput.click();
            } else if (action === 'download') {
                downloadCsvTemplate();
            } else if (action === 'manual') {
                // show manual registration modal instead of leaving page
                showManualRegisterModal();
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const filterDropdown = document.getElementById('filterDropdown');
        const filterBtn = document.getElementById('filterBtn');
        const addUserDropdownEl = document.getElementById('addUserDropdown');
        const addUserBtnEl = document.getElementById('addUserBtn');
        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.style.display = 'none';
        }
        if (!addUserBtnEl.contains(e.target) && !addUserDropdownEl.contains(e.target)) {
            addUserDropdownEl.style.display = 'none';
        }
    });

    // manual registration modal buttons
    const manualModal = document.getElementById('manualRegisterModal');
    const manualSubmit = document.getElementById('manualSubmitBtn');
    const manualCancel = document.getElementById('manualCancelBtn');
    const manualClose = document.getElementById('manualCloseBtn');
    const manualPosition = document.getElementById('manualPosition');
    const manualRoleFields = document.getElementById('manualRoleFields');
    const manualPrimaryRole = document.getElementById('manualPrimaryRoleId');

    const syncManualRoleFields = () => {
        const showRoles = manualPosition.value === 'Player';
        manualRoleFields.style.display = showRoles ? 'block' : 'none';
        manualPrimaryRole.required = showRoles;
    };

    manualPosition.addEventListener('change', syncManualRoleFields);
    syncManualRoleFields();

    const closeManual = () => { manualModal.style.display = 'none'; };
    manualCancel.addEventListener('click', (e) => { e.preventDefault(); closeManual(); });
    manualClose.addEventListener('click', (e) => { e.preventDefault(); closeManual(); });
    manualModal.addEventListener('click', (e) => {
        if (e.target === manualModal) closeManual();
    });

    manualSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        await registerManualUser();
    });

    // edit user modal buttons
    const editModal = document.getElementById('editUserModal');
    const editSaveBtn = document.getElementById('editSaveBtn');
    const editCancelBtn = document.getElementById('editCancelBtn');
    const editCloseBtn = document.getElementById('editCloseBtn');

    document.getElementById('editPosition').addEventListener('change', syncEditPlayerFields);

    const closeEdit = () => {
        editModal.style.display = 'none';
        delete editModal.dataset.userId;
        editingUserId = null;
    };

    editCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeEdit();
    });

    editCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeEdit();
    });

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEdit();
        }
    });

    editSaveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveEditedUser();
    });
}

// show/hide the player-specific fields in the edit modal based on selected position
function syncEditPlayerFields() {
    const position = document.getElementById('editPosition').value;
    const playerFields = document.getElementById('editPlayerFields');
    playerFields.style.display = position === 'Player' ? 'block' : 'none';
}

// show modal for editing selected user position and status
function showEditUserModal(user) {
    const modal = document.getElementById('editUserModal');
    const editablePositions = new Set(['Team Manager', 'Team Coach', 'Player']);
    const positionValue = editablePositions.has(user.position) ? user.position : 'Player';
    editingUserId = String(user.userId);
    modal.dataset.userId = editingUserId;
    document.getElementById('editUserName').textContent = `Editing: ${user.firstname} ${user.lastname} (ID: ${user.userId})`;
    document.getElementById('editPosition').value = positionValue;
    document.getElementById('editStatus').value = user.status;
    document.getElementById('editRiotId').value = user.riotId || '';
    document.getElementById('editPrimaryRoleId').value = user.primaryRoleId || '1';
    document.getElementById('editSecondaryRoleId').value = user.secondaryRoleId || '';
    syncEditPlayerFields();
    modal.style.display = 'flex';
}

// save edited position and status for one user
async function saveEditedUser() {
    const modal = document.getElementById('editUserModal');
    const checked = getCheckedUserCheckboxes();
    const candidateUserId = modal.dataset.userId || editingUserId || (checked[0] && checked[0].dataset.userId);
    const parsedUserId = Number.parseInt(candidateUserId, 10);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        alert('No user selected for editing');
        return;
    }

    const payload = {
        position: document.getElementById('editPosition').value,
        status: document.getElementById('editStatus').value
    };

    if (payload.position === 'Player') {
        const primaryRoleId = document.getElementById('editPrimaryRoleId').value;
        if (!primaryRoleId) {
            alert('Primary role is required when position is Player');
            return;
        }
        payload.primaryRoleId = primaryRoleId;
        payload.secondaryRoleId = document.getElementById('editSecondaryRoleId').value || null;
        payload.riotId = document.getElementById('editRiotId').value.trim() || null;
    }

    try {
        const response = await fetch(`/team_management/api/users/${parsedUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || 'Error updating user');
            return;
        }

        alert(result.message || 'User updated successfully');
        modal.style.display = 'none';
        delete modal.dataset.userId;
        editingUserId = null;
        selectedUsers.clear();
        document.getElementById('selectAllCheckbox').checked = false;
        await loadUsers(currentFilter);
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user. Please try again.');
    }
}

// Trigger download of a CSV template with headers matching registration fields
function downloadCsvTemplate() {
    const headers = [
        'Full Name',
        'Riot ID',
        'Position (Team Manager/Team Coach/Player)',
        'Status (Active/Inactive/Deactivated)',
        'Email',
        'Discord',
        'Primary Role (Top/Jungle/Mid/AD Carry/Support)',
        'Secondary Role (Top/Jungle/Mid/AD Carry/Support)'
    ];

    const examples = [
        ['John Manager', 'ManagerOne#1111', 'Team Manager', 'Active', 'manager@example.com', 'Manager#1111', '', '']
    ];

    const csvContent = [headers.join(','), ...examples.map((row) => row.join(','))].join('\n') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teamforge_user_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// show modal for manual registration
function showManualRegisterModal() {
    const modal = document.getElementById('manualRegisterModal');
    // clear existing inputs
    document.getElementById('manualFullName').value = '';
    document.getElementById('manualRiotId').value = '';
    document.getElementById('manualPosition').value = 'Player';
    document.getElementById('manualPrimaryRoleId').value = '1';
    document.getElementById('manualSecondaryRoleId').value = '';
    document.getElementById('manualStatus').value = 'Active';
    document.getElementById('manualEmail').value = '';
    document.getElementById('manualDiscord').value = '';
    document.getElementById('manualRoleFields').style.display = 'block';
    modal.style.display = 'flex';
}

// gather manual form values, validate and call server
async function registerManualUser() {
    const fullName = document.getElementById('manualFullName').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    if (!fullName || !email) {
        alert('Full Name and Email are required');
        return;
    }
    const discord = document.getElementById('manualDiscord').value.trim();
    const position = document.getElementById('manualPosition').value;
    const needsRoles = position === 'Player';
    const riotId = document.getElementById('manualRiotId').value.trim();
    const primaryRoleRaw = document.getElementById('manualPrimaryRoleId').value;
    const secondaryRoleRaw = document.getElementById('manualSecondaryRoleId').value;

    if (needsRoles && !primaryRoleRaw) {
        alert('Primary role is required for players');
        return;
    }

    if (needsRoles && !riotId) {
        alert('Riot ID is required for players');
        return;
    }

    if (riotId) {
        const riotIdParts = riotId.split('#');
        if (riotIdParts.length !== 2 || !riotIdParts[0].trim() || !riotIdParts[1].trim()) {
            alert('Riot ID must use the format gameName#tagLine');
            return;
        }
    }

    const nameParts = fullName.split(' ').filter(Boolean);
    const firstname = nameParts.shift();
    const lastname = nameParts.join(' ') || '';
    const payload = {
        email,
        firstname,
        lastname,
        riotId,
        position,
        discord: document.getElementById('manualDiscord').value.trim(),
        status: document.getElementById('manualStatus').value,
        profilePhoto: 'defaultusericon.png'
    };

    if (needsRoles) {
        payload.primaryroleid = Number.parseInt(primaryRoleRaw, 10);
        payload.secondaryroleid = secondaryRoleRaw ? Number.parseInt(secondaryRoleRaw, 10) : null;
    }

    try {
        const res = await fetch('/api/v1/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.status === 201) {
            alert('User registered successfully');
            document.getElementById('manualRegisterModal').style.display = 'none';
            loadUsers(currentFilter);
        } else {
            const json = await res.json().catch(() => ({}));
            alert('Registration failed: ' + (json.message || `Status ${res.status}`));
        }
    } catch (err) {
        alert('Error registering user: ' + err.message);
    }
}

// Handle CSV file upload: parse and submit rows to registration endpoint
function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0 || rows.length === 0) {
            alert('CSV file appears to be empty or invalid');
            return;
        }

        // Normalize header names to lowercase for matching.
        const normalized = headers.map(h => h.toLowerCase().trim());
        const idx = (names) => {
            for (let i = 0; i < normalized.length; i++) {
                for (const n of names) {
                    if (normalized[i] === n || normalized[i].startsWith(`${n} (`) || normalized[i].includes(n)) {
                        return i;
                    }
                }
            }
            return -1;
        };

        let fullNameIdx = idx(['full name', 'fullname', 'name']);
        let riotIdIdx = idx(['riot id', 'riotid']);
        let positionIdx = idx(['position']);
        let statusIdx = idx(['status']);
        let emailIdx = idx(['email']);
        let discordIdx = idx(['discord']);
        let primaryRoleIdx = idx(['primary role', 'primaryrole', 'primaryroleid']);
        let secondaryRoleIdx = idx(['secondary role', 'secondaryrole', 'secondaryroleid']);

        if (fullNameIdx === -1 || emailIdx === -1) {
            alert('CSV must include at least "Full Name" and "Email" headers');
            return;
        }

        // Backward compatibility: older templates had commas in header labels,
        // which shifted header indexes while data rows still had 6 columns.
        const firstDataRow = rows.find(row => row.some(cell => (cell || '').trim() !== ''));
        if (firstDataRow && emailIdx >= firstDataRow.length && firstDataRow.length >= 5) {
            if (fullNameIdx === -1 || fullNameIdx >= firstDataRow.length) fullNameIdx = 0;
            if (riotIdIdx === -1 || riotIdIdx >= firstDataRow.length) riotIdIdx = firstDataRow.length > 1 ? 1 : -1;
            if (positionIdx === -1 || positionIdx >= firstDataRow.length) positionIdx = firstDataRow.length > 2 ? 2 : -1;
            if (statusIdx === -1 || statusIdx >= firstDataRow.length) statusIdx = firstDataRow.length > 3 ? 3 : -1;
            emailIdx = 4;
            discordIdx = firstDataRow.length > 5 ? 5 : -1;
        }

        // Role name to ID mapping
        const roleNameToId = { 'top': 1, 'jungle': 2, 'mid': 3, 'ad carry': 4, 'adc': 4, 'support': 5, 'sup': 5 };
        const parseRoleId = (val) => {
            const name = (val || '').trim().toLowerCase();
            return roleNameToId[name] || null;
        };

        // Build validated payloads
        const payloads = [];
        const allowedCsvPositions = new Set(['Team Manager', 'Team Coach', 'Player']);
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const fullName = (row[fullNameIdx] || '').trim();
            if (!fullName) continue;

            const nameParts = fullName.split(' ').filter(Boolean);
            const firstname = nameParts.shift();
            const lastname = nameParts.join(' ') || '';

            const rawPosition = positionIdx !== -1 ? (row[positionIdx] || '').trim() : 'Player';
            const position = rawPosition || 'Player';
            if (!allowedCsvPositions.has(position)) {
                continue;
            }
            const payload = {
                email: (row[emailIdx] || '').trim(),
                firstname: firstname || '',
                lastname: lastname || '',
                riotId: riotIdIdx !== -1 ? (row[riotIdIdx] || '').trim() : '',
                position,
                discord: discordIdx !== -1 ? (row[discordIdx] || '').trim() : '',
                status: statusIdx !== -1 ? (row[statusIdx] || '').trim() : 'Active',
                profilePhoto: 'defaultusericon.png'
            };

            // Include role IDs for positions that require them
            if (position === 'Player') {
                const primaryRoleName = primaryRoleIdx !== -1 ? (row[primaryRoleIdx] || '') : '';
                const secondaryRoleName = secondaryRoleIdx !== -1 ? (row[secondaryRoleIdx] || '') : '';
                const primaryRoleId = parseRoleId(primaryRoleName);
                const secondaryRoleId = parseRoleId(secondaryRoleName);
                if (primaryRoleId) payload.primaryroleid = primaryRoleId;
                if (secondaryRoleId) payload.secondaryroleid = secondaryRoleId;
            }

            // Basic validation
            if (payload.email && payload.firstname) {
                payloads.push(payload);
            }
        }

        if (payloads.length === 0) {
            alert('No valid users found in CSV');
            return;
        }

        // Show confirmation modal
        showUploadConfirmation(payloads);
    };

    reader.readAsText(file);
}

// Show CSV upload confirmation modal
function showUploadConfirmation(payloads) {
    const modal = document.getElementById('csvConfirmModal');
    const countEl = document.getElementById('uploadCount');
    const tableEl = document.getElementById('previewTable');
    const confirmBtn = document.getElementById('confirmUploadBtn');
    const cancelBtn = document.getElementById('cancelUploadBtn');
    const closeBtn = document.getElementById('modalCloseBtn');

    // Update modal content
    countEl.textContent = `Ready to upload ${payloads.length} user(s)`;

    // Role ID to name mapping for preview
    const roleIdToName = { 1: 'Top', 2: 'Jungle', 3: 'Mid', 4: 'AD Carry', 5: 'Support' };

    // Build preview table
    tableEl.innerHTML = `
        <thead>
            <tr>
                <th>Full Name</th>
                <th>Riot ID</th>
                <th>Position</th>
                <th>Status</th>
                <th>Email</th>
                <th>Discord</th>
                <th>Primary Role</th>
                <th>Secondary Role</th>
            </tr>
        </thead>
        <tbody>
            ${payloads.map(p => `
                <tr>
                    <td>${p.firstname} ${p.lastname}</td>
                    <td>${p.riotId || '—'}</td>
                    <td>${p.position}</td>
                    <td>${p.status}</td>
                    <td>${p.email}</td>
                    <td>${p.discord || '—'}</td>
                    <td>${p.primaryroleid ? (roleIdToName[p.primaryroleid] || p.primaryroleid) : '—'}</td>
                    <td>${p.secondaryroleid ? (roleIdToName[p.secondaryroleid] || p.secondaryroleid) : '—'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    // Show modal
    modal.style.display = 'flex';

    // Handle confirm
    const handleConfirm = async () => {
        modal.style.display = 'none';
        await uploadPayloads(payloads);
        cleanup();
    };

    // Handle cancel
    const handleCancel = () => {
        modal.style.display = 'none';
        cleanup();
    };

    // Handle close button
    const handleClose = () => {
        modal.style.display = 'none';
        cleanup();
    };

    // Cleanup event listeners
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleClose);
        modal.removeEventListener('click', handleBackdropClick);
    };

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleClose);
    modal.addEventListener('click', handleBackdropClick);
}

// Upload payloads to the server
async function uploadPayloads(payloads) {
    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < payloads.length; i++) {
        const payload = payloads[i];

        try {
            const res = await fetch('/api/v1/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 201) {
                results.success++;
            } else {
                results.failed++;
                const json = await res.json().catch(() => ({}));
                results.errors.push({ row: i + 1, message: json.message || `Status ${res.status}` });
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ row: i + 1, message: err.message });
        }
    }

    let msg = `Upload complete. Success: ${results.success}, Failed: ${results.failed}`;
    if (results.errors.length) {
        msg += '\nErrors:\n' + results.errors.map(e => `User ${e.row}: ${e.message}`).join('\n');
    }
    alert(msg);
    loadUsers(currentFilter);
}

// Very small CSV parser: first line headers, remaining lines data. Handles simple commas and quotes.
function parseCSV(text) {
    // Remove UTF-8 BOM if present
    text = text.replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers (handles quoted and unquoted fields)
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        rows.push(parseCSVLine(lines[i]));
    }

    return { headers, rows };
}

// Parse a single CSV line, handling quoted and unquoted fields
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let ch of line) {
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            // Push trimmed value, without surrounding quotes
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += ch;
        }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
}

// Load users from API
async function loadUsers(status) {
    try {
        const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : 'all';
        let url;
        if (normalizedStatus === 'all') {
            url = '/team_management/api/users';
        } else {
            url = `/team_management/api/users/status/${encodeURIComponent(normalizedStatus)}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        // Keep selection state aligned with the currently rendered table.
        selectedUsers.clear();
        document.getElementById('selectAllCheckbox').checked = false;

        if (result.success || result.data) {
            allUsers = result.data;
            renderUsersTable(allUsers);
        } else {
            allUsers = [];
            renderUsersTable([]);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users. Please try again.');
    }
}

// Render users in table
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');

    tbody.innerHTML = '';

    if (users.length === 0) {
        noUsersMessage.style.display = 'block';
        return;
    }

    noUsersMessage.style.display = 'none';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-col">
                <input
                    type="checkbox"
                    class="user-checkbox"
                    data-user-id="${user.userId}"
                    data-firstname="${user.firstname}"
                    data-lastname="${user.lastname}"
                    data-position="${user.position}"
                    data-status="${user.status}"
                    data-riot-id="${user.riotId && user.riotId !== 'N/A' ? user.riotId : ''}"
                    data-primary-role-id="${user.primaryRoleId || ''}"
                    data-secondary-role-id="${user.secondaryRoleId || ''}">
            </td>
            <td>${user.firstname} ${user.lastname}</td>
            <td>${user.riotId}</td>
            <td>${user.position}</td>
            <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status}</span></td>
            <td>${user.email}</td>
            <td>${user.discord || '—'}</td>
        `;

        tbody.appendChild(row);

        // Add checkbox event listener
        row.querySelector('.user-checkbox').addEventListener('change', (e) => {
            const userId = e.target.dataset.userId;
            if (e.target.checked) {
                selectedUsers.add(userId);
            } else {
                selectedUsers.delete(userId);
                document.getElementById('selectAllCheckbox').checked = false;
            }
        });
    });
}

// Deactivate selected users
async function deactivateSelectedUsers(userIds = []) {
    if (userIds.length === 0) {
        alert('Please select at least one user');
        return;
    }

    if (!confirm(`Are you sure you want to deactivate ${userIds.length} user(s)?`)) {
        return;
    }

    try {
        const response = await fetch('/team_management/api/deactivate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userIds })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            selectedUsers.clear();
            document.getElementById('selectAllCheckbox').checked = false;
            loadUsers(currentFilter);
        } else {
            alert('Error deactivating users');
        }
    } catch (error) {
        console.error('Error deactivating users:', error);
        alert('Error deactivating users. Please try again.');
    }
}
