class PaymentManager {
  constructor() {
    this.payments = [];
    this.setupPayments();
  }

  setupPayments() {
    const container = document.getElementById('payment-methods');
    if (container) {
      container.innerHTML = `
        <div class="payment-options">
          <button class="payment-method">Add Payment Method</button>
          <button class="split-payment">Split Payment</button>
        </div>
      `;
    }
  }
}