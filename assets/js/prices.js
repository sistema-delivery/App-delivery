/**
 * prices.js
 * 
 * Este arquivo gerencia os preços e detalhes de todos os itens da loja, incluindo:
 * - Dados das Pizzas (descrição, preços por tamanho e bordas)
 * - Preços das Bebidas
 * - Taxas de Entrega por Bairro
 */

// Dados das Pizzas
const pizzas = {
  "Pizza Marguerita": {
    description: "A clássica Marguerita com molho de tomate fresco, mussarela, manjericão e um toque de azeite extra virgem.",
    sizes: {
      "Pequena": 23.90,
      "Média": 34.90,
      "Grande": 49.90
    },
    borders: {
      "Nenhuma": 0.00,
      "Catupiry": 6.00,
      "Cheddar": 5.00,
      "Cream cheese": 3.50
    }
  },
  "Pizza Calabresa": {
    description: "Pizza com rodelas de calabresa, cebola, azeitonas e orégano para um sabor marcante.",
    sizes: {
      "Pequena": 23.90,
      "Média": 34.90,
      "Grande": 49.90
    },
    borders: {
      "Nenhuma": 0.00,
      "Catupiry": 6.00,
      "Cheddar": 5.00,
      "Cream cheese": 3.50
    }
  },
  "Pizza Quatro Queijos": {
    description: "Deliciosa combinação de mussarela, parmesão, gorgonzola e provolone para os amantes de queijo.",
    sizes: {
      "Pequena": 14.00,
      "Média": 21.00,
      "Grande": 28.00
    },
    borders: {
      "Nenhuma": 0.00,
      "Catupiry": 6.00,
      "Cheddar": 5.00,
      "Cream cheese": 3.50
    }
  }
};

// Dados das Bebidas
const beverages = {
  "Coca-Cola 1,5L": 5.00,
  "Guaraná 1L": 4.50,
  "Guaraná 2L": 3.00
};

// Taxas de Entrega por Bairro
const deliveryFees = {
  "Janga": 5.00,
  "Maranguape I": 6.00,
  "Maranguape II": 6.00,
  "Arthur Lundgren I": 7.00,
  "Arthur Lundgren II": 7.00,
  "Paratibe": 8.00,
  "Centro": 4.00,
  "Nossa Senhora da Conceição": 5.50,
  "Engenho Maranguape": 6.50,
  "Jardim Paulista": 5.00,
  "Jardim Paulista Alto": 6.50,
  "Pau Amarelo": 7.00,
  "Conceição": 5.00,
  "Mirueira": 14.00,
  "Vila Torres Galvão": 5.00,
  "Alto do Bigode": 6.00,
  "Maria Farinha": 8.00,
  "Nossa Senhora do Ó": 7.00,
  "Loteamento Conceição": 5.50
};
