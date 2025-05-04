// Aplikasi Pembukuan Modal dengan Firebase
// -------------------------------------------

// Global variables
let inventory = [];
let currentSort = { field: null, ascending: true };
let editItemId = null;

// Load data dari Firestore
function loadDataFromFirestore() {
    showToast("Memuat data...", "info");
    
    db.collection("inventory").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            inventory = [];
            querySnapshot.forEach((doc) => {
                inventory.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderInventory();
            calculateTotals();
            showToast("Data berhasil dimuat dari database!", "success");
        })
        .catch((error) => {
            console.error("Error loading data from Firestore:", error);
            showToast("Gagal memuat data dari database!", "error");
            
            // Fallback ke localStorage jika ada
            const savedData = localStorage.getItem('modalInventory');
            if (savedData) {
                inventory = JSON.parse(savedData);
                renderInventory();
                calculateTotals();
                showToast("Data dimuat dari penyimpanan lokal", "info");
            }
        });
}

// Load data dari Firestore
function loadDataFromFirestore() {
    showToast("Memuat data...", "info");
    
    db.collection("inventory").orderBy("timestamp", "desc").get()
        .then((querySnapshot) => {
            inventory = [];
            querySnapshot.forEach((doc) => {
                inventory.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderInventory();
            calculateTotals();
            showToast("Data berhasil dimuat dari database!", "success");
        })
        .catch((error) => {
            console.error("Error loading data from Firestore:", error);
            showToast("Gagal memuat data dari database!", "error");
            
            // Fallback ke localStorage jika ada
            const savedData = localStorage.getItem('modalInventory');
            if (savedData) {
                inventory = JSON.parse(savedData);
                renderInventory();
                calculateTotals();
                showToast("Data dimuat dari penyimpanan lokal", "info");
            }
        });
}

// Simpan item ke Firestore
function saveItemToFirestore(item) {
    return new Promise((resolve, reject) => {
        // Jika item memiliki id, perbarui dokumen yang ada
        if (item.id && item.id.length > 10) {
            db.collection("inventory").doc(item.id)
                .update(item)
                .then(() => {
                    console.log("Document updated with ID:", item.id);
                    // Simpan juga ke localStorage sebagai backup
                    saveDataToLocalStorage();
                    resolve(item);
                })
                .catch((error) => {
                    console.error("Error updating document:", error);
                    reject(error);
                });
        } else {
            // Jika tidak, buat dokumen baru
            const newItem = { ...item };
            delete newItem.id; // Hapus id lama jika ada
            
            db.collection("inventory").add(newItem)
                .then((docRef) => {
                    console.log("Document written with ID:", docRef.id);
                    item.id = docRef.id; // Update id dengan id Firestore
                    // Simpan juga ke localStorage sebagai backup
                    saveDataToLocalStorage();
                    resolve(item);
                })
                .catch((error) => {
                    console.error("Error adding document:", error);
                    reject(error);
                });
        }
    });
}

// Hapus item dari Firestore
function deleteItemFromFirestore(id) {
    return new Promise((resolve, reject) => {
        db.collection("inventory").doc(id)
            .delete()
            .then(() => {
                console.log("Document deleted with ID:", id);
                // Simpan juga ke localStorage sebagai backup
                saveDataToLocalStorage();
                resolve(id);
            })
            .catch((error) => {
                console.error("Error deleting document:", error);
                reject(error);
            });
    });
}

// Fitur offline backup - simpan ke localStorage
function saveDataToLocalStorage() {
    try {
        localStorage.setItem('modalInventory', JSON.stringify(inventory));
        console.log('Data berhasil disimpan ke localStorage (backup).');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

// Format number with thousand separator
function formatNumber(num) {
    return new Intl.NumberFormat('id-ID').format(num);
}

// Parse price string to number
function parsePrice(str) {
    if (!str) return 0;
    return parseInt(str.replace(/\D/g, '')) || 0;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastIcon || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle mr-2 text-green-400';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle mr-2 text-red-400';
    } else if (type === 'info') {
        toastIcon.className = 'fas fa-info-circle mr-2 text-blue-400';
    }
    
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-24', 'opacity-0');
    }, 3000);
}

// Format price input with thousand separator
document.getElementById('item-price').addEventListener('input', function() {
    const val = this.value.replace(/\D/g, '');
    this.value = val ? formatNumber(val) : '';
});

// Calculate totals
function calculateTotals() {
    const totalItemsElement = document.getElementById('total-items');
    const totalValueElement = document.getElementById('total-value');
    
    if (!totalItemsElement || !totalValueElement) return;
    
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    totalItemsElement.textContent = `${totalItems} Item`;
    totalValueElement.textContent = `Rp ${formatNumber(totalValue)}`;
}

// Render inventory table
function renderInventory(items = inventory) {
    const inventoryTable = document.getElementById('inventory-table');
    
    if (!inventoryTable) return;
    
    if (items.length === 0) {
        inventoryTable.innerHTML = `
            <tr class="text-center">
                <td colspan="7" class="px-6 py-8 text-gray-500">
                    Belum ada data barang. Tambahkan barang baru dengan form di atas.
                </td>
            </tr>
        `;
        return;
    }
    
    inventoryTable.innerHTML = items.map((item, index) => `
        <tr>
            <td class="px-3 py-3 whitespace-nowrap text-sm text-gray-900">${index + 1}</td>
            <td class="px-3 py-3 text-sm font-medium text-gray-900 truncate">${item.name}</td>
            <td class="px-3 py-3 text-sm text-gray-500">Rp ${formatNumber(item.price)}</td>
            <td class="px-3 py-3 text-sm text-gray-500">${item.quantity}</td>
            <td class="px-3 py-3 text-sm text-gray-500">Rp ${formatNumber(item.price * item.quantity)}</td>
            <td class="px-3 py-3 text-sm text-gray-500">${formatDate(item.date || new Date())}</td>
            <td class="px-3 py-3 text-sm font-medium">
                <button class="edit-btn bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1 px-2 rounded-lg transition duration-300 mr-1" data-id="${item.id}">
                    <i class="fas fa-edit mr-1"></i> Edit
                </button>
                <button class="delete-btn bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded-lg transition duration-300" data-id="${item.id}">
                    <i class="fas fa-trash-alt mr-1"></i> Hapus
                </button>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            handleEdit(this.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            handleDelete(this.dataset.id);
        });
    });
}

// Add item
function addItem(name, price, quantity) {
    const now = new Date();
    const newItem = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        date: now.toISOString().split('T')[0], // Store date in YYYY-MM-DD format
        timestamp: now.toISOString()
    };
    
    showToast("Menyimpan data...", "info");
    
    saveItemToFirestore(newItem)
        .then((savedItem) => {
            // Add the saved item to the inventory array
            inventory.push(savedItem);
            renderInventory();
            calculateTotals();
            showToast('Barang berhasil ditambahkan!', 'success');
        })
        .catch((error) => {
            console.error("Error adding item:", error);
            showToast('Gagal menambahkan barang! ' + error.message, 'error');
            
            // Fallback ke penyimpanan lokal jika gagal
            const itemWithId = {
                ...newItem,
                id: Date.now().toString()
            };
            inventory.push(itemWithId);
            saveDataToLocalStorage();
            renderInventory();
            calculateTotals();
            showToast('Barang disimpan secara lokal (offline mode)', 'info');
        });
}

// Edit item
function editItem(id, name, price, quantity) {
    const index = inventory.findIndex(item => item.id === id);
    if (index !== -1) {
        // Keep the original date and just update other fields
        const updatedItem = {
            ...inventory[index],
            name,
            price: Number(price),
            quantity: Number(quantity)
        };
        
        showToast("Memperbarui data...", "info");
        
        saveItemToFirestore(updatedItem)
            .then(() => {
                // Update the item in the inventory array
                inventory[index] = updatedItem;
                renderInventory();
                calculateTotals();
                showToast('Barang berhasil diperbarui!', 'success');
                
                // Reset add button style
                const addBtn = document.getElementById('add-btn');
                if (addBtn) {
                    addBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Tambahkan';
                    addBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    addBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                }
                
                editItemId = null;
            })
            .catch((error) => {
                console.error("Error updating item:", error);
                showToast('Gagal memperbarui barang! ' + error.message, 'error');
                
                // Fallback ke penyimpanan lokal jika gagal
                inventory[index] = updatedItem;
                saveDataToLocalStorage();
                renderInventory();
                calculateTotals();
                showToast('Barang diperbarui secara lokal (offline mode)', 'info');
                
                // Reset add button style
                const addBtn = document.getElementById('add-btn');
                if (addBtn) {
                    addBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Tambahkan';
                    addBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    addBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                }
                
                editItemId = null;
            });
    }
}

// Delete item
function deleteItem(id) {
    showToast("Menghapus data...", "info");
    
    deleteItemFromFirestore(id)
        .then(() => {
            // Remove the item from the inventory array
            inventory = inventory.filter(item => item.id !== id);
            renderInventory();
            calculateTotals();
            showToast('Barang berhasil dihapus!', 'success');
        })
        .catch((error) => {
            console.error("Error deleting item:", error);
            showToast('Gagal menghapus barang! ' + error.message, 'error');
            
            // Fallback ke penyimpanan lokal jika gagal
            inventory = inventory.filter(item => item.id !== id);
            saveDataToLocalStorage();
            renderInventory();
            calculateTotals();
            showToast('Barang dihapus secara lokal (offline mode)', 'info');
        });
}

// Handle add button click
document.getElementById('add-btn').addEventListener('click', function() {
    const nameInput = document.getElementById('item-name');
    const priceInput = document.getElementById('item-price');
    const quantityInput = document.getElementById('item-quantity');
    
    if (!nameInput || !priceInput || !quantityInput) {
        showToast('Form elements not found', 'error');
        return;
    }
    
    const name = nameInput.value.trim();
    const priceStr = priceInput.value.trim();
    const quantityStr = quantityInput.value.trim();
    
    if (!name || !priceStr || !quantityStr) {
        showToast('Semua kolom harus diisi!', 'error');
        return;
    }
    
    const price = parsePrice(priceStr);
    const quantity = parseInt(quantityStr, 10);
    
    if (editItemId) {
        // Update existing item
        editItem(editItemId, name, price, quantity);
    } else {
        // Add new item
        addItem(name, price, quantity);
    }
    
    // Reset form
    nameInput.value = '';
    priceInput.value = '';
    quantityInput.value = '';
    nameInput.focus();
});

// Handle edit button click
function handleEdit(id) {
    const item = inventory.find(item => item.id === id);
    
    if (!item) {
        console.error('Item not found with ID:', id);
        return;
    }
    
    const nameInput = document.getElementById('item-name');
    const priceInput = document.getElementById('item-price');
    const quantityInput = document.getElementById('item-quantity');
    const addBtn = document.getElementById('add-btn');
    
    if (!nameInput || !priceInput || !quantityInput || !addBtn) {
        showToast('Form elements not found', 'error');
        return;
    }
    
    nameInput.value = item.name;
    priceInput.value = formatNumber(item.price); 
    quantityInput.value = item.quantity;
    
    editItemId = id;
    addBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Perbarui';
    addBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    addBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    
    showToast('Edit mode aktif. Ubah data lalu klik Perbarui', 'info');
    
    // Scroll to form
    nameInput.scrollIntoView({ behavior: 'smooth' });
    nameInput.focus();
}

// Handle delete button click
function handleDelete(id) {
    const item = inventory.find(item => item.id === id);
    
    if (!item) {
        console.error('Item not found with ID:', id);
        return;
    }
    
    // Direct delete without confirmation
    deleteItem(id);
}

// Handle sorting
document.getElementById('sort-name').addEventListener('click', function() {
    handleSort('name');
});

document.getElementById('sort-price').addEventListener('click', function() {
    handleSort('price');
});

document.getElementById('sort-quantity').addEventListener('click', function() {
    handleSort('quantity');
});

function handleSort(field) {
    if (currentSort.field === field) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.field = field;
        currentSort.ascending = true;
    }
    
    inventory.sort((a, b) => {
        let comparison = 0;
        
        if (field === 'name') {
            comparison = a.name.localeCompare(b.name);
        } else if (field === 'price') {
            comparison = a.price - b.price;
        } else if (field === 'quantity') {
            comparison = a.quantity - b.quantity;
        }
        
        return currentSort.ascending ? comparison : -comparison;
    });
    
    renderInventory();
    
    // Update sort buttons
    document.querySelectorAll('#sort-name, #sort-price, #sort-quantity').forEach(btn => {
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        if (!icon) return;
        
        if (btn.id === `sort-${field}`) {
            icon.className = currentSort.ascending 
                ? `fas fa-sort-${field === 'name' ? 'alpha' : field === 'price' ? 'numeric' : 'amount'}-down mr-1` 
                : `fas fa-sort-${field === 'name' ? 'alpha' : field === 'price' ? 'numeric' : 'amount'}-up mr-1`;
        } else {
            icon.className = icon.className.replace('-up', '-down');
        }
    });
}

// Export inventory to JSON format for Firebase compatibility
function exportToJson(filename, location) {
    try {
        const dataStr = JSON.stringify(inventory, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        // Ensure filename has correct extension
        if (!filename.toLowerCase().endsWith('.json')) {
            filename += '.json';
        }
        
        // Create link for download
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', filename);
        
        // Trigger download
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        // Show toast with location info
        let locationMsg = 'folder Downloads';
        if (location === 'documents') locationMsg = 'folder Documents';
        if (location === 'desktop') locationMsg = 'Desktop';
        if (location === 'custom') locationMsg = 'lokasi yang Anda pilih';
        
        showToast(`Data berhasil diekspor ke ${locationMsg}!`, 'success');
    } catch (err) {
        console.error('Error exporting to JSON:', err);
        showToast('Gagal mengekspor data!', 'error');
    }
}

// Import inventory from JSON
document.getElementById('import-btn').addEventListener('click', function() {
    const importFile = document.getElementById('import-file');
    if (importFile) importFile.click();
});

document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                // Konfirmasi impor
                if (confirm(`Anda akan mengimpor ${importedData.length} item ke database. Lanjutkan?`)) {
                    showToast("Mengimpor data ke Firebase...", "info");
                    
                    // Simpan referensi data yang lama untuk berjaga-jaga
                    const oldInventory = [...inventory];
                    
                    // Reset inventory untuk impor
                    inventory = [];
                    
                    // Untuk setiap item di data impor
                    let importedCount = 0;
                    let promises = [];
                    
                    importedData.forEach((item) => {
                        // Hapus ID jika ada untuk membuat entry baru di Firestore
                        const newItem = { ...item };
                        if (newItem.id) delete newItem.id;
                        
                        // Pastikan timestamp ada
                        if (!newItem.timestamp) {
                            newItem.timestamp = new Date().toISOString();
                        }
                        
                        // Tambahkan ke Firestore
                        const promise = db.collection("inventory").add(newItem)
                            .then((docRef) => {
                                console.log("Document imported with ID:", docRef.id);
                                importedCount++;
                                
                                // Tambahkan ke inventory lokal dengan ID baru
                                inventory.push({
                                    id: docRef.id,
                                    ...newItem
                                });
                            })
                            .catch((error) => {
                                console.error("Error importing item:", error);
                                throw error;
                            });
                        
                        promises.push(promise);
                    });
                    
                    // Tunggu semua operasi selesai
                    Promise.all(promises)
                        .then(() => {
                            renderInventory();
                            calculateTotals();
                            saveDataToLocalStorage(); // Backup ke localStorage
                            showToast(`${importedCount} item berhasil diimpor ke database!`, 'success');
                        })
                        .catch((error) => {
                            console.error("Error during import:", error);
                            showToast('Gagal mengimpor beberapa data! ' + error.message, 'error');
                            
                            // Kembalikan data lama jika ada kesalahan
                            inventory = oldInventory;
                            renderInventory();
                            calculateTotals();
                        });
                }
            } else {
                showToast('Format file tidak valid!', 'error');
            }
        } catch (error) {
            showToast('Gagal membaca file!', 'error');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
});

// Format date to Indonesian format
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Invalid date
        
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return '';
    }
}

// Update current date display
function updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = formatDate(now);
    }
}

// Add database connection status indicator
function addStatusIndicator() {
    const headerContainer = document.querySelector('.container.mx-auto');
    if (headerContainer) {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'db-status';
        statusDiv.className = 'absolute top-4 right-4 flex items-center bg-white bg-opacity-20 py-1 px-3 rounded-full text-xs';
        statusDiv.innerHTML = '<i class="fas fa-cloud mr-1"></i> <span id="status-text">Terhubung ke Cloud</span>';
        
        // Set positioning on the parent container if not already set
        if (headerContainer.style.position !== 'relative') {
            headerContainer.style.position = 'relative';
        }
        
        headerContainer.appendChild(statusDiv);
        
        // Tambahkan listener untuk status online/offline
        window.addEventListener('online', updateConnectionStatus);
        window.addEventListener('offline', updateConnectionStatus);
        updateConnectionStatus();
    }
}

// Update connection status display
function updateConnectionStatus() {
    const statusText = document.getElementById('status-text');
    const statusIcon = document.querySelector('#db-status i');
    
    if (statusText && statusIcon) {
        if (navigator.onLine) {
            statusText.textContent = 'Terhubung ke Cloud';
            statusIcon.className = 'fas fa-cloud mr-1';
            statusText.parentElement.classList.remove('bg-red-500', 'bg-opacity-40');
            statusText.parentElement.classList.add('bg-white', 'bg-opacity-20');
        } else {
            statusText.textContent = 'Mode Offline';
            statusIcon.className = 'fas fa-cloud-slash mr-1';
            statusText.parentElement.classList.remove('bg-white', 'bg-opacity-20');
            statusText.parentElement.classList.add('bg-red-500', 'bg-opacity-40');
        }
    }
}

// Initialize the app
window.onload = function() {
    // Update date display
    updateCurrentDate();
    
    // Update date display every minute
    setInterval(updateCurrentDate, 60000);
    
    // Add status indicator
    addStatusIndicator();
    
    // Inisialisasi Firebase
    try {
        initializeFirebase();
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showToast("Gagal menghubungkan ke database. Mode offline aktif.", "error");
        
        // Fallback ke localStorage
        const savedData = localStorage.getItem('modalInventory');
        if (savedData) {
            inventory = JSON.parse(savedData);
            renderInventory();
            calculateTotals();
        } else {
            // Tambahkan sample data jika tidak ada data
            addSampleData();
        }
    }
};

// Add sample data if inventory is empty
function addSampleData() {
    if (inventory.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        
        inventory = [
            {
                id: '1',
                name: 'Laptop Asus',
                price: 8500000,
                quantity: 5,
                date: today,
                timestamp: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Mouse Wireless',
                price: 150000,
                quantity: 20,
                date: today,
                timestamp: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Keyboard Mechanical',
                price: 850000,
                quantity: 10,
                date: today,
                timestamp: new Date().toISOString()
            }
        ];
        saveDataToLocalStorage();
        renderInventory();
        calculateTotals();
    }
}

// Handle export button click
document.getElementById('export-btn').addEventListener('click', function() {
    if (inventory.length === 0) {
        showToast('Tidak ada data untuk diekspor!', 'error');
        return;
    }
    
    // Export to JSON directly for Firebase compatibility
    exportToJson(`MODAL-Inventory-${new Date().toISOString().slice(0, 10)}`, 'downloads');
});