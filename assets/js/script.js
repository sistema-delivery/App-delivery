document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // Mobile Menu Toggle
  // -----------------------------
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  // -----------------------------
  // Dados fixos da Pizzaria e Taxas por Bairro
  // -----------------------------
  const storeLocation = { lat: -7.950346, lon: -34.902970 };
  const bairrosComTaxas = {
    "Janga": 5.00,
    "Maranguape I": 6.00,
    "Maranguape II": 6.00,
    "Arthur Lundgren I": 7.00,
    "Arthur Lundgren II": 7.00,
    "Paratibe": 8.00,
    "Centro": 4.00,
    "Nossa Senhora da Conceição": 5.50,
    "Engenho Maranguape": 6.50,
    "Jardim Paulista": 6.50,
    "Jardim Paulista Alto": 6.50
  };

  // -----------------------------
  // Funções de Modais
  // -----------------------------
  function openOrderModal(pizzaName) {
    const modalPizzaName = document.getElementById('modal-pizza-name');
    if (modalPizzaName) {
      modalPizzaName.textContent = pizzaName;
    }
    document.getElementById('order-modal').style.display = 'block';
  }
  
  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    const orderForm = document.getElementById('modal-order-form');
    if (orderForm) {
      orderForm.reset();
    }
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
  
  // Fechar modais se clicar fora do conteúdo (apenas se o clique for no fundo, e não em seus filhos)
  window.addEventListener('click', function(event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
      if (event.target.id === 'order-modal') closeOrderModal();
      if (event.target.id === 'payment-modal') closePaymentModal();
    }
  });
  
  // Botões de fechar (X)
  document.querySelectorAll('.modal .close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeOrderModal();
      closePaymentModal();
    });
  });
  
  // -----------------------------
  // Abertura do Modal de Pedido via clique em Item da Horizontal Scroll
  // -----------------------------
  document.querySelectorAll('.horizontal-scroll .item').forEach(item => {
    item.addEventListener('click', function () {
      const pizzaName = item.querySelector('p').textContent;
      openOrderModal(pizzaName);
    });
  });
  
  // -----------------------------
  // Atualização do Resumo do Pedido (incluindo bebidas)
  // -----------------------------
  function updateOrderSummary() {
    const size = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
    const crust = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
    const border = document.querySelector('select[name="pizza-border"]').value || 'Não selecionado';
    const quantity = document.getElementById('modal-pizza-quantity')?.value || 1;
  
    // Coleta as bebidas selecionadas, caso exista a nova opção
    const selectedDrinks = [];
    document.querySelectorAll('input[name="drink"]:checked').forEach(checkbox => {
      selectedDrinks.push(checkbox.value);
    });
    const drinksSummary = selectedDrinks.length ? selectedDrinks.join(', ') : 'Nenhuma';
  
    document.getElementById('summary-size').textContent = `Tamanho: ${size}`;
    document.getElementById('summary-crust').textContent = `Tipos de Massa: ${crust}`;
    document.getElementById('summary-border').textContent = `Borda: ${border}`;
    document.getElementById('summary-quantity').textContent = `Quantidade: ${quantity}`;
    if (document.getElementById('summary-drinks')) {
      document.getElementById('summary-drinks').textContent = `Bebidas: ${drinksSummary}`;
    }
  }
  
  // Eventos para atualizar o resumo
  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  const crustSelect = document.querySelector('select[name="pizza-crust"]');
  if (crustSelect) crustSelect.addEventListener('change', updateOrderSummary);
  const borderSelect = document.querySelector('select[name="pizza-border"]');
  if (borderSelect) borderSelect.addEventListener('change', updateOrderSummary);
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) quantityInput.addEventListener('input', updateOrderSummary);
  // Listener para checkboxes de bebidas
  document.querySelectorAll('input[name="drink"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  
  // -----------------------------
  // Envio do Formulário de Pedido (Modal de Pedido)
  // -----------------------------
  let pedidoInfo = {};
  
  const orderForm = document.getElementById('modal-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation(); // Impede que o clique se propague e seja capturado pelo listener global
      
      pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.border = document.querySelector('select[name="pizza-border"]').value;
      pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity').value;
      pedidoInfo.adicionais = document.getElementById('modal-additional')?.value || 'Nenhum';
  
      // Se existir a seleção de bebidas, coletemos também
      const selectedDrinks = [];
      document.querySelectorAll('input[name="drink"]:checked').forEach(checkbox => {
        selectedDrinks.push(checkbox.value);
      });
      pedidoInfo.bebidas = selectedDrinks;
  
      closeOrderModal();
      openPaymentModal();
    });
  }
  
  // -----------------------------
  // Alternar Informações do Pix conforme método de pagamento selecionado
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
  
        const bairro = data.bairro;
        if (bairro && bairrosComTaxas.hasOwnProperty(bairro)) {
          const fee = bairrosComTaxas[bairro].toFixed(2);
          document.getElementById('delivery-fee').textContent = `Taxa de Entrega: R$ ${fee}`;
          pedidoInfo.deliveryFee = fee;
        } else {
          document.getElementById('delivery-fee').textContent = "Bairro fora da área de entrega.";
          pedidoInfo.deliveryFee = null;
        }
      })
      .catch(err => {
        console.error(err);
        document.getElementById('delivery-fee').textContent = "Erro ao buscar a localização.";
      });
  }
  
  // -----------------------------
  // Conversão de Graus para Radianos (para cálculo de distância)
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
  // Envio do Formulário de Pagamento (Atualizado)
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

      // Obter os dados de endereço
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
*Borda:* ${pedidoInfo.border}
*Quantidade:* ${pedidoInfo.quantidade} unidade(s)

*Observações:* ${pedidoInfo.adicionais}

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

      closePaymentModal();
      window.open(`https://wa.me/5581997333714?text=${encodeURIComponent(mensagem)}`, '_blank');
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
  
  // Carousel com pontos e arraste (touch/mouse)
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
