let menus = [];
let toppings = [];
let cart = [];
let currentMenuId = null; // เปลี่ยนจากการเก็บ Index มาเก็บ ID แทน
let currentCustomer = null;
let currentCategory = 'ทั้งหมด'; // เก็บสถานะหมวดหมู่ปัจจุบัน

// ==========================================
// ระบบ Switch Tab
// ==========================================
function switchTab(tabId) {
    ['pos', 'dashboard', 'promotions', 'recommend'].forEach(id => {
        document.getElementById(`section-${id}`).classList.add('hidden');
        document.getElementById(`tab-${id}`).classList.remove('active');
    });

    document.getElementById(`section-${tabId}`).classList.remove('hidden');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    if(tabId === 'dashboard') { initMockChart(); loadRealReports(); }
    if(tabId === 'promotions') { loadPromotionTable(); }
    if(tabId === 'recommend') { loadRecommendTable(); }
}

async function loadData() {
    try {
        const [menuRes, topRes] = await Promise.all([
            fetch('http://localhost:3000/api/menus'),
            fetch('http://localhost:3000/api/toppings')
        ]);
        menus = (await menuRes.json()).data || [];
        toppings = (await topRes.json()).data || [];
        
        renderCategoryFilter(); 
        renderMenus('ทั้งหมด'); 
        loadPromotionBanners();
    } catch (err) {
        document.getElementById('menu-list').innerHTML = `<div class="col-span-full text-center text-red-500 p-10 bg-red-50 rounded-2xl">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้</div>`;
    }
}

// ==========================================
// ระบบ Slideshow
// ==========================================
let currentSlide = 0;
let slideInterval;

async function loadPromotionBanners() {
    try {
        const res = await fetch('http://localhost:3000/api/promotions');
        if (!res.ok) return;
        const result = await res.json();
        const promos = result.data || [];
        
        const banners = promos.filter(p => p.promo_image);
        const bannerContainer = document.getElementById('promo-banner-container');
        
        if (banners.length > 0) {
            bannerContainer.classList.remove('hidden');

            let slidesHTML = banners.map((b, index) => `
                <div class="promo-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}">
                    <img src="http://localhost:3000/uploads/${b.promo_image}" class="w-full h-full object-cover" alt="${b.promo_name}">
                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                        <div class="flex justify-between items-end">
                            <div>
                                <p class="font-bold text-sm text-yellow-400"><i class="fa-solid fa-bullhorn mr-1"></i> โค้ดส่วนลด : ${b.promo_id}</p>
                                <p class="text-xs text-gray-200">${b.promo_name} (เฉพาะหมวดหมู่ : ${b.applicable_categories || 'ทั้งหมด'})</p>
                            </div>
                            <span class="bg-red-500 text-white font-bold px-2 py-1 rounded text-sm shadow-md">- ${b.discount_amount} ฿</span>
                        </div>
                    </div>
                </div>
            `).join('');

            let buttonsHTML = '';
            if (banners.length > 1) {
                buttonsHTML = `
                    <button onclick="changeSlide(-1)" class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full z-20 transition-all shadow-md backdrop-blur-sm">
                        <i class="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <button onclick="changeSlide(1)" class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full z-20 transition-all shadow-md backdrop-blur-sm">
                        <i class="fa-solid fa-chevron-right text-sm"></i>
                    </button>
                `;
            }

            bannerContainer.innerHTML = slidesHTML + buttonsHTML;

            currentSlide = 0;
            startSlideInterval();

        } else {
            bannerContainer.classList.add('hidden');
            clearInterval(slideInterval);
        }
    } catch (err) {
        console.error('ไม่สามารถดึง Banner ได้', err);
    }
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length <= 1) return;

    slides[currentSlide].classList.replace('opacity-100', 'opacity-0');
    slides[currentSlide].classList.replace('z-10', 'z-0');

    currentSlide = (currentSlide + direction + slides.length) % slides.length;

    slides[currentSlide].classList.replace('opacity-0', 'opacity-100');
    slides[currentSlide].classList.replace('z-0', 'z-10');

    startSlideInterval();
}

function startSlideInterval() {
    clearInterval(slideInterval);
    const slides = document.querySelectorAll('.promo-slide');
    if (slides.length > 1) {
        slideInterval = setInterval(() => {
            changeSlide(1);
        }, 4000);
    }
}

