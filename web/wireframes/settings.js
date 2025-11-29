// Settings Page JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Show tab
function showTab(tabName) {
    // Update navigation
    const navItems = document.querySelectorAll('.settings-nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Update content
    const contents = document.querySelectorAll('.settings-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(tabName);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Form submission handlers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Alterações salvas com sucesso!');
        });
    });
});
