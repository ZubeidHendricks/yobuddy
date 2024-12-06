let port;
let isConnected = false;
let auth;
let chat;
let wishlist;
let cart;
let payments;

// Initialize features
document.addEventListener('DOMContentLoaded', () => {
  auth = new Auth();
  initTabs();
  initAuthListeners();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabId}Tab`).classList.add('active');
}

function initRoom(roomId) {
  chat = new Chat(roomId);
  wishlist = new Wishlist(roomId);
  cart = new SharedCart(roomId);
  payments = new PaymentManager(roomId);

  // Initialize chat display
  chat.subscribe(messages => {
    const container = document.getElementById('chatMessages');
    container.innerHTML = messages.map(msg => `
      <div class="chat-message">
        <strong>${msg.sender.displayName}:</strong> ${msg.text}
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  });

  // Initialize wishlist display
  wishlist.subscribe(items => {
    document.getElementById('wishlistItems').innerHTML = items.map(item => `
      <div class="wishlist-item">
        <span>${item.title} - $${item.price}</span>
        <div class="vote-buttons">
          <button onclick="wishlist.voteItem('${item.id}', 1)">👍</button>
          <button onclick="wishlist.voteItem('${item.id}', -1)">👎</button>
        </div>
      </div>
    `).join('');
  });

  // Initialize cart display
  cart.subscribe(items => {
    document.getElementById('cartItems').innerHTML = items.map(item => `
      <div class="cart-item">
        <span>${item.title} - $${item.price}</span>
        <button onclick="cart.removeItem('${item.id}')">Remove</button>
      </div>
    `).join('');
    document.getElementById('cartTotal').textContent = 
      `Total: $${cart.getTotalPrice().toFixed(2)}`;
  });

  // Initialize payments display
  payments.subscribe(items => {
    document.getElementById('pendingPayments').innerHTML = items
      .filter(p => p.status === 'pending')
      .map(payment => `
        <div class="payment-item">
          <div>Amount: $${payment.amount.toFixed(2)} (${payment.users.length} users)</div>
          <div>Per user: $${payment.perUser.toFixed(2)}</div>
          <button onclick="payments.approvePayment('${payment.id}')">Approve</button>
        </div>
      `).join('');
  });
}

// Chat handlers
document.getElementById('sendMessage').addEventListener('click', () => {
  const input = document.getElementById('chatInput');
  chat.sendMessage(input.value);
  input.value = '';
});

document.getElementById('sendEmoji').addEventListener('click', () => {
  chat.sendEmoji('👋');
});

// Payment handlers
document.getElementById('splitPayment').addEventListener('click', () => {
  const amount = cart.getTotalPrice();
  const users = Array.from(sessions[roomId].users).map(uid => ({
    uid,
    displayName: userDisplayNames[uid]
  }));
  payments.splitPayment(amount, users);
});

// Auth handlers
function initAuthListeners() {
  document.getElementById('signIn').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signIn(email, password);
  });

  document.getElementById('signUp').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signUp(email, password);
  });

  document.getElementById('signOut').addEventListener('click', () => {
    auth.signOut();
  });

  auth.onAuthStateChanged(user => {
    document.getElementById('signedOutView').style.display = 
      user ? 'none' : 'block';
    document.getElementById('signedInView').style.display = 
      user ? 'block' : 'none';
    document.getElementById('mainContent').style.display = 
      user ? 'block' : 'none';
    
    if (user) {
      document.getElementById('userDisplay').textContent = 
        `Signed in as ${user.displayName}`;
    }
  });
}

// Clean up on window close
window.addEventListener('unload', () => {
  chat?.cleanup();
  wishlist?.cleanup();
  cart?.cleanup();
  payments?.cleanup();
});