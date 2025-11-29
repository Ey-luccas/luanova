/**
 * Script para corrigir separação de Produtos e Serviços
 * 
 * Este script garante que:
 * - Todos os produtos tenham isService = false
 * - Todos os serviços tenham isService = true
 * - Produtos não tenham categoria "Serviços"
 * - Serviços não tenham categoria
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductServiceSeparation() {
  console.log('🔧 Iniciando correção de separação de Produtos e Serviços...\n');

  try {
    // Buscar todas as categorias
    const categories = await prisma.category.findMany({
      include: {
        products: true,
      },
    });

    // Encontrar categoria "Serviços" se existir
    const serviceCategory = categories.find(
      (cat) => cat.name.toLowerCase() === 'serviços' || cat.name.toLowerCase() === 'servicos'
    );

    console.log('📋 Categorias encontradas:', categories.length);
    if (serviceCategory) {
      console.log('   - Categoria "Serviços" encontrada (ID:', serviceCategory.id, ')');
    }

    // Buscar todos os produtos
    const allProducts = await prisma.product.findMany({
      include: {
        category: true,
      },
    });

    console.log('\n📦 Produtos encontrados:', allProducts.length);

    let productsUpdated = 0;
    let servicesUpdated = 0;
    let errors = 0;

    // Processar cada produto
    for (const product of allProducts) {
      try {
        const isInServiceCategory = serviceCategory && product.categoryId === serviceCategory.id;
        const shouldBeService = isInServiceCategory || product.isService === true;

        if (shouldBeService) {
          // É um serviço
          if (!product.isService || product.categoryId !== null) {
            await prisma.product.update({
              where: { id: product.id },
              data: {
                isService: true,
                categoryId: null, // Serviços não têm categoria
              },
            });
            servicesUpdated++;
            console.log(`   ✅ Serviço atualizado: ${product.name} (ID: ${product.id})`);
          }
        } else {
          // É um produto
          if (product.isService !== false) {
            await prisma.product.update({
              where: { id: product.id },
              data: {
                isService: false,
              },
            });
            productsUpdated++;
            console.log(`   ✅ Produto atualizado: ${product.name} (ID: ${product.id})`);
          }
        }
      } catch (error: any) {
        errors++;
        console.error(`   ❌ Erro ao atualizar produto ${product.id}:`, error.message);
      }
    }

    console.log('\n✅ Correção concluída!');
    console.log(`   - Produtos atualizados: ${productsUpdated}`);
    console.log(`   - Serviços atualizados: ${servicesUpdated}`);
    console.log(`   - Erros: ${errors}`);

    // Verificar resultado final
    const finalProducts = await prisma.product.count({
      where: { isService: false },
    });
    const finalServices = await prisma.product.count({
      where: { isService: true },
    });

    console.log('\n📊 Estatísticas finais:');
    console.log(`   - Total de produtos: ${finalProducts}`);
    console.log(`   - Total de serviços: ${finalServices}`);
  } catch (error: any) {
    console.error('❌ Erro ao executar correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixProductServiceSeparation()
  .then(() => {
    console.log('\n🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro ao executar script:', error);
    process.exit(1);
  });

