import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://icjqneahxmyurwizviaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljanFuZWFoeG15dXJ3aXp2aWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzM0MDEsImV4cCI6MjA2ODkwOTQwMX0.69uKkqcPIUTg22eazuE2U3P_dLE6PVBzHW0yWu53FQ8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initHamburgerMenu();
  initAuthState();
  initProductPage();
  initCartPage();
  initCheckoutPage();
  initAccountPage();
  initAdminPage();
  initLoginPage();
});

// Hamburger menu toggle
function initHamburgerMenu() {
  const hamburgerButtons = document.querySelectorAll('#hamburger');
  hamburgerButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu) mobileMenu.classList.toggle('hidden');
    });
  });
}

// Authentication state management
async function initAuthState() {
  const { data: { user } } = await supabase.auth.getUser();
  updateAuthUI(user);
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session?.user);
  });
}

function updateAuthUI(user) {
  const authElements = document.querySelectorAll('.auth-state');
  authElements.forEach(element => {
    if (user) {
      if (element.classList.contains('logged-in')) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    } else {
      if (element.classList.contains('logged-out')) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  });
}

// Product page functionality
function initProductPage() {
  if (!document.querySelector('.product-details')) return;
  
  // Thumbnail image switching
  document.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const mainImage = document.querySelector('.main-image');
      mainImage.src = thumb.src;
    });
  });
  
  // Color selection
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // Add to cart
  const addToCartBtn = document.getElementById('add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async () => {
      const productId = addToCartBtn.dataset.id;
      const size = document.getElementById('size').value;
      const color = document.querySelector('.color-btn.active')?.dataset.color || 'default';
      
      await addToCart(productId, 1, { size, color });
      alert('Product added to cart!');
    });
  }
}

// Cart functionality
function initCartPage() {
  if (!document.getElementById('cart-items')) return;
  
  renderCart();
  
  // Quantity adjustments
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('quantity-btn')) {
      const itemElement = e.target.closest('.cart-item');
      const index = itemElement.dataset.index;
      const quantityElement = itemElement.querySelector('.quantity');
      let quantity = parseInt(quantityElement.textContent);
      
      if (e.target.textContent === '+' || e.target.classList.contains('fa-plus')) {
        quantity++;
      } else if (e.target.textContent === '-' || e.target.classList.contains('fa-minus')) {
        if (quantity > 1) quantity--;
      }
      
      quantityElement.textContent = quantity;
      await updateCartItemQuantity(index, quantity);
      updateCartSummary();
    }
    
    // Remove item
    if (e.target.classList.contains('remove-item') || e.target.classList.contains('fa-trash')) {
      const itemElement = e.target.closest('.cart-item');
      const index = itemElement.dataset.index;
      await removeCartItem(index);
      renderCart();
    }
  });
  
  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = getCart();
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }
      window.location.href = 'checkout.html';
    });
  }
}

// Checkout functionality
function initCheckoutPage() {
  if (!document.getElementById('place-order')) return;
  
  const placeOrderBtn = document.getElementById('place-order');
  placeOrderBtn.addEventListener('click', async () => {
    const cart = getCart();
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to place an order.');
      window.location.href = 'login.html?redirect=checkout';
      return;
    }
    
    // Collect shipping info
    const shippingInfo = {
      name: document.getElementById('full-name').value,
      phone: document.getElementById('phone').value,
      address1: document.getElementById('address1').value,
      address2: document.getElementById('address2').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      zip: document.getElementById('zip').value
    };
    
    // Validate inputs
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address1 || 
        !shippingInfo.city || !shippingInfo.state || !shippingInfo.zip) {
      alert('Please fill in all required shipping information.');
      return;
    }
    
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    if (!paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = 50;
    const discount = cart.length > 2 ? 100 : 0;
    const total = subtotal + delivery - discount;
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        total,
        status: 'pending',
        shipping_address: shippingInfo,
        payment_method: paymentMethod
      }])
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      alert('Failed to place order');
      return;
    }
    
    // Create order items
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
    
    // Send confirmation email
    const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
      body: {
        order_id: order.id,
        user_email: user.email,
        total,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });
    
    if (emailError) {
      console.error('Error sending order confirmation:', emailError);
    }
    
    // Clear cart and redirect
    clearCart();
    window.location.href = `order-confirmation.html?order_id=${order.id}`;
  });
}

