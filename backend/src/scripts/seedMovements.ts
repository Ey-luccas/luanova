/**
 * Script para criar produtos, serviços e movimentações para as empresas
 * Execute: npx ts-node src/scripts/seedMovements.ts
 */

import prisma from "../config/prisma";
import { Decimal } from "@prisma/client/runtime/library";

async function seedMovements() {
  console.log("🌱 Iniciando seed de produtos, serviços e movimentações...\n");

  try {
    const userEmail = "eylucca@gmail.com";

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error(
        "Usuário não encontrado. Execute o seed de usuário primeiro."
      );
    }

    // Buscar todas as empresas do usuário
    const companies = await prisma.company.findMany({
      where: {
        companyUsers: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (companies.length === 0) {
      throw new Error(
        "Nenhuma empresa encontrada. Execute o seed de empresas primeiro."
      );
    }

    console.log(`📋 Encontradas ${companies.length} empresas\n`);

    // Dados de produtos e serviços por tipo de empresa
    const companyData: Record<string, any> = {
      "TechStore - Loja de Eletrônicos": {
        products: [
          {
            name: "Smartphone Samsung Galaxy",
            price: 1299.99,
            stock: 15,
            barcode: "7891234567890",
          },
          {
            name: "Notebook Dell Inspiron",
            price: 2499.99,
            stock: 8,
            barcode: "7891234567891",
          },
          {
            name: "Fone de Ouvido Bluetooth",
            price: 199.99,
            stock: 30,
            barcode: "7891234567892",
          },
          {
            name: "Mouse Gamer RGB",
            price: 89.99,
            stock: 25,
            barcode: "7891234567893",
          },
          {
            name: "Teclado Mecânico",
            price: 349.99,
            stock: 12,
            barcode: "7891234567894",
          },
        ],
        services: [
          { name: "Instalação de Sistema Operacional", price: 150.0 },
          { name: "Formatação de Computador", price: 200.0 },
          { name: "Limpeza de Hardware", price: 80.0 },
        ],
      },
      "Beleza & Estilo - Salão de Beleza": {
        products: [
          {
            name: "Shampoo Profissional",
            price: 45.9,
            stock: 50,
            barcode: "7891234567900",
          },
          {
            name: "Condicionador Reparador",
            price: 48.9,
            stock: 45,
            barcode: "7891234567901",
          },
          {
            name: "Tinta para Cabelo",
            price: 25.9,
            stock: 60,
            barcode: "7891234567902",
          },
          {
            name: "Máscara Capilar",
            price: 55.9,
            stock: 35,
            barcode: "7891234567903",
          },
        ],
        services: [
          { name: "Corte de Cabelo Feminino", price: 80.0 },
          { name: "Corte de Cabelo Masculino", price: 50.0 },
          { name: "Coloração Completa", price: 180.0 },
          { name: "Escova Progressiva", price: 350.0 },
          { name: "Manicure e Pedicure", price: 60.0 },
        ],
      },
      "SuperMercado Central": {
        products: [
          {
            name: "Arroz 5kg",
            price: 24.9,
            stock: 100,
            barcode: "7891234567910",
          },
          {
            name: "Feijão 1kg",
            price: 8.9,
            stock: 150,
            barcode: "7891234567911",
          },
          {
            name: "Açúcar 1kg",
            price: 5.9,
            stock: 120,
            barcode: "7891234567912",
          },
          {
            name: "Óleo de Soja 900ml",
            price: 7.9,
            stock: 200,
            barcode: "7891234567913",
          },
          {
            name: "Macarrão 500g",
            price: 4.9,
            stock: 180,
            barcode: "7891234567914",
          },
          {
            name: "Leite Integral 1L",
            price: 5.5,
            stock: 250,
            barcode: "7891234567915",
          },
        ],
        services: [],
      },
      "Pizzaria Bella Italia": {
        products: [
          {
            name: "Refrigerante 2L",
            price: 8.9,
            stock: 80,
            barcode: "7891234567920",
          },
          {
            name: "Cerveja Long Neck",
            price: 6.9,
            stock: 120,
            barcode: "7891234567921",
          },
          {
            name: "Água Mineral 500ml",
            price: 2.9,
            stock: 200,
            barcode: "7891234567922",
          },
        ],
        services: [
          { name: "Pizza Margherita", price: 35.0 },
          { name: "Pizza Calabresa", price: 38.0 },
          { name: "Pizza Portuguesa", price: 40.0 },
          { name: "Pizza Quatro Queijos", price: 42.0 },
          { name: "Pizza Frango com Catupiry", price: 40.0 },
        ],
      },
      "AutoMecânica Express": {
        products: [
          {
            name: "Óleo Motor 5W30",
            price: 45.9,
            stock: 40,
            barcode: "7891234567930",
          },
          {
            name: "Filtro de Óleo",
            price: 18.9,
            stock: 60,
            barcode: "7891234567931",
          },
          {
            name: "Pastilha de Freio",
            price: 89.9,
            stock: 25,
            barcode: "7891234567932",
          },
          {
            name: "Bateria Automotiva",
            price: 350.0,
            stock: 15,
            barcode: "7891234567933",
          },
        ],
        services: [
          { name: "Troca de Óleo", price: 120.0 },
          { name: "Alinhamento e Balanceamento", price: 150.0 },
          { name: "Revisão Completa", price: 300.0 },
          { name: "Troca de Pneus", price: 80.0 },
        ],
      },
      "Farmácia Vida Saudável": {
        products: [
          {
            name: "Paracetamol 500mg",
            price: 12.9,
            stock: 100,
            barcode: "7891234567940",
          },
          {
            name: "Ibuprofeno 400mg",
            price: 15.9,
            stock: 90,
            barcode: "7891234567941",
          },
          {
            name: "Vitamina C 1000mg",
            price: 28.9,
            stock: 70,
            barcode: "7891234567942",
          },
          {
            name: "Protetor Solar FPS 50",
            price: 45.9,
            stock: 50,
            barcode: "7891234567943",
          },
        ],
        services: [
          { name: "Aferição de Pressão", price: 0.0 },
          { name: "Aplicação de Injeção", price: 15.0 },
          { name: "Curativo Simples", price: 10.0 },
        ],
      },
      "Academia FitLife": {
        products: [
          {
            name: "Whey Protein 1kg",
            price: 89.9,
            stock: 30,
            barcode: "7891234567950",
          },
          {
            name: "Creatina 300g",
            price: 65.9,
            stock: 25,
            barcode: "7891234567951",
          },
          {
            name: "BCAA 300g",
            price: 75.9,
            stock: 20,
            barcode: "7891234567952",
          },
          {
            name: "Garrafa de Água 750ml",
            price: 15.9,
            stock: 50,
            barcode: "7891234567953",
          },
        ],
        services: [
          { name: "Mensalidade Academia", price: 99.0 },
          { name: "Avaliação Física", price: 80.0 },
          { name: "Personal Trainer (1h)", price: 120.0 },
          { name: "Aula de Pilates", price: 60.0 },
        ],
      },
    };

    // Clientes de exemplo
    const customers = [
      {
        name: "João Silva",
        cpf: "123.456.789-00",
        email: "joao.silva@email.com",
      },
      {
        name: "Maria Santos",
        cpf: "234.567.890-11",
        email: "maria.santos@email.com",
      },
      {
        name: "Pedro Oliveira",
        cpf: "345.678.901-22",
        email: "pedro.oliveira@email.com",
      },
      {
        name: "Ana Costa",
        cpf: "456.789.012-33",
        email: "ana.costa@email.com",
      },
      {
        name: "Carlos Ferreira",
        cpf: "567.890.123-44",
        email: "carlos.ferreira@email.com",
      },
      {
        name: "Juliana Alves",
        cpf: "678.901.234-55",
        email: "juliana.alves@email.com",
      },
      {
        name: "Roberto Lima",
        cpf: "789.012.345-66",
        email: "roberto.lima@email.com",
      },
      {
        name: "Fernanda Rocha",
        cpf: "890.123.456-77",
        email: "fernanda.rocha@email.com",
      },
    ];

    const paymentMethods = ["PIX", "CARTAO", "BOLETO", "ESPECIE"];

    // Processar cada empresa
    for (const company of companies) {
      const data = companyData[company.name];
      if (!data) {
        console.log(`⚠️  Dados não encontrados para: ${company.name}`);
        continue;
      }

      console.log(`\n🏢 Processando: ${company.name}`);

      // Criar categoria padrão
      let category = await prisma.category.findFirst({
        where: { companyId: company.id, name: "Geral" },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: "Geral",
            companyId: company.id,
          },
        });
      }

      // Criar produtos
      const createdProducts: any[] = [];
      if (data.products && data.products.length > 0) {
        console.log(`   📦 Criando ${data.products.length} produtos...`);
        for (const productData of data.products) {
          const product = await prisma.product.create({
            data: {
              name: productData.name,
              description: `Produto ${productData.name}`,
              barcode: productData.barcode,
              companyId: company.id,
              categoryId: category.id,
              currentStock: new Decimal(productData.stock),
              minStock: new Decimal(5),
              unitPrice: new Decimal(productData.price),
              costPrice: new Decimal(productData.price * 0.7), // 70% do preço de venda
              isActive: true,
              isService: false,
            },
          });
          createdProducts.push(product);
        }
        console.log(`   ✅ ${createdProducts.length} produtos criados`);
      }

      // Criar serviços
      const createdServices: any[] = [];
      if (data.services && data.services.length > 0) {
        console.log(`   💼 Criando ${data.services.length} serviços...`);
        for (const serviceData of data.services) {
          const service = await prisma.product.create({
            data: {
              name: serviceData.name,
              description: `Serviço ${serviceData.name}`,
              companyId: company.id,
              categoryId: category.id,
              currentStock: new Decimal(0),
              unitPrice: new Decimal(serviceData.price),
              costPrice: new Decimal(serviceData.price * 0.5), // 50% do preço de venda
              isActive: true,
              isService: true,
            },
          });
          createdServices.push(service);
        }
        console.log(`   ✅ ${createdServices.length} serviços criados`);
      }

      // Criar movimentações (vendas de produtos)
      if (createdProducts.length > 0) {
        console.log(`   💰 Criando vendas de produtos...`);
        const salesCount = Math.min(createdProducts.length * 2, 10); // 2 vendas por produto, máximo 10

        for (let i = 0; i < salesCount; i++) {
          const product =
            createdProducts[Math.floor(Math.random() * createdProducts.length)];
          const customer =
            customers[Math.floor(Math.random() * customers.length)];
          const paymentMethod =
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1 a 3 unidades
          const daysAgo = Math.floor(Math.random() * 30); // Últimos 30 dias
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - daysAgo);
          createdAt.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8h e 20h
          createdAt.setMinutes(Math.floor(Math.random() * 60));

          await prisma.sale.create({
            data: {
              companyId: company.id,
              productId: product.id,
              type: "SALE",
              quantity: new Decimal(quantity),
              customerName: customer.name,
              customerCpf: customer.cpf,
              customerEmail: customer.email,
              paymentMethod: paymentMethod,
              observations: `Venda realizada em ${createdAt.toLocaleDateString("pt-BR")}`,
              createdAt: createdAt,
              updatedAt: createdAt,
            },
          });

          // Atualizar estoque
          const newStock = Number(product.currentStock) - quantity;
          await prisma.product.update({
            where: { id: product.id },
            data: { currentStock: new Decimal(Math.max(0, newStock)) },
          });
        }
        console.log(`   ✅ ${salesCount} vendas de produtos criadas`);
      }

      // Criar movimentações (prestações de serviços)
      if (createdServices.length > 0) {
        console.log(`   💼 Criando prestações de serviços...`);
        const servicesCount = Math.min(createdServices.length * 3, 15); // 3 prestações por serviço, máximo 15

        for (let i = 0; i < servicesCount; i++) {
          const service =
            createdServices[Math.floor(Math.random() * createdServices.length)];
          const customer =
            customers[Math.floor(Math.random() * customers.length)];
          const paymentMethod =
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const daysAgo = Math.floor(Math.random() * 30); // Últimos 30 dias
          const createdAt = new Date();
          createdAt.setDate(createdAt.getDate() - daysAgo);
          createdAt.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8h e 20h
          createdAt.setMinutes(Math.floor(Math.random() * 60));

          await prisma.sale.create({
            data: {
              companyId: company.id,
              productId: service.id,
              type: "SERVICE",
              quantity: new Decimal(1), // Serviços sempre quantidade 1
              customerName: customer.name,
              customerCpf: customer.cpf,
              customerEmail: customer.email,
              paymentMethod: paymentMethod,
              observations: `Prestação de serviço realizada em ${createdAt.toLocaleDateString("pt-BR")}`,
              createdAt: createdAt,
              updatedAt: createdAt,
            },
          });
        }
        console.log(`   ✅ ${servicesCount} prestações de serviços criadas`);
      }
    }

    console.log(`\n✨ Seed de movimentações concluído!`);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
seedMovements()
  .then(() => {
    console.log("\n✅ Processo finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro ao executar seed:", error);
    process.exit(1);
  });
