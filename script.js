function navigateToInventory() {
    window.location.href = "inventory.html";
}

function navigateToSales() {
    window.location.href = "sales.html";
}

function showInventory()
{
    window.location.href = "inventorytable.html"
}
const addItemForm = document.getElementById('addItemForm');
const removeItemForm = document.getElementById('removeItemForm');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const salesForm = document.getElementById('salesForm'); // Sales form
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const currentDay = currentDate.getDate();

document.addEventListener('DOMContentLoaded', function () {
    

    let db;

    addItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const name = addItemForm.itemName.value;
        const quantity = parseInt(addItemForm.itemQuantity.value, 10);
        const price = parseFloat(addItemForm.itemPrice.value);
        addItemToInventory(name, quantity, price);
        clearForm(addItemForm);
        populateDropdowns();
        populateSalesDropdown();
    });

    removeItemForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const name = removeItemForm.removeItemName.value;
        removeItemFromInventory(name);
        clearForm(removeItemForm);
        populateDropdowns();
    });

    const request = indexedDB.open('inventoryDB', 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'name' });
            inventoryStore.createIndex('quantity', 'quantity');
            inventoryStore.createIndex('price', 'price');
        }

        if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { autoIncrement: true });
            salesStore.createIndex('productName', 'productName');
            salesStore.createIndex('saleQuantity' , 'saleQuantity');
            salesStore.createIndex('salePrice' , 'salePrice');
            salesStore.createIndex('unitProfit' , 'unitProfit');
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        populateDropdowns();
        populateSalesDropdown(); // Populate sales dropdown
    };

    request.onerror = function (event) {
        console.error('Database error:', event.target.error);
    };

    function addItemToInventory(name, quantity, price) {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const inventoryStore = transaction.objectStore('inventory');
        const newItem = { name, quantity, price };
        const addRequest = inventoryStore.add(newItem);

        addRequest.onsuccess = function () {
            console.log('Item added to inventory:', newItem);
            clearForm(document.getElementById('addItemForm'));
        };

        addRequest.onerror = function (event) {
            console.error('Error adding item to inventory:', event.target.error);
        };
    }

    function removeItemFromInventory(name) {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const inventoryStore = transaction.objectStore('inventory');
        const deleteRequest = inventoryStore.delete(name);

        deleteRequest.onsuccess = function () {
            console.log('Item removed from inventory:', name);
            clearForm(document.getElementById('removeItemForm'));
        };

        deleteRequest.onerror = function (event) {
            console.error('Error removing item from inventory:', event.target.error);
        };
    }


    function populateDropdowns() {
        const transaction = db.transaction(['inventory'], 'readonly');
        const inventoryStore = transaction.objectStore('inventory');
        const getAllRequest = inventoryStore.getAllKeys();

        getAllRequest.onsuccess = function () {
            const keys = getAllRequest.result;
            const removeItemNameDropdown = document.getElementById('removeItemName');

            removeItemNameDropdown.innerHTML = '';

            keys.forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                removeItemNameDropdown.appendChild(option);
            });
        };

        getAllRequest.onerror = function (event) {
            console.error('Error populating dropdowns:', event.target.error);
        };
    }

    
    const goBackBtn = document.getElementById('goBackBtn');

    goBackBtn.addEventListener('click', function () {
        // Navigate back to the previous page
        history.back();
    });

    function clearForm(form) {
        form.reset();
    }

    // Sales functionality

    salesForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const productName = salesForm.saleProductName.value;
        const price = parseFloat(salesForm.sellingPrice.value);
        const quantity = parseInt(salesForm.saleQuantity.value, 10);

        if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
            salesMessage.textContent = 'Invalid price or quantity.';
            return;
        }

        recordSale(productName, quantity, price);
    });
    function recordSale(productName, quantity, price) {
        const transaction = db.transaction(['sales', 'inventory'], 'readwrite');
        const salesStore = transaction.objectStore('sales');
        const inventoryStore = transaction.objectStore('inventory');
    
        const inventoryGetRequest = inventoryStore.get(productName);
    
        inventoryGetRequest.onsuccess = function () {
            const inventoryItem = inventoryGetRequest.result;
    
            if (inventoryItem) {
                if (inventoryItem.quantity >= quantity) {
                    const saleRecord = {
                        productName,
                        saleQuantity: quantity,
                        salePrice: price,
                        saleDate: new Date(),
                        unitProfit: (price - inventoryItem.price) * quantity // Calculate unit profit
                    };
    
                    const addRequest = salesStore.add(saleRecord);
    
                    addRequest.onsuccess = function () {
                        console.log('Sale recorded:', saleRecord);
                        inventoryItem.quantity -= quantity;
                        const updateRequest = inventoryStore.put(inventoryItem);
    
                        updateRequest.onsuccess = function () {
                            console.log('Inventory updated:', inventoryItem);
                            transaction.oncomplete = function () {
                                clearForm(salesForm);
                                populateSalesTable();
                            };
                        };
    
                        updateRequest.onerror = function (event) {
                            console.error('Error updating inventory:', event.target.error);
                        };
                    };
    
                    addRequest.onerror = function (event) {
                        console.error('Error recording sale:', event.target.error);
                    };
                } else {
                    salesMessage.textContent = 'Not enough quantity in inventory.';
                }
            } else {
                salesMessage.textContent = `Product "${productName}" not found in inventory.`;
            }
        };
    }
    
    function populateSalesTable() {
        const transaction = db.transaction('sales', 'readonly');
        const salesStore = transaction.objectStore('sales');
        const getAllRequest = salesStore.getAll();
    
        getAllRequest.onsuccess = function () {
            const salesData = getAllRequest.result;
            const salesTableBody = document.getElementById('salesTableBody');
            let totalProfit = 0; // Initialize the total profit
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
    
            if (salesData.length === 0) {
                salesTableBody.innerHTML = '<tr><td colspan="5">No sales recorded.</td></tr>';
                return;
            }
    
            const filteredSalesData = salesData.filter(record => {
                const saleDate = new Date(record.saleDate);
                return (
                    saleDate.getFullYear() === currentYear &&
                    saleDate.getMonth() === currentMonth &&
                    saleDate.getDate() === currentDay
                );
            });
    
            const tableRows = filteredSalesData.map(record => {
                totalProfit += record.unitProfit; // Add unit profit to the total profit
    
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
    
            // Display the total profit
            const totalProfitElement = document.getElementById('totalProfit');
            totalProfitElement.textContent = `$${totalProfit.toFixed(2)}`;
        };
    
        getAllRequest.onerror = function (event) {
            console.error('Error loading sales data:', event.target.error);
        };
    }
    

    // Helper function to clear form inputs
    function clearForm(form) {
        form.reset();
        salesMessage.textContent = '';
    }

    function populateSalesDropdown() {
        const transaction = db.transaction(['inventory'], 'readonly');
        const inventoryStore = transaction.objectStore('inventory');
        const getAllRequest = inventoryStore.getAllKeys();
    
        getAllRequest.onsuccess = function () {
            const keys = getAllRequest.result;
            const saleProductNameDropdown = document.getElementById('saleProductName');
    
            saleProductNameDropdown.innerHTML = '';
    
            keys.forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                saleProductNameDropdown.appendChild(option);
            });
        };
    
        getAllRequest.onerror = function (event) {
            console.error('Error populating sales dropdown:', event.target.error);
        };
        populateSalesTable();
    }
   
    function populateSalesDropdown() {
        const transaction = db.transaction(['inventory'], 'readonly');
        const inventoryStore = transaction.objectStore('inventory');
        const getAllRequest = inventoryStore.getAllKeys();

        getAllRequest.onsuccess = function () {
            const keys = getAllRequest.result;
            const saleProductNameDropdown = document.getElementById('saleProductName');

            saleProductNameDropdown.innerHTML = '';

            keys.forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                saleProductNameDropdown.appendChild(option);
            });
        };

        getAllRequest.onerror = function (event) {
            console.error('Error populating sales dropdown:', event.target.error);
        };
    }
 
    const toggleSalesReportBtn = document.getElementById('toggleSalesReportBtn');
    const salesTableContainer = document.getElementById('salesTableContainer');

    toggleSalesReportBtn.addEventListener('click', function () {
        if (salesTableContainer.style.display === 'none' || salesTableContainer.style.display === '') {
            salesTableContainer.style.display = 'block';
            populateSalesTable();
        } else {
            salesTableContainer.style.display = 'none';
        }
    });

  
    
});

const playButton = document.getElementById('playButton');
    const audioPlayer = document.getElementById('audioPlayer');

    playButton.addEventListener('click', () => {
        playAudio();
    });

    function playAudio() {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    }