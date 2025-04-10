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

// Envio do pedido para o WhatsApp com mensagem formatada
document.getElementById('modal-order-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const pizzaName = document.getElementById('modal-pizza-name').textContent;
  const pizzaSize = document.querySelector('input[name="pizza-size"]:checked').value;
  const pizzaQuantity = document.getElementById('modal-pizza-quantity').value;

  const orderMessage = 
`*Novo Pedido - Pizza Express*

*Pizza:* ${pizzaName}
*Tamanho:* ${pizzaSize}
*Quantidade:* ${pizzaQuantity}

*Status do pagamento:* Pendente

Por favor, confirme o pedido e envie os detalhes do pagamento.
Obrigado!`;

  // Substitua pelo seu número no formato internacional
  const whatsappNumber = '55SEUNUMERO';
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

  closeOrderModal();
  window.open(whatsappURL, '_blank');
});