// ==========================================
// ฟังก์ชันสร้างปุ่มหมวดหมู่
// ==========================================
function renderCategoryFilter() {
    const categories = ['ทั้งหมด', 'เมนูแนะนำ', ...new Set(menus.map(m => m.category).filter(c => c))];
    const filterDiv = document.getElementById('category-filter');
    
    filterDiv.innerHTML = categories.map(cat => {
        let btnClass = currentCategory === cat ? 'bg-blue-800 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-800';
        if (cat === 'เมนูแนะนำ' && currentCategory !== cat) btnClass = 'bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700';
        else if (cat === 'เมนูแนะนำ' && currentCategory === cat) btnClass = 'bg-yellow-400 text-blue-900 shadow-md font-bold';

        return `<button onclick="renderMenus('${cat}')" class="whitespace-nowrap px-4 py-2 rounded-xl font-medium transition-all ${btnClass}">
            ${cat === 'เมนูแนะนำ' ? '<i class="fa-solid fa-star mr-1"></i> ' : ''}${cat}
        </button>`;
    }).join('');
}

// ==========================================
// ฟังก์ชันแสดงรายการเมนู (กรองตามหมวดหมู่)
// ==========================================
function renderMenus(category) {
    currentCategory = category;
    renderCategoryFilter();
    
    let filteredMenus = [];
    if (category === 'ทั้งหมด') {
        filteredMenus = menus;
    } else if (category === 'เมนูแนะนำ') {
        filteredMenus = menus.filter(m => m.is_recommended == 1);
    } else {
        filteredMenus = menus.filter(m => m.category === category);
    }
    
    document.getElementById('menu-list').innerHTML = filteredMenus.map(m => {
        let icon = '<i class="fa-solid fa-utensils text-gray-300 text-xs"></i>';
        if(['กาแฟ', 'ชา', 'โกโก้'].includes(m.category)) icon = '<i class="fa-solid fa-mug-hot text-gray-300 text-xs"></i>';
        else if(m.category === 'เบเกอรี่') icon = '<i class="fa-solid fa-cookie text-gray-300 text-xs"></i>';
        
        return `
        <button onclick="handleMenuClick(${m.menu_id})" class="menu-card bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-400 hover:shadow-md flex flex-col justify-between h-full text-left group">
            <div class="w-full">
                <div class="flex justify-between items-start">
                    <div class="font-bold text-gray-700 group-hover:text-blue-900">${m.menu_name}</div>
                    ${icon}
                </div>
                <div class="text-xs text-gray-400 mt-1">${m.category || 'ไม่มีหมวดหมู่'}</div>
            </div>
            <div class="text-blue-800 font-bold mt-4 text-lg bg-blue-50/50 inline-block px-3 py-1 rounded-lg">${m.price} ฿</div>
        </button>
    `}).join('');
}

// ==========================================
// ฟังก์ชันแยกแยะเมื่อกดเมนู (หัวใจสำคัญของการแยกหมวดหมู่)
// ==========================================
function handleMenuClick(menu_id) {
    const selectedMenu = menus.find(m => m.menu_id === menu_id);
    if(!selectedMenu) return;

    const customizableCategories = ['กาแฟ', 'ชา', 'โกโก้'];
    const isCustomizable = customizableCategories.includes(selectedMenu.category);

    if (isCustomizable) {
        openModal(selectedMenu);
    } else {
        cart.push({
            menu_id: selectedMenu.menu_id,
            menu_name: selectedMenu.menu_name,
            size: '-',
            price: Number(selectedMenu.price),
            toppings: [],
            toppingNames: []
        });
        renderCart();
    }
}

