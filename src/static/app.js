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
registerTab = addEventListener('click', () => switchTab('register'));

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
    const password = document.getElementById('regPass').value;

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
        return ShowError('Passwords do not match');
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
        showError('Could nto connect to server');
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