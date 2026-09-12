const STORAGE_KEY = 'office_room_manager_data_v1';
const DEFAULT_DATA = {
    layout: { rows: 5, cols: 9 },
    rooms: [
        { row: 0, col: 0, room_no: '2401', dept: '순환' },
        { row: 0, col: 1, room_no: '2402', dept: '순환' },
        { row: 0, col: 2, room_no: '2403', dept: '기후' },
        { row: 0, col: 3, room_no: '2404', dept: '순환' },
        { row: 0, col: 4, room_no: '2405', dept: '순환' },
        { row: 0, col: 5, room_no: '2406', dept: '순환' },
        { row: 0, col: 6, room_no: '2407', dept: '순환' },
        { row: 0, col: 7, room_no: '2408', dept: '순환' },
        { row: 0, col: 8, room_no: '2409', dept: '순환' },
        { row: 1, col: 0, room_no: '2433', dept: '순환' },
        { row: 1, col: 1, room_no: '2432', dept: '순환' },
        { row: 1, col: 2, room_no: '2431', dept: '순환' },
        { row: 1, col: 3, room_no: '2430', dept: '공용' },
        { row: 1, col: 4, room_no: '2429', dept: '순환' },
        { row: 1, col: 5, room_no: '2428', dept: '순환' },
        { row: 1, col: 6, room_no: '2427', dept: '순환' },
        { row: 1, col: 7, room_no: '2426', dept: '공용' },
        { row: 1, col: 8, room_no: '2425', dept: '공용' },
        { row: 2, col: 0, room_no: '미배정', dept: '' },
        { row: 2, col: 1, room_no: '', dept: '' },
        { row: 2, col: 2, room_no: '2410', dept: '순환' },
        { row: 2, col: 3, room_no: '2411', dept: '순환' },
        { row: 2, col: 4, room_no: '2412', dept: '기후' },
        { row: 2, col: 5, room_no: '2413', dept: '순환' },
        { row: 2, col: 6, room_no: '2414', dept: '기후' },
        { row: 2, col: 7, room_no: '2415', dept: '순환' },
        { row: 2, col: 8, room_no: '', dept: '' },
        { row: 3, col: 0, room_no: '2424', dept: '기후' },
        { row: 3, col: 1, room_no: '2423', dept: '순환/기후' },
        { row: 3, col: 2, room_no: '2422', dept: '순환' },
        { row: 3, col: 3, room_no: '2421', dept: '순환' },
        { row: 3, col: 4, room_no: '2420', dept: '순환' },
        { row: 3, col: 5, room_no: '2419', dept: '순환/기후' },
        { row: 3, col: 6, room_no: '2418', dept: '기후' },
        { row: 3, col: 7, room_no: '2417', dept: '순환/ICT' },
        { row: 3, col: 8, room_no: '', dept: '' },
        { row: 4, col: 0, room_no: '1238', dept: '순환' },
        { row: 4, col: 1, room_no: '1237', dept: '순환' },
        { row: 4, col: 2, room_no: '1236', dept: '순환' },
        { row: 4, col: 3, room_no: '1235', dept: '순환' },
        { row: 4, col: 4, room_no: '1234', dept: '순환' },
        { row: 4, col: 5, room_no: '1233', dept: '순환' },
        { row: 4, col: 6, room_no: '1232', dept: '순환' },
        { row: 4, col: 7, room_no: '1231', dept: '기후' },
        { row: 4, col: 8, room_no: '1230', dept: '기후' }
    ],
    members: []
};

let currentData = null;
let lastLoadedFileName = 'room_data.json';

const deptPalette = ['#e3f2fd', '#fce4ec', '#f1f8e9', '#fff3e0', '#f3e5f5', '#e0f2f1', '#fffde7', '#efebe9', '#eceff1'];
let deptColors = {};
let deptColorIndex = 0;

