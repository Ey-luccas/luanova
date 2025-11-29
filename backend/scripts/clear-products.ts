/**
 * Script para limpar todos os produtos do banco de dados
 * 
 * Uso: npx ts-node scripts/clear-products.ts
 */

import prisma from "../src/config/prisma";

async function clearProducts() {
  try {
    console.log("🔍 Verificando produtos no banco de dados...\n");

    // Contar produtos antes
    const productCount = await prisma.product.count();
    
    if (productCount === 0) {
      console.log("✅ Nenhum produto encontrado no banco de dados.");
      await prisma.$disconnect();
      return;
    }

    console.log(`📊 Produtos encontrados: ${productCount}\n`);

    // Listar produtos com informações
    const products = await prisma.product.findMany({
      include: {
        company: true,
        category: true,
      },
      take: 10, // Mostrar apenas os 10 primeiros
    });

    if (products.length > 0) {
      console.log("📦 Alguns produtos encontrados:");
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} (ID: ${product.id})`);
        console.log(`   Empresa: ${product.company.name}`);
        console.log(`   Categoria: ${product.category?.name || "Sem categoria"}`);
        console.log(`   Estoque: ${product.currentStock}`);
        console.log("");
      });
      if (productCount > 10) {
        console.log(`... e mais ${productCount - 10} produtos\n`);
      }
    }

    console.log("🗑️  Limpando todos os produtos e dados relacionados...\n");

    // Deletar em cascata (StockMovements serão deletados automaticamente)
    await prisma.$transaction(async (tx) => {
      // Deletar movimentações de estoque primeiro (foreign key)
      const movementsCount = await tx.stockMovement.count();
      await tx.stockMovement.deleteMany({});
      console.log(`✅ ${movementsCount} movimentações de estoque deletadas`);

      // Deletar produtos
      await tx.product.deleteMany({});
      console.log(`✅ ${productCount} produtos deletados`);
    });

    console.log("\n✅ Banco de dados limpo com sucesso!");
  } catch (error: any) {
    console.error("❌ Erro ao limpar produtos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
clearProducts()
  .then(() => {
    console.log("\n🎉 Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error);
    process.exit(1);
  });

