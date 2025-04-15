document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para converter strings de preço ("6,00") para número (6.00)
  function parsePrice(str) {
    return parseFloat(str.replace(",", "."));
  }

  // -----------------------------
  // Mobile Menu Toggle
  // -----------------------------
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  // -----------------------------
  // Dados de Localização da Loja
  // -----------------------------
  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";

  // Variável global para armazenar as informações do pedido
  let pedidoInfo = {};
  // Objeto para armazenar as bebidas selecionadas (suporte a múltiplas escolhas)
  let selectedBeverages = {};

  // -----------------------------
  // Função para gerar as opções dinâmicas de borda
  // -----------------------------
  function generateBorderOptions() {
    const quantityInput = document.getElementById('modal-pizza-quantity');
    if (!quantityInput) {
      console.error('Elemento "modal-pizza-quantity" não encontrado.');
      return;
    }
    const quantity = parseInt(quantityInput.value, 10);
    const borderContainer = document.getElementById('border-options-container');
    if (!borderContainer) {
      console.error('Elemento "border-options-container" não encontrado.');
      return;
    }
    borderContainer.innerHTML = ""; // Limpa opções anteriores

    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (!modalPizzaName) {
      console.error('Elemento "modal-pizza-name" não encontrado.');
      return;
    }
    const pizzaName = modalPizzaName.textContent.trim();
    if (!(window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName])) {
      borderContainer.innerHTML = "<p>Opções de borda indisponíveis.</p>";
      return;
    }
    const pizzaData = window.storeData.pizzas[pizzaName];
    const borders = Object.keys(pizzaData.borders);
    borders.forEach(borderOption => {
      const div = document.createElement('div');
      div.style.marginBottom = "5px";
      const label = document.createElement('label');
      label.textContent = `${borderOption} (R$ ${pizzaData.borders[borderOption].toFixed(2)}): `;
      const input = document.createElement('input');
      input.type = "number";
      input.min = "0";
      input.max = quantity.toString();
      input.value = "0"; // Valor padrão
      input.style.width = "50px";
      input.dataset.border = borderOption;
      input.addEventListener('change', updateOrderSummary);
      label.appendChild(input);
      div.appendChild(label);
      borderContainer.appendChild(div);
    });
  }

  // -----------------------------
  // Funções de Modais: abrir/fechar
  // -----------------------------
  function openOrderModal(pizzaName) {
    const modal = document.getElementById('order-modal');
    if (!modal) {
      console.error('Elemento "order-modal" não encontrado.');
      return;
    }
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
    } else {
      console.error('Elemento "modal-pizza-name" não encontrado.');
    }
    if (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      const pizzaData = window.storeData.pizzas[pizzaName];
      const modalDescription = document.getElementById('modal-pizza-description');
      if (modalDescription) {
        modalDescription.textContent = pizzaData.description;
      }
      // Atualiza os preços dos tamanhos conforme a pizza selecionada
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
    modal.style.display = 'block';
    // Sempre que abrir o modal de pedido, gera as opções de borda e reseta as bebidas
    generateBorderOptions();
    selectedBeverages = {};
    document.querySelectorAll('.bebida-item').forEach(item => item.classList.remove('selected-bebida'));
    updateOrderSummary();
  }

  function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) modal.style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) orderForm.reset();
    // Reseta as bebidas selecionadas
    selectedBeverages = {};
    document.querySelectorAll('.bebida-item').forEach(item => item.classList.remove('selected-bebida'));
    updateOrderSummary();
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

  // Fechar modais ao clicar fora deles
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

  // Abertura do Modal de Pedido quando clicar em um item de pizza
  document.querySelectorAll('.horizontal-scroll .item').forEach(item => {
    item.addEventListener('click', function () {
      const pizzaName = item.querySelector('p').textContent;
      openOrderModal(pizzaName);
    });
  });

  // -----------------------------
  // Função para atualizar o resumo do pedido com os cálculos
  // -----------------------------
  function updateOrderSummary() {
    // Recupera informações do modal de pedido
    const modalPizzaNameElem = document.getElementById("modal-pizza-name");
    const sizeElem = document.querySelector('input[name="pizza-size"]:checked');
    const quantityElem = document.getElementById("modal-pizza-quantity");
    const crustElem = document.querySelector('select[name="pizza-crust"]');

    const pizzaName = modalPizzaNameElem ? modalPizzaNameElem.textContent.trim() : "";
    const size = sizeElem ? sizeElem.value : "";
    const quantity = quantityElem ? parseInt(quantityElem.value, 10) : 0;
    const crust = crustElem ? crustElem.value : "";

    // Atualiza os campos do resumo no modal de pedido
    document.getElementById("summary-size").textContent = "Tamanho: " + size;
    document.getElementById("summary-crust").textContent = "Tipo de Massa: " + crust;
    document.getElementById("summary-quantity").textContent = "Quantidade: " + quantity;

    // Recupera os dados da pizza escolhida a partir do objeto global storeData
    let pizzaData = null;
    if (pizzaName && window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      pizzaData = window.storeData.pizzas[pizzaName];
    }

    // 1. Cálculo do valor do tamanho: preço do tamanho x quantidade
    const tamanhoPreco = pizzaData ? (pizzaData.sizes[size] || 0) : 0;
    const totalTamanho = tamanhoPreco * quantity;

    // 2. Cálculo do valor das bordas: para cada tipo de borda, multiplica o preço pelo número selecionado
    let totalBordas = 0;
    let bordaResumo = "";
    const borderContainer = document.getElementById("border-options-container");
    if (borderContainer && pizzaData) {
      const borderInputs = borderContainer.querySelectorAll("input[type='number']");
      borderInputs.forEach(input => {
        const qty = parseInt(input.value, 10) || 0;
        const borderType = input.dataset.border;
        const borderPrice = pizzaData.borders[borderType] || 0;
        totalBordas += borderPrice * qty;
        if (qty > 0) {
          bordaResumo += `${qty} x ${borderType}; `;
        }
      });
    }
    document.getElementById("summary-border").textContent = "Borda: " + (bordaResumo || "Nenhuma");

    // 3. Cálculo do valor das bebidas: soma o preço de cada bebida multiplicado pela sua quantidade
    let totalBebidas = 0;
    let bebidaResumo = "";
    for (const key in selectedBeverages) {
      if (selectedBeverages.hasOwnProperty(key)) {
        const bev = selectedBeverages[key];
        totalBebidas += bev.price * bev.quantity;
        bebidaResumo += `${bev.quantity} x ${bev.name}; `;
      }
    }
    document.getElementById("summary-beverage").textContent = "Bebida(s): " + (bebidaResumo || "Nenhuma");

    // 4. Cálculo final do pedido
    const totalPedidoBase = totalTamanho + totalBordas + totalBebidas;
    pedidoInfo.baseTotal = totalPedidoBase;
    // Se houver taxa de entrega (definida via CEP), soma-a
    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    const totalPedidoFinal = totalPedidoBase + deliveryFee;
    pedidoInfo.total = totalPedidoFinal;
    document.getElementById("summary-total").innerHTML = `<strong>Total: R$ ${totalPedidoFinal.toFixed(2)}</strong>`;

    console.log("Valor Tamanho:", totalTamanho, "Valor Bordas:", totalBordas, "Valor Bebidas:", totalBebidas, "Total Pedido:", totalPedidoFinal);
  }

  // Atualiza opções de borda e resumo quando a quantidade é alterada
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) {
    quantityInput.addEventListener('input', () => {
      generateBorderOptions();
      updateOrderSummary();
    });
  }

  // -----------------------------
  // Seleção de Bebidas – suporte a múltiplas seleções com contagem
  // -----------------------------
  document.querySelectorAll('.bebida-item').forEach(bebidaItem => {
    bebidaItem.addEventListener('click', () => {
      const beverageName = bebidaItem.querySelector('p').textContent.trim();
      const priceText = bebidaItem.querySelector('.price').textContent.replace('R$', '').trim();
      const beveragePrice = parsePrice(priceText);
      // Se a bebida já foi selecionada, incrementa a quantidade; se não, inicia com 1
      if (selectedBeverages[beverageName]) {
        selectedBeverages[beverageName].quantity += 1;
      } else {
        selectedBeverages[beverageName] = { name: beverageName, price: beveragePrice, quantity: 1 };
        bebidaItem.classList.add('selected-bebida');
      }
      updateOrderSummary();
    });
  });

  // -----------------------------
  // Atualiza o resumo no Modal de Pagamento
  // -----------------------------
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
      <p><strong>Borda:</strong> ${document.getElementById('summary-border').textContent.replace("Borda: ","")}</p>
      <p><strong>Quantidade:</strong> ${pedidoInfo.quantidade}</p>
      <p><strong>Bebida(s):</strong> ${Object.keys(selectedBeverages).length > 0 ? Object.values(selectedBeverages).map(bev => `${bev.quantity} x ${bev.name}`).join("; ") : "Nenhuma"}</p>
      <p><strong>Total do Pedido:</strong> R$ ${pedidoInfo.total.toFixed(2)}</p>
    `;
  }

  // -----------------------------
  // Envio do Formulário de Pedido (Modal de Pedido)
  // -----------------------------
  const orderForm = document.getElementById('modal-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity').value;
      
      // Armazena a distribuição das bordas
      const borderContainer = document.getElementById('border-options-container');
      let borderDistribution = {};
      if (borderContainer) {
        const inputs = borderContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
          const borderOption = input.dataset.border;
          const qty = parseInt(input.value, 10) || 0;
          if (qty > 0) {
            borderDistribution[borderOption] = qty;
          }
        });
      }
      pedidoInfo.borderDistribution = borderDistribution;
      pedidoInfo.adicionais = document.getElementById('modal-additional') ? document.getElementById('modal-additional').value : 'Nenhum';
      
      // Cria uma string resumo das bebidas selecionadas
      let bebidaResumo = "";
      for (const key in selectedBeverages) {
        if (selectedBeverages.hasOwnProperty(key)) {
          const bev = selectedBeverages[key];
          bebidaResumo += `${bev.quantity} x ${bev.name}; `;
        }
      }
      pedidoInfo.bebidas = bebidaResumo || "Nenhuma";
      
      updateOrderSummary();
      closeOrderModal();
      openPaymentModal();
      updatePaymentSummary();
    });
  }

  // -----------------------------
  // Envio do Formulário de Pagamento (Modal de Pagamento)
  // -----------------------------
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
*Tipo de Massa:* ${pedidoInfo.crust}
*Borda:* ${document.getElementById('summary-border').textContent.replace("Borda: ","")}
*Quantidade:* ${pedidoInfo.quantidade} unidade(s)
*Bebida(s):* ${pedidoInfo.bebidas}
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

  // -----------------------------
  // Alterna informações do Pix conforme método de pagamento
  // -----------------------------
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const pixInfo = document.getElementById('pix-info');
      pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
    });
  });

  // -----------------------------
  // CEP e Endereço Automático e Cálculo da Taxa de Entrega
  // -----------------------------
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
          pedidoInfo.deliveryFee = 0;
        }
        updateOrderSummary();
        if (document.getElementById('payment-modal').style.display === 'block'){
          updatePaymentSummary();
        }
      })
      .catch(err => {
        console.error(err);
        document.getElementById('delivery-fee').textContent = "Erro ao buscar a localização.";
      });
  }

  // -----------------------------
  // Conversão de Graus para Radianos (Cálculo de Distância)
  // -----------------------------
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

  // -----------------------------
  // Carousel de Vendas e Carrossel Geral
  // -----------------------------
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
});
