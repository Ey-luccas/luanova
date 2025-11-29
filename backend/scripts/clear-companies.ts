/**
 * Script para limpar todas as empresas do banco de dados
 * 
 * Uso: npx ts-node scripts/clear-companies.ts
 */

import prisma from "../src/config/prisma";

async function clearCompanies() {
  try {
    console.log("🔍 Verificando empresas no banco de dados...\n");

    // Lista todas as empresas
    const companies = await prisma.company.findMany({
      include: {
        companyUsers: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            stockMovements: true,
          },
        },
      },
    });

    if (companies.length === 0) {
      console.log("✅ Nenhuma empresa encontrada no banco de dados.");
      await prisma.$disconnect();
      return;
    }

    console.log(`📊 Empresas encontradas: ${companies.length}\n`);

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
      console.log(`   CNPJ: ${company.cnpj || "Não informado"}`);
      console.log(`   Email: ${company.email || "Não informado"}`);
      console.log(`   Usuários vinculados: ${company.companyUsers.length}`);
      company.companyUsers.forEach((cu) => {
        console.log(`     - ${cu.user.name} (${cu.user.email}) - Role: ${cu.role}`);
      });
      console.log(`   Produtos: ${company._count.products}`);
      console.log(`   Categorias: ${company._count.categories}`);
      console.log(`   Movimentações: ${company._count.stockMovements}`);
      console.log("");
    });

    console.log("🗑️  Limpando todas as empresas e dados relacionados...\n");

    // Deletar em cascata (CompanyUser será deletado automaticamente por causa do onDelete: Cascade)
    // Mas vamos deletar explicitamente para garantir
    await prisma.$transaction(async (tx) => {
      // Deletar movimentações de estoque
      await tx.stockMovement.deleteMany({});
      console.log("✅ Movimentações de estoque deletadas");

      // Deletar produtos
      await tx.product.deleteMany({});
      console.log("✅ Produtos deletados");

      // Deletar categorias
      await tx.category.deleteMany({});
      console.log("✅ Categorias deletadas");

      // Deletar vínculos CompanyUser
      await tx.companyUser.deleteMany({});
      console.log("✅ Vínculos CompanyUser deletados");

      // Deletar empresas
      await tx.company.deleteMany({});
      console.log("✅ Empresas deletadas");
    });

    console.log("\n✅ Banco de dados limpo com sucesso!");
  } catch (error: any) {
    console.error("❌ Erro ao limpar banco de dados:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
clearCompanies()
  .then(() => {
    console.log("\n🎉 Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erro ao executar script:", error);
    process.exit(1);
  });

