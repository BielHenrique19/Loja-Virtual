const WHATSAPP_NUMBER = "554384817218";

const products = [
    { id: 1, name: "Fone Bluetooth Pro", desc: "Cancelamento de ruído e 24h de bateria.", price: 149.90, img: "", category: "Eletrônicos" },
    { id: 2, name: "Smartwatch Esportivo", desc: "Monitor cardíaco, GPS e à prova d'água.", price: 229.00, img: "", category: "Eletrônicos" },
    { id: 3, name: "Mochila Impermeável", desc: "Compartimento para notebook até 15.6''.", price: 119.50, img: "", category: "Acessórios" },
    { id: 4, name: "Garrafa Térmica Inox", desc: "Mantém bebidas geladas por 24h (750ml).", price: 65.00, img: "", category: "Casa" }
];

let cart = [];
try {
    cart = JSON.parse(localStorage.getItem('minha_loja_cart')) || [];
} catch(e) { cart = []; }

function saveCart() {
    localStorage.setItem('minha_loja_cart', JSON.stringify(cart));
}

function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderProducts() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const filtered = products.filter(p => 
        (p.name.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term)) &&
        (!category || p.category === category)
    );
    const list = document.getElementById('products-list');

    if (filtered.length === 0) {
        list.innerHTML = "<p>Nenhum produto encontrado. Tente outra busca.</p>";
        return;
    }

    list.innerHTML = filtered.map(p => `
        <article class="product-card">
            <div>
                ${p.img 
                    ? `<img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy">` 
                    : `<div class="img-placeholder">Sem imagem</div>`
                }
                <span class="category-badge">${escapeHtml(p.category)}</span>
                <h3>${escapeHtml(p.name)}</h3>
                <p class="product-desc">${escapeHtml(p.desc)}</p>
            </div>
            <div>
                <p class="price">${formatBRL(p.price)}</p>
                <p class="installments">ou 3x de ${formatBRL(p.price / 3)} sem juros</p>
                <button class="add-btn" id="btn-${p.id}" onclick="addToCart(${p.id})">Adicionar ao Carrinho</button>
            </div>
        </article>
    `).join('');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function addToCart(id) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        const product = products.find(p => p.id === id);
        if (product) cart.push({ ...product, qty: 1 });
    }
    saveCart();
    updateCartUI();
    showToast('Produto adicionado ao carrinho!');

    const btn = document.getElementById(`btn-${id}`);
    if (btn) {
        const original = btn.innerText;
        btn.innerText = "✓ Adicionado";
        btn.classList.add("added");
        setTimeout(() => {
            btn.innerText = original;
            btn.classList.remove("added");
        }, 900);
    }
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('Limpar todo o carrinho?')) return;
    cart = [];
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-count').textContent = totalItems;

    const container = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cart-total').textContent = formatBRL(total);
    document.getElementById('checkout-btn').disabled = cart.length === 0;

    if (cart.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#6b7280; padding:1rem 0;'>Seu carrinho está vazio.</p>";
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div style="flex:1;">
                <strong>${escapeHtml(item.name)}</strong><br>
                <small>${formatBRL(item.price)} cada</small>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)" aria-label="Diminuir">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)" aria-label="Aumentar">+</button>
            </div>
            <strong>${formatBRL(item.price * item.qty)}</strong>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
        </div>
    `).join('');
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    const isOpen = modal.classList.contains('open');
    modal.classList.toggle('open');
    document.body.style.overflow = isOpen ? '' : 'hidden';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('cart-modal');
        if (modal.classList.contains('open')) toggleCart();
    }
});

function checkoutWhatsApp() {
    const nameInput = document.getElementById('customer-name');
    const addressInput = document.getElementById('customer-address');
    const payment = document.getElementById('payment-method').value;

    let hasError = false;
    [nameInput, addressInput].forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            hasError = true;
        } else {
            input.classList.remove('error');
        }
    });

    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    if (hasError) {
        alert('Preencha seu nome e endereço para continuar.');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    let message = `*NOVO PEDIDO - MINHA LOJA*%0A%0A`;
    message += `*Cliente:* ${encodeURIComponent(nameInput.value.trim())}%0A`;
    message += `*Endereço:* ${encodeURIComponent(addressInput.value.trim())}%0A`;
    message += `*Pagamento:* ${encodeURIComponent(payment)}%0A%0A`;
    message += `*Itens:*%0A`;

    cart.forEach(item => {
        message += `• ${encodeURIComponent(item.name)} - ${item.qty}x ${encodeURIComponent(formatBRL(item.price))} = ${encodeURIComponent(formatBRL(item.price * item.qty))}%0A`;
    });

    message += `%0A*Total: ${encodeURIComponent(formatBRL(total))}*`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
}

renderProducts();
updateCartUI();
