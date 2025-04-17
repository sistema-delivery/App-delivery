// Declaração global do carrinho para que todas as funções possam acessá-lo
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// Função centralizada para calcular o total dos itens do pedido (sem a taxa de entrega)
function calcularTotalPedido() {
  let total = 0;
  carrinho.forEach((pizza) => {
    let sizePrice = 0;
    if (
      window.storeData &&
      window.storeData.pizzas &&
      window.storeData.pizzas[pizza.nome] &&
      window.storeData.pizzas[pizza.nome].sizes
    ) {
      sizePrice = window.storeData.pizzas[pizza.nome].sizes[pizza.tamanho] || 0;
    } else {
      sizePrice = pizza.tamanho === "Pequena" ? 10 : pizza.tamanho === "Média" ? 15 : 20;
    }
    let pizzaData =
      window.storeData &&
      window.storeData.pizzas &&
      window.storeData.pizzas[pizza.nome]
        ? window.storeData.pizzas[pizza.nome]
        : null;
    const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
    const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
    const bordasCost =
      pizza.bordas.cheddar * cheddarPrice +
      pizza.bordas.catupiry * catupiryPrice +
      pizza.bordas.cream * creamCheesePrice;
    const bebidasCost = pizza.bebidas
      ? pizza.bebidas.reduce((acc, bev) => {
          const priceFromStore =
            window.storeData &&
            window.storeData.beverages &&
            window.storeData.beverages[bev.name] !== undefined
              ? window.storeData.beverages[bev.name]
              : bev.price;
          return acc + priceFromStore * bev.quantity;
        }, 0)
      : 0;
    const subtotal = sizePrice * pizza.quantidade + bordasCost + bebidasCost;
    total += subtotal;
  });
  return total;
}

