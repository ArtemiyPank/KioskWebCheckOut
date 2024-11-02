// report.js

document.addEventListener('DOMContentLoaded', () => {
  displaySalesReport();

  // Кнопка для копирования отчета в буфер обмена
  document.getElementById('copy-report').addEventListener('click', copyReportToClipboard);

  // Кнопка для сброса счётчиков
  document.getElementById('reset-counters').addEventListener('click', resetCountersWithConfirmation);
});

function displaySalesReport() {
  const salesData = getSalesDataFromLocalStorage();
  const reportContainer = document.getElementById('sales-report');
  reportContainer.innerHTML = '';

  const report = Object.values(salesData).filter(item => item.soldToday > 0);

  if (report.length === 0) {
    reportContainer.innerHTML = '<p>No sales to report.</p>';
    return;
  }

  // Заголовок отчета
  const header = document.createElement('div');
  header.innerHTML = `<h3>Summary of Sales</h3>`;
  reportContainer.appendChild(header);

  let totalRevenue = 0;
  let reportText = 'Sales Report:\n\n';

  report.forEach(item => {
    const itemRevenue = item.price * item.soldToday;
    totalRevenue += itemRevenue;

    const itemElement = document.createElement('div');
    itemElement.classList.add('report-item');
    itemElement.innerHTML = `
      <strong>${item.name}</strong><br>
      Sold: ${item.soldToday} pcs
    `;
    reportContainer.appendChild(itemElement);

    // Добавляем текст для копирования
    reportText += `${item.name}: ${item.soldToday} pcs sold\n`;
  });

  // Добавляем общую выручку в текст отчета
  reportText += `\nTotal Revenue: ${totalRevenue} ₪`;

  const totalRevenueElement = document.createElement('div');
  totalRevenueElement.classList.add('total-revenue');
  totalRevenueElement.innerHTML = `<h4>Total Revenue: ${totalRevenue} ₪</h4>`;
  reportContainer.appendChild(totalRevenueElement);

  // Сохраняем текст отчета для копирования
  reportContainer.setAttribute('data-report-text', reportText);
}

function getSalesDataFromLocalStorage() {
  const data = localStorage.getItem('salesData');
  return data ? JSON.parse(data) : {};
}

// Копирование отчета в буфер обмена, совместимое с мобильными устройствами
function copyReportToClipboard() {
  const reportText = document.getElementById('sales-report').getAttribute('data-report-text');

  // Создаем временный элемент <textarea> для копирования текста
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = reportText;
  document.body.appendChild(tempTextArea);

  // Выделяем текст в <textarea> и копируем его в буфер обмена
  tempTextArea.select();
  tempTextArea.setSelectionRange(0, 99999); // Для мобильных устройств

  try {
    document.execCommand('copy');
    alert("Report copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy report:", err);
    alert("Failed to copy report. Please try manually.");
  }

  // Удаляем временный элемент <textarea>
  document.body.removeChild(tempTextArea);
}


// Функция сброса счетчиков с двойным подтверждением
function resetCountersWithConfirmation() {
  if (confirm("Are you sure you want to reset the counters?")) {
    if (confirm("This action cannot be undone. Do you really want to reset?")) {
      localStorage.removeItem('salesData');
      alert("Counters have been reset.");

      // Перенаправление на главную страницу после успешного сброса
      window.location.href = 'index.html';
    }
  }
}
