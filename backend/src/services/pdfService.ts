/**
 * Service de Geração de PDFs
 *
 * Gera PDFs para relatórios usando pdfkit.
 */

import PDFDocument from "pdfkit";

// Interface do ReportData (mesma do reportService)
interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    type: "day" | "week" | "month" | "year";
  };
  sales: {
    total: number;
    totalValue: number;
    byType: {
      products: number;
      services: number;
    };
    averageTicket: number;
  };
  products: {
    totalSold: number;
    totalValue: number;
    lowStock: number;
    topSelling: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  services: {
    totalPerformed: number;
    totalValue: number;
    topServices: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  movements: {
    total: number;
    entries: number;
    exits: number;
    byDay: Array<{
      date: string;
      entries: number;
      exits: number;
    }>;
  };
  returns: {
    total: number;
    returns: number;
    refunds: number;
    exchanges: number;
    totalValue: number;
  };
  customers: {
    total: number;
    newCustomers: number;
    topCustomers: Array<{
      name: string;
      totalPurchases: number;
      totalValue: number;
    }>;
  };
  stock: {
    currentValue: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStock: number;
  };
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata data
 */
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

/**
 * Gera PDF completo do relatório
 */
export function generateReportPDF(
  reportData: ReportData,
  reportType: string = "full"
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);

    // Cabeçalho
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Relatório de Estoque", { align: "center" });
    doc.moveDown(0.5);

    const periodLabel =
      reportData.period.type === "day"
        ? "Dia"
        : reportData.period.type === "week"
          ? "Semana"
          : reportData.period.type === "month"
            ? "Mês"
            : "Ano";

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Período: ${periodLabel} - ${formatDate(reportData.period.startDate)} até ${formatDate(reportData.period.endDate)}`,
        { align: "center" }
      );
    doc.moveDown(1);

    // Vendas
    if (reportType === "full" || reportType === "sales") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("VENDAS", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total de Vendas: ${reportData.sales.total}`);
      doc.text(`Valor Total: ${formatCurrency(reportData.sales.totalValue)}`);
      doc.text(
        `Ticket Médio: ${formatCurrency(reportData.sales.averageTicket)}`
      );
      doc.text(
        `Produtos: ${reportData.sales.byType.products} | Serviços: ${reportData.sales.byType.services}`
      );
      doc.moveDown(1);
    }

    // Produtos
    if (reportType === "full" || reportType === "products") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("PRODUTOS", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Vendido: ${reportData.products.totalSold}`);
      doc.text(
        `Valor Total: ${formatCurrency(reportData.products.totalValue)}`
      );
      doc.text(`Estoque Baixo: ${reportData.products.lowStock}`);

      if (reportData.products.topSelling.length > 0) {
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Top 5 Produtos Mais Vendidos:");
        reportData.products.topSelling.slice(0, 5).forEach((product, index) => {
          doc.fontSize(10).font("Helvetica");
          doc.text(
            `${index + 1}. ${product.name} - Qtd: ${product.quantity} - ${formatCurrency(product.value)}`
          );
        });
      }
      doc.moveDown(1);
    }

    // Serviços
    if (reportType === "full" || reportType === "services") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("SERVIÇOS", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total Prestado: ${reportData.services.totalPerformed}`);
      doc.text(
        `Valor Total: ${formatCurrency(reportData.services.totalValue)}`
      );

      if (reportData.services.topServices.length > 0) {
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Top 5 Serviços Mais Prestados:");
        reportData.services.topServices
          .slice(0, 5)
          .forEach((service, index) => {
            doc.fontSize(10).font("Helvetica");
            doc.text(
              `${index + 1}. ${service.name} - Qtd: ${service.quantity} - ${formatCurrency(service.value)}`
            );
          });
      }
      doc.moveDown(1);
    }

    // Movimentações
    if (reportType === "full" || reportType === "movements") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("MOVIMENTAÇÕES", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total: ${reportData.movements.total}`);
      doc.text(`Entradas: ${reportData.movements.entries}`);
      doc.text(`Saídas: ${reportData.movements.exits}`);
      doc.moveDown(1);
    }

    // Devoluções/Reembolsos/Trocas
    if (reportType === "full" || reportType === "returns") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("DEVOLUÇÕES/REEMBOLSOS/TROCAS", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total: ${reportData.returns.total}`);
      doc.text(`Devoluções: ${reportData.returns.returns}`);
      doc.text(`Reembolsos: ${reportData.returns.refunds}`);
      doc.text(`Trocas: ${reportData.returns.exchanges}`);
      doc.text(`Valor Total: ${formatCurrency(reportData.returns.totalValue)}`);
      doc.moveDown(1);
    }

    // Clientes
    if (reportType === "full" || reportType === "customers") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("CLIENTES", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Total de Clientes: ${reportData.customers.total}`);
      doc.text(`Novos Clientes: ${reportData.customers.newCustomers}`);

      if (reportData.customers.topCustomers.length > 0) {
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica-Bold").text("Top 5 Clientes:");
        reportData.customers.topCustomers
          .slice(0, 5)
          .forEach((customer, index) => {
            doc.fontSize(10).font("Helvetica");
            doc.text(
              `${index + 1}. ${customer.name} - ${customer.totalPurchases} compras - ${formatCurrency(customer.totalValue)}`
            );
          });
      }
      doc.moveDown(1);
    }

    // Estoque
    if (reportType === "full" || reportType === "stock") {
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("ESTOQUE", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(
        `Valor do Estoque: ${formatCurrency(reportData.stock.currentValue)}`
      );
      doc.text(`Total de Produtos: ${reportData.stock.totalProducts}`);
      doc.text(`Estoque Baixo: ${reportData.stock.lowStockProducts}`);
      doc.text(`Sem Estoque: ${reportData.stock.outOfStock}`);
      doc.moveDown(1);
    }

    // Rodapé
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, {
        align: "center",
      });

    doc.end();
  });
}
