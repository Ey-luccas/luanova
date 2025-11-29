/**
 * Script para adicionar um produto de teste
 * 
 * Uso: npx ts-node backend/scripts/add-test-product.ts
 */

import prisma from "../src/config/prisma";

async function addTestProduct() {
  try {
    console.log("🔍 Buscando primeira empresa...");

    // Buscar primeira empresa
    let company = await prisma.company.findFirst();

    if (!company) {
      console.log("⚠️  Nenhuma empresa encontrada!");
      console.log("💡 Criando empresa de teste...");

      // Buscar ou criar usuário de teste
      let user = await prisma.user.findFirst({
        where: {
          email: "teste@exemplo.com",
        },
      });

      if (!user) {
        // Criar usuário de teste (sem hash de senha real, apenas para script)
        user = await prisma.user.create({
          data: {
            name: "Usuário de Teste",
            email: "teste@exemplo.com",
            password: "hash_temporario", // Não usar em produção
          },
        });
        console.log(`✅ Usuário de teste criado: ${user.email}`);
      }

      // Criar empresa de teste
      company = await prisma.company.create({
        data: {
          name: "Empresa de Teste",
          email: "empresa@teste.com",
        },
      });

      // Vincular usuário à empresa
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      console.log(`✅ Empresa de teste criada: ${company.name} (ID: ${company.id})`);
    } else {
      console.log(`✅ Empresa encontrada: ${company.name} (ID: ${company.id})`);
    }

    // Verificar se já existe um produto de teste
    const existingProduct = await prisma.product.findFirst({
      where: {
        companyId: company.id,
        name: {
          contains: "Produto de Teste",
        },
      },
    });

    if (existingProduct) {
      console.log(`⚠️  Produto de teste já existe: ${existingProduct.name} (ID: ${existingProduct.id})`);
      console.log("💡 Deletando produto de teste existente...");
      // Deletar movimentações relacionadas primeiro
      await prisma.stockMovement.deleteMany({
        where: {
          productId: existingProduct.id,
        },
      });
      await prisma.product.delete({
        where: { id: existingProduct.id },
      });
      console.log("✅ Produto de teste antigo removido.");
    }

    // Buscar primeira categoria (se existir)
    const category = await prisma.category.findFirst({
      where: {
        companyId: company.id,
      },
    });

    if (category) {
      console.log(`📁 Categoria encontrada: ${category.name}`);
    } else {
      console.log("📁 Nenhuma categoria encontrada, produto será criado sem categoria.");
    }

    // Criar produto de teste
    const testProduct = await prisma.product.create({
      data: {
        name: "Produto de Teste",
        description: "Este é um produto criado automaticamente para teste da listagem",
        barcode: "7891234567890",
        sku: "TEST-001",
        companyId: company.id,
        categoryId: category?.id || null,
        currentStock: 100,
        minStock: 10,
        maxStock: 500,
        unitPrice: 29.90,
        costPrice: 15.00,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("");
    console.log("✅ Produto de teste criado com sucesso!");
    console.log("");
    console.log("📦 Detalhes do produto:");
    console.log(`   ID: ${testProduct.id}`);
    console.log(`   Nome: ${testProduct.name}`);
    console.log(`   Código de Barras: ${testProduct.barcode}`);
    console.log(`   SKU: ${testProduct.sku}`);
    console.log(`   Preço de Venda: R$ ${testProduct.unitPrice?.toFixed(2)}`);
    console.log(`   Preço de Custo: R$ ${testProduct.costPrice?.toFixed(2)}`);
    console.log(`   Estoque Atual: ${testProduct.currentStock}`);
    console.log(`   Estoque Mínimo: ${testProduct.minStock || "Não definido"}`);
    console.log(`   Categoria: ${testProduct.category?.name || "Nenhuma"}`);
    console.log(`   Status: ${testProduct.isActive ? "Ativo" : "Inativo"}`);
    console.log("");
    console.log("🎉 Agora você pode ver o produto na listagem!");
    console.log("💡 Recarregue a página de produtos no frontend para ver o novo produto.");

  } catch (error: any) {
    console.error("❌ Erro ao adicionar produto de teste:", error.message || error);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTestProduct()
  .then(() => {
    console.log("\n✅ Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error);
    process.exit(1);
  });
