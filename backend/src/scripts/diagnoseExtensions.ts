/**
 * Script de diagnóstico de extensões
 * Verifica se extensões estão cadastradas e associadas às empresas
 */

import prisma from "../config/prisma";

async function diagnoseExtensions() {
  console.log("🔍 Diagnóstico de Extensões\n");

  try {
    // 1. Verificar extensões cadastradas
    console.log("1️⃣ Verificando extensões cadastradas...");
    const extensions = await prisma.extension.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    console.log(`   ✅ Encontradas ${extensions.length} extensões:`);
    extensions.forEach((ext) => {
      console.log(`      - ${ext.name} (${ext.displayName}) - ID: ${ext.id}`);
    });

    if (extensions.length === 0) {
      console.log("   ⚠️  NENHUMA EXTENSÃO CADASTRADA!");
      console.log("   💡 Execute: npx ts-node src/scripts/seedExtensions.ts");
      return;
    }

    console.log("");

    // 2. Verificar empresas
    console.log("2️⃣ Verificando empresas...");
    const companies = await prisma.company.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    console.log(`   ✅ Encontradas ${companies.length} empresas:`);
    companies.forEach((company) => {
      console.log(`      - ${company.name} (ID: ${company.id})`);
    });

    if (companies.length === 0) {
      console.log("   ⚠️  NENHUMA EMPRESA CADASTRADA!");
      return;
    }

    console.log("");

    // 3. Verificar extensões por empresa
    console.log("3️⃣ Verificando extensões por empresa...\n");
    for (const company of companies) {
      console.log(`   📦 Empresa: ${company.name} (ID: ${company.id})`);

      // Busca todas as extensões da empresa (ativas e inativas)
      const allCompanyExtensions = await prisma.companyExtension.findMany({
        where: { companyId: company.id },
        include: { extension: true },
      });

      console.log(`      Total de extensões associadas: ${allCompanyExtensions.length}`);

      // Separa ativas e inativas
      const active = allCompanyExtensions.filter((ce) => ce.isActive);
      const inactive = allCompanyExtensions.filter((ce) => !ce.isActive);

      if (active.length > 0) {
        console.log(`      ✅ Extensões ATIVAS (${active.length}):`);
        active.forEach((ce) => {
          console.log(`         - ${ce.extension.name} (${ce.extension.displayName})`);
        });
      } else {
        console.log(`      ⚠️  Nenhuma extensão ATIVA`);
      }

      if (inactive.length > 0) {
        console.log(`      ❌ Extensões INATIVAS (${inactive.length}):`);
        inactive.forEach((ce) => {
          console.log(`         - ${ce.extension.name} (${ce.extension.displayName})`);
        });
      }

      // Verifica se produtos está ativo (extensão padrão)
      const productsExtension = extensions.find(
        (e) => e.name === "products_management"
      );
      if (productsExtension) {
        const productsCE = allCompanyExtensions.find(
          (ce) => ce.extensionId === productsExtension.id
        );
        if (!productsCE) {
          console.log(`      ⚠️  Extensão de PRODUTOS não está associada (deveria estar como padrão)`);
        } else if (!productsCE.isActive) {
          console.log(`      ⚠️  Extensão de PRODUTOS está INATIVA (deveria estar ativa por padrão)`);
        }
      }

      console.log("");
    }

    // 4. Resumo
    console.log("4️⃣ Resumo:");
    console.log(`   - Extensões cadastradas: ${extensions.length}`);
    console.log(`   - Empresas cadastradas: ${companies.length}`);
    
    const totalCompanyExtensions = await prisma.companyExtension.count();
    const activeCompanyExtensions = await prisma.companyExtension.count({
      where: { isActive: true },
    });
    
    console.log(`   - Total de associações empresa-extensão: ${totalCompanyExtensions}`);
    console.log(`   - Associações ativas: ${activeCompanyExtensions}`);
    console.log(`   - Associações inativas: ${totalCompanyExtensions - activeCompanyExtensions}`);

    console.log("\n✨ Diagnóstico concluído!");
  } catch (error) {
    console.error("❌ Erro ao diagnosticar:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  diagnoseExtensions()
    .then(() => {
      console.log("\n✅ Processo concluído");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Erro:", error);
      process.exit(1);
    });
}

export default diagnoseExtensions;

