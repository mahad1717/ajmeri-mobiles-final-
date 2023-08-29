document.addEventListener('DOMContentLoaded', function () {
    let db;
    const showSalesButton = document.getElementById('showSalesButton');

    const request = indexedDB.open('inventoryDB', 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { autoIncrement: true });
            salesStore.createIndex('productName', 'productName');
            salesStore.createIndex('saleQuantity', 'saleQuantity');
            salesStore.createIndex('salePrice', 'salePrice');
            salesStore.createIndex('unitProfit', 'unitProfit');
            salesStore.createIndex('saleDate', 'saleDate');
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
    };

    request.onerror = function (event) {
        console.error('Database error:', event.target.error);
    };



showSalesButton.addEventListener('click', function () {
    const selectedDate = document.getElementById('salesDate').value;
    populateSalesTable(selectedDate);
})
function populateSalesTable(selectedDate) {
    const transaction = db.transaction('sales', 'readonly');
    const salesStore = transaction.objectStore('sales');
    const getAllRequest = salesStore.getAll();

    getAllRequest.onsuccess = function () {
        const salesData = getAllRequest.result;
        const salesTableBody = document.getElementById('salesTableBody');
        let totalProfit = 0; // Initialize the total profit
        let totalSales = 0; // Initialize the total sales

        if (salesData.length === 0) {
            salesTableBody.innerHTML = '<tr><td colspan="5">No sales recorded.</td></tr>';
            return;
        }

        const filteredSalesData = salesData.filter(record => {
            const saleDate = new Date(record.saleDate);
            const selectedDateObj = new Date(selectedDate);

            return (
                saleDate.getFullYear() === selectedDateObj.getFullYear() &&
                saleDate.getMonth() === selectedDateObj.getMonth() &&
                saleDate.getDate() === selectedDateObj.getDate()
            );
        });

        const tableRows = filteredSalesData.map(record => {
            totalProfit += record.unitProfit; // Add unit profit to the total profit
            totalSales += record.salePrice * record.saleQuantity; // Add original prices to total sales

            const saleDate = record.saleDate ? new Date(record.saleDate).toLocaleString() : '';

            const row = `
                <tr>
                    <td>${record.productName}</td>
                    <td>${record.saleQuantity}</td>
                    <td>${record.salePrice}</td>
                    <td>${record.unitProfit.toFixed(2)}</td>
                    <td>${saleDate}</td>
                </tr>
            `;
            return row;
        });

        salesTableBody.innerHTML = tableRows.join('');

        // Display the total profit and total sales
        const totalProfitElement = document.getElementById('totalProfit');
        totalProfitElement.textContent = `$${totalProfit.toFixed(2)}`;

        const totalSalesElement = document.getElementById('totalSales');
        totalSalesElement.textContent = `$${totalSales.toFixed(2)}`;
    };

    getAllRequest.onerror = function (event) {
        console.error('Error loading sales data:', event.target.error);
    };
}


      
const goBackBtn = document.getElementById('goBackBtn');

goBackBtn.addEventListener('click', function () {
    // Navigate back to the previous page
    history.back();
});
});