const positionPalette = ['#ffebee', '#e8eaf6', '#e0f7fa', '#f1f8e9', '#fff8e1', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5', '#ffffff'];
let positionColors = {};
let posColorIndex = 0;

function cloneData(data) {
    return JSON.parse(JSON.stringify(data || DEFAULT_DATA));
}

function normalizeData(data) {
    const base = cloneData(DEFAULT_DATA);
    const incoming = data && typeof data === 'object' ? data : {};
    const layout = incoming.layout && typeof incoming.layout === 'object' ? incoming.layout : {};
    base.layout = {
        rows: Number(layout.rows) || 0,
        cols: Number(layout.cols) || 0
    };
    base.rooms = Array.isArray(incoming.rooms) ? incoming.rooms : [];
    base.members = Array.isArray(incoming.members) ? incoming.members : [];
    return base;
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getDeptColor(deptName) {
    if (!deptName || deptName.trim() === '') return '#eef';
    const cleanName = deptName.trim();
    if (!deptColors[cleanName]) {
        deptColors[cleanName] = deptPalette[deptColorIndex % deptPalette.length];
        deptColorIndex++;
    }
    return deptColors[cleanName];
}

function getPositionColor(positionName) {
    if (!positionName || positionName.trim() === '') return 'rgba(255,255,255,0.9)';
    const cleanName = positionName.trim();
    if (!positionColors[cleanName]) {
        positionColors[cleanName] = positionPalette[posColorIndex % positionPalette.length];
        posColorIndex++;
    }
    return positionColors[cleanName];
}

function persistData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
}

function updateFileStatus(message) {
    const statusEl = document.getElementById('file-status');
    if (statusEl) statusEl.textContent = message;
}

function loadInitialData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return normalizeData(JSON.parse(saved));
        } catch (error) {
            console.warn('저장된 데이터가 올바르지 않아 기본값을 사용합니다.', error);
        }
    }

    const fallback = normalizeData(DEFAULT_DATA);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
}

function renderCurrentState() {
    renderRoomGrid();
    updateRoomSelect();
    renderMemberListTable();

    const rowsInput = document.getElementById('layout-rows');
    const colsInput = document.getElementById('layout-cols');
    if (currentData && currentData.layout && currentData.layout.rows > 0) {
        rowsInput.value = currentData.layout.rows;
        colsInput.value = currentData.layout.cols;
        loadSavedSetupGrid();
    } else {
        generateSetupGrid();
    }

    updateFileStatus(`현재 파일: ${lastLoadedFileName}`);
}

function switchTab(tabIndex) {
    document.querySelectorAll('.tab').forEach((t, i) => {
        t.className = i + 1 === tabIndex ? 'tab active' : 'tab';
    });
    document.querySelectorAll('.tab-content').forEach((c, i) => {
        c.className = i + 1 === tabIndex ? 'tab-content active' : 'tab-content';
    });
}

