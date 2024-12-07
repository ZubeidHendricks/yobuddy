class GroupCart {
  constructor() {
    this.items = [];
    this.setupCartListeners();
  }

  setupCartListeners() {
    document.addEventListener('DOMContentLoaded', () => {
      const cartContainer = document.getElementById('cart-items');
      if (cartContainer) {
        this.renderCart();
      }
    });
  }

  addItem(item) {
    this.items.push(item);
    this.renderCart();
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.renderCart();
  }

  renderCart() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    cartContainer.innerHTML = `
      <div class="cart-list">
        ${this.items.map(item => `
          <div class="cart-item">
            <span>${item.name}</span>
            <span>$${item.price}</span>
            <button onclick="groupCart.removeItem('${item.id}')">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-total">
        Total: $${this.getTotal()}
      </div>
    `;
  }

  getTotal() {
    return this.items.reduce((total, item) => total + item.price, 0).toFixed(2);
  }
}

window.groupCart = new GroupCart();