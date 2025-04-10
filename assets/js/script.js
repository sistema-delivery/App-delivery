// Script para ativação do menu mobile e submissão simples do formulário de contato

// Toggle do menu mobile
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Submissão do formulário
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  alert("Obrigado por entrar em contato! Em breve responderemos.");
  contactForm.reset();
});

// Captura o envio do formulário de pedido
document.getElementById('order-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const pizzaType = document.getElementById('pizza-type').value;
  const pizzaSize = document.querySelector('input[name="pizza-size"]:checked').value;
  const pizzaQuantity = document.getElementById('pizza-quantity').value;

  const orderDetails = `Você pediu ${pizzaQuantity} unidade(s) de ${pizzaSize} ${pizzaType}.`;
  document.getElementById('order-details').textContent = orderDetails;
});

// Função para abrir o modal e preencher o nome da pizza
function openOrderModal(pizzaName) {
  // Preenche o nome da pizza no modal
  document.getElementById('modal-pizza-name').textContent = pizzaName;
  // Exibe o modal
  document.getElementById('order-modal').style.display = 'block';
}

// Função para fechar o modal
function closeOrderModal() {
  document.getElementById('order-modal').style.display = 'none';
  // Reseta o formulário de pedido do modal
  document.getElementById('modal-order-form').reset();
}

// Adiciona os eventos de clique para fechar o modal
document.querySelector('.modal .close').addEventListener('click', closeOrderModal);
window.addEventListener('click', function(event) {
  const modal = document.getElementById('order-modal');
  if (event.target === modal) {
    closeOrderModal();
  }
});

// Adiciona o evento de clique para cada item de pizza do cardápio
const pizzaItems = document.querySelectorAll('.horizontal-scroll .item');
pizzaItems.forEach(item => {
  item.addEventListener('click', function() {
    // Aqui você pode capturar o nome da pizza 
    // Exemplo: assumindo que o <p> com o nome da pizza é o primeiro <p> do item
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

  // Monta a mensagem para o WhatsApp
  const orderMessage = `Olá, gostaria de pedir ${pizzaQuantity} unidade(s) de ${pizzaSize} ${pizzaName}.`;
  
  // Substitua pelo seu número de telefone no formato internacional (ex: '5511999998888')
  const whatsappNumber = '55SEUNUMERO';

  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

  // Fecha o modal
  closeOrderModal();

  // Abre a URL do WhatsApp em uma nova aba/janela
  window.open(whatsappURL, '_blank');
});
