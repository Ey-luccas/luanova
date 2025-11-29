// Dashboard JavaScript

// Logout function
function logout() {
    if (confirm('Deseja realmente sair?')) {
        window.location.href = 'login.html';
    }
}

// Simple Chart Implementation (without external libraries)
function createMovementsChart() {
    const canvas = document.getElementById('movementsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;
    
    // Sample data
    const data = {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        entries: [45, 52, 48, 61, 55, 38, 42],
        exits: [32, 41, 38, 45, 48, 29, 35]
    };
    
    const maxValue = Math.max(...data.entries, ...data.exits) * 1.2;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw entries line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.entries.forEach((value, index) => {
        const x = padding + (chartWidth / (data.labels.length - 1)) * index;
        const y = height - padding - (value / maxValue) * chartHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw exits line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.exits.forEach((value, index) => {
        const x = padding + (chartWidth / (data.labels.length - 1)) * index;
        const y = height - padding - (value / maxValue) * chartHeight;
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    data.labels.forEach((label, index) => {
        const x = padding + (chartWidth / (data.labels.length - 1)) * index;
        ctx.fillText(label, x, height - 15);
    });
    
    // Draw legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(width - 150, 20, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Entradas', width - 130, 32);
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width - 150, 45, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Saídas', width - 130, 57);
}

function createCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = 300;
    
    // Sample data
    const data = [
        { label: 'Eletrônicos', value: 234, color: '#3b82f6' },
        { label: 'Acessórios', value: 567, color: '#10b981' },
        { label: 'Monitores', value: 145, color: '#f59e0b' },
        { label: 'Armazenamento', value: 89, color: '#8b5cf6' },
        { label: 'Outros', value: 212, color: '#6b7280' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw pie chart
    let currentAngle = -Math.PI / 2;
    data.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // Draw center circle (donut effect)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw total in center
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 10);
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Produtos', centerX, centerY + 15);
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    createMovementsChart();
    createCategoryChart();
    
    // Redraw charts on window resize
    window.addEventListener('resize', function() {
        createMovementsChart();
        createCategoryChart();
    });
});