function openModal(menu) {
    currentMenuId = menu.menu_id;
    document.getElementById('modal-menu-name').innerText = menu.menu_name;
    document.getElementById('modal-size').value = "M";
    
    document.getElementById('modal-toppings').innerHTML = toppings.map(t => `
        <label class="flex items-center justify-between cursor-pointer p-3 bg-gray-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 transition-colors">
            <div class="flex items-center gap-3">
                <input type="checkbox" value="${t.topping_id}" data-price="${t.price}" data-name="${t.topping_name}" class="topping-cb w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                <span class="text-gray-700 font-medium">${t.topping_name}</span>
            </div>
            <span class="text-blue-600 font-bold">+${t.price}฿</span>
        </label>
    `).join('');
    
    const modal = document.getElementById('option-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('modal-content').classList.remove('scale-95');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('option-modal');
    modal.classList.add('opacity-0');
    document.getElementById('modal-content').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function confirmAddToCart() {
    const selected = menus.find(m => m.menu_id === currentMenuId);
    const size = document.getElementById('modal-size').value;
    let finalPrice = Number(selected.price) + (size === 'L' ? 10 : 0);
    
    const selectedToppings = [];
    const toppingNames = [];
    
    document.querySelectorAll('.topping-cb:checked').forEach(cb => {
        selectedToppings.push(Number(cb.value));
        toppingNames.push(cb.dataset.name);
        finalPrice += Number(cb.dataset.price);
    });

    cart.push({
        menu_id: selected.menu_id,
        menu_name: selected.menu_name,
        size: size,
        price: finalPrice,
        toppings: selectedToppings,
        toppingNames: toppingNames
    });
    
    closeModal();
    renderCart();
}

let appliedPromo = null;

// ==========================================
// ฟังก์ชันใช้โค้ดส่วนลด
// ==========================================
async function applyPromoCode() {
    const code = document.getElementById('promo-code-input').value.trim();
    if (!code) return;

    try {
        const res = await fetch('http://localhost:3000/api/promotions');
        const result = await res.json();
        const promo = result.data.find(p => p.promo_id === code);

        if (!promo) return alert('ไม่พบโค้ดส่วนลดนี้');

        const today = new Date().toISOString().split('T')[0];
        if (promo.expiry_date && promo.expiry_date < today) {
            return alert('โค้ดส่วนลดนี้หมดอายุแล้วเมื่อวันที่ ' + promo.expiry_date);
        }

        appliedPromo = promo;
        document.getElementById('display-promo-code').innerText = code;
        document.getElementById('applied-promo-info').classList.remove('hidden');
        
        renderCart();
        alert(`ใช้โค้ดส่วนลดสำเร็จ! ลด ${promo.discount_amount} บาท สำหรับสินค้าหมวดหมู่ : ${promo.applicable_categories}`);
    } catch (err) {
        console.error(err);
    }
}

// ==========================================
// ฟังก์ชันยกเลิกโค้ดส่วนลด
// ==========================================
function removePromoCode() {
    appliedPromo = null;
    document.getElementById('promo-code-input').value = '';
    document.getElementById('applied-promo-info').classList.add('hidden');
    renderCart();
}

// ==========================================
// ฟังก์ชัน renderCart ให้คิดส่วนลดตามเงื่อนไข
// ==========================================
function renderCart() {
    let subtotal = 0;
    let totalDiscount = 0;
    const cartDiv = document.getElementById('cart-list');

    subtotal = cart.reduce((sum, item) => sum + item.price, 0);

    if (appliedPromo) {
        const promoCategories = appliedPromo.applicable_categories.split(',').map(c => c.trim());
        
        const hasEligibleItem = cart.some(item => {
            const itemCategory = menus.find(m => m.menu_id === item.menu_id)?.category;
            return promoCategories.includes('ทั้งหมด') || promoCategories.includes(itemCategory);
        });

        if (hasEligibleItem) {
            totalDiscount = Math.min(subtotal, appliedPromo.discount_amount);
        }
    }

    cartDiv.innerHTML = cart.map((item, i) => `
        <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
            <div>
                <div class="font-bold text-gray-800 text-sm">${item.menu_name} ${item.size !== '-' ? `<span class="text-xs text-gray-400">(${item.size})</span>` : ''}</div>
                <div class="text-blue-800 font-bold text-xs">${item.price} ฿</div>
            </div>
            <button onclick="cart.splice(${i}, 1); renderCart();" class="text-red-300 hover:text-red-500 ml-2"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');

    const finalTotal = subtotal - totalDiscount;

    let totalHTML = `${finalTotal} ฿`;
    if (totalDiscount > 0) {
        totalHTML = `
            <div class="text-right">
                <div class="text-xs text-gray-400 line-through">${subtotal} ฿</div>
                <div class="text-xs text-green-600 font-bold">ส่วนลด: -${totalDiscount} ฿</div>
                <div class="text-2xl font-bold text-blue-900">${finalTotal} ฿</div>
            </div>
        `;
        document.getElementById('cart-total').innerHTML = totalHTML;
    } else {
        document.getElementById('cart-total').innerText = totalHTML;
    }
}

// ==========================================
// ฟังก์ชันค้นหาลูกค้า
// ==========================================
async function searchCustomer() {
    const phone = document.getElementById('search-phone').value.trim();
    
    if(!phone) {
        currentCustomer = null;
        document.getElementById('customer-info').classList.add('hidden');
        return; 
    }
    
    try {
        const res = await fetch(`http://localhost:3000/api/customers?phone=${phone}`);
        const result = await res.json();
        
        if(result.data && result.data.length > 0) {
            currentCustomer = result.data[0];
            document.getElementById('c-name').innerText = currentCustomer.name;
            document.getElementById('customer-info').classList.remove('hidden');
        } else {
            alert('ไม่พบข้อมูลลูกค้าในระบบ');
            document.getElementById('customer-info').classList.add('hidden');
            currentCustomer = null;
        }
    } catch (err) {
        console.error(err);
        alert('ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อค้นหาลูกค้าได้');
    }
}

// ==========================================
// ฟังก์ชันชำระเงิน
// ==========================================
async function checkoutReal() {
    if (cart.length === 0) return alert('ตะกร้าว่างเปล่า!');

    const phoneInput = document.getElementById('search-phone').value.trim();
    if (!phoneInput) {
        currentCustomer = null;
    }

    let subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    let totalDiscount = 0;

    if (appliedPromo) {
        const promoCategories = appliedPromo.applicable_categories.split(',').map(c => c.trim());
        const hasEligibleItem = cart.some(item => {
            const itemCategory = menus.find(m => m.menu_id === item.menu_id)?.category;
            return promoCategories.includes('ทั้งหมด') || promoCategories.includes(itemCategory);
        });

        if (hasEligibleItem) {
            totalDiscount = Math.min(subtotal, appliedPromo.discount_amount);
        }
    }

    const final_price = subtotal - totalDiscount;

    const orderData = {
        customer_id: currentCustomer ? currentCustomer.customer_id : 999999, 
        total_price: final_price,
        items: cart
    };

    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert(`ชำระเงินเสร็จสิ้น! ยอดรวมทั้งสิ้น ${final_price} บาท (รวมส่วนลดแล้ว)`);
            
            cart = [];
            currentCustomer = null;
            document.getElementById('search-phone').value = '';
            document.getElementById('customer-info').classList.add('hidden');
            
            appliedPromo = null;
            document.getElementById('promo-code-input').value = '';
            document.getElementById('applied-promo-info').classList.add('hidden');
            
            renderCart();
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
}

// ==========================================
// ฟังก์ชันสร้างกราฟ Dashboard
// ==========================================
let categoryChartInstance = null;
let topMenuChartInstance = null;

function initMockChart() {
    // กราฟโดนัทสัดส่วนยอดขายตามหมวดหมู่
    if(!categoryChartInstance) {
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        categoryChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['กาแฟ', 'ชา', 'เบเกอรี่', 'เครื่องดื่มอื่นๆ'],
                datasets: [{
                    data: [55, 20, 15, 10],
                    backgroundColor: ['#1e3a8a', '#facc15', '#3b82f6', '#94a3b8'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } },
                cutout: '65%'
            }
        });
    }

    // กราฟ 5 อันดับเมนูขายดี
    if(!topMenuChartInstance) {
        const ctxTopMenu = document.getElementById('topMenuChart').getContext('2d');
        topMenuChartInstance = new Chart(ctxTopMenu, {
            type: 'bar',
            data: {
                labels: ['อเมริกาโน่', 'ลาเต้ร้อน', 'ชาไทยปั่น', 'เค้กส้ม', 'มัทฉะลาเต้'],
                datasets: [{
                    label: 'จำนวน (แก้ว/ชิ้น)',
                    data: [45, 38, 30, 22, 15],
                    backgroundColor: ['#1e3a8a', '#3b82f6', '#facc15', '#fbbf24', '#94a3b8'],
                    borderRadius: 6
                }]
            },
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });
    }
}

