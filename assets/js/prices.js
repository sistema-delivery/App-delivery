/**
 * prices.js
 * 
 * Este arquivo gerencia os preços e detalhes de todos os itens da loja.
 * Os dados incluem informações específicas para cada pizza e para as bebidas.
 */

// Dados das Pizzas
const pizzas = {
  "Pizza Marguerita": {
    description: "A clássica Marguerita com molho de tomate fresco, mussarela, manjericão e um toque de azeite extra virgem.",
    sizes: {
      "Pequena": 100.00,  // Preço em reais
      "Média": 150.00,
      "Grande": 200.00
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
      "Pequena": 12.00,
      "Média": 18.00,
      "Grande": 24.00
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

// Exporta os dados para que possam ser utilizados em outros módulos
// Se estiver utilizando módulos ES6 (import/export)
export { pizzas, beverages };

// Caso prefira o CommonJS (Node.js), comente a linha acima e descomente a linha abaixo:
// module.exports = { pizzas, beverages };
