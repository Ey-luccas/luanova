/**
 * Script para criar extensões padrão no banco de dados
 * Execute: npx ts-node src/scripts/seedExtensions.ts
 */

import prisma from "../config/prisma";

async function seedExtensions() {
  console.log("🌱 Iniciando seed de extensões...");

  try {
    // Verifica se a extensão de agendamento já existe
    const existingAppointment = await prisma.extension.findUnique({
      where: { name: "appointments" },
    });

    if (!existingAppointment) {
      const appointmentExtension = await prisma.extension.create({
        data: {
          name: "appointments",
          displayName: "Sistema de Agendamento",
          description:
            "Sistema completo de agendamento com calendário, gestão de clientes, profissionais, serviços e lista de espera. Ideal para qualquer tipo de negócio que precisa gerenciar horários e atendimentos.",
          price: 0, // Gratuito
          icon: "Calendar", // Ícone do lucide-react
          isActive: true,
          features: JSON.stringify([
            "Calendário visual (dia, semana, mês)",
            "Gestão completa de clientes",
            "Histórico de atendimentos por cliente",
            "Gestão de profissionais/atendentes",
            "Cadastro de serviços personalizados",
            "Gestão de salas e recursos",
            "Lista de espera inteligente",
            "Status de agendamentos (Pendente, Confirmado, Iniciado, Concluído, Cancelado)",
            "Ações rápidas (confirmar, iniciar, concluir)",
            "Tags e observações internas",
            "Última visita destacada",
          ]),
          dependencies: JSON.stringify(["services_management"]), // Requer gerenciamento de serviços
        },
      });

      console.log(
        "✅ Extensão de Agendamento criada:",
        appointmentExtension.id
      );
    } else {
      // Atualiza a extensão existente para incluir o ícone e dependências se não tiver
      const updateData: any = {};
      if (!existingAppointment.icon) {
        updateData.icon = "Calendar";
      }
      if (!existingAppointment.dependencies) {
        updateData.dependencies = JSON.stringify(["services_management"]);
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.extension.update({
          where: { id: existingAppointment.id },
          data: updateData,
        });
        console.log("✅ Extensão de Agendamento atualizada");
      } else {
        console.log(
          "ℹ️ Extensão de Agendamento já existe com ícone e dependências"
        );
      }
    }

    // Verifica se a extensão de restaurante já existe
    const existingRestaurant = await prisma.extension.findUnique({
      where: { name: "restaurant_system" },
    });

    if (!existingRestaurant) {
      const restaurantExtension = await prisma.extension.create({
        data: {
          name: "restaurant_system",
          displayName: "Sistema de Restaurante e Pizzaria",
          description:
            "Sistema completo para gestão de restaurantes, pizzarias e bares. Controle de mesas, comandas digitais, cardápio, cozinha, garçons, reservas e muito mais.",
          price: 0, // Gratuito
          icon: "UtensilsCrossed", // Ícone do lucide-react
          isActive: true,
          features: JSON.stringify([
            "Mapa visual de mesas com status em tempo real",
            "Comanda digital por mesa, balcão ou delivery",
            "Cardápio completo com categorias e fotos",
            "Envio automático de pedidos para cozinha",
            "Tela da cozinha (KDS) com controle de tempo",
            "Gestão de garçons, taxas e gorjetas",
            "Sistema de reservas",
            "Fechamento parcial e total",
            "Dividir conta por valor, itens ou pessoa",
            "Mover e juntar mesas",
            "Controle de tempo de preparo",
            "Relatórios e métricas completas",
            "Modos especiais para pizzaria (meia, terço, borda recheada)",
          ]),
        },
      });

      console.log("✅ Extensão de Restaurante criada:", restaurantExtension.id);
    } else {
      // Atualiza a extensão existente para incluir o ícone se não tiver
      if (!existingRestaurant.icon) {
        await prisma.extension.update({
          where: { id: existingRestaurant.id },
          data: { icon: "UtensilsCrossed" },
        });
        console.log("✅ Ícone adicionado à extensão de Restaurante");
      } else {
        console.log("ℹ️ Extensão de Restaurante já existe com ícone");
      }
    }

    // Verifica se a extensão de serviços já existe
    const existingServices = await prisma.extension.findUnique({
      where: { name: "services_management" },
    });

    if (!existingServices) {
      const servicesExtension = await prisma.extension.create({
        data: {
          name: "services_management",
          displayName: "Gerenciamento de Serviços",
          description:
            "Habilita o gerenciamento completo de serviços no sistema. Permite cadastrar, editar e gerenciar serviços prestados, além de registrar prestações de serviços nas movimentações.",
          price: 0, // Gratuito
          icon: "Briefcase", // Ícone do lucide-react
          isActive: true,
          features: JSON.stringify([
            "Cadastro e gestão de serviços",
            "Registro de prestações de serviços",
            "Histórico de serviços prestados",
            "Relatórios de serviços",
            "Integração com movimentações",
          ]),
        },
      });

      console.log(
        "✅ Extensão de Gerenciamento de Serviços criada:",
        servicesExtension.id
      );
    } else {
      // Atualiza a extensão existente para incluir o ícone se não tiver
      if (!existingServices.icon) {
        await prisma.extension.update({
          where: { id: existingServices.id },
          data: { icon: "Briefcase" },
        });
        console.log(
          "✅ Ícone adicionado à extensão de Gerenciamento de Serviços"
        );
      } else {
        console.log(
          "ℹ️ Extensão de Gerenciamento de Serviços já existe com ícone"
        );
      }
    }

    // Verifica se a extensão de produtos já existe
    const existingProducts = await prisma.extension.findUnique({
      where: { name: "products_management" },
    });

    if (!existingProducts) {
      const productsExtension = await prisma.extension.create({
        data: {
          name: "products_management",
          displayName: "Gerenciamento de Produtos",
          description:
            "Habilita o gerenciamento completo de produtos no sistema. Permite cadastrar, editar e gerenciar produtos físicos, controle de estoque, movimentações e muito mais.",
          price: 0, // Gratuito
          icon: "Package", // Ícone do lucide-react
          isActive: true,
          features: JSON.stringify([
            "Cadastro e gestão de produtos",
            "Controle de estoque em tempo real",
            "Movimentações de entrada e saída",
            "Código de barras",
            "Categorias e unidades",
            "Relatórios de produtos",
            "Alertas de estoque baixo",
            "Histórico de movimentações",
          ]),
        },
      });

      console.log(
        "✅ Extensão de Gerenciamento de Produtos criada:",
        productsExtension.id
      );
    } else {
      // Atualiza a extensão existente para incluir o ícone se não tiver
      if (!existingProducts.icon) {
        await prisma.extension.update({
          where: { id: existingProducts.id },
          data: { icon: "Package" },
        });
        console.log(
          "✅ Ícone adicionado à extensão de Gerenciamento de Produtos"
        );
      } else {
        console.log(
          "ℹ️ Extensão de Gerenciamento de Produtos já existe com ícone"
        );
      }
    }

    console.log("✨ Seed de extensões concluído!");
  } catch (error) {
    console.error("❌ Erro ao fazer seed de extensões:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  seedExtensions()
    .then(() => {
      console.log("✅ Processo concluído");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro:", error);
      process.exit(1);
    });
}

export default seedExtensions;