function renderRoomGrid() {
    const grid = document.getElementById('room-grid');
    grid.innerHTML = '';

    if (!currentData || !currentData.layout || currentData.layout.cols <= 0) {
        grid.innerHTML = '<p>저장된 레이아웃이 없습니다. [2. 방 레이아웃 설정] 탭에서 방을 만들어주세요.</p>';
        return;
    }

    grid.style.gridTemplateColumns = `repeat(${Math.min(currentData.layout.cols, 4)}, minmax(120px, 1fr))`;

    const roomMap = {};
    deptColors = {};
    deptColorIndex = 0;
    positionColors = {};
    posColorIndex = 0;

    currentData.rooms.forEach((room) => {
        const roomDiv = document.createElement('div');
        if (!room.room_no || room.room_no.trim() === '') {
            roomDiv.className = 'room empty-room';
            grid.appendChild(roomDiv);
            return;
        }

        roomDiv.className = 'room';
        roomDiv.style.backgroundColor = getDeptColor(room.dept || '');
        roomDiv.innerHTML = `<div class="room-header">${escapeHtml(room.room_no)}호 (${escapeHtml(room.dept || '-')})</div>`;

        const memberContainer = document.createElement('div');
        memberContainer.className = 'member-container';
        memberContainer.addEventListener('dragover', allowDrop);
        memberContainer.addEventListener('drop', (event) => drop(event, room.room_no));

        roomDiv.appendChild(memberContainer);
        grid.appendChild(roomDiv);
        roomMap[room.room_no] = memberContainer;
    });

    if (currentData.members) {
        const sortedMembersForGrid = [...currentData.members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        sortedMembersForGrid.forEach((member) => {
            if (roomMap[member.room_no]) {
                const memDiv = document.createElement('div');
                memDiv.className = 'member';
                memDiv.id = member.id;
                memDiv.draggable = true;
                memDiv.addEventListener('dragstart', drag);
                memDiv.style.backgroundColor = getPositionColor(member.position);
                memDiv.innerHTML = `<strong>${escapeHtml(member.name)}</strong> <small>(${escapeHtml(member.position || '-')})</small><br><small style="color:#555;">${escapeHtml(member.phone || '')}</small>`;
                roomMap[member.room_no].appendChild(memDiv);
            }
        });
    }
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData('text', ev.target.id); }

function drop(ev, newRoomNo) {
    ev.preventDefault();
    const memberId = ev.dataTransfer.getData('text');
    let targetContainer = ev.target;
    if (!targetContainer.classList.contains('member-container')) {
        targetContainer = targetContainer.closest('.member-container');
    }
    if (targetContainer) {
        const draggable = document.getElementById(memberId);
        if (draggable) {
            targetContainer.appendChild(draggable);
        }
    }

    const member = currentData.members.find((item) => item.id === memberId);
    if (!member) return;

    member.room_no = newRoomNo;
    persistData();
    renderCurrentState();
}

function loadSavedSetupGrid() {
    const container = document.getElementById('setup-grid-container');
    if (!currentData || !currentData.layout) return;
    container.style.gridTemplateColumns = `repeat(${currentData.layout.cols}, minmax(120px, 1fr))`;
    container.innerHTML = '';

    currentData.rooms.forEach((room) => {
        container.innerHTML += `
            <div class="setup-cell" data-row="${escapeHtml(room.row)}" data-col="${escapeHtml(room.col)}">
                <div style="font-size:11px; color:#888; margin-bottom:3px;">[${Number(room.row || 0) + 1}행, ${Number(room.col || 0) + 1}열]</div>
                <input type="text" class="r-no" placeholder="방 번호" value="${escapeHtml(room.room_no || '')}">
                <input type="text" class="r-dept" placeholder="부서명" value="${escapeHtml(room.dept || '')}">
            </div>
        `;
    });
}

function generateSetupGrid() {
    const rows = Number(document.getElementById('layout-rows').value || 0);
    const cols = Number(document.getElementById('layout-cols').value || 0);
    const container = document.getElementById('setup-grid-container');

    container.style.gridTemplateColumns = `repeat(${cols}, minmax(120px, 1fr))`;
    container.innerHTML = '';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let savedNo = '';
            let savedDept = '';
            if (currentData && currentData.rooms) {
                const matched = currentData.rooms.find((room) => Number(room.row) === r && Number(room.col) === c);
                if (matched) {
                    savedNo = matched.room_no || '';
                    savedDept = matched.dept || '';
                }
            }

            container.innerHTML += `
                <div class="setup-cell" data-row="${r}" data-col="${c}">
                    <div style="font-size:11px; color:#888; margin-bottom:3px;">[${r + 1}행, ${c + 1}열]</div>
                    <input type="text" class="r-no" placeholder="방 번호" value="${escapeHtml(savedNo)}">
                    <input type="text" class="r-dept" placeholder="부서명" value="${escapeHtml(savedDept)}">
                </div>
            `;
        }
    }
}

function saveLayout() {
    const rows = Number(document.getElementById('layout-rows').value || 0);
    const cols = Number(document.getElementById('layout-cols').value || 0);
    const cells = document.querySelectorAll('.setup-cell');

    const newRooms = [];
    cells.forEach((cell) => {
        newRooms.push({
            row: cell.getAttribute('data-row'),
            col: cell.getAttribute('data-col'),
            room_no: cell.querySelector('.r-no').value,
            dept: cell.querySelector('.r-dept').value
        });
    });

    currentData.layout = { rows, cols };
    currentData.rooms = newRooms;
    persistData();
    renderCurrentState();
    alert('✅ 방 레이아웃과 정보가 성공적으로 수정/저장되었습니다.');
}

function updateRoomSelect() {
    const select = document.getElementById('m-room');
    select.innerHTML = '<option value="">-- 방 선택 --</option>';
    if (!currentData || !currentData.rooms) return;

    currentData.rooms.forEach((room) => {
        if (room.room_no && room.room_no.trim() !== '') {
            select.innerHTML += `<option value="${escapeHtml(room.room_no)}">${escapeHtml(room.room_no)}호 (${escapeHtml(room.dept || '-')})</option>`;
        }
    });
}

