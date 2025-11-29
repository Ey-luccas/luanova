// Categories Page JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Open category modal
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close category modal
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        document.getElementById('categoryForm').reset();
    }
}

// Save category
function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const category = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        color: document.getElementById('categoryColor').value
    };
    
    console.log('Saving category:', category);
    
    // Show success message (in production, this would save to API)
    alert('Categoria criada com sucesso!');
    closeCategoryModal();
    
    // Reload page to show new category (in production, update grid without reload)
    // location.reload();
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeCategoryModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCategoryModal();
    }
});