// Account page functionality
function initAccountPage() {
  if (!document.getElementById('account-dashboard')) return;
  
  loadUserProfile();
  loadOrders();
  
  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const fullName = document.getElementById('full-name').value;
      const phone = document.getElementById('phone').value;
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          phone
        });
      
      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      } else {
        alert('Profile updated successfully!');
      }
    });
  }
}

// Admin page functionality
function initAdminPage() {
  if (!document.getElementById('admin-dashboard')) return;
  
  loadProductsForAdmin();
  loadOrdersForAdmin();
  
  // Add product form
  const addProductForm = document.getElementById('add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('product-name').value;
      const description = document.getElementById('product-description').value;
      const price = parseFloat(document.getElementById('product-price').value);
      const category = document.getElementById('product-category').value;
      const stock = parseInt(document.getElementById('product-stock').value);
      
      // For file uploads, you would need to use Supabase Storage
      // This is a simplified version without image upload
      const imageUrl = document.getElementById('product-image-url').value;
      
      const { error } = await supabase
        .from('products')
        .insert([{
          name,
          description,
          price,
          category,
          stock_quantity: stock,
          image_url: imageUrl
        }]);
      
      if (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product');
      } else {
        alert('Product added successfully!');
        addProductForm.reset();
        loadProductsForAdmin();
      }
    });
  }
  
  // Business info form
  const businessInfoForm = document.getElementById('business-info-form');
  if (businessInfoForm) {
    businessInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const businessName = document.getElementById('business-name').value;
      const logoUrl = document.getElementById('business-logo').value;
      const contactEmail = document.getElementById('business-email').value;
      const contactPhone = document.getElementById('business-phone').value;
      const address = document.getElementById('business-address').value;
      
      const { error } = await supabase
        .from('business_info')
        .upsert({
          id: 1,
          business_name: businessName,
          logo_url: logoUrl,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          address
        });
      
      if (error) {
        console.error('Error updating business info:', error);
        alert('Failed to update business info');
      } else {
        alert('Business info updated successfully!');
      }
    });
  }
}

// Login page functionality
function initLoginPage() {
  if (!document.getElementById('login-form')) return;
  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        alert(error.message);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'account.html';
        window.location.href = redirect;
      }
    });
  }
  
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const fullName = document.getElementById('register-name').value;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        alert(error.message);
      } else {
        // Create user profile
        await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: fullName
          });
        
        alert('Registration successful! Please check your email for verification.');
        window.location.href = 'account.html';
      }
    });
  }
}

// Cart helper functions
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

async function addToCart(productId, quantity = 1, options = {}) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    return;
  }
  
  let cart = getCart();
  const existingItemIndex = cart.findIndex(item => 
    item.id === productId && 
    item.options?.size === options?.size && 
    item.options?.color === options?.color
  );
  
  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      quantity,
      options
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

async function updateCartItemQuantity(index, quantity) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    cart[index].quantity = quantity;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }
}

async function removeCartItem(index) {
  const cart = getCart();
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  });
}

async function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;
  
  const cart = getCart();
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="bg-white p-8 rounded shadow text-center">
        <p class="text-gray-600 mb-4">Your cart is empty</p>
        <a href="category.html" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Continue Shopping
        </a>
      </div>
    `;
    updateCartSummary();
    return;
  }
  
  let html = '';
  
  for (const [index, item] of cart.entries()) {
    html += `
      <div class="cart-item bg-white p-4 rounded shadow mb-4 flex items-start" data-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded mr-4">
        <div class="flex-1">
          <h3 class="font-semibold">${item.name}</h3>
          ${item.options?.size ? `<p class="text-sm text-gray-600">Size: ${item.options.size}</p>` : ''}
          ${item.options?.color ? `<p class="text-sm text-gray-600">Color: ${item.options.color}</p>` : ''}
          <p class="font-semibold">₹${item.price * item.quantity}</p>
          <div class="flex items-center mt-2">
            <button class="quantity-btn border border-gray-300 px-2 py-1 rounded-l">
              <i class="fas fa-minus"></i>
            </button>
            <span class="quantity border-t border-b border-gray-300 px-4 py-1">${item.quantity}</span>
            <button class="quantity-btn border border-gray-300 px-2 py-1 rounded-r">
              <i class="fas fa-plus"></i>
            </button>
            <button class="remove-item ml-4 text-red-600">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  cartItemsContainer.innerHTML = html;
  updateCartSummary();
}

