/**
 * Script de Seed - Dados de Demonstração
 *
 * Este script cria:
 * - Usuário: eyluccas@gmail.com
 * - Empresa: Eletrônica
 * - Categorias, produtos, movimentações e unidades
 *
 * Execute: npx ts-node scripts/seed-demo.ts
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Função para hash de senha
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function seedDemo() {
  console.log("🌱 Iniciando seed de dados de demonstração...\n");

  try {
    // 1. Criar ou atualizar usuário
    console.log("1️⃣ Criando/atualizando usuário...");
    const password = await hashPassword("1980Luca$");

    let user = await prisma.user.findUnique({
      where: { email: "eyluccas@gmail.com" },
    });

    if (user) {
      // Atualiza senha se usuário já existe
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password },
      });
      console.log(
        `   ✅ Usuário atualizado: ID=${user.id}, Email=${user.email}\n`
      );
    } else {
      // Cria novo usuário
      user = await prisma.user.create({
        data: {
          email: "eyluccas@gmail.com",
          name: "Eyluccas",
          password,
        },
      });
      console.log(`   ✅ Usuário criado: ID=${user.id}, Email=${user.email}\n`);
    }

    // 2. Criar ou atualizar empresa "Eletrônica"
    console.log('2️⃣ Criando/atualizando empresa "Eletrônica"...');

    let company = await prisma.company.findFirst({
      where: { name: { contains: "Eletrônica" } },
    });

    if (company) {
      console.log(
        `   ✅ Empresa já existe: ID=${company.id}, Nome=${company.name}\n`
      );
    } else {
      company = await prisma.company.create({
        data: {
          name: "Eletrônica LTDA",
          cnpj: "12.345.678/0001-00",
          email: "contato@eletronica.com",
          phone: "(11) 98765-4321",
          address: "Rua das Eletrônicas, 123 - São Paulo, SP",
        },
      });
      console.log(
        `   ✅ Empresa criada: ID=${company.id}, Nome=${company.name}\n`
      );
    }

    // 3. Criar relacionamento CompanyUser
    console.log("3️⃣ Criando/atualizando relacionamento CompanyUser...");
    const companyUser = await prisma.companyUser.upsert({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
      update: {
        role: "ADMIN",
      },
      create: {
        userId: user.id,
        companyId: company.id,
        role: "ADMIN",
      },
    });
    console.log(
      `   ✅ Relacionamento criado: ID=${companyUser.id}, Role=${companyUser.role}\n`
    );

    // 4. Criar categorias
    console.log("4️⃣ Criando categorias...");
    const categoriesData = [
      { name: "Notebooks" },
      { name: "Smartphones" },
      { name: "Tablets" },
      { name: "Acessórios" },
      { name: "Periféricos" },
    ];

    const categories = [];
    for (const catData of categoriesData) {
      let category = await prisma.category.findFirst({
        where: {
          name: catData.name,
          companyId: company.id,
        },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: catData.name,
            companyId: company.id,
          },
        });
        console.log(`   ✅ Categoria criada: ${category.name}`);
      } else {
        console.log(`   ℹ️  Categoria já existe: ${category.name}`);
      }
      categories.push(category);
    }
    console.log();

    // 5. Criar produtos
    console.log("5️⃣ Criando produtos...");
    const productsData = [
      {
        name: "Notebook Dell Inspiron 15",
        description: "Notebook Dell Inspiron 15 i5 8GB 256GB SSD",
        barcode: "7891234567890",
        sku: "NB-DELL-001",
        category: categories[0],
        currentStock: 15,
        minStock: 5,
        maxStock: 50,
        unitPrice: 3500.0,
        costPrice: 2800.0,
      },
      {
        name: "Smartphone Samsung Galaxy A54",
        description: "Smartphone Samsung Galaxy A54 128GB",
        barcode: "7891234567891",
        sku: "SP-SAMSUNG-001",
        category: categories[1],
        currentStock: 25,
        minStock: 10,
        maxStock: 100,
        unitPrice: 1899.0,
        costPrice: 1500.0,
      },
      {
        name: 'Tablet iPad 10.2"',
        description: 'Tablet Apple iPad 10.2" 64GB Wi-Fi',
        barcode: "7891234567892",
        sku: "TB-APPLE-001",
        category: categories[2],
        currentStock: 8,
        minStock: 3,
        maxStock: 30,
        unitPrice: 3299.0,
        costPrice: 2800.0,
      },
      {
        name: "Mouse Logitech MX Master 3",
        description: "Mouse Logitech MX Master 3 Wireless",
        barcode: "7891234567893",
        sku: "AC-LOGITECH-001",
        category: categories[3],
        currentStock: 12,
        minStock: 5,
        maxStock: 50,
        unitPrice: 599.0,
        costPrice: 450.0,
      },
      {
        name: "Teclado Mecânico RGB",
        description: "Teclado Mecânico RGB Switch Red",
        barcode: "7891234567894",
        sku: "PER-KEYBOARD-001",
        category: categories[4],
        currentStock: 20,
        minStock: 8,
        maxStock: 60,
        unitPrice: 399.0,
        costPrice: 280.0,
      },
      {
        name: 'Monitor LG 27" 4K',
        description: 'Monitor LG UltraWide 27" 4K IPS',
        barcode: "7891234567895",
        sku: "MON-LG-001",
        category: categories[4],
        currentStock: 6,
        minStock: 3,
        maxStock: 25,
        unitPrice: 2499.0,
        costPrice: 2000.0,
      },
      {
        name: 'Notebook MacBook Pro 14"',
        description: 'MacBook Pro 14" M2 16GB 512GB',
        barcode: "7891234567896",
        sku: "NB-APPLE-001",
        category: categories[0],
        currentStock: 4,
        minStock: 2,
        maxStock: 15,
        unitPrice: 12999.0,
        costPrice: 11000.0,
      },
      {
        name: "Smartphone iPhone 15",
        description: "iPhone 15 128GB",
        barcode: "7891234567897",
        sku: "SP-APPLE-001",
        category: categories[1],
        currentStock: 18,
        minStock: 8,
        maxStock: 50,
        unitPrice: 5999.0,
        costPrice: 5200.0,
      },
    ];

    const products = [];
    for (const prodData of productsData) {
      let product = await prisma.product.findFirst({
        where: {
          barcode: prodData.barcode,
          companyId: company.id,
        },
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            name: prodData.name,
            description: prodData.description,
            barcode: prodData.barcode,
            sku: prodData.sku,
            categoryId: prodData.category.id,
            companyId: company.id,
            currentStock: prodData.currentStock,
            minStock: prodData.minStock,
            maxStock: prodData.maxStock,
            unitPrice: prodData.unitPrice,
            costPrice: prodData.costPrice,
            isActive: true,
          },
        });
        console.log(
          `   ✅ Produto criado: ${product.name} (Estoque: ${product.currentStock})`
        );
      } else {
        // Atualiza estoque se produto já existe
        product = await prisma.product.update({
          where: { id: product.id },
          data: {
            currentStock: prodData.currentStock,
            minStock: prodData.minStock,
            maxStock: prodData.maxStock,
          },
        });
        console.log(
          `   ℹ️  Produto atualizado: ${product.name} (Estoque: ${product.currentStock})`
        );
      }
      products.push(product);
    }
    console.log();

    // 6. Criar movimentações de estoque
    console.log("6️⃣ Criando movimentações de estoque...");

    // Limpar movimentações existentes da empresa para recriar
    await prisma.stockMovement.deleteMany({
      where: { companyId: company.id },
    });

    const movements = [];
    const now = new Date();

    // Criar movimentações para os últimos 30 dias
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Seleciona produtos aleatórios
      const product = products[Math.floor(Math.random() * products.length)];
      const type = Math.random() > 0.3 ? "IN" : "OUT"; // 70% entrada, 30% saída
      const quantity =
        type === "IN"
          ? Math.floor(Math.random() * 10) + 5 // 5-15 para entrada
          : Math.floor(Math.random() * 5) + 1; // 1-5 para saída

      const movement = await prisma.stockMovement.create({
        data: {
          productId: product.id,
          companyId: company.id,
          type,
          quantity,
          reason:
            type === "IN"
              ? `Compra - Fornecedor ${(i % 3) + 1}`
              : `Venda - Cliente ${(i % 5) + 1}`,
          userId: user.id,
          createdAt: date,
        },
      });
      movements.push(movement);
    }
    console.log(`   ✅ ${movements.length} movimentações criadas\n`);

    // 7. Criar unidades de produtos para alguns produtos
    console.log("7️⃣ Criando unidades de produtos...");

    // Limpar unidades existentes
    await prisma.productUnit.deleteMany({
      where: { companyId: company.id },
    });

    let unitCount = 0;
    for (const product of products.slice(0, 4)) {
      // Primeiros 4 produtos
      const stock = Number(product.currentStock);
      for (let i = 0; i < Math.min(stock, 10); i++) {
        // Máximo 10 unidades por produto
        const unitBarcode = `${product.barcode}-${String(i + 1).padStart(3, "0")}`;
        const isSold = Math.random() > 0.7; // 30% vendido
        const soldAt = isSold
          ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null;

        await prisma.productUnit.create({
          data: {
            productId: product.id,
            companyId: company.id,
            barcode: unitBarcode,
            isSold,
            soldAt,
            sellerName: isSold ? "João Silva" : null,
            attendantName: isSold ? "Maria Santos" : null,
            buyerDescription: isSold ? "Cliente Final" : null,
            paymentMethods: isSold ? "Cartão de Crédito" : null,
            createdAt: new Date(
              now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
            ),
          },
        });
        unitCount++;
      }
    }
    console.log(`   ✅ ${unitCount} unidades criadas\n`);

    console.log("✅ Seed concluído com sucesso!\n");
    console.log("📊 Resumo:");
    console.log(`   👤 Usuário: ${user.email}`);
    console.log(`   🏢 Empresa: ${company.name}`);
    console.log(`   📦 Categorias: ${categories.length}`);
    console.log(`   📱 Produtos: ${products.length}`);
    console.log(`   📈 Movimentações: ${movements.length}`);
    console.log(`   🔢 Unidades: ${unitCount}\n`);
    console.log("🚀 Agora você pode fazer login com:");
    console.log(`   Email: eyluccas@gmail.com`);
    console.log(`   Senha: 1980Luca$\n`);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