function addMember() {
    const name = document.getElementById('m-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    const position = document.getElementById('m-position').value.trim();
    const room = document.getElementById('m-room').value;

    if (!name || !room) {
        alert('이름과 배치할 방 번호는 필수 입력사항입니다.');
        return;
    }

    currentData.members.push({
        id: 'm_' + Date.now() + Math.floor(Math.random() * 900 + 100),
        name,
        phone,
        position,
        room_no: room
    });

    persistData();
    document.getElementById('m-name').value = '';
    document.getElementById('m-phone').value = '';
    document.getElementById('m-position').value = '';
    renderCurrentState();
    alert('✅ 새 멤버가 추가되었습니다.');
}

function renderMemberListTable() {
    const tbody = document.getElementById('member-list-tbody');
    tbody.innerHTML = '';

    if (!currentData.members || currentData.members.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#999; padding:20px;">등록된 멤버가 없습니다.</td></tr>';
        return;
    }

    let roomOptionsHtml = '<option value="">-- 선택 --</option>';
    currentData.rooms.forEach((room) => {
        if (room.room_no && room.room_no.trim() !== '') {
            roomOptionsHtml += `<option value="${escapeHtml(room.room_no)}">${escapeHtml(room.room_no)}호</option>`;
        }
    });

    const sortedMembers = [...currentData.members].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    sortedMembers.forEach((member) => {
        const tr = document.createElement('tr');
        tr.id = `tr-${member.id}`;

        tr.innerHTML = `
            <td><input type="text" class="edit-name" value="${escapeHtml(member.name)}"></td>
            <td><input type="text" class="edit-phone" value="${escapeHtml(member.phone || '')}"></td>
            <td><input type="text" class="edit-position" value="${escapeHtml(member.position || '')}"></td>
            <td>
                <select class="edit-room">${roomOptionsHtml}</select>
            </td>
            <td>
                <button onclick="editMember('${member.id}')" style="padding:4px 10px; font-size:12px;">수정</button>
                <button onclick="deleteMember('${member.id}')" class="btn-danger" style="padding:4px 10px; font-size:12px; margin-left:5px;">삭제</button>
            </td>
        `;

        tbody.appendChild(tr);
        const selectElem = tr.querySelector('.edit-room');
        selectElem.value = member.room_no || '';
    });
}

function editMember(memberId) {
    const tr = document.getElementById(`tr-${memberId}`);
    if (!tr) return;

    const name = tr.querySelector('.edit-name').value.trim();
    const phone = tr.querySelector('.edit-phone').value.trim();
    const position = tr.querySelector('.edit-position').value.trim();
    const roomNo = tr.querySelector('.edit-room').value;

    if (!name || !roomNo) {
        alert('이름과 방 번호는 비워둘 수 없습니다.');
        return;
    }

    const target = currentData.members.find((member) => member.id === memberId);
    if (!target) return;

    target.name = name;
    target.phone = phone;
    target.position = position;
    target.room_no = roomNo;

    persistData();
    renderCurrentState();
    alert('✅ 멤버 정보가 성공적으로 수정되었습니다.');
}

function deleteMember(memberId) {
    if (!confirm('이 멤버를 정말 삭제하시겠습니까?')) return;

    currentData.members = currentData.members.filter((member) => member.id !== memberId);
    persistData();
    renderCurrentState();
    alert('🗑️ 멤버가 성공적으로 삭제되었습니다.');
}

function handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const json = JSON.parse(reader.result);
            currentData = normalizeData(json);
            lastLoadedFileName = file.name;
            persistData();
            renderCurrentState();
            alert(`✅ 파일을 로드했습니다: ${file.name}`);
        } catch (error) {
            console.error(error);
            alert('⚠️ 올바른 JSON 파일이 아닙니다.');
        }
    };
    reader.readAsText(file);
}

function downloadCurrentData() {
    const fileName = lastLoadedFileName.endsWith('.json') ? lastLoadedFileName : `${lastLoadedFileName}.json`;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('📥 JSON 파일이 다운로드되었습니다.');
}

document.addEventListener('DOMContentLoaded', () => {
    currentData = loadInitialData();
    renderCurrentState();
    const uploadInput = document.getElementById('json-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', handleFileUpload);
    }
});
