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
  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // -----------------------------
  // Dados de Localização da Loja
  // -----------------------------
  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const defaultCity = "Paulista (PE)";

  // Variável para armazenar a bebida selecionada (temporária)
  let selectedBeverage = null;

  // Objeto global para armazenar os dados do pedido
  let pedidoInfo = {};

  // -----------------------------
  // Função para gerar as opções dinâmicas de borda
  // -----------------------------
  function generateBorderOptions() {
    const quantityInput = document.getElementById('modal-pizza-quantity');
    const quantity = parseInt(quantityInput.value);
    const borderContainer = document.getElementById('border-options-container');
    borderContainer.innerHTML = ""; // Limpa opções anteriores

    const pizzaName = document.getElementById('modal-pizza-name').textContent.trim();
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
      input.value = "0"; // Valor padrão zero
      input.style.width = "50px";
      input.dataset.border = borderOption;
      input.addEventListener('change', updateOrderSummary);
      label.appendChild(input);
      div.appendChild(label);
      borderContainer.appendChild(div);
    });
  }

  // -----------------------------
  // Funções de Modais (abrir/fechar)
  // -----------------------------
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
    // Gere as opções de borda assim que o modal abrir
    generateBorderOptions();
  }

  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) {
      orderForm.reset();
    }
    selectedBeverage = null;
    document.querySelectorAll('.bebida-item').forEach(item => item.classList.remove('selected-bebida'));
    updateOrderSummary();
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

  // Fechar modais ao clicar fora do conteúdo
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

  // Abertura do Modal de Pedido ao clicar em um item
  document.querySelectorAll('.horizontal-scroll .item').forEach(item => {
    item.addEventListener('click', function () {
      const pizzaName = item.querySelector('p').textContent;
      openOrderModal(pizzaName);
    });
  });

  // -----------------------------
  // Atualização do Resumo do Pedido e Cálculo do Total
  // Regra: (Preço do Tamanho * Quantidade) + (Soma dos preços de borda conforme distribuição) + (Valor da Bebida única)
  // -----------------------------
  function updateOrderSummary() {
    let pizzaName, size, crust, quantity;
    let borderTotal = 0;
    if (document.getElementById('order-modal').style.display === 'block') {
      pizzaName = document.getElementById('modal-pizza-name')?.textContent.trim() || '';
      size = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
      crust = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
      quantity = document.getElementById('modal-pizza-quantity')?.value || 1;
    } else {
      pizzaName = pedidoInfo.nome || '';
      size = pedidoInfo.tamanho || 'Não selecionado';
      crust = pedidoInfo.crust || 'Não selecionado';
      quantity = pedidoInfo.quantidade || 1;
    }

    if (document.getElementById('order-summary')) {
      document.getElementById('summary-size').textContent = `Tamanho: ${size}`;
      document.getElementById('summary-crust').textContent = `Tipo de Massa: ${crust}`;
      // Para o resumo da borda, mostraremos a distribuição (se houver)
      const borderContainer = document.getElementById('border-options-container');
      let resumoBorda = "";
      if (borderContainer) {
        const inputs = borderContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
          const borderOption = input.dataset.border;
          const qty = parseInt(input.value) || 0;
          if (qty > 0) {
            resumoBorda += `${qty} x ${borderOption}; `;
          }
        });
      }
      document.getElementById('summary-border').textContent = `Borda: ${resumoBorda || "Nenhuma"}`;
      document.getElementById('summary-quantity').textContent = `Quantidade: ${quantity}`;
      document.getElementById('summary-beverage').textContent = 
        `Bebida: ${selectedBeverage ? `${selectedBeverage.name} - R$ ${parseFloat(selectedBeverage.price).toFixed(2)}` : (pedidoInfo.beverageCost ? `R$ ${pedidoInfo.beverageCost.toFixed(2)}` : 'Não selecionada')}`;
    }

    let basePrice = 0;
    let pizzaData = null;
    if (pizzaName && window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizzaName]) {
      pizzaData = window.storeData.pizzas[pizzaName];
    }
    const sizePrice = pizzaData ? (pizzaData.sizes[size] || 0) : 0;
    const sizeTotal = sizePrice * parseInt(quantity);

    // Cálculo do custo das bordas a partir da distribuição
    if (pizzaData) {
      const borderContainer = document.getElementById('border-options-container');
      let allocated = 0;
      if (borderContainer) {
        const inputs = borderContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
          let qty = parseInt(input.value) || 0;
          allocated += qty;
          const borderOption = input.dataset.border;
          const bordaPrice = pizzaData.borders[borderOption] || 0;
          borderTotal += bordaPrice * qty;
        });
        // Se o total alocado for menor que a quantidade total, considere o restante como "Nenhuma"
        const remaining = parseInt(quantity) - allocated;
        if (remaining > 0 && pizzaData.borders["Nenhuma"] !== undefined) {
          borderTotal += pizzaData.borders["Nenhuma"] * remaining;
        }
      }
    }

    // Total do pedido
    const beverageCost = selectedBeverage ? parseFloat(selectedBeverage.price) : (pedidoInfo.beverageCost || 0);
    const baseTotal = sizeTotal + borderTotal + beverageCost;
    pedidoInfo.baseTotal = baseTotal;

    const deliveryFee = pedidoInfo.deliveryFee ? parseFloat(pedidoInfo.deliveryFee) : 0;
    const total = baseTotal + deliveryFee;
    pedidoInfo.total = total;

    if (document.getElementById('summary-total')) {
      document.getElementById('summary-total').innerHTML = `<strong>Total: R$ ${total.toFixed(2)}</strong>`;
    }
  }

  // Atualiza a geração das opções de borda sempre que a quantidade for alterada
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) {
    quantityInput.addEventListener('input', () => {
      generateBorderOptions();
      updateOrderSummary();
    });
  }

  // -----------------------------
  // Seleção de Bebidas
  // -----------------------------
  document.querySelectorAll('.bebida-item').forEach(bebidaItem => {
    bebidaItem.addEventListener('click', () => {
      document.querySelectorAll('.bebida-item').forEach(item => item.classList.remove('selected-bebida'));
      bebidaItem.classList.add('selected-bebida');
      const beverageName = bebidaItem.querySelector('p').textContent;
      const beveragePrice = parsePrice(bebidaItem.querySelector('.price').textContent.replace('R$', '').trim());
      selectedBeverage = { name: beverageName, price: beveragePrice };
      pedidoInfo.beverageCost = beveragePrice;
      updateOrderSummary();
    });
  });

  // -----------------------------
  // Atualização do Resumo no Modal de Pagamento
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
      <p><strong>Bebida:</strong> ${pedidoInfo.bebida}</p>
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
      // Para borda, armazenamos a distribuição recuperando os valores dos inputs
      const borderContainer = document.getElementById('border-options-container');
      let borderDistribution = {};
      if (borderContainer) {
        const inputs = borderContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
          const borderOption = input.dataset.border;
          const qty = parseInt(input.value) || 0;
          if (qty > 0) {
            borderDistribution[borderOption] = qty;
          }
        });
      }
      pedidoInfo.borderDistribution = borderDistribution;
      pedidoInfo.adicionais = document.getElementById('modal-additional')?.value || 'Nenhum';
      pedidoInfo.bebida = selectedBeverage 
        ? `${selectedBeverage.name} - R$ ${parseFloat(selectedBeverage.price).toFixed(2)}`
        : 'Nenhuma';
      updateOrderSummary();
      closeOrderModal();
      openPaymentModal();
      updatePaymentSummary();
    });
  }

  // -----------------------------
  // Alternar Informações do Pix conforme método de pagamento
  // -----------------------------
  document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const pixInfo = document.getElementById('pix-info');
      pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
    });
  });

  // -----------------------------
  // CEP e Endereço Automático
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
          pedidoInfo.deliveryFee = null;
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
*Bebida:* ${pedidoInfo.bebida}
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
  // Botão Copiar Chave Pix
  // -----------------------------
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
