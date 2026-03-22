//state of the program
let authToken = null;

//DOM References
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const notesSection = document.getElementById('notesSection');
const errorMsg = document.getElementById('errorMsg');
const notesList = document.getElementById('notesList');

//Tab Switching
loginTab.addEventListener('click', () => switchTab('login'));
registerTab.addEventListener('click', () => switchTab('register'));

function switchTab(tab) {
    errorMsg.textContent = '';

    if (tab === 'login') {
        loginForm.hidden = false;
        registerForm.hidden = true;
        loginTab.classList.add('active'); //adds the active CSS class when clicked
        registerTab.classList.remove('active'); //removes the active CSS when clicked
    }

    else {
        loginForm.hidden = true;
        registerForm.hidden = false;
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

//Helpers
function showError(message) {
    errorMsg.textContent = message;
}

function clearError () {
    errorMsg.textContent = '';
}

function validateUsername(username) {

    if (username.length < 3 || username.length > 30) {
        return 'Username must be 3-30 characters';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) { //.test takes the input and compares it against username
        return 'Username: letters, numbers, and underscores only';
    }

    return null;
}

function validatePassword(password) {
    if (password.length < 8) {
        return 'Password must be at least 8 characters.';
    }
    return null;
}

//Authentication
document.getElementById('loginBtn').addEventListener('click', handleLogin);
document.getElementById('registerBtn').addEventListener('click', handleRegister);
document.getElementById('loginPass').addEventListener('keypress', (e) => { //handles login if user enters the 'Enter' key after entering the password
    if (e.key == 'Enter') handleLogin();
});

async function handleLogin() {
    clearError();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    const userErr = validateUsername(username);
    if (userErr) return showError(userErr);
    const passErr = validatePassword(password);
    if (passErr) return showError(passErr);

    try {
        const res = await fetch ('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({username, password})
        });
    
        const data = await res.json();
        // ^takes the raw response from the server and parses it from JSON into a JavaScript object you can work with. So if the server sent back {"token":"abc123"}, now data.token equals "abc123"

        if (res.ok) {
            authToken = data.token;
            showDashboard();
            loadNotes();
        }

        else {
            showError(data.error || 'Login failed');
        }
    }
    catch (err) {
        showError ('Could not connect to server');
    }
}

async function handleRegister() {
    clearError();
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;

    const userErr = validateUsername(username);
    if (userErr) return showError(userErr);
    const passErr = validatePassword(password);
    if (passErr) return showError(passErr);
    if (password !== confirm) {
        return showError('Passwords do not match');
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();

        if (res.ok) {
            switchTab('login');
            document.getElementById('loginUser').value = username;
            document.getElementById('loginPass').focus();
        }

        else {
            showError(data.error || 'Registration failed.')
        }
    }

    catch (err) {
        showError('Could not connect to server');
    }
}

//Dashboard UI
function showDashboard() {
    loginForm.hidden = true;
    registerForm.hidden = true;
    document.querySelector('nav').hidden = true;
    notesSection.hidden = false;
    clearError();
}

function showAuth() {
    loginForm.hidden = false;
    registerForm.hidden = true;
    document.querySelector('nav').hidden = false;
    notesSection.hidden = true;
    authToken = null;
    switchTab('login');
}

//CRUD for notes
document.getElementById('saveNoteBtn').addEventListener('click', handleSaveNote);

async function handleSaveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    if (!title || !content) {
        return showError('Title and content are required');
    }

    try {
        const res = await fetch(
            '/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({title, content})
            }
        );

        if (res.ok) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            clearError();
            loadNotes();
        }

        else if (res.status === 401) {
            showError('Session expired. Please login again.');
        }

        else {
            const data = await res.json();
            showError (data.error || 'Failed to save note');
        }
    }

    catch (err) {
            showError('Could not connect to server');
        }
}

async function loadNotes() {
    try {
        const res = await fetch('/api/notes', {
            headers: {'Authorization': `Bearer ${authToken}`}
        });

        if (res.status === 401) {
            showAuth();
            return;
        }

        const notes = await res.json();
        renderNotes(notes);
    }

    catch (err) {
        showError('Could not load notes');
    }
}

function renderNotes(notes) {
    noteList.innerHTML = '';

    if (notes.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No notes yet. Create your first one above!';
        empty.style.color = 'var(--text-muted)';
        empty.style.textAlign = 'center';
        empty.style.marginTop = '2rem';
        noteList.appendChild(empty);
        return;
    }

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        const h3 = document.createElement('h3');
        h3.innerHTML = note.title;
        const p = document.createElement('p');
        p.textContent = note.content;
        const date = document.createElement('span');
        date.className = 'note-date';
        date.textContent = new Date(note.created_at).toLocaleString();
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteNote(note.id));
        card.appendChild(h3);
        card.appendChild(p);
        card.appendChild(date);
        card.appendChild(deleteBtn);
        notesList.appendChild(card);
    });
}

async function deleteNote(noteId) {

    try {
        const res = await fetch (`/api/notes/${noteId}`, {
            method : 'DELETE',
            headers: {'Authorization': `Bearer ${authToken}`}
        }
        );

        if (res.ok) {
            loadNotes();
        }

        else if (res.status === 401) {
            showError('Session expired. Please login again');
            showAuth();
        }
    }

    catch (err) {
        showError('Could not connect to server');
    }
}

document.getElementById('noteContent').addEventListener('input', updateCharCount);

function updateCharCount() {
    const length = document.getElementById('noteContent').value.length;
    document.getElementById('charCounter').textContent = `${length} / 1000`;
}

const logoutBtn = document.createElement('button');
logoutBtn.textContent = 'Logout';
logoutBtn.addEventListener('click',logout)
document.getElementById('notesSection').appendChild(logoutBtn);

function logout() {
    showAuth();
}