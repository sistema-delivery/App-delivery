// Declaração global do carrinho para que todas as funções possam acessá-lo
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// Função centralizada para calcular o total dos itens do pedido (sem a taxa de entrega)
function calcularTotalPedido() {
  let total = 0;
  carrinho.forEach((pizza) => {
    // Preço do tamanho
    let sizePrice = 0;
    if (
      window.storeData &&
      window.storeData.pizzas &&
      window.storeData.pizzas[pizza.nome] &&
      window.storeData.pizzas[pizza.nome].sizes
    ) {
      sizePrice = window.storeData.pizzas[pizza.nome].sizes[pizza.tamanho] || 0;
    } else {
      sizePrice = pizza.tamanho === "Pequena"
        ? 10
        : pizza.tamanho === "Média"
          ? 15
          : 20;
    }
    // Para as bordas, se houver dados no storeData, usa os preços definidos
    let pizzaData = (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizza.nome])
                      ? window.storeData.pizzas[pizza.nome]
                      : null;
    const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
    const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;

    const bordasCost = (pizza.bordas.cheddar * cheddarPrice) +
                       (pizza.bordas.catupiry * catupiryPrice) +
                       (pizza.bordas.cream * creamCheesePrice);

    // Bebidas: tenta usar os valores do storeData.beverages se disponíveis
    const bebidasCost = pizza.bebidas
      ? pizza.bebidas.reduce((acc, bev) => {
          const priceFromStore = (window.storeData &&
                                  window.storeData.beverages &&
                                  window.storeData.beverages[bev.name] !== undefined)
                                  ? window.storeData.beverages[bev.name]
                                  : bev.price;
          return acc + (priceFromStore * bev.quantity);
        }, 0)
      : 0;

    const subtotal = (sizePrice * pizza.quantidade) + bordasCost + bebidasCost;
    total += subtotal;
  });
  return total;
}

