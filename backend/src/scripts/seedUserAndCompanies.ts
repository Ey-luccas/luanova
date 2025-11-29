/**
 * Script para criar usuário e empresas de exemplo
 * Execute: npx ts-node src/scripts/seedUserAndCompanies.ts
 */

import prisma from '../config/prisma';
import bcrypt from 'bcrypt';

async function seedUserAndCompanies() {
  console.log('🌱 Iniciando seed de usuário e empresas...\n');

  try {
    const userEmail = 'eylucca@gmail.com';
    const userPassword = '1980Luca$';
    const userName = 'Lucas Oliveira';

    // 1. Verificar se o usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user) {
      console.log(`✅ Usuário já existe: ${userEmail}`);
      // Atualizar senha caso necessário
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword, name: userName },
      });
      console.log(`✅ Senha atualizada para o usuário\n`);
    } else {
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: hashedPassword,
        },
      });
      console.log(`✅ Usuário criado: ${userEmail}\n`);
    }

    // 2. Listar todas as empresas existentes do usuário
    const existingCompanies = await prisma.company.findMany({
      where: {
        companyUsers: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        companyUsers: true,
      },
    });

    console.log(`📋 Encontradas ${existingCompanies.length} empresas existentes`);

    // 3. Excluir todas as empresas existentes (cascade vai deletar tudo relacionado)
    if (existingCompanies.length > 0) {
      console.log('🗑️  Excluindo empresas existentes...');
      for (const company of existingCompanies) {
        await prisma.company.delete({
          where: { id: company.id },
        });
        console.log(`   ✅ Empresa "${company.name}" excluída`);
      }
      console.log('✅ Todas as empresas foram excluídas\n');
    }

    // 4. Criar novas empresas com nomes adequados para diferentes nichos
    const companiesData = [
      {
        name: 'TechStore - Loja de Eletrônicos',
        cnpj: '12.345.678/0001-90',
        email: 'contato@techstore.com.br',
        phone: '(11) 98765-4321',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
      },
      {
        name: 'Beleza & Estilo - Salão de Beleza',
        cnpj: '23.456.789/0001-01',
        email: 'contato@belezaestilo.com.br',
        phone: '(21) 99876-5432',
        address: 'Rua das Flores, 250 - Rio de Janeiro, RJ',
      },
      {
        name: 'SuperMercado Central',
        cnpj: '34.567.890/0001-12',
        email: 'contato@supercentral.com.br',
        phone: '(31) 98765-4321',
        address: 'Av. Afonso Pena, 1500 - Belo Horizonte, MG',
      },
      {
        name: 'Pizzaria Bella Italia',
        cnpj: '45.678.901/0001-23',
        email: 'contato@bellaitalia.com.br',
        phone: '(41) 99876-5432',
        address: 'Rua XV de Novembro, 500 - Curitiba, PR',
      },
      {
        name: 'AutoMecânica Express',
        cnpj: '56.789.012/0001-34',
        email: 'contato@automecanica.com.br',
        phone: '(51) 98765-4321',
        address: 'Av. Assis Brasil, 2000 - Porto Alegre, RS',
      },
      {
        name: 'Farmácia Vida Saudável',
        cnpj: '67.890.123/0001-45',
        email: 'contato@vidasaudavel.com.br',
        phone: '(85) 99876-5432',
        address: 'Av. Beira Mar, 800 - Fortaleza, CE',
      },
      {
        name: 'Academia FitLife',
        cnpj: '78.901.234/0001-56',
        email: 'contato@fitlife.com.br',
        phone: '(48) 98765-4321',
        address: 'Rua Felipe Schmidt, 300 - Florianópolis, SC',
      },
    ];

    console.log('🏢 Criando novas empresas...\n');

    // Buscar a extensão de produtos (extensão padrão)
    const productsExtension = await prisma.extension.findUnique({
      where: { name: 'products_management' },
    });

    if (!productsExtension) {
      throw new Error(
        'Extensão de produtos não encontrada. Execute o seed de extensões primeiro.',
      );
    }

    // Criar empresas e vincular ao usuário
    for (const companyData of companiesData) {
      const company = await prisma.company.create({
        data: {
          name: companyData.name,
          cnpj: companyData.cnpj,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
        },
      });

      // Vincular usuário como ADMIN
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: 'ADMIN',
        },
      });

      // Ativar extensão de produtos automaticamente
      await prisma.companyExtension.create({
        data: {
          companyId: company.id,
          extensionId: productsExtension.id,
          isActive: true,
        },
      });

      console.log(`   ✅ Empresa criada: ${company.name} (ID: ${company.id})`);
    }

    console.log(`\n✨ Seed concluído!`);
    console.log(`   👤 Usuário: ${userEmail}`);
    console.log(`   🔑 Senha: ${userPassword}`);
    console.log(`   🏢 Empresas criadas: ${companiesData.length}`);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
seedUserAndCompanies()
  .then(() => {
    console.log('\n✅ Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar seed:', error);
    process.exit(1);
  });

