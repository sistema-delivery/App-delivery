// Toggle do menu mobile
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Modal de Pedido
function openOrderModal(pizzaName) {
  document.getElementById('modal-pizza-name').textContent = pizzaName;
  document.getElementById('order-modal').style.display = 'block';
}

function closeOrderModal() {
  document.getElementById('order-modal').style.display = 'none';
  document.getElementById('modal-order-form').reset();
  updateOrderSummary(); // Atualiza o resumo para o estado inicial
}

// Modal de Pagamento
function openPaymentModal() {
  document.getElementById('payment-modal').style.display = 'block';
}

function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
  document.getElementById('modal-payment-form').reset();
  document.getElementById('pix-info').style.display = 'none';
}

// Clique fora para fechar os modais
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('order-modal')) closeOrderModal();
  if (event.target === document.getElementById('payment-modal')) closePaymentModal();
});

document.querySelectorAll('.modal .close').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    closeOrderModal();
    closePaymentModal();
  });
});

// Abrir modal ao clicar na pizza
document.querySelectorAll('.horizontal-scroll .item').forEach(item => {
  item.addEventListener('click', function () {
    const pizzaName = item.querySelector('p').textContent;
    openOrderModal(pizzaName);
  });
});

// Função para atualizar o resumo do pedido em tempo real
function updateOrderSummary() {
  const size = document.querySelector('input[name="pizza-size"]:checked')?.value || 'Não selecionado';
  const crust = document.querySelector('select[name="pizza-crust"]').value || 'Não selecionado';
  const quantity = document.getElementById('modal-pizza-quantity').value;

  document.getElementById('summary-size').textContent = `Tamanho: ${size}`;
  document.getElementById('summary-crust').textContent = `Tipos de Massa: ${crust}`;
  document.getElementById('summary-quantity').textContent = `Quantidade: ${quantity}`;
}

// Adiciona listeners para atualizar o resumo quando houver alterações
document.querySelectorAll('input[name="pizza-size"]').forEach(el => el.addEventListener('change', updateOrderSummary));
document.querySelector('select[name="pizza-crust"]').addEventListener('change', updateOrderSummary);
document.getElementById('modal-pizza-quantity').addEventListener('input', updateOrderSummary);

// Variável para manter os dados do pedido entre os modais
let pedidoInfo = {};

// Primeiro formulário (pedido)
document.getElementById('modal-order-form').addEventListener('submit', function (e) {
  e.preventDefault();

  pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
  pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
  pedidoInfo.crust = document.querySelector('select[name="pizza-crust"]').value;
  pedidoInfo.quantidade = document.getElementById('modal-pizza-quantity').value;

  pedidoInfo.adicionais = document.getElementById('modal-additional').value || 'Nenhum';

  closeOrderModal();
  openPaymentModal();
});

// Exibe ou oculta info Pix
document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
  radio.addEventListener('change', function () {
    const pixInfo = document.getElementById('pix-info');
    pixInfo.style.display = this.value === 'Pix' ? 'block' : 'none';
  });
});

// Segundo formulário (pagamento)
document.getElementById('modal-payment-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const metodo = document.querySelector('input[name="payment-method"]:checked').value;
  const status = metodo === 'Pix' ? 'Pago via Pix' : 'Pagamento na entrega';
  const chavePix = '708.276.084-11';

  const dataAtual = new Date();
  const data = dataAtual.toLocaleDateString();
  const hora = dataAtual.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const mensagem = `
*Pedido de Pizza - Pizza Express*
------------------------------------
*Pizza:* ${pedidoInfo.nome}
*Tamanho:* ${pedidoInfo.tamanho}
*Tipos de Massa:* ${pedidoInfo.crust}
*Quantidade:* ${pedidoInfo.quantidade} unidade(s)

*Observações:* ${pedidoInfo.adicionais}

*Status do Pagamento:* ${status}
*Forma de Pagamento:* ${metodo}${metodo === 'Pix' ? ` (Chave: ${chavePix})` : ''}

------------------------------------
*Data do Pedido:* ${data}
*Hora:* ${hora}

Agradecemos o seu pedido!
Pizza Express - Sabor que chega rápido!
`.trim();

  // Envio via WhatsApp
  const whatsappNumber = '5581997333714';
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

  closePaymentModal();
  window.open(whatsappURL, '_blank');
});

// Código para pausar a animação enquanto o usuário interage e retomá-la depois de 2 segundos
const scrollContainer = document.querySelector('.horizontal-scroll.vendidas');
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

// Código para atualização dos pontos do carrossel
const dots = document.querySelectorAll('.carousel-dots .dot');
const carouselInner = document.querySelector('.carousel-inner');
let currentIndex = 0;

function updateCarousel(index) {
  carouselInner.style.transition = 'transform 0.5s ease-in-out';
  carouselInner.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
  currentIndex = index;
}

// Atualização automática
setInterval(() => {
  updateCarousel((currentIndex + 1) % dots.length);
}, 4000);

// Atualização manual por clique nas bolinhas
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    updateCarousel(index);
  });
});

// Deslize manual para celular e arraste no desktop
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

// Clique e arraste no desktop
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
carouselViewport.addEventListener('scroll', () => {
  const index = Math.round(carouselViewport.scrollLeft / carouselViewport.offsetWidth);
  dots.forEach(dot => dot.classList.remove('active'));
  if (dots[index]) dots[index].classList.add('active');
});