function updateCartSummary() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = 50;
  const discount = cart.length > 2 ? 100 : 0;
  const total = subtotal + delivery - discount;
  
  document.getElementById('subtotal')?.textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('delivery')?.textContent = `₹${delivery.toFixed(2)}`;
  document.getElementById('discount')?.textContent = `-₹${discount.toFixed(2)}`;
  document.getElementById('total')?.textContent = `₹${total.toFixed(2)}`;
}

async function loadUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error loading profile:', error);
    return;
  }
  
  document.getElementById('profile-name')?.textContent = profile.full_name || user.email;
  document.getElementById('profile-email')?.textContent = user.email;
  document.getElementById('full-name')?.value = profile.full_name || '';
  document.getElementById('phone')?.value = profile.phone || '';
}

async function loadOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading orders:', error);
    return;
  }
  
  const ordersContainer = document.getElementById('orders-list');
  if (!ordersContainer) return;
  
  if (orders.length === 0) {
    ordersContainer.innerHTML = '<p class="text-gray-600">You have no orders yet.</p>';
    return;
  }
  
  let html = '';
  for (const order of orders) {
    html += `
      <div class="border p-4 rounded mb-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold">Order #${order.id}</h3>
          <span class="px-2 py-1 rounded text-xs ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }">${order.status}</span>
        </div>
        <p class="text-gray-600">₹${order.total.toFixed(2)} • ${new Date(order.created_at).toLocaleDateString()}</p>
        <a href="order-details.html?order_id=${order.id}" class="text-blue-600 hover:underline mt-2 inline-block">
          View Details
        </a>
      </div>
    `;
  }
  
  ordersContainer.innerHTML = html;
}

async function loadProductsForAdmin() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  
  const productsTable = document.getElementById('products-table');
  if (!productsTable) return;
  
  let html = '';
  for (const product of products) {
    html += `
      <tr class="border-t">
        <td class="p-2">${product.id}</td>
        <td class="p-2">${product.name}</td>
        <td class="p-2">₹${product.price.toFixed(2)}</td>
        <td class="p-2">${product.stock_quantity}</td>
        <td class="p-2">
          <button class="edit-product text-blue-600 mr-2" data-id="${product.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-product text-red-600" data-id="${product.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }
  
  productsTable.innerHTML = html;
  
  // Add event listeners for edit/delete buttons
  document.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', () => editProduct(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

async function loadOrdersForAdmin() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, user_profiles(full_name)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading orders:', error);
    return;
  }
  
  const ordersTable = document.getElementById('orders-table');
  if (!ordersTable) return;
  
  let html = '';
  for (const order of orders) {
    html += `
      <tr class="border-t">
        <td class="p-2">${order.id}</td>
        <td class="p-2">${order.user_profiles?.full_name || 'Customer'}</td>
        <td class="p-2">₹${order.total.toFixed(2)}</td>
        <td class="p-2">
          <span class="px-2 py-1 rounded text-xs ${
            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }">${order.status}</span>
        </td>
        <td class="p-2">
          <a href="order-details.html?order_id=${order.id}" class="text-blue-600 hover:underline">
            View
          </a>
        </td>
      </tr>
    `;
  }
  
  ordersTable.innerHTML = html;
}

async function editProduct(productId) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    return;
  }
  
  // Populate form
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-stock').value = product.stock_quantity;
  document.getElementById('product-image-url').value = product.image_url;
  
  // Change form to update mode
  document.getElementById('add-product-form').querySelector('button[type="submit"]').textContent = 'Update Product';
  
  // Scroll to form
  document.getElementById('add-product-form').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  
  if (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product');
  } else {
    alert('Product deleted successfully!');
    loadProductsForAdmin();
  }
}
