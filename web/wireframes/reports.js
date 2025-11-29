// Reports Page JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Select report type
function selectReport(reportType) {
    // Update active state
    const cards = document.querySelectorAll('.report-card');
    cards.forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    console.log('Selected report:', reportType);
    
    // In production, this would update the report content based on type
}

// Generate report
function generateReport() {
    const startDate = document.querySelector('.report-filters input[type="date"]:first-of-type').value;
    const endDate = document.querySelector('.report-filters input[type="date"]:last-of-type').value;
    const category = document.querySelector('.report-filters select').value;
    
    console.log('Generating report:', { startDate, endDate, category });
    
    // Show loading state
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg> Gerando...';
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // Simulate API call
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        alert('Relatório gerado com sucesso!');
    }, 1500);
}

// Export report
function exportReport(format) {
    console.log('Exporting report as:', format);
    
    // In production, this would trigger actual file download
    alert(`Exportando relatório em formato ${format.toUpperCase()}...`);
    
    // Simulate download
    setTimeout(() => {
        alert(`Relatório exportado com sucesso!`);
    }, 1000);
}
