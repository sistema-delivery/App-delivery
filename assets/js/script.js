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

// Captura o envio do formulário de pedido no modal e redireciona para o WhatsApp com nota formatada
document.getElementById('modal-order-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const pizzaName = document.getElementById('modal-pizza-name').textContent;
  const pizzaSize = document.querySelector('input[name="pizza-size"]:checked').value;
  const pizzaQuantity = document.getElementById('modal-pizza-quantity').value;
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const observations = document.getElementById('modal-observations').value.trim() || '(nenhuma)';

  const now = new Date();
  const date = now.toLocaleDateString('pt-BR');
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const paymentStatus = paymentMethod === 'Pix' ? 'Pago via Pix' : 'Aguardando pagamento';
  const paymentInfo = paymentMethod === 'Pix' ? 'Pix (Chave: 708.276.084-11)' : paymentMethod;

  const orderMessage = `
Pedido de Pizza - Pizza Express
------------------------------------
Pizza: ${pizzaName}
Tamanho: ${pizzaSize}
Quantidade: ${pizzaQuantity} ${pizzaQuantity > 1 ? 'unidades' : 'unidade'}

Status do Pagamento: ${paymentStatus}
Forma de Pagamento: ${paymentInfo}

Observações adicionais:
${observations}

------------------------------------
Data do Pedido: ${date}
Hora: ${time}

Agradecemos o seu pedido! Em breve ele será preparado e enviado para você.
Pizza Express - Sabor que chega rápido!
  `.trim();

  const whatsappNumber = '5581997333714';
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

  closeOrderModal();
  window.open(whatsappURL, '_blank');
});
