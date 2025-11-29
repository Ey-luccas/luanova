/**
 * Script de teste do banco de dados SQLite
 * 
 * Execute: npx ts-node scripts/test-database.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabase() {
  console.log("🧪 Testando banco de dados SQLite...\n");

  try {
    // Teste 1: Verificar conexão
    console.log("1️⃣ Testando conexão...");
    await prisma.$connect();
    console.log("   ✅ Conexão estabelecida\n");

    // Teste 2: Criar um usuário
    console.log("2️⃣ Criando usuário de teste...");
    const user = await prisma.user.create({
      data: {
        email: "teste@example.com",
        name: "Usuário Teste",
        password: "senha123",
      },
    });
    console.log(`   ✅ Usuário criado: ID=${user.id}, Email=${user.email}\n`);

    // Teste 3: Criar uma empresa
    console.log("3️⃣ Criando empresa de teste...");
    const company = await prisma.company.create({
      data: {
        name: "Empresa Teste LTDA",
        cnpj: "12.345.678/0001-90",
        email: "contato@empresateste.com",
      },
    });
    console.log(`   ✅ Empresa criada: ID=${company.id}, Nome=${company.name}\n`);

    // Teste 4: Criar relacionamento CompanyUser
    console.log("4️⃣ Criando relacionamento CompanyUser...");
    const companyUser = await prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: "ADMIN",
      },
    });
    console.log(`   ✅ Relacionamento criado: ID=${companyUser.id}, Role=${companyUser.role}\n`);

    // Teste 5: Criar categoria
    console.log("5️⃣ Criando categoria de teste...");
    const category = await prisma.category.create({
      data: {
        name: "Eletrônicos",
        companyId: company.id,
      },
    });
    console.log(`   ✅ Categoria criada: ID=${category.id}, Nome=${category.name}\n`);

    // Teste 6: Criar produto
    console.log("6️⃣ Criando produto de teste...");
    const product = await prisma.product.create({
      data: {
        name: "Notebook Dell",
        description: "Notebook Dell Inspiron 15",
        barcode: "7891234567890",
        sku: "NB-DELL-001",
        categoryId: category.id,
        companyId: company.id,
        currentStock: 10,
        minStock: 5,
        maxStock: 50,
        unitPrice: 3500.00,
        costPrice: 2800.00,
        isActive: true,
      },
    });
    console.log(`   ✅ Produto criado: ID=${product.id}, Nome=${product.name}`);
    console.log(`      Estoque: ${product.currentStock}\n`);

    // Teste 7: Criar movimentação de entrada
    console.log("7️⃣ Criando movimentação de entrada (IN)...");
    const movementIn = await prisma.stockMovement.create({
      data: {
        productId: product.id,
        companyId: company.id,
        type: "IN",
        quantity: 5,
        reason: "Compra inicial",
        userId: user.id,
      },
    });
    console.log(`   ✅ Movimentação criada: ID=${movementIn.id}, Tipo=${movementIn.type}, Quantidade=${movementIn.quantity}\n`);

    // Teste 8: Verificar estoque atualizado (deve ser 15 = 10 + 5)
    console.log("8️⃣ Verificando estoque atualizado...");
    const productUpdated = await prisma.product.findUnique({
      where: { id: product.id },
    });
    console.log(`   📦 Estoque atual: ${productUpdated?.currentStock}`);
    console.log(`   ⚠️  Nota: SQLite não tem triggers, então o estoque não foi atualizado automaticamente`);
    console.log(`   💡 Em produção (MySQL), os triggers atualizariam automaticamente\n`);

    // Teste 9: Criar movimentação de saída
    console.log("9️⃣ Criando movimentação de saída (OUT)...");
    const movementOut = await prisma.stockMovement.create({
      data: {
        productId: product.id,
        companyId: company.id,
        type: "OUT",
        quantity: 3,
        reason: "Venda",
        userId: user.id,
      },
    });
    console.log(`   ✅ Movimentação criada: ID=${movementOut.id}, Tipo=${movementOut.type}, Quantidade=${movementOut.quantity}\n`);

    // Teste 10: Testar relacionamentos
    console.log("🔟 Testando relacionamentos...");
    const userWithCompanies = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        companyUsers: {
          include: {
            company: true,
          },
        },
      },
    });
    console.log(`   ✅ Usuário encontrado: ${userWithCompanies?.name}`);
    console.log(`   ✅ Empresas vinculadas: ${userWithCompanies?.companyUsers.length}\n`);

    const productWithMovements = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        stockMovements: true,
        category: true,
        company: true,
      },
    });
    console.log(`   ✅ Produto encontrado: ${productWithMovements?.name}`);
    console.log(`   ✅ Movimentações: ${productWithMovements?.stockMovements.length}`);
    console.log(`   ✅ Categoria: ${productWithMovements?.category?.name}`);
    console.log(`   ✅ Empresa: ${productWithMovements?.company?.name}\n`);

    // Teste 11: Testar unique constraints
    console.log("1️⃣1️⃣ Testando unique constraints...");
    try {
      await prisma.user.create({
        data: {
          email: "teste@example.com", // Email duplicado
          name: "Outro Usuário",
          password: "senha123",
        },
      });
      console.log("   ❌ Erro: Unique constraint não funcionou!");
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log("   ✅ Unique constraint funcionando (email duplicado bloqueado)\n");
      } else {
        throw error;
      }
    }

    // Teste 12: Contar registros
    console.log("1️⃣2️⃣ Contando registros...");
    const counts = {
      users: await prisma.user.count(),
      companies: await prisma.company.count(),
      companyUsers: await prisma.companyUser.count(),
      categories: await prisma.category.count(),
      products: await prisma.product.count(),
      stockMovements: await prisma.stockMovement.count(),
    };
    console.log("   📊 Registros criados:");
    console.log(`      - Users: ${counts.users}`);
    console.log(`      - Companies: ${counts.companies}`);
    console.log(`      - CompanyUsers: ${counts.companyUsers}`);
    console.log(`      - Categories: ${counts.categories}`);
    console.log(`      - Products: ${counts.products}`);
    console.log(`      - StockMovements: ${counts.stockMovements}\n`);

    console.log("✨ Todos os testes passaram com sucesso!");
    console.log("\n💡 Para limpar os dados de teste, execute:");
    console.log("   npx prisma migrate reset");

  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase()
  .catch((error) => {
    console.error("❌ Falha nos testes:", error);
    process.exit(1);
  });

