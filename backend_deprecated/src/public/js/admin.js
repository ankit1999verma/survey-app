// admin.js

const API_BASE = '/api';

// --- Dashboard ---
async function fetchSurveys() {
  const tbody = document.getElementById('surveyTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/survey/list`);
    const surveys = await res.json();
    
    tbody.innerHTML = '';
    
    if (surveys.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No surveys found.</td></tr>';
      return;
    }

    surveys.forEach(s => {
      const location = `${s.GramPanchayat ? s.GramPanchayat.name : '-'}, ${s.Block ? s.Block.name : '-'}`;
      const surveyor = s.User ? s.User.name : 'Unknown';
      const date = new Date(s.createdAt).toLocaleDateString();

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.uuid.substring(0,8)}...</td>
        <td>${surveyor}</td>
        <td>${s.respondentName || '-'}</td>
        <td>${location}</td>
        <td>${date}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    tbody.innerHTML = '<tr><td colspan="5">Error loading surveys.</td></tr>';
  }
}

// --- Users ---
async function fetchUsers() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/auth/users`);
    const users = await res.json();
    
    tbody.innerHTML = '';
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
      return;
    }

    users.forEach(u => {
      const date = new Date(u.createdAt).toLocaleDateString();

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>${u.contactNo || '-'}</td>
        <td>${date}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    tbody.innerHTML = '<tr><td colspan="5">Error loading users.</td></tr>';
  }
}

const userForm = document.getElementById('userForm');
if (userForm) {
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('userName').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const contactNo = document.getElementById('userContact').value;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, password, contactNo, role: 'surveyor' })
      });
      
      if (res.ok) {
        alert('User created successfully');
        userForm.reset();
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create user');
    }
  });
}

// --- Master Data ---
async function initMasterData() {
  await fetchMasterData('states', 'stateList', s => s.name);
  await populateSelect('districtStateSelect', 'states');
  
  await fetchMasterData('districts', 'districtList', d => `${d.name} (${d.State ? d.State.name : 'No State'})`);
  await populateSelect('blockDistrictSelect', 'districts');
  
  await fetchMasterData('blocks', 'blockList', b => `${b.name} (${b.District ? b.District.name : 'No District'})`);
  await populateSelect('gpBlockSelect', 'blocks');
  
  await fetchMasterData('grampanchayats', 'gpList', g => `${g.name} (${g.Block ? g.Block.name : 'No Block'})`);
}

async function fetchMasterData(endpoint, listId, formatter) {
  const ul = document.getElementById(listId);
  if (!ul) return;

  try {
    const res = await fetch(`${API_BASE}/master/${endpoint}`);
    const data = await res.json();
    
    ul.innerHTML = '';
    data.forEach(item => {
      const li = document.createElement('li');
      li.textContent = formatter(item);
      li.style.marginBottom = '0.25rem';
      ul.appendChild(li);
    });
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
  }
}

async function populateSelect(selectId, endpoint) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const res = await fetch(`${API_BASE}/master/${endpoint}`);
    const data = await res.json();
    
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error(`Failed to populate ${selectId}:`, error);
  }
}

// Setup form handlers for master data
function setupMasterForm(formId, endpoint, payloadFn, callback) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = payloadFn();
    
    try {
      const res = await fetch(`${API_BASE}/master/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        form.reset();
        await callback();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to add ${endpoint}`);
    }
  });
}

// Attach Master Data Handlers
setupMasterForm('stateForm', 'states', 
  () => ({ name: document.getElementById('stateName').value, code: document.getElementById('stateCode').value }),
  async () => {
    await fetchMasterData('states', 'stateList', s => s.name);
    document.getElementById('districtStateSelect').innerHTML = '<option value="">Select State...</option>';
    await populateSelect('districtStateSelect', 'states');
  }
);

setupMasterForm('districtForm', 'districts', 
  () => ({ name: document.getElementById('districtName').value, stateId: document.getElementById('districtStateSelect').value }),
  async () => {
    await fetchMasterData('districts', 'districtList', d => `${d.name} (${d.State ? d.State.name : 'No State'})`);
    document.getElementById('blockDistrictSelect').innerHTML = '<option value="">Select District...</option>';
    await populateSelect('blockDistrictSelect', 'districts');
  }
);

setupMasterForm('blockForm', 'blocks', 
  () => ({ name: document.getElementById('blockName').value, districtId: document.getElementById('blockDistrictSelect').value }),
  async () => {
    await fetchMasterData('blocks', 'blockList', b => `${b.name} (${b.District ? b.District.name : 'No District'})`);
    document.getElementById('gpBlockSelect').innerHTML = '<option value="">Select Block...</option>';
    await populateSelect('gpBlockSelect', 'blocks');
  }
);

setupMasterForm('gpForm', 'grampanchayats', 
  () => ({ name: document.getElementById('gpName').value, blockId: document.getElementById('gpBlockSelect').value }),
  async () => {
    await fetchMasterData('grampanchayats', 'gpList', g => `${g.name} (${g.Block ? g.Block.name : 'No Block'})`);
  }
);