// ==========================================
// ฟังก์ชันดึงข้อมูลจริงมาแสดงใน Dashboard
// ==========================================
async function loadRealReports() {
    const selectedDate = document.getElementById('date-filter').value;
    let url = 'http://localhost:3000/api/report';
    if (selectedDate) {
        url += `?date=${selectedDate}`;
    }

    try {
        const res = await fetch(url);
        const result = await res.json();

        if (result.status === 'success') {
            document.getElementById('report-total-sales').innerText = Number(result.summary.total_sales || 0).toLocaleString();
            document.getElementById('report-total-orders').innerText = result.summary.total_orders || 0;
            document.getElementById('report-top-menu').innerText = result.top1 || '-';

            // กราฟโดนัท
            if (categoryChartInstance) {
                if(result.categories.length > 0) {
                    categoryChartInstance.data.labels = result.categories.map(c => c.category || 'ไม่มีหมวดหมู่');
                    categoryChartInstance.data.datasets[0].data = result.categories.map(c => c.total_sales);
                    categoryChartInstance.data.datasets[0].backgroundColor = ['#1e3a8a', '#facc15', '#3b82f6', '#94a3b8'];
                } else {
                    categoryChartInstance.data.labels = ['ไม่มีข้อมูลการขาย'];
                    categoryChartInstance.data.datasets[0].data = [1];
                    categoryChartInstance.data.datasets[0].backgroundColor = ['#e2e8f0']; // สีเทา
                }
                categoryChartInstance.update();
            }

            // กราฟแท่ง
            if (topMenuChartInstance) {
                if(result.top5.length > 0) {
                    topMenuChartInstance.data.labels = result.top5.map(m => m.menu_name);
                    topMenuChartInstance.data.datasets[0].data = result.top5.map(m => m.qty);
                } else {
                    topMenuChartInstance.data.labels = ['ไม่มีข้อมูล'];
                    topMenuChartInstance.data.datasets[0].data = [0];
                }
                topMenuChartInstance.update();
            }

            const tbody = document.getElementById('daily-sales-table');
            if (result.tableData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-400 text-lg">ไม่มีข้อมูลการขายในวันที่เลือก</td></tr>`;
            } else {
                let sumTotal = 0;

                let tableHTML = result.tableData.map(row => {
                    sumTotal += Number(row.total_price);
                    return `
                        <tr class="border-b hover:bg-gray-50 transition-colors">
                            <td class="p-3 text-blue-900 font-medium">#${row.order_id}</td>
                            <td class="p-3 text-gray-600">${row.datetime}</td>
                            <td class="p-3 text-gray-700">${row.customer_name || 'ลูกค้าทั่วไป'}</td>
                            <td class="p-3 text-gray-500">${row.customer_phone || '-'}</td> <td class="p-3 text-right font-bold text-blue-800">${Number(row.total_price).toLocaleString()} ฿</td>
                        </tr>
                    `;
                }).join('');

                tableHTML += `
                    <tr class="bg-blue-50/50 border-t-2 border-blue-200">
                        <td colspan="4" class="p-4 text-right font-bold text-blue-900 text-lg">รวมเงินทั้งสิ้น:</td>
                        <td class="p-4 text-right font-bold text-red-600 text-xl underline">${sumTotal.toLocaleString()} ฿</td>
                    </tr>
                `;
                
                tbody.innerHTML = tableHTML;
            }
        }
    } catch (err) {
        console.error("ดึงข้อมูล Report ไม่สำเร็จ", err);
    }
}

