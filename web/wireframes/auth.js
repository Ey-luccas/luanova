// Authentication JavaScript

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simulate login (in production, this would call your API)
        console.log('Login attempt:', { email, password });
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });
}

// Register Form Handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const company = document.getElementById('company').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate password match
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        // Simulate registration (in production, this would call your API)
        console.log('Register attempt:', { name, email, company, password });
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });
}

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}
