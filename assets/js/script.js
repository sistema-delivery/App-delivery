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

// Variáveis para manter os dados do pedido entre os modais
let pedidoInfo = {};

// Primeiro formulário (pedido)
document.getElementById('modal-order-form').addEventListener('submit', function (e) {
  e.preventDefault();

  pedidoInfo.nome = document.getElementById('modal-pizza-name').textContent;
  pedidoInfo.tamanho = document.querySelector('input[name="pizza-size"]:checked').value;
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
*Quantidade:* ${pedidoInfo.quantidade} unidade(s)

*Adicionais:* ${pedidoInfo.adicionais}

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

<script>
  const scrollContainer = document.querySelector('.horizontal-scroll.vendidas');
  const scrollTrack = scrollContainer.querySelector('.horizontal-scroll-track');

  let timeout;

  function pauseAnimation() {
    scrollTrack.style.animationPlayState = 'paused';
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      scrollTrack.style.animationPlayState = 'running';
    }, 2000);
  }

  scrollContainer.addEventListener('scroll', pauseAnimation);
  scrollContainer.addEventListener('mouseenter', pauseAnimation);
  scrollContainer.addEventListener('touchstart', pauseAnimation);
</script>
