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
