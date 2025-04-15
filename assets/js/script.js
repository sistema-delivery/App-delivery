document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para converter strings de preço ("6,00") para formato numérico ("6.00")
  function parsePrice(str) {
    return parseFloat(str.replace(",", "."));
  }

  // Função para incrementar o valor de um input por seu ID (usado para bordas)
  window.incrementField = function(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
      let current = parseInt(input.value) || 0;
      input.value = current + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  // Função para incrementar o valor do input imediatamente anterior ao botão (usado para bebidas)
  window.incrementSibling = function(button) {
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

  // Dados de Localização da Loja (exemplo para cálculo de distância futuro)
  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";

  // Objeto global para armazenar os dados do pedido atual (usado no modal de pedido)
  let pedidoInfo = {};

  // Funções de Modais
  function openOrderModal(pizzaName) {
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
    }
    if (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
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
    // Reset dos campos de bordas e bebidas
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

  window.addEventListener('click', function(event) {
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

  // Atualização do Resumo do Pedido e Cálculo do Total (para o modal de pedido)
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
    if (pizzaName && window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      const pizzaData = window.storeData.pizzas[pizzaName];
      sizePrice = pizzaData.sizes[size] || 0;
    }

    const cheddarPrice = 5.00;
    const catupiryPrice = 6.00;
    const creamCheesePrice = 3.50;

    const pizzasCost = (sizePrice * totalPizzas) 
                        + (cheddarQuantity * cheddarPrice) 
                        + (catupiryQuantity * catupiryPrice)
                        + (creamCheeseQuantity * creamCheesePrice);

    let beveragesCost = 0;
    const beveragesSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const bebidaName = item.querySelector('p').textContent;
      const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
      const bebidaPrice = parsePrice(priceText);
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

  // Processamento do formulário de pedido (submit) – a versão original redirecionava para o modal de pagamento
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
        const bebidaPrice = parsePrice(priceText);
        const bebidaQuantity = parseInt(item.querySelector('.bebida-quantity').value) || 0;
        if (bebidaQuantity > 0) {
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
      updatePaymentSummary();
    });
  }

  function updatePaymentSummary() {
    let paymentSummaryElement = document.getElementById('payment-summary');
    if (!paymentSummaryElement) {
      paymentSummaryElement = document.createElement('div');
      paymentSummaryElement.id = 'payment-summary';
      const deliveryFeeElement = document.getElementById('delivery-fee');
      deliveryFeeElement.parentNode.insertBefore(paymentSummaryElement, deliveryFeeElement.nextSibling);
    }
    paymentSummaryElement.innerHTML = `
      <p><strong>Pizza:</strong> ${pedidoInfo.nome}</p>
      <p><strong>Tamanho:</strong> ${pedidoInfo.tamanho}</p>
      <p><strong>Tipo de Massa:</strong> ${pedidoInfo.crust}</p>
      <p><strong>Bordas:</strong> Cheddar (${pedidoInfo.borderCheddar} un.) + Catupiry (${pedidoInfo.borderCatupiry} un.) + Cream cheese (${pedidoInfo.borderCreamCheese} un.)</p>
      <p><strong>Quantidade:</strong> ${pedidoInfo.quantidade}</p>
      <p><strong>Bebida(s):</strong> ${pedidoInfo.bebida.length > 0 ? pedidoInfo.bebida.map(b => `${b.name} x${b.quantity} - R$ ${(b.price * b.quantity).toFixed(2)}`).join(', ') : 'Nenhuma'}</p>
      <p><strong>Total do Pedido:</strong> R$ ${pedidoInfo.total.toFixed(2)}</p>
    `;
  }

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
        if (document.getElementById('payment-modal').style.display === 'block'){
          updatePaymentSummary();
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

  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;
      const status = metodo === 'Pix' ? 'Aguardando Comprovante' : 'Pagamento na entrega';
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
*Bebida(s):* ${pedidoInfo.bebida.length > 0 ? pedidoInfo.bebida.map(b => `${b.name} x${b.quantity} - R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ') : 'Nenhuma'}
*Total do Pedido:* R$ ${pedidoInfo.total.toFixed(2)}
------------------------------------
*Status do Pagamento:* ${status}
*Forma de Pagamento:* ${metodo}${metodo === 'Pix' ? ` (Chave: ${chavePix})` : ''}
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
    });
  }

  const copyButton = document.getElementById('copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', () => {
      const pixKey = document.getElementById('pix-key-text').textContent;
      navigator.clipboard.writeText(pixKey)
        .then(() => {
          alert('Chave Pix copiada!');
        })
        .catch(err => {
          console.error('Erro ao copiar a chave Pix:', err);
        });
    });
  }

  // Scroll horizontal infinito para a seção "As Mais Vendidas"
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

  // Carousel dos banners
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

  // ================================================
  // IMPLEMENTAÇÃO DO CARRINHO DE COMPRAS COM LOCALSTORAGE
  // ================================================
  
  // Inicializa o carrinho a partir do localStorage (ou cria um array vazio)
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

  function atualizarLocalStorage() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
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
    
    // Coleta as bebidas selecionadas
    const bebidas = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const bebidaName = item.querySelector('p').textContent;
      const priceText = item.querySelector('.price').textContent.replace('R$', '').trim();
      const bebidaPrice = parsePrice(priceText);
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
      bebidas  // guarda as bebidas selecionadas
    };

    carrinho.push(pizza);
    atualizarLocalStorage();
    alert("Pizza adicionada ao carrinho!");
    closeOrderModal();
    atualizarCarrinhoUI();
  };

  // Função para atualizar a interface do carrinho (lista de itens e total)
function atualizarCarrinhoUI() {
  const lista = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  lista.innerHTML = "";
  let total = 0;
  
  carrinho.forEach((pizza) => {
    // Busca o preço do tamanho a partir dos dados da pizza no storeData.
    let sizePrice = 0;
    if (window.storeData &&
        window.storeData.pizzas &&
        window.storeData.pizzas[pizza.nome] &&
        window.storeData.pizzas[pizza.nome].sizes) {
      sizePrice = window.storeData.pizzas[pizza.nome].sizes[pizza.tamanho] || 0;
    } else {
      // Fallback: se não encontrar no storeData, usa valores fixos (opcional)
      sizePrice = pizza.tamanho === "Pequena" ? 10 : pizza.tamanho === "Média" ? 15 : 20;
    }

    const cheddarPrice = 5.00;
    const catupiryPrice = 6.00;
    const creamCheesePrice = 3.50;
    
    // Calcula o custo das bordas conforme a quantidade escolhida
    const bordasCost = 
      (pizza.bordas.cheddar * cheddarPrice) +
      (pizza.bordas.catupiry * catupiryPrice) +
      (pizza.bordas.cream * creamCheesePrice);

    // Calcula o custo total das bebidas, se houver
    const bebidasCost = pizza.bebidas 
      ? pizza.bebidas.reduce((acc, bev) => acc + (bev.price * bev.quantity), 0)
      : 0;

    // Subtotal da pizza: preço do tamanho vezes quantidade, mais bordas e bebidas
    const subtotal = (sizePrice * pizza.quantidade) + bordasCost + bebidasCost;
    total += subtotal;
    
    let bebidaText = "";
    if (pizza.bebidas && pizza.bebidas.length > 0) {
      bebidaText = " - Bebidas: " + pizza.bebidas.map(b => `${b.name} x${b.quantity}`).join(', ');
    }
    
    const item = document.createElement("li");
    item.innerText = `Pizza: ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bebidaText} - R$ ${subtotal.toFixed(2)}`;
    lista.appendChild(item);
  });
  
  totalEl.innerText = total.toFixed(2);
}

  window.abrirCarrinho = function() {
    document.getElementById("cart").style.display = "block";
    atualizarCarrinhoUI();
  };

  window.fecharCarrinho = function() {
    document.getElementById("cart").style.display = "none";
  };

  // Função para atualizar o resumo do pagamento usando os itens do carrinho
  function updatePaymentSummaryCart() {
    let paymentSummaryElement = document.getElementById('payment-summary');
    if (!paymentSummaryElement) {
      paymentSummaryElement = document.createElement('div');
      paymentSummaryElement.id = 'payment-summary';
      const deliveryFeeElement = document.getElementById('delivery-fee');
      deliveryFeeElement.parentNode.insertBefore(paymentSummaryElement, deliveryFeeElement.nextSibling);
    }
    let summaryText = '';
    let total = 0;

    carrinho.forEach((pizza, index) => {
      const precoTamanho = pizza.tamanho === "Pequena" ? 10 : pizza.tamanho === "Média" ? 15 : 20;
      const precoBordas = (pizza.bordas.cheddar * 5) +
                          (pizza.bordas.catupiry * 6) +
                          (pizza.bordas.cream * 3.5);
      const precoBebidas = pizza.bebidas ? pizza.bebidas.reduce((acc, bev) => acc + (bev.price * bev.quantity), 0) : 0;
      const subtotal = (precoTamanho * pizza.quantidade) + precoBordas + precoBebidas;
      total += subtotal;
      let bebidaText = "";
      if(pizza.bebidas && pizza.bebidas.length > 0){
        bebidaText = ` - Bebidas: ${pizza.bebidas.map(b => `${b.name} x${b.quantity} - R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ')}`;
      }
      summaryText += `<p><strong>Pizza ${index+1}:</strong> ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bebidaText} - R$ ${subtotal.toFixed(2)}</p>`;
    });
    summaryText += `<p><strong>Total do Pedido:</strong> R$ ${total.toFixed(2)}</p>`;
    paymentSummaryElement.innerHTML = summaryText;
  }

  // Ao clicar em "Finalizar Pedido" no carrinho, abre o modal de pagamento para finalizar o pedido
  window.finalizarPedido = function() {
    if (carrinho.length === 0) {
      alert("Seu carrinho está vazio!");
      return;
    }
    updatePaymentSummaryCart();
    openPaymentModal();
  };

  // Atualiza a interface do carrinho no carregamento
  atualizarCarrinhoUI();
});
