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

    // Image Slider (Product Detail Page)
    const thumbnails = document.querySelectorAll('.thumbnail');
    if (thumbnails.length === 0) {
        console.warn('No thumbnails found with class "thumbnail"');
    }
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const mainImage = document.querySelector('.main-image');
            if (mainImage) {
                mainImage.src = thumbnail.src;
                console.log(`Updated main image to ${thumbnail.src}`);
            } else {
                console.error('Main image not found');
            }
        });
    });

    // Lazy Loading for Products
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            console.log('Load more products');
        }
    });

    // Search Bar Functionality
    const searchButton = document.querySelector('#search-button');
    const searchBar = document.getElementById('search-bar');
    const productItems = document.querySelectorAll('.product-item');

    if (!searchButton) {
        console.error('Search button with ID "search-button" not found');
    }
    if (!searchBar) {
        console.error('Search bar with ID "search-bar" not found');
    }
    if (productItems.length === 0) {
        console.warn('No product items found with class "product-item"');
    }

    if (searchButton && searchBar) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            console.log(`Searching for: ${searchTerm}`);
            filterProducts(searchTerm);
        });

        searchBar.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const searchTerm = searchBar.value.trim().toLowerCase();
                console.log(`Enter key pressed, searching for: ${searchTerm}`);
                filterProducts(searchTerm);
            }
        });
    }

    function filterProducts(searchTerm) {
        productItems.forEach(item => {
            const productName = item.getAttribute('data-name')?.toLowerCase() || '';
            if (productName.includes(searchTerm)) {
                item.style.display = 'block';
                console.log(`Showing product: ${productName}`);
            } else {
                item.style.display = 'none';
                console.log(`Hiding product: ${productName}`);
            }
        });
    }

    // Add to Cart Functionality
    const addToCartButton = document.getElementById('add-to-cart');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            const name = addToCartButton.dataset.name;
            const price = parseInt(addToCartButton.dataset.price);
            const image = addToCartButton.dataset.image;
            const size = document.getElementById('size').value;
            const color = document.querySelector('.color-btn.active')?.dataset.color || 'Red';
            const quantity = 1;

            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            cart.push({ name, price, image, size, color, quantity });
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Product added to cart!');
            console.log(`Added to cart: ${name}, ₹${price}, ${size}, ${color}`);
        });
    }

    // Render Cart Items
    function renderCart() {
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
                                <p class="text-gray-600">Size: ${item.size}, Color: ${item.color}</p>
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

    // Initialize Cart
    renderCart();

    // Color Button Selection
    const colorButtons = document.querySelectorAll('.color-btn');
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            colorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            console.log(`Selected color: ${button.dataset.color}`);
        });
    });
});
