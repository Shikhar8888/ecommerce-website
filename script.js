// Hamburger Menu Toggle
    document.querySelectorAll('#hamburger').forEach(button => {
        button.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    });

    // Quantity Update in Cart
    document.querySelectorAll('.cart-item .border').forEach((button, index) => {
        button.addEventListener('click', () => {
            const quantity = button.parentElement.querySelector('span');
            let count = parseInt(quantity.textContent);
            if (button.textContent === '+') {
                quantity.textContent = count + 1;
            } else if (button.textContent === '-' && count > 1) {
                quantity.textContent = count - 1;
            }
        });
    });

    // Image Slider (Product Detail Page)
    document.querySelectorAll('.cursor-pointer').forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            const mainImage = thumbnail.parentElement.previousElementSibling;
            mainImage.src = thumbnail.src;
        });
    });

    // Lazy Loading for Products
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            // Simulate loading more products
            console.log('Load more products');
        }
    });