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
  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";
  let pedidoInfo = {}; // Armazena o pedido atual

  // ============================
  // Funções de Modais
  // ============================
  function openOrderModal(pizzaName) {
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
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
      // Atualiza os preços por tamanho conforme os dados da pizza
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
    document.getElementById('order-modal').style.display = 'block';
  }

  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) {
      orderForm.reset();
    }
    // Reset dos inputs de bordas e bebidas
    document.getElementById('border-cheddar').value = 0;
    document.getElementById('border-catupiry').value = 0;
    document.getElementById('border-cream-cheese').value = 0;
    document.querySelectorAll('.bebida-quantity').forEach(input => input.value = 0);
  }

  function openPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    const paymentForm = document.getElementById('modal-payment-form');
    if (paymentForm) {
      paymentForm.reset();
    }
    document.getElementById('pix-info').style.display = 'none';
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
      if (modal.id === 'order-modal') {
        closeOrderModal();
      } else if (modal.id === 'payment-modal') {
        closePaymentModal();
      } else {
        modal.style.display = 'none';
      }
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
    const pizzaName = document.getElementById('modal-pizza-name')?.textContent.trim() || '';
    const size = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
    const crust = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
    const totalPizzas = parseInt(document.getElementById('modal-pizza-quantity')?.value) || 1;
    const cheddarQuantity = parseInt(document.getElementById('border-cheddar')?.value) || 0;
    const catupiryQuantity = parseInt(document.getElementById('border-catupiry')?.value) || 0;
    const creamCheeseQuantity = parseInt(document.getElementById('border-cream-cheese')?.value) || 0;
    
    const somaBordas = cheddarQuantity + catupiryQuantity + creamCheeseQuantity;
    const semBorda = totalPizzas - (somaBordas > totalPizzas ? totalPizzas : somaBordas);
    
    let sizePrice = 0;
    let pizzaData = null;
    if (pizzaName && window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      pizzaData = window.storeData.pizzas[pizzaName];
      sizePrice = pizzaData.sizes[size] || 0;
    }

    const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
    const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;

    const pizzasCost = (sizePrice * totalPizzas) +
                        (cheddarQuantity * cheddarPrice) +
                        (catupiryQuantity * catupiryPrice) +
                        (creamCheeseQuantity * creamCheesePrice);

    let beveragesCost = 0;
    const beveragesSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const bebidaName = item.querySelector('p').textContent;
      const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
      let bebidaPrice = parsePrice(priceText);
      if (window.storeData && window.storeData.beverages && window.storeData.beverages[bebidaName] !== undefined) {
        bebidaPrice = window.storeData.beverages[bebidaName];
      }
      const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if (bebidaQuantity > 0) {
        beveragesCost += bebidaPrice * bebidaQuantity;
        beveragesSummary.push(`${bebidaName} x${bebidaQuantity} - R$ ${(bebidaPrice * bebidaQuantity).toFixed(2)}`);
      }
    });

    const baseTotal = pizzasCost + beveragesCost;
    pedidoInfo.baseTotal = baseTotal;

    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    pedidoInfo.total = baseTotal + deliveryFee;

    if (document.getElementById('order-summary')) {
      document.getElementById('summary-size').textContent = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
      document.getElementById('summary-crust').textContent = `Tipo de Massa: ${crust}`;
      document.getElementById('summary-border').textContent = `Bordas: Cheddar (${cheddarQuantity} un. × R$ ${cheddarPrice.toFixed(2)}) + Catupiry (${catupiryQuantity} un. × R$ ${catupiryPrice.toFixed(2)}) + Cream cheese (${creamCheeseQuantity} un. × R$ ${creamCheesePrice.toFixed(2)})`;
      document.getElementById('summary-quantity').textContent = `Quantidade de Pizzas: ${totalPizzas} (Sem borda: ${semBorda})`;
      document.getElementById('summary-beverage').textContent = `Bebidas: ${beveragesSummary.length > 0 ? beveragesSummary.join(', ') : 'Nenhuma selecionada'}`;
      
      if (document.getElementById('summary-total')) {
        document.getElementById('summary-total').innerHTML = `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
      }
    }
  }

  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  const crustSelect = document.querySelector('select[name="pizza-crust"]');
  if (crustSelect) crustSelect.addEventListener('change', updateOrderSummary);
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) quantityInput.addEventListener('input', updateOrderSummary);
  document.getElementById('border-cheddar').addEventListener('input', updateOrderSummary);
  document.getElementById('border-catupiry').addEventListener('input', updateOrderSummary);
  document.getElementById('border-cream-cheese').addEventListener('input', updateOrderSummary);
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
      pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.borderCheddar = document.getElementById('border-cheddar').value;
      pedidoInfo.borderCatupiry = document.getElementById('border-catupiry').value;
      pedidoInfo.borderCreamCheese = document.getElementById('border-cream-cheese').value;
      pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity').value;
      pedidoInfo.adicionais = document.getElementById('modal-additional')?.value || 'Nenhum';
      
      const bebidas = [];
      document.querySelectorAll('.bebida-item').forEach(item => {
        const bebidaName = item.querySelector('p').textContent;
        const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
        let bebidaPrice = parsePrice(priceText);
        if (window.storeData && window.storeData.beverages && window.storeData.beverages[bebidaName] !== undefined) {
          bebidaPrice = window.storeData.beverages[bebidaName];
        }
        const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
        if(bebidaQuantity > 0){
          bebidas.push({
            name: bebidaName,
            price: bebidaPrice,
            quantity: bebidaQuantity
          });
        }
      });
      pedidoInfo.bebida = bebidas.length > 0 ? bebidas : [];
      
      updateOrderSummary();
      closeOrderModal();
      openPaymentModal();
      updatePaymentSummaryCart();
    });
  }

  // ========================================
  // Atualiza o resumo de pagamento do modal, incluindo a taxa de entrega
  // ========================================
  function updatePaymentSummaryCart() {
    let paymentSummaryElement = document.getElementById('payment-summary');
    if (!paymentSummaryElement) {
      paymentSummaryElement = document.createElement('div');
      paymentSummaryElement.id = 'payment-summary';
      const deliveryFeeElement = document.getElementById('delivery-fee');
      deliveryFeeElement.parentNode.insertBefore(paymentSummaryElement, deliveryFeeElement.nextSibling);
    }
    let summaryText = '';
    
    carrinho.forEach((pizza, index) => {
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
      let pizzaData = (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizza.nome])
                        ? window.storeData.pizzas[pizza.nome] : null;
      const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
      const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
      const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
      
      const bordasCost = pizza.bordas.cheddar * cheddarPrice +
                         pizza.bordas.catupiry * catupiryPrice +
                         pizza.bordas.cream * creamCheesePrice;
      const bebidasCost = pizza.bebidas
        ? pizza.bebidas.reduce((acc, bev) => acc + bev.price * bev.quantity, 0)
        : 0;
      const subtotal = sizePrice * pizza.quantidade + bordasCost + bebidasCost;
      
      let bebidaText = "";
      if (pizza.bebidas && pizza.bebidas.length > 0) {
        bebidaText = ` - Bebidas: ${pizza.bebidas.map(b => `${b.name} x${b.quantity} - R$ ${(b.price * b.quantity).toFixed(2)}`).join(', ')}`;
      }
      summaryText += `<p><strong>Pizza ${index + 1}:</strong> ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bebidaText} - R$ ${subtotal.toFixed(2)}</p>`;
    });
    
    const itensTotal = calcularTotalPedido();
    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    const totalComEntrega = itensTotal + deliveryFee;
    
    summaryText += `<p><strong>Taxa de Entrega:</strong> R$ ${deliveryFee.toFixed(2)}</p>`;
    summaryText += `<p><strong>Total do Pedido:</strong> R$ ${totalComEntrega.toFixed(2)}</p>`;
    
    paymentSummaryElement.innerHTML = summaryText;
  }

  // ========================================
  // Eventos para método de pagamento e CEP
  // ========================================
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const pixInfo = document.getElementById('pix-info');
      pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
    });
  });

  document.getElementById('cep').addEventListener('blur', function() {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      document.getElementById('delivery-fee').textContent = "CEP inválido. Insira 8 dígitos.";
      return;
    }
    lookupAddressByCEP(cep);
  });

  function lookupAddressByCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          document.getElementById('delivery-fee').textContent = "CEP não encontrado. Verifique o CEP informado.";
          return;
        }
        document.getElementById('rua').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
// Declaração global do carrinho para que todas as funções possam acessá-lo
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

/**
 * Monta a mensagem completa do pedido no formato WhatsApp.
 * @param {Object} pedido – contém todos os campos do pedido (pizza, bordas, bebidas, total, endereço, etc).
 * @param {String} metodo – 'Pix' ou outro (para exibir forma de pagamento).
 */
function montarMensagemWhatsApp(pedido, metodo) {
  const linhas = [];

  linhas.push(`*Pedido de Pizza - Pizza Express*`);
  linhas.push(`------------------------------------`);
  linhas.push(`*Pizza:* ${pedido.nome}`);
  linhas.push(`*Tamanho:* ${pedido.tamanho}`);
  linhas.push(`*Massa:* ${pedido.crust}`);
  linhas.push(
    `*Bordas:* Cheddar (${pedido.borderCheddar}), Catupiry (${pedido.borderCatupiry}), Cream cheese (${pedido.borderCreamCheese})`
  );
  linhas.push(`*Quantidade:* ${pedido.quantidade}`);
  if (pedido.bebida && pedido.bebida.length) {
    const b = pedido.bebida
      .map(
        (bev) => `${bev.name} x${bev.quantity} – R$ ${(bev.price * bev.quantity).toFixed(2)}`
      )
      .join(', ');
    linhas.push(`*Bebidas:* ${b}`);
  } else {
    linhas.push(`*Bebidas:* Nenhuma`);
  }
  linhas.push(`*Total do Pedido:* R$ ${pedido.total.toFixed(2)}`);
  linhas.push(`------------------------------------`);
  linhas.push(`*Forma de Pagamento:* ${metodo}`);
  linhas.push(`------------------------------------`);
  linhas.push(`*Endereço de Entrega:*`);
  linhas.push(`Rua: ${pedido.rua}`);
  linhas.push(`Bairro: ${pedido.bairro}`);
  linhas.push(`Cidade: ${pedido.cidade}`);
  linhas.push(`Número: ${pedido.numero}`);
  linhas.push(`------------------------------------`);
  linhas.push(`*Data:* ${new Date().toLocaleDateString()}`);
  linhas.push(
    `*Hora:* ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  );
  linhas.push(`\nObrigado pelo seu pedido! 🍕`);

  return encodeURIComponent(linhas.join('\n'));
}

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
  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";
  let pedidoInfo = {}; // Armazena o pedido atual

  // ============================
  // Funções de Modais
  // ============================
  function openOrderModal(pizzaName) {
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
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
      // Atualiza os preços por tamanho conforme os dados da pizza
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
    document.getElementById('order-modal').style.display = 'block';
  }

  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) {
      orderForm.reset();
    }
    // Reset dos inputs de bordas e bebidas
    document.getElementById('border-cheddar').value = 0;
    document.getElementById('border-catupiry').value = 0;
    document.getElementById('border-cream-cheese').value = 0;
    document.querySelectorAll('.bebida-quantity').forEach(input => input.value = 0);
  }

  function openPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    const paymentForm = document.getElementById('modal-payment-form');
    if (paymentForm) {
      paymentForm.reset();
    }
    document.getElementById('pix-info').style.display = 'none';
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
      if (modal.id === 'order-modal') {
        closeOrderModal();
      } else if (modal.id === 'payment-modal') {
        closePaymentModal();
      } else {
        modal.style.display = 'none';
      }
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
    const pizzaName = document.getElementById('modal-pizza-name')?.textContent.trim() || '';
    const size = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
    const crust = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
    const totalPizzas = parseInt(document.getElementById('modal-pizza-quantity')?.value) || 1;
    const cheddarQuantity = parseInt(document.getElementById('border-cheddar')?.value) || 0;
    const catupiryQuantity = parseInt(document.getElementById('border-catupiry')?.value) || 0;
    const creamCheeseQuantity = parseInt(document.getElementById('border-cream-cheese')?.value) || 0;
    
    const somaBordas = cheddarQuantity + catupiryQuantity + creamCheeseQuantity;
    const semBorda = totalPizzas - (somaBordas > totalPizzas ? totalPizzas : somaBordas);
    
    let sizePrice = 0;
    let pizzaData = null;
    if (pizzaName && window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      pizzaData = window.storeData.pizzas[pizzaName];
      sizePrice = pizzaData.sizes[size] || 0;
    }

    const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
    const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;

    const pizzasCost = (sizePrice * totalPizzas) +
                        (cheddarQuantity * cheddarPrice) +
                        (catupiryQuantity * catupiryPrice) +
                        (creamCheeseQuantity * creamCheesePrice);

    let beveragesCost = 0;
    const beveragesSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const bebidaName = item.querySelector('p').textContent;
      const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
      let bebidaPrice = parsePrice(priceText);
      if (window.storeData && window.storeData.beverages && window.storeData.beverages[bebidaName] !== undefined) {
        bebidaPrice = window.storeData.beverages[bebidaName];
      }
      const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if (bebidaQuantity > 0) {
        beveragesCost += bebidaPrice * bebidaQuantity;
        beveragesSummary.push(`${bebidaName} x${bebidaQuantity} - R$ ${(bebidaPrice * bebidaQuantity).toFixed(2)}`);
      }
    });

    const baseTotal = pizzasCost + beveragesCost;
    pedidoInfo.baseTotal = baseTotal;

    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    pedidoInfo.total = baseTotal + deliveryFee;

    if (document.getElementById('order-summary')) {
      document.getElementById('summary-size').textContent = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
      document.getElementById('summary-crust').textContent = `Tipo de Massa: ${crust}`;
      document.getElementById('summary-border').textContent = `Bordas: Cheddar (${cheddarQuantity} un. × R$ ${cheddarPrice.toFixed(2)}) + Catupiry (${catupiryQuantity} un. × R$ ${catupiryPrice.toFixed(2)}) + Cream cheese (${creamCheeseQuantity} un. × R$ ${creamCheesePrice.toFixed(2)})`;
      document.getElementById('summary-quantity').textContent = `Quantidade de Pizzas: ${totalPizzas} (Sem borda: ${semBorda})`;
      document.getElementById('summary-beverage').textContent = `Bebidas: ${beveragesSummary.length > 0 ? beveragesSummary.join(', ') : 'Nenhuma selecionada'}`;
      
      if (document.getElementById('summary-total')) {
        document.getElementById('summary-total').innerHTML = `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
      }
    }
  }

  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  const crustSelect = document.querySelector('select[name="pizza-crust"]');
  if (crustSelect) crustSelect.addEventListener('change', updateOrderSummary);
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) quantityInput.addEventListener('input', updateOrderSummary);
  document.getElementById('border-cheddar').addEventListener('input', updateOrderSummary);
  document.getElementById('border-catupiry').addEventListener('input', updateOrderSummary);
  document.getElementById('border-cream-cheese').addEventListener('input', updateOrderSummary);
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
      pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.borderCheddar = document.getElementById('border-cheddar').value;
      pedidoInfo.borderCatupiry = document.getElementById('border-catupiry').value;
      pedidoInfo.borderCreamCheese = document.getElementById('border-cream-cheese').value;
      pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity').value;
      pedidoInfo.adicionais = document.getElementById('modal-additional')?.value || 'Nenhum';
      
      const bebidas = [];
      document.querySelectorAll('.bebida-item').forEach(item => {
        const bebidaName = item.querySelector('p').textContent;
        const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
        let bebidaPrice = parsePrice(priceText);
        if (window.storeData && window.storeData.beverages && window.storeData.beverages[bebidaName] !== undefined) {
          bebidaPrice = window.storeData.beverages[bebidaName];
        }
        const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
        if(bebidaQuantity > 0){
          bebidas.push({
            name: bebidaName,
            price: bebidaPrice,
            quantity: bebidaQuantity
          });
        }
      });
      pedidoInfo.bebida = bebidas.length > 0 ? bebidas : [];
      
      updateOrderSummary();
      closeOrderModal();
      openPaymentModal();
      updatePaymentSummaryCart();
    });
  }

  // ========================================
  // Atualiza o resumo de pagamento do modal, incluindo a taxa de entrega
  // ========================================
  function updatePaymentSummaryCart() {
    let paymentSummaryElement = document.getElementById('payment-summary');
    if (!paymentSummaryElement) {
      paymentSummaryElement = document.createElement('div');
      paymentSummaryElement.id = 'payment-summary';
      const deliveryFeeElement = document.getElementById('delivery-fee');
      deliveryFeeElement.parentNode.insertBefore(paymentSummaryElement, deliveryFeeElement.nextSibling);
    }
    let summaryText = '';
    
    carrinho.forEach((pizza, index) => {
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
      let pizzaData = (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizza.nome])
                        ? window.storeData.pizzas[pizza.nome] : null;
      const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
      const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
      const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
      
      const bordasCost = pizza.bordas.cheddar * cheddarPrice +
                         pizza.bordas.catupiry * catupiryPrice +
                         pizza.bordas.cream * creamCheesePrice;
      const bebidasCost = pizza.bebidas
        ? pizza.bebidas.reduce((acc, bev) => acc + bev.price * bev.quantity, 0)
        : 0;
      const subtotal = sizePrice * pizza.quantidade + bordasCost + bebidasCost;
      
      let bebidaText = "";
      if (pizza.bebidas && pizza.bebidas.length > 0) {
        bebidaText = ` - Bebidas: ${pizza.bebidas.map(b => `${b.name} x${b.quantity} - R$ ${(b.price * b.quantity).toFixed(2)}`).join(', ')}`;
      }
      summaryText += `<p><strong>Pizza ${index + 1}:</strong> ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bebidaText} - R$ ${subtotal.toFixed(2)}</p>`;
    });
    
    const itensTotal = calcularTotalPedido();
    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    const totalComEntrega = itensTotal + deliveryFee;
    
    summaryText += `<p><strong>Taxa de Entrega:</strong> R$ ${deliveryFee.toFixed(2)}</p>`;
    summaryText += `<p><strong>Total do Pedido:</strong> R$ ${totalComEntrega.toFixed(2)}</p>`;
    
    paymentSummaryElement.innerHTML = summaryText;
  }

  // ========================================
  // Eventos para método de pagamento e CEP
  // ========================================
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const pixInfo = document.getElementById('pix-info');
      pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
    });
  });

  document.getElementById('cep').addEventListener('blur', function() {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      document.getElementById('delivery-fee').textContent = "CEP inválido. Insira 8 dígitos.";
      return;
    }
    lookupAddressByCEP(cep);
  });

  function lookupAddressByCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          document.getElementById('delivery-fee').textContent = "CEP não encontrado. Verifique o CEP informado.";
          return;
        }
        document.getElementById('rua').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';

        const cityKey = data.localidade && data.uf ? `${data.localidade} (${data.uf})` : defaultCity;
        const bairro = data.bairro;
        let fee;
        if (
          bairro &&
          window.storeData &&
          window.storeData.deliveryFees &&
          window.storeData.deliveryFees[cityKey] &&
          window.storeData.deliveryFees[cityKey].hasOwnProperty(bairro)
        ) {
          fee = window.storeData.deliveryFees[cityKey][bairro].toFixed(2);
          document.getElementById('delivery-fee').textContent = `Taxa de Entrega: R$ ${fee}`;
          pedidoInfo.deliveryFee = fee;
        } else {
          document.getElementById('delivery-fee').textContent = "Bairro fora da área de entrega.";
          pedidoInfo.deliveryFee = null;
        }
        if (pedidoInfo.baseTotal !== undefined) {
          pedidoInfo.total = pedidoInfo.baseTotal + (pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0);
        }
        if (document.getElementById('payment-modal').style.display === 'block') {
          updatePaymentSummaryCart();
        }
      })
      .catch(err => {
        console.error(err);
        document.getElementById('delivery-fee').textContent = "Erro ao buscar a localização.";
      });
  }

  function toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  function calculateDistance(loc1, loc2) {
    const R = 6371;
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lon - loc1.lon);
    const lat1 = toRad(loc1.lat);
    const lat2 = toRad(loc2.lat);
    const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ========================================
  // Processamento do formulário de pagamento (Atualizado para a API PIX)
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;
      
      if (metodo === 'Pix') {
  let recalculatedTotal = calcularTotalPedido() + (pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0);

  fetch('https://meu-app-sooty.vercel.app/mp-pix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valor: Number(recalculatedTotal.toFixed(2)),
      nome: pedidoInfo.nome,
      email: pedidoInfo.email
    })
  })
  .then(response => {
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    return response.json();
  })
  .then(data => {
    const paymentId = data.payment.id;
    const qrBase64     = data.pix.transaction_data.qr_code_base64;
    const payload      = data.pix.transaction_data.qr_code;
    const pixInfoDiv   = document.getElementById('pix-info');

    // Monta UI com contador
    pixInfoDiv.innerHTML = `
      <p>Pagamento via Pix – expira em <span id="pix-timer">03:00</span></p>
      <img src="data:image/png;base64,${qrBase64}" alt="QR Code Pix">
      <textarea id="pix-payload-text" readonly>${payload}</textarea>
      <button id="copy-payload-button">COPIAR PAYLOAD</button>
    `;
    pixInfoDiv.style.display = 'block';
    paymentForm.querySelector('button[type="submit"]').disabled = true;

    // Função copiar
    document.getElementById('copy-payload-button').addEventListener('click', () => {
      navigator.clipboard.writeText(payload).then(() => alert('Payload copiado!'));
    });

    // === Timer de 3 minutos ===
    let timeLeft = 180;
    const timerEl = document.getElementById('pix-timer');
    const countdown = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}`;
      if (timeLeft <= 0) {
        clearInterval(countdown);
        clearInterval(polling);
        pixInfoDiv.innerHTML = '<p style="color:red;">QR Code expirado. Gere novamente.</p>';
        paymentForm.querySelector('button[type="submit"]').disabled = false;
      }
    }, 1000);

    // === Polling a cada 5s para checar pagamento ===
    const polling = setInterval(() => {
      fetch(`https://meu-app-sooty.vercel.app/mp-pix/status/${transactionId}`)
        .then(r => r.json())
        .then(({ pago }) => {
          if (pago) {
            clearInterval(countdown);
            clearInterval(polling);
            // Monta mensagem e abre WhatsApp
            pedidoInfo.total = recalculatedTotal;
            const mensagem = `*Pedido pago via Pix*...`; // resumo do pedido
            window.open(`https://wa.me/5581997333714?text=${encodeURIComponent(mensagem)}`, '_blank');
          }
        })
        .catch(console.error);
    }, 5000);
  })
  .catch(err => {
    alert("Não foi possível gerar o Pix. Tente novamente.");
  });
      } else {
        const status = 'Pagamento na entrega';
        const chavePix = '708.276.084-11';
        const dataAtual = new Date();
        const data = dataAtual.toLocaleDateString();
        const hora = dataAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const taxaEntrega = pedidoInfo.deliveryFee ? `*Taxa de Entrega:* R$ ${pedidoInfo.deliveryFee}` : '*Taxa de Entrega:* R$ 0,00';

        const rua = document.getElementById('rua').value;
        const bairro = document.getElementById('bairro').value;
        const cidade = document.getElementById('cidade').value;
        const numero = document.getElementById('numero').value;

        const mensagem = `
*Pedido de Pizza - Pizza Express*
------------------------------------
*Pizza:* ${pedidoInfo.nome}
*Tamanho:* ${pedidoInfo.tamanho}
*Tipos de Massa:* ${pedidoInfo.crust}
*Bordas:* Cheddar (${pedidoInfo.borderCheddar} un.) + Catupiry (${pedidoInfo.borderCatupiry} un.) + Cream cheese (${pedidoInfo.borderCreamCheese} un.)
*Quantidade:* ${pedidoInfo.quantidade} unidade(s)
*Bebida(s):* ${pedidoInfo.bebida.length > 0 ? pedidoInfo.bebida.map(b => `${b.name} x${b.quantity} - R$ ${(b.price * b.quantity).toFixed(2)}`).join(', ') : 'Nenhuma'}
*Total do Pedido:* R$ ${pedidoInfo.total.toFixed(2)}
------------------------------------
*Status do Pagamento:* ${status}
*Forma de Pagamento:* Não Pix (Chave: ${chavePix})
${taxaEntrega}
------------------------------------
*Endereço de Entrega:*
*Rua:* ${rua}
*Bairro:* ${bairro}
*Cidade:* ${cidade}
*Número:* ${numero}

*Data do Pedido:* ${data}
*Hora:* ${hora}

Agradecemos o seu pedido!
Pizza Express - Sabor que chega rápido!`.trim();

        const whatsappNumber = '5581997333714';
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
        closePaymentModal();
        window.open(whatsappURL, '_blank');
      }
    });
  }

  // ========================================
  // Scroll horizontal infinito para a seção "As Mais Vendidas"
  // ========================================
  const scrollContainer = document.querySelector('.horizontal-scroll.vendidas');
  if (scrollContainer) {
    const scrollTrack = scrollContainer.querySelector('.horizontal-scroll-track');
    let animationTimeout;
    function pauseAnimation() {
      scrollTrack.style.animationPlayState = 'paused';
      clearTimeout(animationTimeout);
      animationTimeout = setTimeout(() => {
        scrollTrack.style.animationPlayState = 'running';
      }, 2000);
    }
    scrollContainer.addEventListener('scroll', pauseAnimation);
    scrollContainer.addEventListener('mouseenter', pauseAnimation);
    scrollContainer.addEventListener('touchstart', pauseAnimation);
  }

  // ========================================
  // Carousel dos banners
  // ========================================
  const dots = document.querySelectorAll('.carousel-dots .dot');
  const carouselInner = document.querySelector('.carousel-inner');
  let currentIndex = 0;
  function updateCarousel(index) {
    carouselInner.style.transition = 'transform 0.5s ease-in-out';
    carouselInner.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(dot => dot.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');
    currentIndex = index;
  }
  setInterval(() => {
    updateCarousel((currentIndex + 1) % dots.length);
  }, 4000);
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      updateCarousel(index);
    });
  });
  let startX = 0;
  let isDragging = false;
  let currentTranslate = 0;
  carouselInner.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  carouselInner.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    currentTranslate = -currentIndex * 100 + (diff / window.innerWidth) * 100;
    carouselInner.style.transition = 'none';
    carouselInner.style.transform = `translateX(${currentTranslate}%)`;
  });
  carouselInner.addEventListener('touchend', (e) => {
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (diff > 50 && currentIndex > 0) {
      updateCarousel(currentIndex - 1);
    } else if (diff < -50 && currentIndex < dots.length - 1) {
      updateCarousel(currentIndex + 1);
    } else {
      updateCarousel(currentIndex);
    }
  });
  let mouseStartX = 0;
  carouselInner.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX;
    isDragging = true;
  });
  carouselInner.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const diff = e.clientX - mouseStartX;
    currentTranslate = -currentIndex * 100 + (diff / window.innerWidth) * 100;
    carouselInner.style.transition = 'none';
    carouselInner.style.transform = `translateX(${currentTranslate}%)`;
  });
  carouselInner.addEventListener('mouseup', (e) => {
    isDragging = false;
    const diff = e.clientX - mouseStartX;
    if (diff > 50 && currentIndex > 0) {
      updateCarousel(currentIndex - 1);
    } else if (diff < -50 && currentIndex < dots.length - 1) {
      updateCarousel(currentIndex + 1);
    } else {
      updateCarousel(currentIndex);
    }
  });
  const carouselViewport = document.querySelector('.carousel-viewport');
  if (carouselViewport) {
    carouselViewport.addEventListener('scroll', () => {
      const index = Math.round(carouselViewport.scrollLeft / carouselViewport.offsetWidth);
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[index]) dots[index].classList.add('active');
    });
  }

  // ========================================
  // Carrinho de Compras com LocalStorage
  // ========================================
  function atualizarLocalStorage() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
  }

  // Função para remover um item do carrinho e atualizar a interface
  function removerPedido(index) {
    if (confirm("Deseja remover este pedido?")) {
      carrinho.splice(index, 1);
      atualizarLocalStorage();
      atualizarCarrinhoUI();
    }
  }

  // Adiciona o pedido atual ao carrinho e persiste os dados
  window.adicionarAoCarrinho = function() {
    const tamanho = document.querySelector('input[name="pizza-size"]:checked')?.value;
    const massa = document.querySelector('select[name="pizza-crust"]').value;
    const quantidade = parseInt(document.getElementById("modal-pizza-quantity").value);

    const cheddar = parseInt(document.getElementById("border-cheddar").value);
    const catupiry = parseInt(document.getElementById("border-catupiry").value);
    const cream = parseInt(document.getElementById("border-cream-cheese").value);

    if (!tamanho || !massa || quantidade < 1) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    const bebidas = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const bebidaName = item.querySelector('p').textContent;
      const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
      let bebidaPrice = parsePrice(priceText);
      if (window.storeData && window.storeData.beverages && window.storeData.beverages[bebidaName] !== undefined) {
        bebidaPrice = window.storeData.beverages[bebidaName];
      }
      const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if(bebidaQuantity > 0){
        bebidas.push({
          name: bebidaName,
          price: bebidaPrice,
          quantity: bebidaQuantity
        });
      }
    });

    const pizza = {
      nome: document.getElementById('modal-pizza-name').textContent.trim(),
      tamanho,
      massa,
      quantidade,
      bordas: { cheddar, catupiry, cream },
      bebidas
    };

    carrinho.push(pizza);
    atualizarLocalStorage();
    alert("Pizza adicionada ao carrinho!");
    closeOrderModal();
    atualizarCarrinhoUI();
  };

  // Atualiza a interface do carrinho (modal) com layout mais organizado e estilizado
  function atualizarCarrinhoUI() {
    const lista = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");
    lista.innerHTML = "";

    carrinho.forEach((pizza, index) => {
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
      let pizzaData = (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizza.nome])
                        ? window.storeData.pizzas[pizza.nome]
                        : null;
      const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
      const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
      const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
      
      const bordasCost = pizza.bordas.cheddar * cheddarPrice +
                         pizza.bordas.catupiry * catupiryPrice +
                         pizza.bordas.cream * creamCheesePrice;
      const bebidasCost = pizza.bebidas
        ? pizza.bebidas.reduce((acc, bev) => acc + bev.price * bev.quantity, 0)
        : 0;
      const subtotal = sizePrice * pizza.quantidade + bordasCost + bebidasCost;

      // Cria o elemento da lista com estrutura organizada usando flexbox
      const li = document.createElement("li");
      li.classList.add("cart-item");

      // Container para detalhes do pedido
      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("cart-item-details");

      const title = document.createElement("p");
      title.classList.add("cart-item-title");
      title.textContent = `${pizza.nome} (${pizza.tamanho} - ${pizza.massa})`;
      detailsDiv.appendChild(title);

      const qty = document.createElement("p");
      qty.textContent = `Quantidade: ${pizza.quantidade}`;
      detailsDiv.appendChild(qty);

      if (pizza.bebidas && pizza.bebidas.length > 0) {
        const drinks = document.createElement("p");
        drinks.textContent = `Bebidas: ${pizza.bebidas.map(b => `${b.name} x${b.quantity}`).join(", ")}`;
        detailsDiv.appendChild(drinks);
      }

      const subt = document.createElement("p");
      subt.classList.add("cart-item-subtotal");
      subt.textContent = `Subtotal: R$ ${subtotal.toFixed(2)}`;
      detailsDiv.appendChild(subt);

      li.appendChild(detailsDiv);

      // Container para o botão de remoção
      const removeContainer = document.createElement("div");
      removeContainer.classList.add("cart-item-remove");

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remover";
      removeBtn.classList.add("remove-button");
      removeBtn.addEventListener("click", function () {
        removerPedido(index);
      });
      removeContainer.appendChild(removeBtn);

      li.appendChild(removeContainer);

      lista.appendChild(li);
    });

    totalEl.textContent = calcularTotalPedido().toFixed(2);
    
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
      cartCount.textContent = carrinho.length;
    }
  }

  // ========================================
  // Funções para exibição do carrinho como modal
  // ========================================
  window.abrirCarrinho = function() {
    const cartElement = document.getElementById("cart");
    cartElement.classList.add("open");
    atualizarCarrinhoUI();
  };

  window.fecharCarrinho = function() {
    document.getElementById("cart").classList.remove("open");
  };

  // Ao clicar em "Finalizar Pedido" no carrinho, abre o modal de pagamento
  window.finalizarPedido = function() {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    updatePaymentSummaryCart();
    openPaymentModal();
  };

  atualizarCarrinhoUI();
});

// Fim das funções do script
