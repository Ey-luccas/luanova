import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProductUnits() {
  try {
    const units = await prisma.productUnit.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    console.log(`\n📦 Total de unidades encontradas: ${units.length}\n`);

    if (units.length === 0) {
      console.log('⚠️  Nenhuma unidade encontrada no banco de dados.\n');
      console.log('💡 Isso significa que as unidades não estão sendo criadas quando você adiciona estoque.\n');
      return;
    }

    // Agrupar por produto
    const unitsByProduct: { [key: number]: any[] } = {};
    units.forEach(unit => {
      if (!unitsByProduct[unit.productId]) {
        unitsByProduct[unit.productId] = [];
      }
      unitsByProduct[unit.productId].push(unit);
    });

    console.log(`📊 Unidades por produto:\n`);
    Object.keys(unitsByProduct).forEach(productId => {
      const productUnits = unitsByProduct[parseInt(productId)];
      const product = productUnits[0].product;
      console.log(`  🔹 Produto ID ${productId} - ${product.name}: ${productUnits.length} unidade(s)`);
      
      productUnits.forEach((unit, idx) => {
        const date = new Date(unit.createdAt).toLocaleString('pt-BR');
        console.log(`     ${idx + 1}. ID: ${unit.id} | Código: ${unit.barcode} | Criado: ${date} | Vendido: ${unit.isSold ? 'Sim' : 'Não'}`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao listar unidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProductUnits();
