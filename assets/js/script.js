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

// Helper: formata data e hora para “DD/MM/YYYY” e “HH:MM”
function formatDateTime(dateObj) {
  const pad = n => String(n).padStart(2, '0');
  return {
    date: `${pad(dateObj.getDate())}/${pad(dateObj.getMonth()+1)}/${dateObj.getFullYear()}`,
    time: `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`
  };
}

// Eventos após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para converter strings de preço ("6,00") para número
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
    document.getElementById('modal-pizza-name').textContent = pizzaName;
    if (window.storeData?.pizzas?.[pizzaName]) {
      const pizzaData = window.storeData.pizzas[pizzaName];
      document.getElementById('modal-pizza-description').textContent = pizzaData.description;
      document.querySelectorAll('.pizza-size-section label').forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio && pizzaData.sizes[radio.value]) {
          label.querySelector('.price-size').textContent = pizzaData.sizes[radio.value].toFixed(2);
        }
      });
    }
    document.getElementById('order-modal').style.display = 'block';
  }

  function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
    document.getElementById('modal-order-form').reset();
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
    document.getElementById('modal-payment-form').reset();
    document.getElementById('pix-info').style.display = 'none';
  }

  // Fecha modais ao clicar fora ou nos botões
  window.addEventListener('click', e => {
    if (e.target.id === 'order-modal') closeOrderModal();
    if (e.target.id === 'payment-modal') closePaymentModal();
  });
  document.querySelectorAll('.modal .close, .modal .back').forEach(btn =>
    btn.addEventListener('click', () => {
      closeOrderModal();
      closePaymentModal();
    })
  );
  document.querySelectorAll('.horizontal-scroll .item').forEach(item =>
    item.addEventListener('click', () => openOrderModal(item.querySelector('p').textContent))
  );

  // ====================================
  // Atualiza o Resumo do Pedido (Modal)
  // ====================================
  function updateOrderSummary() {
    const pizzaName = document.getElementById('modal-pizza-name').textContent;
    const size      = document.querySelector('input[name="pizza-size"]:checked')?.value || '';
    const crust     = document.querySelector('select[name="pizza-crust"]').value;
    const qty       = parseInt(document.getElementById('modal-pizza-quantity').value) || 1;
    const cheddarQ  = parseInt(document.getElementById('border-cheddar').value) || 0;
    const catupiryQ = parseInt(document.getElementById('border-catupiry').value) || 0;
    const creamQ    = parseInt(document.getElementById('border-cream-cheese').value) || 0;

    let sizePrice = window.storeData?.pizzas?.[pizzaName]?.sizes?.[size] || (size==='Pequena'?10: size==='Média'?15:20);
    let pizzaData = window.storeData?.pizzas?.[pizzaName] || null;
    let cheddarPrice = pizzaData?.borders.Cheddar || 5, catupiryPrice = pizzaData?.borders.Catupiry || 6, creamPrice = pizzaData?.borders["Cream cheese"] || 3.5;
    let pizzasCost = sizePrice * qty + cheddarQ*cheddarPrice + catupiryQ*catupiryPrice + creamQ*creamPrice;

    let beveragesCost = 0, bevSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const name = item.querySelector('p').textContent;
      let price   = parsePrice(item.querySelector('.price').textContent);
      if (window.storeData?.beverages?.[name]!==undefined) price = window.storeData.beverages[name];
      const bq    = parseInt(item.querySelector('.bebida-quantity').value) || 0;
      if (bq>0) {
        beveragesCost += price * bq;
        bevSummary.push(`${name} x${bq} - R$ ${(price*bq).toFixed(2)}`);
      }
    });

    pedidoInfo.baseTotal = pizzasCost + beveragesCost;
    pedidoInfo.total     = pedidoInfo.baseTotal + (pedidoInfo.deliveryFee||0);

    // Atualiza no DOM...
    document.getElementById('summary-size').textContent   = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
    document.getElementById('summary-crust').textContent  = `Massa: ${crust}`;
    document.getElementById('summary-border').textContent = `Bordas: Cheddar ${cheddarQ} × R$ ${cheddarPrice.toFixed(2)}, Catupiry ${catupiryQ} × R$ ${catupiryPrice.toFixed(2)}, Cream ${creamQ} × R$ ${creamPrice.toFixed(2)}`;
    document.getElementById('summary-quantity').textContent = `Quantidade: ${qty}`;
    document.getElementById('summary-beverage').textContent  = bevSummary.length? bevSummary.join(', '): 'Nenhuma';
    document.getElementById('summary-total').innerHTML       = `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
  }

  ['change','input'].forEach(evt => {
    document.querySelectorAll('input[name="pizza-size"], select[name="pizza-crust"], #modal-pizza-quantity, #border-cheddar, #border-catupiry, #border-cream-cheese, .bebida-quantity')
      .forEach(el => el.addEventListener(evt, updateOrderSummary));
  });

  // ========================================
  // Processamento do formulário de pedido
  // ========================================
  document.getElementById('modal-order-form').addEventListener('submit', e => {
    e.preventDefault();
    pedidoInfo.nome  = document.getElementById('modal-pizza-name').textContent;
    pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
    pedidoInfo.crust   = document.querySelector('select[name="pizza-crust"]').value;
    pedidoInfo.borderCheddar    = parseInt(document.getElementById('border-cheddar').value);
    pedidoInfo.borderCatupiry   = parseInt(document.getElementById('border-catupiry').value);
    pedidoInfo.borderCreamCheese= parseInt(document.getElementById('border-cream-cheese').value);
    pedidoInfo.quantidade       = parseInt(document.getElementById('modal-pizza-quantity').value);
    pedidoInfo.adicionais       = document.getElementById('modal-additional').value || 'Nenhum';

    // Bebidas
    pedidoInfo.bebida = Array.from(document.querySelectorAll('.bebida-item'))
      .map(item => {
        const name = item.querySelector('p').textContent;
        let price = parsePrice(item.querySelector('.price').textContent);
        if (window.storeData?.beverages?.[name]!==undefined) price = window.storeData.beverages[name];
        const qty = parseInt(item.querySelector('.bebida-quantity').value)||0;
        return qty>0 ? { name, price, quantity: qty } : null;
      })
      .filter(x=>x);

    updateOrderSummary();
    closeOrderModal();
    openPaymentModal();
    updatePaymentSummaryCart();
  });

  // ========================================
  // Atualiza o resumo de pagamento do modal
  // ========================================
  function updatePaymentSummaryCart() {
    const el = document.getElementById('payment-summary') || (() => {
      const div = document.createElement('div');
      div.id = 'payment-summary';
      document.getElementById('delivery-fee').after(div);
      return div;
    })();
    let html = '';
    carrinho.forEach((pizza,i) => {
      const sub = (window.storeData?.pizzas?.[pizza.nome]?.sizes?.[pizza.tamanho]||0)*pizza.quantidade;
      html += `<p><strong>Pizza ${i+1}:</strong> ${pizza.nome} — ${pizza.tamanho}, Massa ${pizza.massa}, Qtde ${pizza.quantidade}, R$ ${sub.toFixed(2)}</p>`;
    });
    const total  = calcularTotalPedido();
    const fee    = pedidoInfo.deliveryFee||0;
    html += `<p><strong>Taxa de Entrega:</strong> R$ ${fee.toFixed(2)}</p>`;
    html += `<p><strong>Total:</strong> R$ ${(total+fee).toFixed(2)}</p>`;
    el.innerHTML = html;
  }

  // ========================================
  // CEP e entrega
  // ========================================
  document.querySelectorAll('input[name="payment-method"]').forEach(r=>{
    r.addEventListener('change', () => {
      document.getElementById('pix-info').style.display = (r.value==='Pix'? 'block':'none');
    });
  });
  document.getElementById('cep').addEventListener('blur', function(){
    const cep = this.value.replace(/\D/g,'');
    if(cep.length!==8) {
      document.getElementById('delivery-fee').textContent = "CEP inválido";
      return;
    }
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(r=>r.json())
      .then(data=>{
        if(data.erro) {
          document.getElementById('delivery-fee').textContent = "CEP não encontrado";
          return;
        }
        ['rua','bairro','cidade','estado'].forEach(id=>{
          document.getElementById(id).value = data[id==='estado'?'uf':id]||'';
        });
        const cityKey = `${data.localidade} (${data.uf})`;
        const fee = window.storeData?.deliveryFees?.[cityKey]?.[data.bairro];
        if(fee!==undefined) {
          pedidoInfo.deliveryFee = parseFloat(fee);
          document.getElementById('delivery-fee').textContent = `Taxa: R$ ${fee.toFixed(2)}`;
        } else {
          pedidoInfo.deliveryFee = 0;
          document.getElementById('delivery-fee').textContent = "Fora de área";
        }
        updateOrderSummary();
        if(document.getElementById('payment-modal').style.display==='block') updatePaymentSummaryCart();
      })
      .catch(()=> document.getElementById('delivery-fee').textContent = "Erro no CEP");
  });

  // ========================================
  // Processamento do formulário de pagamento (somente PIX)
  // ========================================
  const paymentForm = document.getElementById('modal-payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const metodo = document.querySelector('input[name="payment-method"]:checked').value;
      if (metodo !== 'Pix') {
        alert('Outros métodos em breve!');
        return;
      }
      const totalItens = calcularTotalPedido();
      const fee        = pedidoInfo.deliveryFee || 0;
      const valorTotal = totalItens + fee;
      fetch('https://meu-app-sooty.vercel.app/mp-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: Number(valorTotal.toFixed(2)) })
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const tx = data.pix?.transaction_data || data.transaction_data;
        if (!tx?.qr_code_base64) throw new Error('PIX inválido');
        const pixDiv = document.getElementById('pix-info');
        pixDiv.innerHTML = `
          <p style="font-weight:bold;font-size:1.2rem;margin-bottom:10px;">
            Pix — R$ ${valorTotal.toFixed(2)}
          </p>
          <img src="data:image/png;base64,${tx.qr_code_base64}"
               style="max-width:200px;display:block;margin:0 auto 10px;">
          <textarea readonly style="width:100%;height:4rem;padding:0.5rem;">${tx.qr_code}</textarea>
          <button id="copy-pix" style="display:block;margin:10px auto;padding:.5rem 1rem;
                 background:#32cd32;color:#fff;border:none;border-radius:.25rem;cursor:pointer;">
            COPIAR PIX
          </button>
        `;
        pixDiv.style.display = 'block';
        paymentForm.querySelector('button[type="submit"]').disabled = true;
        document.getElementById('copy-pix').addEventListener('click', () => {
          navigator.clipboard.writeText(tx.qr_code).then(
            ()=>alert('Copiado!'),
            ()=>alert('Falha ao copiar')
          );
        });

        const transactionId = data.transaction_id;
        const interval = setInterval(() => {
          fetch(`https://meu-app-sooty.vercel.app/mp-pix/status/${transactionId}`)
            .then(r=>r.json())
            .then(({ pago }) => {
              if (pago) {
                clearInterval(interval);
                pixDiv.innerHTML = `
                  <p style="font-weight:bold;font-size:1.2rem;margin-bottom:10px;">
                    Pagamento confirmado! 🎉
                  </p>
                  <button id="whatsapp-btn" style="display:block;margin:1rem auto;
                         padding:.75rem 1.5rem;background:#25D366;color:#fff;border:none;
                         border-radius:.25rem;cursor:pointer;">
                    Ir para WhatsApp
                  </button>
                `;
                document.getElementById('whatsapp-btn').addEventListener('click', () => {
                  const { date, time } = formatDateTime(new Date());
                  const lines = [
                    '*Pedido de Pizza - Pizza Express*',
                    '------------------------------------',
                    `*Pizza:* ${pedidoInfo.nome}`,
                    `*Tamanho:* ${pedidoInfo.tamanho}`,
                    `*Quantidade:* ${pedidoInfo.quantidade} unidade(s)`,
                    `*Taxa de Entrega:* R$ ${fee.toFixed(2)}`,
                    '------------------------------------',
                    `*Total:* R$ ${valorTotal.toFixed(2)}`,
                    '*Pagamento:* Pix (PAGO)',
                    '------------------------------------',
                    '*Endereço:*',
                    `Rua: ${pedidoInfo.rua}`,
                    `Bairro: ${pedidoInfo.bairro}`,
                    `Cidade: ${pedidoInfo.cidade}`,
                    `Número: ${pedidoInfo.numero}`,
                    `Data: ${date}`,
                    `Hora: ${time}`,
                    'Obrigado! Pizza Express - Sabor que chega rápido!'
                  ];
                  window.open(
                    `https://wa.me/5581997333714?text=${encodeURIComponent(lines.join('\n'))}`,
                    '_blank'
                  );
                });
              }
            })
            .catch(console.error);
        }, 5000);
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao gerar PIX');
      });
    });
  }

  // … resto do script original (scroll, carousel, carrinho) inalterado …

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
