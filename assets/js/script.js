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
      sizePrice = pizza.tamanho === "Pequena" ? 10 : pizza.tamanho === "Média" ? 15 : 20;
    }

    // Preço das bordas
    let pizzaData = window.storeData?.pizzas?.[pizza.nome] || null;
    const cheddarPrice = pizzaData ? pizzaData.borders["Cheddar"] : 5.00;
    const catupiryPrice = pizzaData ? pizzaData.borders["Catupiry"] : 6.00;
    const creamCheesePrice = pizzaData ? pizzaData.borders["Cream cheese"] : 3.50;
    const bordasCost =
      pizza.bordas.cheddar * cheddarPrice +
      pizza.bordas.catupiry * catupiryPrice +
      pizza.bordas.cream * creamCheesePrice;

    // Preço das bebidas
    const bebidasCost = pizza.bebidas
      ? pizza.bebidas.reduce((acc, bev) => {
          const priceFromStore = window.storeData?.beverages?.[bev.name] ?? bev.price;
          return acc + priceFromStore * bev.quantity;
        }, 0)
      : 0;

    total += sizePrice * pizza.quantidade + bordasCost + bebidasCost;
  });
  return total;
}

document.addEventListener('DOMContentLoaded', () => {
  // Converte "6,00" → 6.00
  function parsePrice(str) {
    return parseFloat(str.replace(',', '.'));
  }

  // Funções auxiliares de incremento
  window.incrementField = (fieldId) => {
    const input = document.getElementById(fieldId);
    if (input) {
      input.value = (parseInt(input.value) || 0) + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  window.incrementSibling = (button) => {
    const input = button.previousElementSibling;
    if (input && input.tagName === 'INPUT') {
      input.value = (parseInt(input.value) || 0) + 1;
      input.dispatchEvent(new Event('input'));
    }
  };

  // Menu mobile
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  const defaultCity = "Paulista (PE)";
  let pedidoInfo = {};

  // ======= Funções de Modal =======
  function openOrderModal(pizzaName) {
    const modal = document.getElementById('order-modal');
    const title = document.getElementById('modal-pizza-name');
    if (modal && title) {
      title.textContent = pizzaName;
      modal.style.display = 'block';
    }
    const pizzaData = window.storeData?.pizzas?.[pizzaName];
    if (pizzaData) {
      const desc = document.getElementById('modal-pizza-description');
      if (desc) desc.textContent = pizzaData.description;
      document.querySelectorAll('.pizza-size-section label').forEach(label => {
        const r = label.querySelector('input[type="radio"]');
        const pd = label.querySelector('.price-size');
        if (r && pd && pizzaData.sizes[r.value] != null) {
          pd.textContent = pizzaData.sizes[r.value].toFixed(2);
        }
      });
    }
  }

  function closeOrderModal() {
    const modal = document.getElementById('order-modal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('modal-order-form');
    if (form) form.reset();
    ['border-cheddar', 'border-catupiry', 'border-cream-cheese'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 0;
    });
    document.querySelectorAll('.bebida-quantity').forEach(i => i.value = 0);
  }

  function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'block';
  }

  function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('modal-payment-form');
    if (form) form.reset();
    const pixInfo = document.getElementById('pix-info');
    if (pixInfo) pixInfo.style.display = 'none';
  }

  window.addEventListener('click', e => {
    if (e.target === document.getElementById('order-modal')) closeOrderModal();
    if (e.target === document.getElementById('payment-modal')) closePaymentModal();
  });

  document.querySelectorAll('.modal .close').forEach(btn =>
    btn.addEventListener('click', () => {
      closeOrderModal();
      closePaymentModal();
    })
  );

  document.querySelectorAll('.modal .back').forEach(btn =>
    btn.addEventListener('click', () => {
      const m = btn.closest('.modal');
      if (m) m.style.display = 'none';
    })
  );

  // Abrir pedido ao clicar em uma pizza
  document.querySelectorAll('.horizontal-scroll .item').forEach(item =>
    item.addEventListener('click', () => {
      const name = item.querySelector('p')?.textContent;
      if (name) openOrderModal(name);
    })
  );

  // ======= Atualiza Resumo do Pedido =======
  function updateOrderSummary() {
    const name = document.getElementById('modal-pizza-name')?.textContent.trim() || '';
    const size = document.querySelector('input[name="pizza-size"]:checked')?.value || '';
    const crust = document.querySelector('select[name="pizza-crust"]')?.value || '';
    const qty = parseInt(document.getElementById('modal-pizza-quantity')?.value) || 1;
    const ch = parseInt(document.getElementById('border-cheddar')?.value) || 0;
    const ca = parseInt(document.getElementById('border-catupiry')?.value) || 0;
    const cr = parseInt(document.getElementById('border-cream-cheese')?.value) || 0;

    const sizePrice = window.storeData?.pizzas?.[name]?.sizes?.[size] != null
      ? window.storeData.pizzas[name].sizes[size]
      : (size === 'Pequena' ? 10 : size === 'Média' ? 15 : 20);

    const pData = window.storeData?.pizzas?.[name];
    const pCh = pData?.borders?.Cheddar ?? 5;
    const pCa = pData?.borders?.Catupiry ?? 6;
    const pCr = pData?.borders?.['Cream cheese'] ?? 3.5;

    const pizzasCost = sizePrice * qty + ch * pCh + ca * pCa + cr * pCr;

    let beveragesCost = 0;
    let beveragesSummary = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const nm = item.querySelector('p')?.textContent;
      let pr = parsePrice(item.querySelector('.price')?.textContent.replace('R$', '').trim() || '0');
      if (nm && window.storeData?.beverages?.[nm] != null) pr = window.storeData.beverages[nm];
      const q = parseInt(item.querySelector('.bebida-quantity')?.value) || 0;
      if (q > 0) {
        beveragesCost += pr * q;
        beveragesSummary.push(`${nm} x${q} - R$ ${(pr * q).toFixed(2)}`);
      }
    });

    pedidoInfo.baseTotal = pizzasCost + beveragesCost;
    const fee = parseFloat(pedidoInfo.deliveryFee) || 0;
    pedidoInfo.total = pedidoInfo.baseTotal + fee;

    if (document.getElementById('order-summary')) {
      document.getElementById('summary-size').textContent = `Tamanho: ${size} - R$ ${sizePrice.toFixed(2)}`;
      document.getElementById('summary-crust').textContent = `Massa: ${crust}`;
      document.getElementById('summary-border').textContent =
        `Bordas: Cheddar(${ch}) + Catupiry(${ca}) + Cream(${cr})`;
      document.getElementById('summary-quantity').textContent = `Quantidade: ${qty}`;
      document.getElementById('summary-beverage').textContent =
        beveragesSummary.length ? beveragesSummary.join(', ') : 'Nenhuma';
      document.getElementById('summary-total').innerHTML =
        `<strong>Total: R$ ${pedidoInfo.total.toFixed(2)}</strong>`;
    }
  }

  // Liga os listeners de resumo
  document.querySelectorAll('input[name="pizza-size"]').forEach(i => i.addEventListener('change', updateOrderSummary));
  document.querySelector('select[name="pizza-crust"]')?.addEventListener('change', updateOrderSummary);
  document.getElementById('modal-pizza-quantity')?.addEventListener('input', updateOrderSummary);
  ['border-cheddar','border-catupiry','border-cream-cheese'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateOrderSummary);
  });
  document.querySelectorAll('.bebida-quantity').forEach(i => i.addEventListener('input', updateOrderSummary));

  // ======= Processamento do Formulário de Pedido =======
  document.getElementById('modal-order-form')?.addEventListener('submit', e => {
    e.preventDefault();
    pedidoInfo.nome = document.getElementById('modal-pizza-name')?.textContent || '';
    pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked')?.value || '';
    pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]')?.value || '';
    pedidoInfo.borderCheddar = document.getElementById('border-cheddar')?.value || 0;
    pedidoInfo.borderCatupiry = document.getElementById('border-catupiry')?.value || 0;
    pedidoInfo.borderCreamCheese = document.getElementById('border-cream-cheese')?.value || 0;
    pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity')?.value || 1;
    pedidoInfo.adicionais = document.getElementById('modal-additional')?.value || 'Nenhum';

    let bevArr = [];
    document.querySelectorAll('.bebida-item').forEach(item => {
      const nm = item.querySelector('p')?.textContent;
      let pr = parsePrice(item.querySelector('.price')?.textContent.replace('R$', '').trim() || '0');
      if (nm && window.storeData?.beverages?.[nm] != null) pr = window.storeData.beverages[nm];
      const q = parseInt(item.querySelector('.bebida-quantity')?.value) || 0;
      if (q > 0) bevArr.push({ name: nm, price: pr, quantity: q });
    });
    pedidoInfo.bebida = bevArr;

    updateOrderSummary();
    closeOrderModal();
    openPaymentModal();
    updatePaymentSummaryCart();
  });

  // ======= Resumo de Pagamento =======
  function updatePaymentSummaryCart() {
    let div = document.getElementById('payment-summary');
    if (!div) {
      div = document.createElement('div');
      div.id = 'payment-summary';
      const feeEl = document.getElementById('delivery-fee');
      feeEl?.parentNode.insertBefore(div, feeEl.nextSibling);
    }
    let html = '';
    carrinho.forEach((p, i) => {
      const sp = window.storeData?.pizzas?.[p.nome]?.sizes?.[p.tamanho] ??
                 (p.tamanho === 'Pequena' ? 10 : p.tamanho === 'Média' ? 15 : 20);
      const pd = window.storeData?.pizzas?.[p.nome];
      const cP = pd?.borders?.Cheddar ?? 5;
      const cCa = pd?.borders?.Catupiry ?? 6;
      const cCr = pd?.borders?.['Cream cheese'] ?? 3.5;
      const bordasCost = p.bordas.cheddar * cP + p.bordas.catupiry * cCa + p.bordas.cream * cCr;
      const bebidasCost = p.bebidas.reduce((s, b) => s + b.price * b.quantity, 0);
      const sub = sp * p.quantidade + bordasCost + bebidasCost;
      html += `<p><strong>Pizza ${i+1}:</strong> ${p.nome} (${p.tamanho}), qtd ${p.quantidade} — R$ ${sub.toFixed(2)}</p>`;
    });
    const itens = calcularTotalPedido();
    const fee = parseFloat(pedidoInfo.deliveryFee) || 0;
    html += `<p><strong>Taxa de entrega:</strong> R$ ${fee.toFixed(2)}</p>`;
    html += `<p><strong>Total:</strong> R$ ${(itens + fee).toFixed(2)}</p>`;
    div.innerHTML = html;
  }

  // ======= Método de Pagamento & CEP =======
  document.querySelectorAll('input[name="payment-method"]').forEach(radio =>
    radio.addEventListener('change', () => {
      const pixInfo = document.getElementById('pix-info');
      if (pixInfo) pixInfo.style.display = radio.value === 'Pix' ? 'block' : 'none';
    })
  );

  const cepInput = document.getElementById('cep');
  if (cepInput) {
    cepInput.addEventListener('blur', function() {
      const c = this.value.replace(/\D/g, '');
      if (c.length !== 8) {
        document.getElementById('delivery-fee').textContent = 'CEP inválido. Insira 8 dígitos.';
        return;
      }
      lookupAddressByCEP(c);
    });
  }
  function lookupAddressByCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          document.getElementById('delivery-fee').textContent = 'CEP não encontrado.';
          return;
        }
        ['logradouro','bairro','localidade','uf'].forEach(key => {
          const el = document.getElementById(key === 'localidade' ? 'cidade' : key);
          if (el) el.value = data[key] || '';
        });
        const cityKey = data.localidade && data.uf
          ? `${data.localidade} (${data.uf})`
          : defaultCity;
        const fee = window.storeData?.deliveryFees?.[cityKey]?.[data.bairro];
        const feeEl = document.getElementById('delivery-fee');
        if (fee != null) {
          feeEl.textContent = `Taxa de Entrega: R$ ${fee.toFixed(2)}`;
          pedidoInfo.deliveryFee = fee;
        } else {
          feeEl.textContent = 'Bairro fora da área de entrega.';
          pedidoInfo.deliveryFee = 0;
        }
        updatePaymentSummaryCart();
      })
      .catch(() => {
        document.getElementById('delivery-fee').textContent = 'Erro ao buscar CEP.';
      });
  }

  // ======= Processamento do Pagamento =======
  document.getElementById('modal-payment-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const metodo = document.querySelector('input[name="payment-method"]:checked')?.value;
    const total = calcularTotalPedido() + (parseFloat(pedidoInfo.deliveryFee) || 0);

    if (metodo === 'Pix') {
      fetch('https://meu-app-sooty.vercel.app/mp-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: Number(total.toFixed(2)) })
      })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        const tx = data.pix?.transaction_data || data.transaction_data;
        if (!tx?.qr_code_base64) throw new Error();
        const pixDiv = document.getElementById('pix-info');
        if (pixDiv) {
          pixDiv.innerHTML = `
            <p><strong>Pagamento via Pix: R$ ${total.toFixed(2)}</strong></p>
            <img src="data:image/png;base64,${tx.qr_code_base64}" alt="QR Code Pix" style="max-width:200px;"/>
          `;
          pixDiv.style.display = 'block';
          e.target.querySelector('button[type="submit"]').disabled = true;
        }
      })
      .catch(() => alert('Não foi possível gerar o pagamento via Pix.'));
    } else {
      // Pagamento na entrega via WhatsApp
      const now = new Date();
      const date = now.toLocaleDateString();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const taxa = pedidoInfo.deliveryFee
        ? `*Taxa de Entrega:* R$ ${pedidoInfo.deliveryFee}`
        : '*Taxa de Entrega:* R$ 0,00';
      const rua = document.getElementById('rua')?.value;
      const bairro = document.getElementById('bairro')?.value;
      const cidade = document.getElementById('cidade')?.value;
      const numero = document.getElementById('numero')?.value;
      const msg = `
*Pedido Pizza Express*
Pizza: ${pedidoInfo.nome}
Tamanho: ${pedidoInfo.tamanho}
Massa: ${pedidoInfo.crust}
Quantidade: ${pedidoInfo.quantidade}
${taxa}
Endereço: ${rua}, ${numero} - ${bairro}, ${cidade}
Data: ${date} ${time}
`;
      window.open(`https://wa.me/5581997333714?text=${encodeURIComponent(msg)}`, '_blank');
    }
  });

  // ======= Copiar chave Pix =======
  document.getElementById('copy-button')?.addEventListener('click', () => {
    const raw = document.getElementById('pix-key-text');
    if (raw) {
      navigator.clipboard.writeText(raw.textContent);
      alert('Chave Pix copiada!');
    }
  });

  // ======= Scroll infinito "Mais Vendidas" =======
  const scrollContainer = document.querySelector('.horizontal-scroll.vendidas');
  if (scrollContainer) {
    const track = scrollContainer.querySelector('.horizontal-scroll-track');
    let timeout;
    const pause = () => {
      track.style.animationPlayState = 'paused';
      clearTimeout(timeout);
      timeout = setTimeout(() => track.style.animationPlayState = 'running', 2000);
    };
    ['scroll','mouseenter','touchstart'].forEach(ev => scrollContainer.addEventListener(ev, pause));
  }

  // ======= Carrossel de banners =======
  const carouselInner = document.querySelector('.carousel-inner');
  const dots = Array.from(document.querySelectorAll('.carousel-dots .dot'));
  let currentIndex = 0;
  if (carouselInner && dots.length) {
    const update = i => {
      carouselInner.style.transform = `translateX(-${i*100}%)`;
      dots.forEach((d,j) => d.classList.toggle('active', j===i));
      currentIndex = i;
    };
    setInterval(() => update((currentIndex+1) % dots.length), 4000);
    dots.forEach((dot, idx) => dot.addEventListener('click', () => update(idx)));
    let startX=0, dragging=false;
    carouselInner.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragging = true; });
    carouselInner.addEventListener('touchmove', e => {
      if (!dragging) return;
      const diff = e.touches[0].clientX - startX;
      carouselInner.style.transform = `translateX(${ -currentIndex*100 + (diff/window.innerWidth)*100 }%)`;
    });
    ['touchend','mouseup'].forEach(ev => carouselInner.addEventListener(ev, e => {
      if (!dragging) return;
      dragging = false;
      const x = ev==='mouseup'? e.clientX : e.changedTouches[0].clientX;
      const diff = x - startX;
      if (diff > 50 && currentIndex > 0) update(currentIndex-1);
      else if (diff < -50 && currentIndex < dots.length-1) update(currentIndex+1);
      else update(currentIndex);
    }));
  }

  // ======= Carrinho (LocalStorage + UI) =======
  function atualizarLocalStorage() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
  }
  function removerPedido(i) {
    if (confirm('Deseja remover este item?')) {
      carrinho.splice(i,1);
      atualizarLocalStorage();
      atualizarCarrinhoUI();
    }
  }
  window.adicionarAoCarrinho = () => {
    const size = document.querySelector('input[name="pizza-size"]:checked')?.value;
    const crust = document.querySelector('select[name="pizza-crust"]')?.value;
    const qty = parseInt(document.getElementById('modal-pizza-quantity')?.value) || 0;
    if (!size || !crust || qty < 1) return alert('Preencha todos os campos!');
    const ch = parseInt(document.getElementById('border-cheddar')?.value) || 0;
    const ca = parseInt(document.getElementById('border-catupiry')?.value) || 0;
    const cr = parseInt(document.getElementById('border-cream-cheese')?.value) || 0;
    let bevArr = [];
    document.querySelectorAll('.bebida-item').forEach(it => {
      const nm = it.querySelector('p')?.textContent;
      let pr = parsePrice(it.querySelector('.price')?.textContent.replace('R$','') || '0');
      if (nm && window.storeData?.beverages?.[nm] != null) pr = window.storeData.beverages[nm];
      const q = parseInt(it.querySelector('.bebida-quantity')?.value) || 0;
      if (q>0) bevArr.push({ name:nm, price:pr, quantity:q });
    });
    const obj = {
      nome: document.getElementById('modal-pizza-name')?.textContent.trim(),
      tamanho: size,
      massa: crust,
      quantidade: qty,
      bordas: { cheddar: ch, catupiry: ca, cream: cr },
      bebidas: bevArr
    };
    carrinho.push(obj);
    atualizarLocalStorage();
    alert('Pizza adicionada ao carrinho!');
    closeOrderModal();
    atualizarCarrinhoUI();
  };

  function atualizarCarrinhoUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (list) list.innerHTML = '';
    carrinho.forEach((p, i) => {
      const li = document.createElement('li');
      let sp = window.storeData?.pizzas?.[p.nome]?.sizes?.[p.tamanho] ?? (p.tamanho==='Pequena'?10:p.tamanho==='Média'?15:20);
      const pd = window.storeData?.pizzas?.[p.nome];
      const bordasCost = p.bordas.cheddar*(pd?.borders?.Cheddar||5)
                       + p.bordas.catupiry*(pd?.borders?.Catupiry||6)
                       + p.bordas.cream*(pd?.borders?.['Cream cheese']||3.5);
      const bebidasCost = p.bebidas.reduce((a,b)=>a+b.price*b.quantity,0);
      const sub = sp*p.quantidade + bordasCost + bebidasCost;
      li.textContent = `${p.nome} (${p.tamanho}) — R$ ${sub.toFixed(2)}`;
      const btn = document.createElement('button');
      btn.textContent = 'Remover';
      btn.addEventListener('click', () => removerPedido(i));
      li.appendChild(btn);
      list?.appendChild(li);
    });
    if (totalEl) totalEl.textContent = calcularTotalPedido().toFixed(2);
    document.getElementById('cart-count')?.textContent = carrinho.length;
  }

  window.abrirCarrinho = () => {
    document.getElementById('cart')?.classList.add('open');
    atualizarCarrinhoUI();
  };
  window.fecharCarrinho = () => {
    document.getElementById('cart')?.classList.remove('open');
  };
  window.finalizarPedido = () => {
    if (!carrinho.length) return alert('Seu carrinho está vazio!');
    updatePaymentSummaryCart();
    openPaymentModal();
  };

  // Inicializa visual do carrinho
  atualizarCarrinhoUI();
});
