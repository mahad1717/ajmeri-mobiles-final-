document.addEventListener('DOMContentLoaded', function () {
    let db;
    const goBackBtn = document.getElementById('goBackBtn');

    goBackBtn.addEventListener('click', function () {
        // Navigate back to the previous page
        history.back();
    });
    const inventoryTableBody = document.getElementById('inventoryTableBody');

    const request = indexedDB.open('inventoryDB', 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'name' });
            inventoryStore.createIndex('quantity', 'quantity');
            inventoryStore.createIndex('price', 'price');
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        loadInventory();
    };

    request.onerror = function (event) {
        console.error('Database error:', event.target.error);
    };

    function loadInventory() {
        const transaction = db.transaction(['inventory'], 'readonly');
        const inventoryStore = transaction.objectStore('inventory');
        const getAllRequest = inventoryStore.getAll();

        getAllRequest.onsuccess = function () {
            const inventoryData = getAllRequest.result;
            inventoryTableBody.innerHTML = '';

            if (inventoryData.length === 0) {
                inventoryTableBody.innerHTML = '<tr><td colspan="3">No items in inventory.</td></tr>';
                return;
            }

            const tableRows = inventoryData.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price}</td>
                </tr>
            `);

            inventoryTableBody.innerHTML = tableRows.join('');
        };

        getAllRequest.onerror = function (event) {
            console.error('Error loading inventory:', event.target.error);
        };
    }
});
