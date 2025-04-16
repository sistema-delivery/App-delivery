/**
 * prices.js
 * 
 * Este arquivo gerencia os preços e detalhes de todos os itens da loja.
 * Ele abrange:
 * - Dados das Pizzas: descrição, preços por tamanho e borda.
 * - Dados das Bebidas: preços fixos.
 * - Taxas de Entrega: Estruturadas por cidade, permitindo escalabilidade para múltiplas regiões.
 *
 * Futuramente, ao vender o site/app para outras regiões do Brasil, basta adicionar novas cidades e seus bairros.
 */

const storeData = {
  pizzas: {
    "Pizza Marguerita": {
      description:
        "A clássica Marguerita com molho de tomate fresco, mussarela, manjericão e um toque de azeite extra virgem.",
      sizes: {
        "Pequena": 1.00,
        "Média": 34.90,
        "Grande": 49.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Pizza Calabresa": {
      description:
        "Pizza com rodelas de calabresa, cebola, azeitonas e orégano para um sabor marcante.",
      sizes: {
        "Pequena": 12.90,
        "Média": 18.90,
        "Grande": 24.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Pizza Quatro Queijos": {
      description:
        "Deliciosa combinação de mussarela, parmesão, gorgonzola e provolone para os amantes de queijo.",
      sizes: {
        "Pequena": 14.90,
        "Média": 21.90,
        "Grande": 28.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Pizza Portuguesa": {
      description:
        "Pizza com molho de tomate, mussarela e orégano, ideal para os amantes da tradição.",
      sizes: {
        "Pequena": 24.90,
        "Média": 32.90,
        "Grande": 44.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Marguerita Clássica": {
      description:
        "Variante da clássica marguerita, com ingredientes frescos e um toque especial.",
      sizes: {
        "Pequena": 18.90,
        "Média": 25.90,
        "Grande": 32.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Pizza Trufada": {
      description:
        "Pizza com massa premium e cobertura trufada, para quem busca um sabor sofisticado.",
      sizes: {
        "Pequena": 20.90,
        "Média": 30.90,
        "Grande": 40.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    },
    "Especial Gourmet": {
      description:
        "Pizza com ingredientes gourmet e toques inovadores, perfeita para ocasiões especiais.",
      sizes: {
        "Pequena": 22.90,
        "Média": 33.90,
        "Grande": 44.90
      },
      borders: {
        "Nenhuma": 0.00,
        "Catupiry": 6.90,
        "Cheddar": 5.90,
        "Cream cheese": 3.90
      }
    }
  },

  beverages: {
    "Coca-Cola 1,5L": 11.50,
    "Guaraná 1L": 1.00,
    "Guaraná 2L": 13.00
  },

  /**
   * Estrutura de taxas de entrega organizada por cidades.
   * Cada chave é o nome da cidade (ou região) e seu valor é um objeto que mapeia
   * os bairros da cidade para a respectiva taxa de entrega.
   */
  deliveryFees: {
    "Paulista (PE)": {
      "Janga": 10.00,
      "Maranguape I": 6.00,
      "Maranguape II": 6.00,
      "Arthur Lundgren I": 7.00,
      "Arthur Lundgren II": 7.00,
      "Paratibe": 8.00,
      "Centro": 4.00,
      "Nossa Senhora da Conceição": 5.50,
      "Engenho Maranguape": 6.50,
      "Jardim Paulista": 0.50,
      "Jardim Paulista Alto": 6.50,
      "Pau Amarelo": 7.00,
      "Conceição": 5.00,
      "Vila Torres Galvão": 5.00,
      "Alto do Bigode": 6.00,
      "Maria Farinha": 8.00,
      "Nossa Senhora do Ó": 7.00,
      "Loteamento Conceição": 5.50
    },

    "São Paulo (SP)": {
      "Centro": 4.00,
      "Jardim Paulista": 5.50,
      "Pinheiros": 6.00,
      "Vila Madalena": 6.50,
      "Brooklin": 7.00
    },

    "Minas gerais (MG)": {
      "Abadia dos Dourados": 10.00,
      "Abaeté": 5.50,
      "Abre Campo": 8.00,
      "Acaiaca": 9.50,
      "Açucena": 11.00
    },

    "Recife (PE)": {
      "Boa Viagem": 10.00,
      "Brasília Teimosa": 5.50,
      "Casa Amarela": 8.00,
      "Afogados": 9.50,
      "Água Fria": 11.00
    },
    
    "Rio de Janeiro (RJ)": {
      "Copacabana": 5.00,
      "Ipanema": 6.00,
      "Leblon": 6.50,
      "Botafogo": 5.50,
      "Barra da Tijuca": 7.00
    }
  }
};

// Expor o objeto global para que os demais arquivos possam acessar os dados
window.storeData = storeData;
