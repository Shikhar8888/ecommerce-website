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
    const cartButtons = document.querySelectorAll('.cart-item .border');
    if (cartButtons.length === 0) {
        console.warn('No cart buttons found with class "cart-item .border"');
    }
    cartButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const quantity = button.parentElement.querySelector('span');
            if (quantity) {
                let count = parseInt(quantity.textContent);
                if (button.textContent === '+') {
                    quantity.textContent = count + 1;
                } else if (button.textContent === '-' && count > 1) {
                    quantity.textContent = count - 1;
                }
                console.log(`Updated quantity to ${quantity.textContent} for cart item ${index}`);
            } else {
                console.error('Quantity span not found for cart button');
            }
        });
    });

    // Image Slider (Product Detail Page)
    const thumbnails = document.querySelectorAll('.cursor-pointer');
    if (thumbnails.length === 0) {
        console.warn('No thumbnails found with class "cursor-pointer"');
    }
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const mainImage = thumbnail.parentElement.previousElementSibling;
            if (mainImage) {
                mainImage.src = thumbnail.src;
                console.log(`Updated main image to ${thumbnail.src}`);
            } else {
                console.error('Main image not found for thumbnail');
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
        // Search on button click
        searchButton.addEventListener('click', () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            console.log(`Searching for: ${searchTerm}`);
            filterProducts(searchTerm);
        });

        // Search on Enter key
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
});