// ==========================================
// ฟังก์ชันโหลดข้อมูลตารางจัดการโปรโมชัน
// ==========================================
async function loadPromotionTable() {
    try {
        const res = await fetch('http://localhost:3000/api/promotions');
        const result = await res.json();
        const tbody = document.getElementById('promo-list-table');

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-gray-400 text-lg">ยังไม่มีโปรโมชันในระบบ</td></tr>`;
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        tbody.innerHTML = result.data.map(p => {
            let statusHTML = `<span class="bg-green-50 text-green-600 font-bold px-3 py-1.5 rounded-full text-xs border border-green-200">ไม่มีวันหมดอายุ</span>`;
            if (p.expiry_date) {
                if (p.expiry_date < today) {
                    statusHTML = `<span class="bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full text-xs border border-red-200">หมดอายุเมื่อวันที่ ${p.expiry_date}</span>`;
                } else {
                    statusHTML = `<span class="bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-full text-xs border border-blue-200">ถึงวันที่ ${p.expiry_date}</span>`;
                }
            }

            return `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="p-3">
                    ${p.promo_image ? `<img src="http://localhost:3000/uploads/${p.promo_image}" class="h-16 w-32 object-cover rounded-lg">` : `<div class="h-16 w-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">ไม่มีรูป</div>`}
                </td>
                <td class="p-3">
                    <div class="font-bold text-blue-900 text-base"><i class="fa-solid fa-tag text-yellow-500 mr-1"></i>${p.promo_id}</div>
                    <div class="text-sm text-gray-500">${p.promo_name}</div>
                </td>
                <td class="p-3 text-gray-600 font-medium">${p.applicable_categories || 'ทั้งหมด'}</td>
                <td class="p-3 text-center"><span class="bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-full text-sm">- ${p.discount_amount} ฿</span></td>
                
                <td class="p-3 text-center">${statusHTML}</td> 
                
                <td class="p-3 text-center">
                    <button onclick="openEditModal('${p.promo_id}', '${p.promo_name}', ${p.discount_amount}, '${p.applicable_categories}', '${p.expiry_date || ''}')" class="text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 px-3 py-2 rounded-xl transition-all shadow-sm border border-blue-100 mb-1">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deletePromo('${p.promo_id}')" class="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 px-3 py-2 rounded-xl transition-all shadow-sm border border-red-100 mb-1">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
    } catch (err) {
        console.error("ดึงข้อมูลโปรโมชันไม่สำเร็จ", err);
    }
}

// เรียกโหลดข้อมูล
loadData();
renderCart();

// ==========================================
// ฟังก์ชันส่งข้อมูลฟอร์มโปรโมชัน+รูปภาพ
// ==========================================
document.getElementById('promoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('promo_id', document.getElementById('promo_id').value);
    formData.append('promo_name', document.getElementById('promo_name').value);
    formData.append('discount_amount', document.getElementById('discount_amount').value);

    const categoryCheckboxes = document.querySelectorAll('input[name="promo_cat"]:checked');
    let selectedCategories = Array.from(categoryCheckboxes).map(cb => cb.value);

    if(selectedCategories.includes('ทั้งหมด') || selectedCategories.length === 0) {
        selectedCategories = ['ทั้งหมด'];
    }

    formData.append('applicable_categories', selectedCategories.join(', '));

    formData.append('expiry_date', document.getElementById('expiry_date').value);
    
    const imageFile = document.getElementById('promo_image_input').files[0];
    if (imageFile) {
        formData.append('promo_image', imageFile); 
    }

    try {
        const response = await fetch('http://localhost:3000/api/promotions', {
            method: 'POST',
            body: formData  
        });

        const result = await response.json();
        if(response.ok) {
            alert('เพิ่มโปรโมชันสำเร็จ!');
            document.getElementById('promoForm').reset(); 
            loadPromotionBanners();
            loadPromotionTable();
        } else {
            alert('เกิดข้อผิดพลาด : ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ติดต่อเซิร์ฟเวอร์ไม่ได้');
    }
});

// ==========================================
// ฟังก์ชันจัดการ Checkbox หมวดหมู่โปรโมชัน
// ==========================================
const categoryCheckboxes = document.querySelectorAll('input[name="promo_cat"]');
const checkAllBox = document.querySelector('input[name="promo_cat"][value="ทั้งหมด"]');

categoryCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
        if (this.value === 'ทั้งหมด' && this.checked) {
            categoryCheckboxes.forEach(otherCb => {
                if (otherCb.value !== 'ทั้งหมด') {
                    otherCb.checked = false;
                }
            });
        } 

        else if (this.value !== 'ทั้งหมด' && this.checked) {
            if (checkAllBox) {
                checkAllBox.checked = false;
            }
        }
    });
});

// ==========================================
// ฟังก์ชันยืนยันการลบโปรโมชัน
// ==========================================
async function deletePromo(id) {
    if(!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชัน รหัส : ${id} ?`)) return;
    
    try {
        const res = await fetch(`http://localhost:3000/api/promotions/${id}`, { method: 'DELETE' });
        if(res.ok) {
            alert('ลบโปรโมชันสำเร็จ!');
            loadPromotionTable();
            loadPromotionBanners();
        } else {
            alert('ลบโปรโมชันไม่สำเร็จ!');
        }
    } catch (err) {
        console.error(err);
        alert('ติดต่อเซิร์ฟเวอร์ไม่ได้');
    }
}

// ==========================================
// ฟังก์ชันแก้ไขโปรโมชัน
// ==========================================
function openEditModal(id, name, discount, categories, expiry_date) {
    document.getElementById('edit_promo_id').value = id;
    document.getElementById('edit_promo_name').value = name;
    document.getElementById('edit_discount_amount').value = discount;
    document.getElementById('edit_promo_image_input').value = "";
    document.getElementById('edit_expiry_date').value = expiry_date || "";

    const catArray = categories.split(',').map(c => c.trim());
    const checkboxes = document.querySelectorAll('input[name="edit_promo_cat"]');
    
    checkboxes.forEach(cb => {
        cb.checked = catArray.includes(cb.value);
    });

    const modal = document.getElementById('edit-promo-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('edit-promo-content').classList.remove('scale-95');
    }, 10);
}

