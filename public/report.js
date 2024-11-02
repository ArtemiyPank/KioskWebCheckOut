document.addEventListener('DOMContentLoaded', displaySalesReport);

function displaySalesReport() {
  const salesData = getSalesDataFromLocalStorage();
  const reportContainer = document.getElementById('sales-report');
  reportContainer.innerHTML = '';

  const report = Object.values(salesData).filter(item => item.soldToday > 0);

  if (report.length === 0) {
    reportContainer.innerHTML = '<p>No sales to report.</p>';
    return;
  }

  const header = document.createElement('div');
  header.innerHTML = `<h3>Summary of Sales</h3>`;
  reportContainer.appendChild(header);

  report.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.classList.add('report-item');
    const totalRevenue = item.price * item.soldToday;
    itemElement.innerHTML = `
      <strong>${item.name}</strong><br>
      Sold: ${item.soldToday} pcs<br>
      Price: ${item.price} ₪<br>
      Total Revenue: <strong>${totalRevenue} ₪</strong>
    `;
    reportContainer.appendChild(itemElement);
  });

  const totalRevenue = report.reduce((acc, item) => acc + (item.price * item.soldToday), 0);
  const totalRevenueElement = document.createElement('div');
  totalRevenueElement.classList.add('total-revenue');
  totalRevenueElement.innerHTML = `<h4>Total Revenue: ${totalRevenue} ₪</h4>`;
  reportContainer.appendChild(totalRevenueElement);
}

function getSalesDataFromLocalStorage() {
  const data = localStorage.getItem('salesData');
  return data ? JSON.parse(data) : {};
}
