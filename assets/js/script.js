// Declaração global do carrinho para que todas as funções possam acessá‑lo
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

/**
 * Gera a mensagem do WhatsApp a partir de todo o array `carrinho`.
 * @param {Array} carrinho 
 * @param {string} metodo 
 * @param {string} status 
 * @returns {string} mensagem formatada
 */
function buildWhatsAppMessageFromCart(carrinho, metodo, status) {
  const now  = new Date();
  const data = now.toLocaleDateString('pt-BR');
  const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Monta as linhas para cada pizza
  const linhasPizzas = carrinho.map((p, i) => {
    const bordas = [];
    if (p.bordas.cheddar) bordas.push(`Cheddar x${p.bordas.cheddar}`);
    if (p.bordas.catupiry) bordas.push(`Catupiry x${p.bordas.catupiry}`);
    if (p.bordas.cream)    bordas.push(`Cream cheese x${p.bordas.cream}`);
    const bordaText = bordas.length ? bordas.join(', ') : 'Nenhuma';

    const bebidasText = (p.bebidas && p.bebidas.length)
      ? p.bebidas.map(b => `${b.name} x${b.quantity}`).join(', ')
      : 'Nenhuma';

    return [
      `Pizza ${i+1}: ${p.nome}`,
      `  Tamanho: ${p.tamanho}`,
      `  Massa: ${p.massa}`,
      `  Bordas: ${bordaText}`,
      `  Quantidade: ${p.quantidade}`,
      `  Bebidas: ${bebidasText}`
    ].join('\n');
  }).join('\n\n');

  // Calcula totais
  const itensTotal = calcularTotalPedido();
  const entrega    = parseFloat(pedidoInfo.deliveryFee || 0);
  const total      = itensTotal + entrega;

  // Endereço formatado
  const endereco = `Rua ${pedidoInfo.rua}, ${pedidoInfo.bairro} – ${pedidoInfo.cidade}, Nº ${pedidoInfo.numero}`;

  const linhas = [
    `*Pedido de Pizza - Pizza Express*`,
    `------------------------------------`,
    linhasPizzas,
    `------------------------------------`,
    `*Taxa de Entrega:* R$ ${entrega.toFixed(2)}`,
    `*Total do Pedido:* R$ ${total.toFixed(2)}`,
    `*Forma de Pagamento:* ${metodo}`,
    `*Status do Pagamento:* ${status}`,
    `------------------------------------`,
    `*Endereço:* ${endereco}`,
    `*Data do Pedido:* ${data}`,
    `*Hora:* ${hora}`,
    ``,
    `Agradecemos o seu pedido!`,
    `Pizza Express - Sabor que chega rápido!`
  ];

  return linhas.join('\n');
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
      sizePrice = pizza.tamanho === "Pequena" ? 10 :
                  pizza.tamanho === "Média"   ? 15 : 20;
    }

    let pizzaData = window.storeData &&
                    window.storeData.pizzas &&
                    window.storeData.pizzas[pizza.nome]
                      ? window.storeData.pizzas[pizza.nome]
                      : null;

    const cheddarPrice     = pizzaData ? pizzaData.borders["Cheddar"]      : 5.00;
    const catupiryPrice    = pizzaData ? pizzaData.borders["Catupiry"]     : 6.00;
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
  function parsePrice(str) {
    return parseFloat(str.replace(",", "."));
  }

  window.incrementField = function (fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
      let current = parseInt(input.value) || 0;
      input.value = current + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

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

  let pedidoInfo = {}; // Armazena o pedido atual

  // ============================
  // Funções de Modais
  // ============================
  function openOrderModal(pizzaName) {
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) modalPizzaName.textContent = pizzaName;

    if (
      window.storeData &&
      window.storeData.pizzas &&
      window.storeData.pizzas[pizzaName]
    ) {
      const pizzaData = window.storeData.pizzas[pizzaName];
      const modalDescription = document.getElementById('modal-pizza-description');
      if (modalDescription) modalDescription.textContent = pizzaData.description;

      const sizeLabels = document.querySelectorAll('.pizza-size-section label');
      sizeLabels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio && pizzaData.sizes[radio.value]) {
          const priceDiv = label.querySelector('.price-size');
          if (priceDiv) priceDiv.textContent = pizzaData.sizes[radio.value].toFixed(2);
        }
      });
    }

    document.getElementById('order-modal').style.display = 'block';
  }

  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) orderForm.reset();
    document.getElementById('border-cheddar').value = 0;
    document.getElementById('border-catupiry').value = 0;
    document.getElementById('border-cream-cheese').value = 0;
    document.querySelectorAll('.bebida-quantity').forEach(i => i.value = 0);
  }

  function openPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
  }

  function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    const paymentForm = document.getElementById('modal-payment-form');
    if (paymentForm) paymentForm.reset();
    document.getElementById('pix-info').style.display = 'none';
  }

  window.addEventListener('click', function (event) {
    const orderModal   = document.getElementById('order-modal');
    const paymentModal = document.getElementById('payment-modal');
    if (event.target === orderModal) closeOrderModal();
    if (event.target === paymentModal) closePaymentModal();
  });

  document.querySelectorAll('.modal .close').forEach(btn =>
    btn.addEventListener('click', () => {
      closeOrderModal();
      closePaymentModal();
    })
  );

  document.querySelectorAll('.modal .back').forEach(btn =>
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (!modal) return;
      if (modal.id === 'order-modal') closeOrderModal();
      else if (modal.id === 'payment-modal') closePaymentModal();
      else modal.style.display = 'none';
    })
  );

  document.querySelectorAll('.horizontal-scroll .item').forEach(item =>
    item.addEventListener('click', () => {
      openOrderModal(item.querySelector('p').textContent);
    })
  );

  // ====================================
  // Atualiza o Resumo do Pedido (Modal)
  // ====================================
  function updateOrderSummary() {
    const pizzaName        = document.getElementById('modal-pizza-name')?.textContent.trim() || '';
    const size             = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
    const crust            = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
    const totalPizzas      = parseInt(document.getElementById('modal-pizza-quantity')?.value) || 1;
    const cheddarQuantity  = parseInt(document.getElementById('border-cheddar')?.value) || 0;
    const catupiryQuantity = parseInt(document.getElementById('border-catupiry')?.value) || 0;
    const creamQuantity    = parseInt(document.getElementById('border-cream-cheese')?.value) || 0;

    let pizzaData = window.storeData?.pizzas?.[pizzaName] || null;

    const sizePrice        = pizzaData ? pizzaData.sizes[size] : 0;
    const cheddarPrice     = pizzaData ? pizzaData.borders["Cheddar"]      : 5.00;
    const catupiryPrice    = pizzaData ? pizzaData.borders["Catupiry"]     : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;

    const pizzasCost = (sizePrice * totalPizzas) +
                       (cheddarQuantity * cheddarPrice) +
                       (catupiryQuantity * catupiryPrice) +
                       (creamQuantity * creamCheesePrice);

    let beveragesCost = 0;
    const beveragesSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const name  = item.querySelector('p').textContent;
      let price   = parsePrice(item.querySelector('.price').textContent.replace('R$', '').trim());
      if (window.storeData?.beverages?.[name] !== undefined) {
        price = window.storeData.beverages[name];
      }
      const qty = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if (qty > 0) {
        beveragesCost += price * qty;
        beveragesSummary.push(`${name} x${qty} - R$ ${(price * qty).toFixed(2)}`);
      }
    });

    const baseTotal = pizzasCost + beveragesCost;
    pedidoInfo.baseTotal = baseTotal;
    pedidoInfo.deliveryFee = pedidoInfo.deliveryFee || 0;
    pedidoInfo.total = baseTotal + parseFloat(pedidoInfo.deliveryFee);

    document.getElementById('summary-size').textContent   = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
    document.getElementById('summary-crust').textContent  = `Tipo de Massa: ${crust}`;
    document.getElementById('summary-border').textContent =
      `Bordas: Cheddar (${cheddarQuantity}×R$${cheddarPrice.toFixed(2)}) + ` +
      `Catupiry (${catupiryQuantity}×R$${catupiryPrice.toFixed(2)}) + ` +
      `Cream cheese (${creamQuantity}×R$${creamCheesePrice.toFixed(2)})`;
    document.getElementById('summary-quantity').textContent = `Quantidade: ${totalPizzas}`;
    document.getElementById('summary-beverage').textContent = `Bebidas: ${beveragesSummary.length>0? beveragesSummary.join(', ') : 'Nenhuma'}`;
    document.getElementById('summary-total').innerHTML     = `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
  }

  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  document.querySelector('select[name="pizza-crust"]')?.addEventListener('change', updateOrderSummary);
  document.getElementById('modal-pizza-quantity')?.addEventListener('input', updateOrderSummary);
  ['border-cheddar','border-catupiry','border-cream-cheese'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', updateOrderSummary)
  );
  document.querySelectorAll('.bebida-quantity').forEach(input => input.addEventListener('input', updateOrderSummary));

  // ========================================
  // Processamento do formulário de pedido
  // ========================================
  const orderForm = document.getElementById('modal-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      pedidoInfo.nome             = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho          = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.massa            = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.borderCheddar    = parseInt(document.getElementById('border-cheddar').value);
      pedidoInfo.borderCatupiry   = parseInt(document.getElementById('border-catupiry').value);
      pedidoInfo.borderCreamCheese= parseInt(document.getElementById('border-cream-cheese').value);
      pedidoInfo.quantidade       = parseInt(document.getElementById('modal-pizza-quantity').value);

      const bebidas = [];
      document.querySelectorAll('.bebida-item').forEach(item => {
        const name  = item.querySelector('p').textContent;
        let price   = parsePrice(item.querySelector('.price').textContent.replace('R$', '').trim());
        if (window.storeData?.beverages?.[name] !== undefined) price = window.storeData.beverages[name];
        const qty   = parseInt(item.querySelector('.bebida-quantity').value) || 0;
        if (qty > 0) bebidas.push({ name, price, quantity: qty });
      });
      pedidoInfo.bebida = bebidas;

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
    let container = document.getElementById('payment-summary');
    if (!container) {
      container = document.createElement('div');
      container.id = 'payment-summary';
      document.getElementById('delivery-fee').after(container);
    }
    let html = '';
    carrinho.forEach((pizza, i) => {
      let sizePrice = window.storeData?.pizzas?.[pizza.nome]?.sizes?.[pizza.tamanho] ?? 
                      (pizza.tamanho==="Pequena"?10:pizza.tamanho==="Média"?15:20);
      const borders = window.storeData?.pizzas?.[pizza.nome]?.borders ?? 
                      {Cheddar:5,Catupiry:6,"Cream cheese":3.5};
      const bordasCost = pizza.bordas.cheddar*borders.Cheddar +
                         pizza.bordas.catupiry*borders.Catupiry +
                         pizza.bordas.cream*borders["Cream cheese"];
      const bebidasCost = pizza.bebidas?.reduce((acc,b)=>acc+b.price*b.quantity,0) || 0;
      const subtotal = sizePrice*pizza.quantidade + bordasCost + bebidasCost;
      const bevText  = pizza.bebidas?.length>0
        ? ` - Bebidas: ${pizza.bebidas.map(b=>`${b.name} x${b.quantity} - R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ')}`
        : '';
      html += `<p><strong>Pizza ${i+1}:</strong> ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bevText} - R$ ${subtotal.toFixed(2)}</p>`;
    });
    const itensTotal     = calcularTotalPedido();
    const deliveryFeeNum = parseFloat(pedidoInfo.deliveryFee)||0;
    html += `<p><strong>Taxa de Entrega:</strong> R$ ${deliveryFeeNum.toFixed(2)}</p>`;
    html += `<p><strong>Total do Pedido:</strong> R$ ${(itensTotal+deliveryFeeNum).toFixed(2)}</p>`;
    container.innerHTML = html;
  }

  // Eventos para método de pagamento e CEP
  document.querySelectorAll('input[name="payment-method"]').forEach(radio =>
    radio.addEventListener('change', function () {
      document.getElementById('pix-info').style.display =
        this.value === 'Pix' ? 'block' : 'none';
    })
  );

  document.getElementById('cep').addEventListener('blur', function () {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length !== 8) {
      document.getElementById('delivery-fee').textContent = "CEP inválido. Insira 8 dígitos.";
      return;
    }
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          document.getElementById('delivery-fee').textContent = "CEP não encontrado.";
          return;
        }
        document.getElementById('rua').value    = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro    || '';
        document.getElementById('cidade').value = data.localidade|| '';
        document.getElementById('estado').value = data.uf        || '';
        const cityKey = `${data.localidade} (${data.uf})`;
        const fee = window.storeData?.deliveryFees?.[cityKey]?.[data.bairro];
        if (fee != null) {
          document.getElementById('delivery-fee').textContent = `Taxa de Entrega: R$ ${fee.toFixed(2)}`;
          pedidoInfo.deliveryFee = fee;
        } else {
          document.getElementById('delivery-fee').textContent = "Bairro fora da área.";
          pedidoInfo.deliveryFee = 0;
        }
        if (pedidoInfo.baseTotal != null) {
          pedidoInfo.total = pedidoInfo.baseTotal + (pedidoInfo.deliveryFee||0);
        }
        if (document.getElementById('payment-modal').style.display==='block') {
          updatePaymentSummaryCart();
        }
      })
      .catch(() => {
        document.getElementById('delivery-fee').textContent = "Erro ao buscar CEP.";
      });
  });

  // ========================================
  // Processamento do formulário de pagamento
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;

      // coleta e atribui endereço ao pedidoInfo antes de gerar mensagem
      pedidoInfo.rua    = document.getElementById('rua').value;
      pedidoInfo.bairro = document.getElementById('bairro').value;
      pedidoInfo.cidade = document.getElementById('cidade').value;
      pedidoInfo.numero = document.getElementById('numero').value;

      if (metodo === 'Pix') {
        const totalPix = calcularTotalPedido() + (pedidoInfo.deliveryFee || 0);

        fetch('https://meu-app-sooty.vercel.app/mp-pix', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ valor: Number(totalPix.toFixed(2)) })
        })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          const tx = data.pix?.transaction_data || data.transaction_data;
          if (!tx?.qr_code_base64) throw new Error('Sem QR code');

          document.getElementById('pix-info').style.display = 'block';
          document.getElementById('pix-msg').innerHTML = `
            <p><strong>Pagamento via Pix gerado!</strong></p>
            <p>Valor: R$ ${totalPix.toFixed(2)}</p>
            <img src="data:image/png;base64,${tx.qr_code_base64}" style="max-width:200px;margin:10px auto;display:block;">
            <button id="copy-payload-button">Copiar Chave Pix</button>
            <p>Aguarde confirmação…</p>
          `;
          document.getElementById('copy-payload-button')
            .addEventListener('click', () => navigator.clipboard.writeText(tx.qr_code));
          paymentForm.querySelector('button[type="submit"]').disabled = true;

          const polling = setInterval(() => {
            fetch(`https://meu-app-sooty.vercel.app/mp-pix/status/${data.transaction_id}`)
              .then(r => r.json())
              .then(({ pago }) => {
                if (!pago) return;
                clearInterval(polling);

                document.getElementById('pix-msg').innerHTML = `
                  <p style="font-weight:bold; font-size:1.2rem;">Pagamento confirmado! 🎉</p>
                `;
                pedidoInfo.total = totalPix;
                const waMsgPix = encodeURIComponent(buildWhatsAppMessageFromCart(carrinho, 'Pix', 'Pagamento confirmado! 🎉'));
                const btnWa = document.getElementById('btn-whatsapp');
                btnWa.href = `https://wa.me/5581997333714?text=${waMsgPix}`;
                btnWa.style.display = 'block';
              });
          }, 5000);

        })
        .catch(err => {
          console.error(err);
          alert("Erro ao criar pagamento Pix. Tente novamente.");
        });

      } else {
        pedidoInfo.total = calcularTotalPedido() + (pedidoInfo.deliveryFee || 0);
        const waMsgEntrega = encodeURIComponent(buildWhatsAppMessageFromCart(carrinho, metodo, 'Pagamento na entrega'));
        closePaymentModal();
        window.open(`https://wa.me/5581997333714?text=${waMsgEntrega}`, '_blank');
      }
    });
  }

  // ========================================
  // Scroll horizontal infinito "As Mais Vendidas"
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
    dot.addEventListener('click', () => updateCarousel(index));
  });
  let startX = 0, isDragging = false, currentTranslate = 0;
  carouselInner.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });
  carouselInner.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    currentTranslate = -currentIndex * 100 + (diff / window.innerWidth) * 100;
    carouselInner.style.transition = 'none';
    carouselInner.style.transform = `translateX(${currentTranslate}%)`;
  });
  carouselInner.addEventListener('touchend', e => {
    isDragging = false;
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 50 && currentIndex > 0) updateCarousel(currentIndex - 1);
    else if (diff < -50 && currentIndex < dots.length - 1) updateCarousel(currentIndex + 1);
    else updateCarousel(currentIndex);
  });
  carouselInner.addEventListener('mousedown', e => {
    startX = e.clientX;
    isDragging = true;
  });
  carouselInner.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    currentTranslate = -currentIndex * 100 + (diff / window.innerWidth) * 100;
    carouselInner.style.transition = 'none';
    carouselInner.style.transform = `translateX(${currentTranslate}%)`;
  });
  carouselInner.addEventListener('mouseup', e => {
    isDragging = false;
    const diff = e.clientX - startX;
    if (diff > 50 && currentIndex > 0) updateCarousel(currentIndex - 1);
    else if (diff < -50 && currentIndex < dots.length - 1) updateCarousel(currentIndex + 1);
    else updateCarousel(currentIndex);
  });

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
    const tamanho = document.querySelector('input[name="pizza-size"]:checked')?.value;
    const massa   = document.querySelector('select[name="pizza-crust"]').value;
    const quantidade = parseInt(document.getElementById("modal-pizza-quantity").value);

    const cheddar = parseInt(document.getElementById("border-cheddar").value);
    const catupiry= parseInt(document.getElementById("border-catupiry").value);
    const cream   = parseInt(document.getElementById("border-cream-cheese").value);

    if (!tamanho || !massa || quantidade < 1) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    const bebidas = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const name = item.querySelector('p').textContent;
      let price  = parsePrice(item.querySelector('.price').textContent.replace('R$', '').trim());
      if (window.storeData?.beverages?.[name] !== undefined) price = window.storeData.beverages[name];
      const qty   = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if (qty > 0) bebidas.push({ name, price, quantity: qty });
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

  function atualizarCarrinhoUI() {
    const lista  = document.getElementById("cart-items");
    const totalEl= document.getElementById("cart-total");
    lista.innerHTML = "";

    carrinho.forEach((pizza, index) => {
      let sizePrice = window.storeData?.pizzas?.[pizza.nome]?.sizes?.[pizza.tamanho] ??
                      (pizza.tamanho==="Pequena"?10:pizza.tamanho==="Média"?15:20);
      let pizzaData = window.storeData?.pizzas?.[pizza.nome] || null;
      const cheddarPrice = pizzaData?.borders?.Cheddar  || 5.00;
      const catupiryPrice= pizzaData?.borders?.Catupiry || 6.00;
      const creamPrice   = pizzaData?.borders?.["Cream cheese"] || 3.50;

      const bordasCost   = pizza.bordas.cheddar*cheddarPrice +
                           pizza.bordas.catupiry*catupiryPrice +
                           pizza.bordas.cream*creamPrice;
      const bebidasCost  = pizza.bebidas?.reduce((acc,b)=>acc+b.price*b.quantity,0) || 0;
      const subtotal     = sizePrice*pizza.quantidade + bordasCost + bebidasCost;

      const li = document.createElement("li");
      li.classList.add("cart-item");

      const detailsDiv = document.createElement("div");
      detailsDiv.classList.add("cart-item-details");
      const title = document.createElement("p");
      title.classList.add("cart-item-title");
      title.textContent = `${pizza.nome} (${pizza.tamanho} - ${pizza.massa})`;
      detailsDiv.appendChild(title);
      const qty = document.createElement("p");
      qty.textContent = `Quantidade: ${pizza.quantidade}`;
      detailsDiv.appendChild(qty);
      if (pizza.bebidas && pizza.bebidas.length>0) {
        const drinks = document.createElement("p");
        drinks.textContent = `Bebidas: ${pizza.bebidas.map(b=>`\${b.name} x\${b.quantity}`).join(", ")}`;
        detailsDiv.appendChild(drinks);
      }
      const subt = document.createElement("p");
      subt.classList.add("cart-item-subtotal");
      subt.textContent = `Subtotal: R$ ${subtotal.toFixed(2)}`;
      detailsDiv.appendChild(subt);

      li.appendChild(detailsDiv);

      const removeContainer = document.createElement("div");
      removeContainer.classList.add("cart-item-remove");
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remover";
      removeBtn.classList.add("remove-button");
      removeBtn.addEventListener("click", () => removerPedido(index));
      removeContainer.appendChild(removeBtn);

      li.appendChild(removeContainer);
      lista.appendChild(li);
    });

    totalEl.textContent = calcularTotalPedido().toFixed(2);
    const cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.textContent = carrinho.length;
  }

  window.abrirCarrinho = function() {
    document.getElementById("cart").classList.add("open");
    atualizarCarrinhoUI();
  };

  window.fecharCarrinho = function() {
    document.getElementById("cart").classList.remove("open");
  };

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
