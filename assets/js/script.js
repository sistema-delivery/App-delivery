// Declaração global do carrinho para que todas as funções possam acessí‑lo
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
  // Função auxiliar para converter strings de preço ("6,00") para número (6.00)
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
    item.addEventListener('click', function () {
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

    let pizzaData = window.storeData &&
                    window.storeData.pizzas &&
                    window.storeData.pizzas[pizzaName]
                      ? window.storeData.pizzas[pizzaName]
                      : null;

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
      if (window.storeData && window.storeData.beverages && window.storeData.beverages[name] !== undefined) {
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

    // Atualiza UI
    document.getElementById('summary-size').textContent   = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
    document.getElementById('summary-crust').textContent  = `Tipo de Massa: ${crust}`;
    document.getElementById('summary-border').textContent = 
      `Bordas: Cheddar (${cheddarQuantity}×R$${cheddarPrice.toFixed(2)}) + ` +
      `Catupiry (${catupiryQuantity}×R$${catupiryPrice.toFixed(2)}) + ` +
      `Cream cheese (${creamQuantity}×R$${creamCheesePrice.toFixed(2)})`;
    document.getElementById('summary-quantity').textContent = 
      `Quantidade: ${totalPizzas}`;
    document.getElementById('summary-beverage').textContent = 
      `Bebidas: ${beveragesSummary.length>0? beveragesSummary.join(', ') : 'Nenhuma'}`;
    document.getElementById('summary-total').innerHTML = 
      `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
  }

  // Listeners para atualizar resumo
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
      pedidoInfo.nome            = document.getElementById('modal-pizza-name').textContent;
      pedidoInfo.tamanho         = document.querySelector('input[name="pizza-size"]:checked').value;
      pedidoInfo.crust           = document.querySelector('select[name="pizza-crust"]').value;
      pedidoInfo.borderCheddar   = document.getElementById('border-cheddar').value;
      pedidoInfo.borderCatupiry  = document.getElementById('border-catupiry').value;
      pedidoInfo.borderCreamCheese = document.getElementById('border-cream-cheese').value;
      pedidoInfo.quantidade      = document.getElementById('modal-pizza-quantity').value;

      const bebidas = [];
      document.querySelectorAll('.bebida-item').forEach(item => {
        const name  = item.querySelector('p').textContent;
        let price   = parsePrice(item.querySelector('.price').textContent.replace('R$', '').trim());
        if (window.storeData && window.storeData.beverages && window.storeData.beverages[name] !== undefined) {
          price = window.storeData.beverages[name];
        }
        const qty = parseInt(item.querySelector('.bebida-quantity').value) || 0;
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
      const bevText = pizza.bebidas?.length>0
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

  // ========================================
  // Eventos para método de pagamento e CEP
  // ========================================
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
  // Processamento do formulário de pagamento (com Pix atualizado)
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;

      if (metodo === 'Pix') {
        // Recalcula o total
        let totalPix = calcularTotalPedido() + (pedidoInfo.deliveryFee||0);

        fetch('https://meu-app-sooty.vercel.app/mp-pix', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ valor: Number(totalPix.toFixed(2)) })
        })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          let tx = data.pix?.transaction_data || data.transaction_data;
          if (!tx?.qr_code_base64) {
            alert("Não foi possível gerar Pix. Tente de novo.");
            return;
          }
          const pixInfoDiv = document.getElementById('pix-info');
          pixInfoDiv.innerHTML = `
            <p style="font-weight:bold; font-size:1.2rem; margin-bottom:10px;">
              Pagamento via Pix gerado! 
            </p>
            <p>Valor: R$ ${totalPix.toFixed(2)}</p>
            <img src="data:image/png;base64,${tx.qr_code_base64}" alt="QR Code Pix" style="max-width:200px; margin:10px auto; display:block;">
            <p style="font-weight:bold;">OU copie abaixo:</p>
            <textarea id="pix-payload-text" readonly style="width:100%;height:4rem;">
${tx.qr_code}
            </textarea>
            <button id="copy-payload-button" style="margin:10px auto; display:block;">
              Copiar Chave Pix
            </button>
            <p style="font-size:0.9rem;color:#555;">
              Após o pagamento, aguarde confirmação...
            </p>
          `;
          pixInfoDiv.style.display = 'block';
          paymentForm.querySelector('button[type="submit"]').disabled = true;
          document.getElementById('copy-payload-button')
            .addEventListener('click', () => {
              navigator.clipboard.writeText(tx.qr_code)
                .then(()=>alert('Chave Pix copiada!'));
            });

          // Polling
          const polling = setInterval(() => {
            fetch(`https://meu-app-sooty.vercel.app/mp-pix/status/${data.transaction_id}`)
              .then(r=>r.json())
              .then(({pago})=>{
                if (pago) {
                  clearInterval(polling);
 // 1) Limpa conteúdo antigo
  pixInfoDiv.textContent = '';

 // 2) Cria elemento de confirmação
 const confirmMsg = document.createElement('p');
 confirmMsg.style.cssText = 'font-weight:bold; font-size:1.2rem; margin-bottom:10px;';
 confirmMsg.textContent = 'Pagamento confirmado! 🎉';
 pixInfoDiv.appendChild(confirmMsg);

 // 3) Cria botão via DOM
 const btnWa = document.createElement('button');
 btnWa.type = 'button';
 btnWa.id = 'btn-whatsapp';
 btnWa.style.cssText = 'display:block; margin:1rem auto; padding:0.75rem 1.5rem; background:#25D366; color:#fff; border:none; border-radius:0.25rem; cursor:pointer;';
 btnWa.textContent = 'Ir para WhatsApp';
 pixInfoDiv.appendChild(btnWa);

 // 4) Atrela o listener imediatamente
 btnWa.addEventListener('click', () => {
    // Dados de endereço
   const rua    = document.getElementById('rua').value;
   const bairro = document.getElementById('bairro').value;
   const cidade = document.getElementById('cidade').value;
   const numero = document.getElementById('numero').value;
   // Data/Hora
   const now  = new Date();
   const dataPt = now.toLocaleDateString('pt-BR');
   const hora   = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
   // Bebidas
   const bebidasText = pedidoInfo.bebida.length > 0
      ? pedidoInfo.bebida.map(b=>`${b.name} x${b.quantity} – R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ')
     : 'Nenhuma';
   const taxa = pedidoInfo.deliveryFee
     ? `*Taxa de Entrega:* R$ ${pedidoInfo.deliveryFee}`
     : '*Taxa de Entrega:* R$ 0,00';
   // Mensagem
   const msg = `
 *Pedido de Pizza - Pizza Express*
 ------------------------------------
 *Pizza:* ${pedidoInfo.nome}
 *Tamanho:* ${pedidoInfo.tamanho}
 *Tipos de Massa:* ${pedidoInfo.crust}
 *Bordas:* Cheddar (${pedidoInfo.borderCheddar} un.) + Catupiry (${pedidoInfo.borderCatupiry} un.) + Cream cheese (${pedidoInfo.borderCreamCheese} un.)
 *Quantidade:* ${pedidoInfo.quantidade} unidade(s)
 *Bebida(s):* ${bebidasText}
 *Total do Pedido:* R$ ${(calcularTotalPedido() + pedidoInfo.deliveryFee).toFixed(2)}
 ------------------------------------
 *Status do Pagamento:* Pagamento confirmado! 🎉
 *Forma de Pagamento:* Pix (Chave: ${tx.qr_code})
 ${taxa}
 ------------------------------------
 *Endereço de Entrega:*
 *Rua:* ${rua}
 *Bairro:* ${bairro}
 *Cidade:* ${cidade}
 *Número:* ${numero}

 *Data do Pedido:* ${dataPt}
 *Hora:* ${hora}

 Agradecemos o seu pedido!
 Pizza Express - Sabor que chega rápido!
   `.trim();
   window.open(`https://wa.me/5581997333714?text=${encodeURIComponent(msg)}`, '_blank');
 });
                }
              });
          }, 5000);

        })
        .catch(err => {
          console.error(err);
          alert("Erro ao criar pagamento Pix. Tente novamente.");
        });

      } else {
        // Fluxo não‑Pix (Dinheiro/Cartão na entrega)
        const status = 'Pagamento na entrega';
        const chavePix = '708.276.084-11';
        const now = new Date();
        const data = now.toLocaleDateString('pt-BR');
        const hora = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        const taxa = pedidoInfo.deliveryFee
          ? `*Taxa de Entrega:* R$ ${pedidoInfo.deliveryFee}`
          : '*Taxa de Entrega:* R$ 0,00';
        const rua    = document.getElementById('rua').value;
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
*Bebida(s):* ${pedidoInfo.bebida.length>0 ? pedidoInfo.bebida.map(b=>`${b.name} x${b.quantity} – R$ ${(b.price*b.quantity).toFixed(2)}`).join(', ') : 'Nenhuma'}
*Total do Pedido:* R$ ${pedidoInfo.total.toFixed(2)}
------------------------------------
*Status do Pagamento:* ${status}
*Forma de Pagamento:* Não Pix (Chave: ${chavePix})
${taxa}
------------------------------------
*Endereço de Entrega:*
*Rua:* ${rua}
*Bairro:* ${bairro}
*Cidade:* ${cidade}
*Número:* ${numero}

*Data do Pedido:* ${data}
*Hora:* ${hora}

Agradecemos o seu pedido!
Pizza Express - Sabor que chega rápido!
        `.trim();

        closePaymentModal();
        window.open(`https://wa.me/5581997333714?text=${encodeURIComponent(mensagem)}`, '_blank');
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
