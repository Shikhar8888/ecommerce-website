import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient('https://pvaclubngkxiwzhayrqb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2YWNsdWJuZ2t4aXd6aGF5cnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MjM5NzIsImV4cCI6MjA2ODk5OTk3Mn0.yKqqxs4k8NWBFhulPHbsWIVX6zJdeXeZ8W0ON7dnccg');

document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Toggle
    const hamburgerButtons = document.querySelectorAll('#hamburger');
    if (hamburgerButtons.length === 0) {
        console.warn('No hamburger buttons found with ID "hamburger"');
    }
    hamburgerButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
                console.log('Toggled mobile menu visibility');
            } else {
                console.error('Mobile menu with ID "mobile-menu" not found');
            }
        });
    });

    // Fetch and Display Products
    async function fetchProducts() {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            console.error('Error fetching products:', error);
            return;
        }
        const productContainer = document.querySelector('.product-list');
        if (productContainer) {
            productContainer.innerHTML = '';
            data.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.dataset.name = product.name;
                productItem.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded">
                    <h3 class="text-lg font-semibold font-[Poppins]">${product.name}</h3>
                    <p class="text-gray-600">₹${product.price}</p>
                    <p class="text-yellow-500">${'★'.repeat(product.rating)}${'☆'.repeat(5 - product.rating)}</p>
                    <button class="btn bg-blue-600 text-white py-2 px-4 rounded mt-2" data-id="${product.id}">Add to Cart</button>
                `;
                productContainer.appendChild(productItem);
            });
        }
    }

    // Add to Cart Functionality
    async function addToCart(productId) {
        const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) {
            console.error('Error fetching product:', error);
            return;
        }
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Product added to cart!');
        console.log(`Added to cart: ${product.name}`);
    }

    // Place Order Functionality
    const placeOrderButton = document.getElementById('place-order');
    if (placeOrderButton) {
        placeOrderButton.addEventListener('click', async () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            const { user } = await supabase.auth.getUser();
            if (!user) {
                alert('Please log in to place an order.');
                window.location.href = 'login.html';
                return;
            }

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const delivery = 50;
            const discount = -100;
            const total = subtotal + delivery + discount;

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{ user_id: user.id, total, status: 'Pending' }])
                .select()
                .single();

            if (orderError) {
                console.error('Error creating order:', orderError);
                alert('Failed to place order');
                return;
            }

            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) {
                console.error('Error creating order items:', itemsError);
                alert('Failed to place order items');
                return;
            }

            // Trigger order confirmation email via Edge Function
            const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
                body: { order_id: order.id, user_email: user.email, total }
            });
            if (emailError) {
                console.error('Error sending order confirmation:', emailError);
            }

            localStorage.removeItem('cart');
            alert('Order placed successfully!');
            window.location.href = 'account.html';
        });
    }

    // Render Cart Items
    async function renderCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cartItemsContainer.innerHTML = '';
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="text-gray-600">Your cart is empty.</p>';
            } else {
                cart.forEach((item, index) => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'bg-white p-4 rounded shadow cart-item mb-4';
                    cartItem.dataset.index = index;
                    cartItem.innerHTML = `
                        <div class="flex items-center space-x-4">
                            <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold font-[Poppins]">${item.name}</h3>
                                <p class="text-gray-600">₹${item.price}</p>
                                <div class="flex items-center space-x-2 mt-2">
                                    <button class="border border-gray-600 text-gray-600 font-medium py-1 px-2 rounded quantity-btn">-</button>
                                    <span class="quantity">${item.quantity}</span>
                                    <button class="border border-gray-600 text-gray-600 font-medium py-1 px-2 rounded quantity-btn">+</button>
                                </div>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.appendChild(cartItem);
                });
            }
            updateCartSummary();
            updateCartQuantity();
        }
    }

    // Update Cart Summary
    function updateCartSummary() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let delivery = 50;
        let discount = -100;
        let total = subtotal + delivery + discount;

        const subtotalEl = document.getElementById('subtotal');
        const deliveryEl = document.getElementById('delivery');
        const discountEl = document.getElementById('discount');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
        if (deliveryEl) deliveryEl.textContent = `₹${delivery}`;
        if (discountEl) discountEl.textContent = `₹${discount}`;
        if (totalEl) totalEl.textContent = `₹${total}`;
    }

    // Quantity Update in Cart
    function updateCartQuantity() {
        document.querySelectorAll('.cart-item .quantity-btn').forEach(button => {
            button.addEventListener('click', () => {
                const quantitySpan = button.parentElement.querySelector('.quantity');
                let count = parseInt(quantitySpan.textContent);
                const index = button.closest('.cart-item').dataset.index;
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                if (button.textContent === '+') {
                    count++;
                } else if (button.textContent === '-' && count > 1) {
                    count--;
                }
                quantitySpan.textContent = count;
                cart[index].quantity = count;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartSummary();
                console.log(`Updated quantity to ${count} for cart item ${index}`);
            });
        });
    }

    // Admin: Add Product
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('product-name').value;
            const price = parseInt(document.getElementById('product-price').value);
            const image = document.getElementById('product-image').value;
            const description = document.getElementById('product-description').value;
            const category = document.getElementById('product-category').value;
            const rating = parseInt(document.getElementById('product-rating').value);

            const { error } = await supabase.from('products').insert([
                { name, price, image, description, category, rating }
            ]);
            if (error) {
                console.error('Error adding product:', error);
                alert('Failed to add product');
            } else {
                alert('Product added successfully!');
                fetchProducts();
                addProductForm.reset();
            }
        });
    }

    // Admin: Update Business Info
    const businessInfoForm = document.getElementById('business-info-form');
    if (businessInfoForm) {
        businessInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const logo_url = document.getElementById('business-logo').value;
            const business_name = document.getElementById('business-name').value;
            const contact_email = document.getElementById('business-email').value;
            const contact_phone = document.getElementById('business-phone').value;
            const address = document.getElementById('business-address').value;

            const { error } = await supabase.from('business_info').upsert([
                { id: 1, logo_url, business_name, contact_email, contact_phone, address }
            ], { onConflict: 'id' });
            if (error) {
                console.error('Error updating business info:', error);
                alert('Failed to update business info');
            } else {
                alert('Business info updated successfully!');
                updateBusinessInfoUI();
            }
        });
    }

    // Update Business Info in UI
    async function updateBusinessInfoUI() {
        const { data, error } = await supabase.from('business_info').select('*').single();
        if (error) {
            console.error('Error fetching business info:', error);
            return;
        }
        const logoImg = document.querySelector('.footer-logo');
        const businessName = document.querySelector('.footer-business-name');
        const contactEmail = document.querySelector('.footer-contact-email');
        const contactPhone = document.querySelector('.footer-contact-phone');
        const address = document.querySelector('.footer-address');

        if (logoImg) logoImg.src = data.logo_url || 'https://via.placeholder.com/150';
        if (businessName) businessName.textContent = data.business_name || 'eShop';
        if (contactEmail) contactEmail.textContent = data.contact_email || '';
        if (contactPhone) contactPhone.textContent = data.contact_phone || '';
        if (address) address.textContent = data.address || '';
    }

    // Fetch Orders
    async function fetchOrders(isAdmin = false) {
        const orderTableBody = document.getElementById('order-table-body');
        if (orderTableBody) {
            let query = supabase.from('orders').select('id, user_id, total, status, created_at');
            if (!isAdmin) {
                const { user } = await supabase.auth.getUser();
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;
            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            orderTableBody.innerHTML = '';
            data.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-2">${order.id}</td>
                    <td class="p-2">${order.user_id}</td>
                    <td class="p-2">₹${order.total}</td>
                    <td class="p-2">${order.status}</td>
                `;
                orderTableBody.appendChild(row);
            });
        }
    }

    // Initialize
    fetchProducts();
    renderCart();
    updateBusinessInfoUI();
    fetchOrders(supabase.auth.getUser()?.user_metadata?.role === 'admin');

    // Search Bar Functionality
    const searchButton = document.querySelector('#search-button');
    const searchBar = document.getElementById('search-bar');
    if (searchButton && searchBar) {
        searchButton.addEventListener('click', async () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            const { data, error } = await supabase.from('products').select('*').ilike('name', `%${searchTerm}%`);
            if (error) {
                console.error('Error searching products:', error);
                return;
            }
            const productContainer = document.querySelector('.product-list');
            if (productContainer) {
                productContainer.innerHTML = '';
                data.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.className = 'product-item';
                    productItem.innerHTML = `
                        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded">
                        <h3 class="text-lg font-semibold font-[Poppins]">${product.name}</h3>
                        <p class="text-gray-600">₹${product.price}</p>
                        <p class="text-yellow-500">${'★'.repeat(product.rating)}${'☆'.repeat(5 - product.rating)}</p>
                        <button class="btn bg-blue-600 text-white py-2 px-4 rounded mt-2" data-id="${product.id}">Add to Cart</button>
                    `;
                    productContainer.appendChild(productItem);
                });
            }
        });
    }
});
