let menus = [];
let toppings = [];
let cart = [];
let currentIndex = null;
let currentCustomer = null;

async function loadData() {
    try {
        const [menuRes, topRes] = await Promise.all([
            fetch('http://localhost:3000/api/menus'),
            fetch('http://localhost:3000/api/toppings')
        ]);
        menus = (await menuRes.json()).data;
        toppings = (await topRes.json()).data;
        
        document.getElementById('menu-list').innerHTML = menus.map((m, index) => `
            <button onclick="openModal(${index})" class="bg-white p-6 rounded-xl shadow-sm border hover:border-blue-500 text-left">
                <div class="font-bold text-lg">${m.menu_name}</div>
                <div class="text-blue-600 font-bold mt-2">${m.price} ฿</div>
            </button>
        `).join('');
    } catch (err) {
        console.error("รายละเอียด Error:", err);
        alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
}

function openModal(index) {
    currentIndex = index;
    document.getElementById('modal-menu-name').innerText = menus[index].menu_name;
    document.getElementById('modal-size').value = "M";
    
    document.getElementById('modal-toppings').innerHTML = toppings.map(t => `
        <label class="flex items-center space-x-3 cursor-pointer p-1">
            <input type="checkbox" value="${t.topping_id}" data-price="${t.price}" data-name="${t.topping_name}" class="topping-cb w-5 h-5">
            <span>${t.topping_name} (+${t.price}฿)</span>
        </label>
    `).join('');
    
    document.getElementById('option-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('option-modal').classList.add('hidden');
}

function confirmAddToCart() {
    const selected = menus[currentIndex];
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

function renderCart() {
    let total = 0;
    const cartDiv = document.getElementById('cart-list');
    
    if (cart.length === 0) {
        cartDiv.innerHTML = "ยังไม่มีสินค้า...";
        return;
    }

    cartDiv.innerHTML = cart.map((item, i) => {
        total += item.price;
        const topText = item.toppingNames.length > 0 ? `<br><span class="text-xs text-blue-500">+ ${item.toppingNames.join(', ')}</span>` : '';
        return `
            <div class="flex justify-between border-b py-3">
                <div><b>${item.menu_name} (ไซส์ ${item.size})</b>${topText}</div>
                <div class="flex gap-4">
                    <span class="text-blue-600 font-bold">${item.price} ฿</span>
                    <button onclick="cart.splice(${i}, 1); renderCart();" class="text-red-500 font-bold">X</button>
                </div>
            </div>
        `;
    }).join('');

    cartDiv.innerHTML += `<div class="text-2xl font-bold text-right mt-4 text-blue-600">รวม: ${total} ฿</div>`;
}

async function searchCustomer() {
    const phone = document.getElementById('search-phone').value;
    if(!phone) return;
    
    try {
        const res = await fetch(`http://localhost:3000/api/customers/${phone}`);
        const data = await res.json();
        
        if(data.status === 'success') {
            currentCustomer = data.data; 
            document.getElementById('customer-info').classList.remove('hidden');
            document.getElementById('c-name').innerText = currentCustomer.name;
        } else {
            const newName = prompt("ไม่พบเบอร์นี้ กรุณาพิมพ์ชื่อลูกค้าเพื่อสมัครสมาชิกใหม่:");
            if(newName) {
                const regRes = await fetch('http://localhost:3000/api/customer', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'}, 
                    body: JSON.stringify({name: newName, phone})
                });
                const regData = await regRes.json();
                if(regRes.ok) {
                    alert("สมัครสมาชิกสำเร็จ");
                    currentCustomer = { customer_id: regData.customer_id, name: regData.name };
                    document.getElementById('customer-info').classList.remove('hidden');
                    document.getElementById('c-name').innerText = currentCustomer.name;
                }
            }
        }
    } catch(e) { 
        alert("ติดต่อเซิร์ฟเวอร์ไม่ได้"); 
    }
}

async function checkoutReal() {
    if (cart.length === 0) return alert("ตะกร้าว่างเปล่า");
    if (!currentCustomer) return alert("กรุณาค้นหาลูกค้าก่อนชำระเงิน");

    try {
        const res = await fetch('http://localhost:3000/api/orders', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ customer_id: currentCustomer.customer_id, items: cart }) 
        });
        const data = await res.json();
        
        if (res.ok) { 
            alert(data.message); 
            cart = []; 
            renderCart(); 
            currentCustomer = null; 
            document.getElementById('customer-info').classList.add('hidden');
            document.getElementById('search-phone').value = '';
        } else { 
            alert('เกิดข้อผิดพลาด: ' + data.error); 
        }
    } catch (error) { 
        alert('ติดต่อเซิร์ฟเวอร์ไม่ได้'); 
    }
}

loadData();
renderCart();

