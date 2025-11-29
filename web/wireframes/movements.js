// Movements Page JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Open movement modal
function openMovementModal() {
    const modal = document.getElementById('movementModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Set current datetime
        const now = new Date();
        const datetime = now.toISOString().slice(0, 16);
        document.getElementById('movementDate').value = datetime;
    }
}

// Close movement modal
function closeMovementModal() {
    const modal = document.getElementById('movementModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        document.getElementById('movementForm').reset();
    }
}

// Save movement
function saveMovement() {
    const form = document.getElementById('movementForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const movement = {
        type: document.getElementById('movementType').value,
        date: document.getElementById('movementDate').value,
        product: document.getElementById('movementProduct').value,
        quantity: document.getElementById('movementQuantity').value,
        unitValue: document.getElementById('movementUnitValue').value,
        notes: document.getElementById('movementNotes').value
    };
    
    console.log('Saving movement:', movement);
    
    // Show success message (in production, this would save to API)
    const typeText = movement.type === 'in' ? 'Entrada' : 'Saída';
    alert(`${typeText} registrada com sucesso!`);
    closeMovementModal();
    
    // Reload page to show new movement (in production, update table without reload)
    // location.reload();
}

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.data-table tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeMovementModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMovementModal();
    }
});
