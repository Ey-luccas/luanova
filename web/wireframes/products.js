// Products Page JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Open product modal
function openProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close product modal
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        document.getElementById('productForm').reset();
    }
}

// Save product
function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const product = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        barcode: document.getElementById('productBarcode').value,
        category: document.getElementById('productCategory').value,
        cost: document.getElementById('productCost').value,
        price: document.getElementById('productPrice').value,
        stock: document.getElementById('productStock').value,
        minStock: document.getElementById('productMinStock').value,
        description: document.getElementById('productDescription').value
    };
    
    console.log('Saving product:', product);
    
    // Show success message (in production, this would save to API)
    alert('Produto cadastrado com sucesso!');
    closeProductModal();
    
    // Reload page to show new product (in production, update table without reload)
    // location.reload();
}

// Import products
function importProducts() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        console.log('Importing file:', file.name);
        
        // In production, this would process the file and upload to API
        alert('Importação de arquivo em desenvolvimento. Arquivo selecionado: ' + file.name);
    };
    
    input.click();
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
        closeProductModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});