document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para converter strings de preço ("6,00") para formato numérico ("6.00")
  function parsePrice(str) {
    return parseFloat(str.replace(",", "."));
  }

  // Incrementa o valor de um input (bordas)
  window.incrementField = function(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
      let current = parseInt(input.value) || 0;
      input.value = current + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  // Incrementa o valor do input imediatamente anterior (bebidas)
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

  // ====================================
  // Atualiza o Resumo do Pedido (Modal)
  // ====================================
  function updateOrderSummary() {
    /* ... sua lógica de resumo original permanece inalterada ... */
  }

  document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
  const crustSelect = document.querySelector('select[name="pizza-crust"]');
  if (crustSelect) crustSelect.addEventListener('change', updateOrderSummary);
  const quantityInput = document.getElementById('modal-pizza-quantity');
  if (quantityInput) quantityInput.addEventListener('input', updateOrderSummary);
  document.getElementById('border-cheddar').addEventListener('input', updateOrderSummary);
  document.getElementById('border-catupiry').addEventListener('input', updateOrderSummary);
  document.getElementById('border-cream-cheese').addEventListener('input', updateOrderSummary);
  document.querySelectorAll('.bebida-quantity').forEach(input => input.addEventListener('input', updateOrderSummary));

  // ========================================
  // Processamento do formulário de pedido
  // ========================================
  const orderForm = document.getElementById('modal-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      /* ... coleta de pedido original ... */
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
    /* ... lógica original de resumo de pagamento ... */
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
    /* ... lookup CEP original ... */
  });

  // ========================================
  // Processamento do formulário de pagamento
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;

      if (metodo === 'Pix') {
        // Fluxo para Pagamento via Pix:
        fetch('https://meu-app-sooty.vercel.app/mp-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor: Number(pedidoInfo.total.toFixed(2)) })
        })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        })
        .then(data => {
          // recupera transaction_data
          const tx = data.pix?.transaction_data ?? data.transaction_data;
          if (!tx?.qr_code_base64 || !tx?.qr_code) {
            alert("Não foi possível gerar o Pix. Tente novamente.");
            return;
          }

          const pixInfoDiv = document.getElementById('pix-info');
          pixInfoDiv.innerHTML = `
            <p style="font-weight:bold; font-size:1.1rem; margin-bottom:0.5rem;">
              Pagamento via Pix (R$ ${pedidoInfo.total.toFixed(2)}) gerado com sucesso!
            </p>
            <img 
              src="data:image/png;base64,${tx.qr_code_base64}" 
              alt="QR Code Pix" 
              style="max-width:200px; display:block; margin:0 auto 1rem;"
            />
            <textarea 
              id="raw-pix-code" 
              readonly 
              style="width:100%; height:4rem; font-family:monospace; padding:0.5rem; margin-bottom:0.5rem;"
            >${tx.qr_code}</textarea>
            <button 
              type="button" 
              id="copy-pix-code" 
              style="padding:0.6rem; width:100%;"
            >Copiar código Pix</button>
          `;
          pixInfoDiv.style.display = 'block';
          // desabilita botão submit para evitar duplicatas
          paymentForm.querySelector('button[type="submit"]').disabled = true;

          // adiciona listener de cópia
          document.getElementById('copy-pix-code').addEventListener('click', () => {
            const raw = document.getElementById('raw-pix-code');
            raw.select();
            document.execCommand('copy');
            alert('Código Pix copiado!');
          });
        })
        .catch(err => {
          console.error("Erro Pix:", err);
          alert("Erro ao criar pagamento via Pix. Tente novamente.");
        });

      } else {
        // Fluxo para outras formas de pagamento (mantém o fluxo original via WhatsApp)
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
*Bebida(s):* ${pedidoInfo.bebida.length > 0 ? pedidoInfo.bebida.map(b => `${b.name} x${b.quantity} - R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ') : 'Nenhuma'}
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
      bebidas  // Guarda as bebidas selecionadas
    };

    carrinho.push(pizza);
    atualizarLocalStorage();
    alert("Pizza adicionada ao carrinho!");
    closeOrderModal();
    atualizarCarrinhoUI();
  };

  // Atualiza a interface do carrinho (lista de itens e total)
  function atualizarCarrinhoUI() {
    const lista = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");
    lista.innerHTML = "";
    
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
      let pizzaData = (window.storeData && window.storeData.pizzas && window.storeData.pizzas[pizza.nome])
                        ? window.storeData.pizzas[pizza.nome]
                        : null;
      const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
      const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
      const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
      
      const bordasCost = (pizza.bordas.cheddar * cheddarPrice) +
                          (pizza.bordas.catupiry * catupiryPrice) +
                          (pizza.bordas.cream * creamCheesePrice);
      const bebidasCost = pizza.bebidas
        ? pizza.bebidas.reduce((acc, bev) => acc + (bev.price * bev.quantity), 0)
        : 0;
      const subtotal = (sizePrice * pizza.quantidade) + bordasCost + bebidasCost;
      
      let bebidaText = "";
      if (pizza.bebidas && pizza.bebidas.length > 0) {
        bebidaText = " - Bebidas: " + pizza.bebidas.map(b => `${b.name} x${b.quantity}`).join(', ');
      }
      
      const item = document.createElement("li");
      item.innerText = `Pizza: ${pizza.nome} - ${pizza.tamanho}, ${pizza.massa}, Qtde: ${pizza.quantidade}${bebidaText} - R$ ${subtotal.toFixed(2)}`;
      lista.appendChild(item);
    });
    
    totalEl.innerText = calcularTotalPedido().toFixed(2);
  }

  // ======================================================
  // Funções alteradas para exibição do carrinho como modal
  // ======================================================
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
    updatePaymentSummaryCart();  // Atualiza o resumo do pagamento unificando os cálculos
    openPaymentModal();
  };

  // Atualiza a interface do carrinho ao carregar a página
  atualizarCarrinhoUI();
});