function closeEditModal() {
    const modal = document.getElementById('edit-promo-modal');
    modal.classList.add('opacity-0');
    document.getElementById('edit-promo-content').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

const editCatCheckboxes = document.querySelectorAll('input[name="edit_promo_cat"]');
const editCheckAllBox = document.querySelector('input[name="edit_promo_cat"][value="ทั้งหมด"]');

editCatCheckboxes.forEach(cb => {
    cb.addEventListener('change', function() {
        if (this.value === 'ทั้งหมด' && this.checked) {
            editCatCheckboxes.forEach(otherCb => { if (otherCb.value !== 'ทั้งหมด') otherCb.checked = false; });
        } else if (this.value !== 'ทั้งหมด' && this.checked) {
            if (editCheckAllBox) editCheckAllBox.checked = false;
        }
    });
});

// ส่งข้อมูลไป PUT
document.getElementById('editPromoForm').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const id = document.getElementById('edit_promo_id').value;
    const formData = new FormData();
    formData.append('promo_name', document.getElementById('edit_promo_name').value);
    formData.append('discount_amount', document.getElementById('edit_discount_amount').value);

    const selectedCbs = document.querySelectorAll('input[name="edit_promo_cat"]:checked');
    let selectedCategories = Array.from(selectedCbs).map(cb => cb.value);
    if(selectedCategories.includes('ทั้งหมด') || selectedCategories.length === 0) selectedCategories = ['ทั้งหมด'];
    formData.append('applicable_categories', selectedCategories.join(', '));

    formData.append('expiry_date', document.getElementById('edit_expiry_date').value);
    
    const imageFile = document.getElementById('edit_promo_image_input').files[0];
    if (imageFile) formData.append('promo_image', imageFile);

    try {
        const response = await fetch(`http://localhost:3000/api/promotions/${id}`, {
            method: 'PUT',
            body: formData  
        });

        const result = await response.json();
        if(response.ok) {
            alert('แก้ไขโปรโมชันสำเร็จ!');
            closeEditModal();
            loadPromotionTable();
            loadPromotionBanners();
        } else {
            alert('เกิดข้อผิดพลาด : ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('ติดต่อเซิร์ฟเวอร์ไม่ได้');
    }
});

// ==========================================
// จัดการเมนูแนะนำ
// ==========================================
async function loadRecommendTable() {
    try {
        const tbody = document.getElementById('recommend-list-table');

        if (menus.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-gray-400">ยังไม่มีเมนูในระบบ</td></tr>`;
            return;
        }

        tbody.innerHTML = menus.map(m => `
            <tr class="border-b hover:bg-gray-50 transition-colors">
                <td class="p-4 text-gray-500 font-medium">#${m.menu_id}</td>
                <td class="p-4">
                    <div class="font-bold text-blue-900 text-base">${m.menu_name}</div>
                </td>
                <td class="p-4 text-gray-600">${m.category || '-'}</td>
                <td class="p-4 text-center">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" ${m.is_recommended == 1 ? 'checked' : ''} 
                               onchange="toggleRecommend(${m.menu_id}, this.checked)">
                        <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-yellow-400"></div>
                    </label>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการโหลดตารางเมนูแนะนำ", err);
    }
}

async function toggleRecommend(menuId, isChecked) {
    const newStatus = isChecked ? 1 : 0;
    try {
        const res = await fetch(`http://localhost:3000/api/menus/${menuId}/recommend`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_recommended: newStatus })
        });

        if (res.ok) {
            const menuIndex = menus.findIndex(m => m.menu_id === menuId);
            if (menuIndex > -1) {
                menus[menuIndex].is_recommended = newStatus;
            }
            
            if (currentCategory === 'เมนูแนะนำ') renderMenus('เมนูแนะนำ');
            
        } else {
            alert('อัปเดตสถานะไม่สำเร็จ!');
        }
    } catch (err) {
        console.error(err);
        alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    }
}