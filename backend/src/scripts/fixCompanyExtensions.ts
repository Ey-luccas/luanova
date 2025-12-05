/**
 * Script para corrigir extensões de empresas
 * Garante que todas as empresas tenham a extensão de produtos ativa (exceto se serviços estiver instalado)
 */

import prisma from "../config/prisma";
import { hasExtension } from "../services/extensionService";

async function fixCompanyExtensions() {
  console.log("🔧 Corrigindo extensões de empresas...\n");

  try {
    // Busca todas as empresas
    const companies = await prisma.company.findMany();
    console.log(`📦 Encontradas ${companies.length} empresas\n`);

    // Busca a extensão de produtos
    const productsExtension = await prisma.extension.findUnique({
      where: { name: "products_management" },
    });

    if (!productsExtension) {
      console.log("❌ Extensão de produtos não encontrada!");
      return;
    }

    let fixed = 0;
    let skipped = 0;

    for (const company of companies) {
      console.log(`🔍 Verificando empresa: ${company.name} (ID: ${company.id})`);

      // Verifica se serviços está instalado
      const hasServices = await hasExtension(
        company.id,
        "services_management"
      );

      // Busca extensão de produtos da empresa
      const existingProductsExtension = await prisma.companyExtension.findUnique({
        where: {
          companyId_extensionId: {
            companyId: company.id,
            extensionId: productsExtension.id,
          },
        },
      });

      if (!existingProductsExtension) {
        // Cria se não existe
        console.log(`   ✅ Criando extensão de produtos`);
        await prisma.companyExtension.create({
          data: {
            companyId: company.id,
            extensionId: productsExtension.id,
            isActive: true,
          },
        });
        fixed++;
      } else if (!existingProductsExtension.isActive && !hasServices) {
        // Reativa se está inativa e serviços não está instalado
        console.log(`   ✅ Reativando extensão de produtos`);
        await prisma.companyExtension.update({
          where: {
            id: existingProductsExtension.id,
          },
          data: {
            isActive: true,
          },
        });
        fixed++;
      } else {
        console.log(`   ⏭️  Já está correta (ativa: ${existingProductsExtension.isActive}, serviços: ${hasServices})`);
        skipped++;
      }
    }

    console.log(`\n✨ Correção concluída!`);
    console.log(`   - Empresas corrigidas: ${fixed}`);
    console.log(`   - Empresas já corretas: ${skipped}`);
  } catch (error) {
    console.error("❌ Erro ao corrigir extensões:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  fixCompanyExtensions()
    .then(() => {
      console.log("\n✅ Processo concluído");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Erro:", error);
      process.exit(1);
    });
}

export default fixCompanyExtensions;

