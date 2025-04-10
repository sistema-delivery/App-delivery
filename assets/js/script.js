// Script para ativação do menu mobile e submissão simples do formulário de contato

// Toggle do menu mobile
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Submissão do formulário de contato
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  alert("Obrigado por entrar em contato! Em breve responderemos.");
  contactForm.reset();
});

// Função para abrir o modal e preencher o nome da pizza
function openOrderModal(pizzaName) {
  document.getElementById('modal-pizza-name').textContent = pizzaName;
  document.getElementById('order-modal').style.display = 'block';
}

// Função para fechar o modal
function closeOrderModal() {
  document.getElementById('order-modal').style.display = 'none';
  document.getElementById('modal-order-form').reset();
}

// Fechar modal ao clicar fora ou no botão de fechar
document.querySelector('.modal .close').addEventListener('click', closeOrderModal);
window.addEventListener('click', function(event) {
  const modal = document.getElementById('order-modal');
  if (event.target === modal) {
    closeOrderModal();
  }
});

// Evento de clique nas pizzas do cardápio
const pizzaItems = document.querySelectorAll('.horizontal-scroll .item');
pizzaItems.forEach(item => {
  item.addEventListener('click', function() {
    const pizzaName = item.querySelector('p').textContent;
    openOrderModal(pizzaName);
  });
});

// Captura o envio do formulário de pedido no modal e redireciona para o WhatsApp
document.getElementById('modal-order-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const pizzaName = document.getElementById('modal-pizza-name').textContent;
  const pizzaSize = document.querySelector('input[name="pizza-size"]:checked').value;
  const pizzaQuantity = document.getElementById('modal-pizza-quantity').value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

  // Mensagem formatada
  const orderMessage = `
*Novo Pedido - Pizza Express*

*Pizza:* ${pizzaName}
*Tamanho:* ${pizzaSize}
*Quantidade:* ${pizzaQuantity}
*Pagamento:* ${paymentMethod}
*Status:* Aguardando comprovante

Por favor, envie o comprovante ou informe a forma de pagamento para confirmarmos o pedido.
  `.trim();

  // Número do WhatsApp (formato internacional, ex: 55 + DDD + número)
  const whatsappNumber = '5581997333714';
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

  // Fecha o modal e abre o WhatsApp
  closeOrderModal();
  window.open(whatsappURL, '_blank');
});
