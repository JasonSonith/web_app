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
}