// Eventos após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para converter strings de preço ("6,00") para formato numérico ("6.00")
  function parsePrice(str) {
    return parseFloat(str.replace(",", "."));
  }

  // Incrementa o valor de um input (bordas)
  window.incrementField = function (fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
      let current = parseInt(input.value) || 0;
      input.value = current + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  // Incrementa o valor do input imediatamente anterior (bebidas)
  window.incrementSibling = function (button) {
    const input = button.previousElementSibling;
    if (input && input.tagName === 'INPUT') {
      let current = parseInt(input.value) || 0;
      input.value = current + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  // Mobile Menu Toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";
  let pedidoInfo = {}; // Armazena o pedido atual

  // ============================
  // Funções de Modais
  // ============================
  function openOrderModal(pizzaName) {
    const modal = document.getElementById('order-modal');
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modal && modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
      modal.style.display = 'block';
    }
    if (
      window.storeData &&
      window.storeData.pizzas &&
      window.storeData.pizzas[pizzaName]
    ) {
      const pizzaData = window.storeData.pizzas[pizzaName];
      const modalDescription = document.getElementById('modal-pizza-description');
      if (modalDescription) {
        modalDescription.textContent = pizzaData.description;
      }
      const sizeLabels = document.querySelectorAll('.pizza-size-section label');
      sizeLabels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio && pizzaData.sizes[radio.value]) {
          const priceDiv = label.querySelector('.price-size');
          if (priceDiv) {
            priceDiv.textContent = pizzaData.sizes[radio.value].toFixed(2);
          }
        }
      });
    }
  }

  function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) modal.style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) orderForm.reset();
    ['border-cheddar','border-catupiry','border-cream-cheese'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 0;
    });
    document.querySelectorAll('.bebida-quantity').forEach(input => input.value = 0);
  }

  function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'block';
  }

  function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
    const paymentForm = document.getElementById('modal-payment-form');
    if (paymentForm) paymentForm.reset();
    const pixInfo = document.getElementById('pix-info');
    if (pixInfo) pixInfo.style.display = 'none';
  }

  window.addEventListener('click', function (event) {
    const orderModal = document.getElementById('order-modal');
    const paymentModal = document.getElementById('payment-modal');
    if (event.target === orderModal) closeOrderModal();
    if (event.target === paymentModal) closePaymentModal();
  });

  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeOrderModal();
      closePaymentModal();
    });
  });

  document.querySelectorAll('.modal .back').forEach(backBtn => {
    backBtn.addEventListener('click', () => {
      const modal = backBtn.closest('.modal');
      if (!modal) return;
      modal.style.display = 'none';
    });
  });

  document.querySelectorAll('.horizontal-scroll .item').forEach(item => {
    item.addEventListener('click', function () {
      const pizzaName = item.querySelector('p').textContent;
      openOrderModal(pizzaName);
    });
  });

  // ====================================
  // Atualiza o Resumo do Pedido (Modal)
  // ====================================
  function updateOrderSummary() {
    // ... (mesma lógica de antes, omitido por brevidade)
  }

  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  const crustSelect = document.querySelector('select[name="pizza-crust"]');
  if (crustSelect) crustSelect.addEventListener('change', updateOrderSummary);
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) quantityInput.addEventListener('input', updateOrderSummary);
  ['border-cheddar','border-catupiry','border-cream-cheese'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateOrderSummary);
  });
  document.querySelectorAll('.bebida-quantity').forEach(input => {
    input.addEventListener('input', updateOrderSummary);
  });

  // ========================================
  // Processamento do formulário de pedido
  // ========================================
  const orderForm = document.getElementById('modal-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // ... (mesma lógica de antes)
      updateOrderSummary();
      closeOrderModal();
      openPaymentModal();
      updatePaymentSummaryCart();
    });
  }

  // ========================================
  // Atualiza o resumo de pagamento do modal
  // ========================================
  function updatePaymentSummaryCart() {
    // ... (mesma lógica de antes)
  }

  // ========================================
  // Eventos para método de pagamento e CEP
  // ========================================
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const pixInfo = document.getElementById('pix-info');
      if (pixInfo) pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
    });
  });

  const cepInput = document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('blur', function() {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length !== 8) {
        document.getElementById('delivery-fee').textContent = "CEP inválido. Insira 8 dígitos.";
        return;
      }
      lookupAddressByCEP(cep);
    });
  }

  // ========================================
  // Processamento do formulário de pagamento
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked')?.value;
      const total comEntrega = calcularTotalPedido() + (pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0);
      if (metodo === 'Pix') {
        fetch('https://meu-app-sooty.vercel.app/mp-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: Number(total comEntrega.toFixed(2)) })
        })
        .then(response => {
          if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
          return response.json();
        })
        .then(data => {
          const tx = data.pix?.transaction_data ?? data.transaction_data;
          if (!tx || !tx.qr_code_base64) {
            throw new Error('Resposta inválida do Pix');
          }
          const pixInfoDiv = document.getElementById('pix-info');
          if (pixInfoDiv) {
            pixInfoDiv.innerHTML = `...`; // monta HTML do Pix
            pixInfoDiv.style.display = 'block';
          }
        })
        .catch(err => {
          console.error(err);
          alert("Não foi possível gerar o pagamento via Pix.");
        });
      } else {
        // Lógica pagamento na entrega + WhatsApp
      }
    });
  }

  const copyButton = document.getElementById('copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const pixKey = document.getElementById('pix-key-text')?.textContent;
      if (pixKey) navigator.clipboard.writeText(pixKey)
        .then(() => alert('Chave Pix copiada!'))
        .catch(err => console.error('Erro ao copiar a chave Pix:', err));
    });
  }

  // ========================================
  // Scroll horizontal infinito para "As Mais Vendidas"
  // ========================================
  const scrollContainer = document.querySelector('.horizontal-scroll.vendidas');
  if (scrollContainer) {
    // ... (mesma lógica de antes)
  }

  // ========================================
  // Carousel dos banners
  // ========================================
  const carouselInner = document.querySelector('.carousel-inner');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  if (carouselInner && dots.length) {
    // ... (mesma lógica de antes, incluindo updateCarousel, touch/mouse handlers)
  }

  const carouselViewport = document.querySelector('.carousel-viewport');
  if (carouselViewport) {
    carouselViewport.addEventListener('scroll', () => {
      const index = Math.round(carouselViewport.scrollLeft / carouselViewport.offsetWidth);
      dots.forEach(dot => dot.classList.toggle('active', dot === dots[index]));
    });
  }

  // ========================================
  // Carrinho de Compras com LocalStorage
  // ========================================
  function atualizarLocalStorage() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
  }

  function removerPedido(index) {
    if (confirm("Deseja remover este pedido?")) {
      carrinho.splice(index, 1);
      atualizarLocalStorage();
      atualizarCarrinhoUI();
    }
  }

  window.adicionarAoCarrinho = function() {
    // ... (mesma lógica de antes)
  };

  function atualizarCarrinhoUI() {
    // ... (mesma lógica de antes)
  }

  window.abrirCarrinho = function() {
    const cartElement = document.getElementById("cart");
    if (cartElement) {
      cartElement.classList.add("open");
      atualizarCarrinhoUI();
    }
  };

  window.fecharCarrinho = function() {
    const cart = document.getElementById("cart");
    if (cart) cart.classList.remove("open");
  };

  window.finalizarPedido = function() {
    if (!carrinho.length) return alert("Seu carrinho está vazio!");
    updatePaymentSummaryCart();
    openPaymentModal();
  };

  if (typeof atualizarCarrinhoUI === 'function') atualizarCarrinhoUI();
});
