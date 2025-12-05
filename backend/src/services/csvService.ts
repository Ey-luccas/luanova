/**
 * Service para geração e processamento de CSV
 *
 * Gera arquivos CSV para backup de dados e processa CSVs para restaurar empresas
 */

import prisma from '../config/prisma';
import * as companyService from './companyService';

/**
 * Parse de data no formato brasileiro
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  try {
    // Remove espaços extras
    const cleaned = dateStr.trim();
    
    // Tenta formato ISO primeiro (mais confiável)
    if (cleaned.includes('T') || cleaned.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Tenta formato brasileiro: "01/01/2024, 10:30:00" ou "01/01/2024 10:30:00"
    const withoutComma = cleaned.replace(/,/g, '');
    const parts = withoutComma.split(/\s+/);
    
    if (parts.length >= 2) {
      const datePart = parts[0]; // "01/01/2024"
      const timePart = parts[1]; // "10:30:00"
      
      if (datePart.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = datePart.split('/');
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Tenta apenas data brasileira: "01/01/2024"
    if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = cleaned.split('/');
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Fallback: tenta parse direto
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Gera CSV das movimentações (vendas) de uma empresa
 */
export async function generateSalesCSV(
  companyId: number,
  userId: number,
): Promise<string> {
  // Verifica acesso à empresa
  const hasAccess = await companyService.userHasAccessToCompany(
    userId,
    companyId,
  );
  if (!hasAccess) {
    throw new Error('Empresa não encontrada ou você não tem acesso');
  }

  // Busca todas as vendas da empresa
  const sales = await prisma.sale.findMany({
    where: {
      companyId,
    },
    include: {
      product: {
        select: {
          name: true,
          isService: true,
          unitPrice: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Busca informações da empresa
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  // Cabeçalho do CSV
  const headers = [
    'ID',
    'Data',
    'Tipo',
    'Produto/Serviço',
    'Quantidade',
    'Cliente',
    'CPF',
    'Email',
    'Forma de Pagamento',
    'Valor Unitário',
    'Valor Total',
    'Observações',
  ];

  // Linhas do CSV
  const rows = sales.map((sale) => {
    const unitPrice = Number(sale.product.unitPrice || 0);
    const quantity = Number(sale.quantity);
    const totalValue = unitPrice * quantity;

    // Formata data em ISO para facilitar restauração
    const dateISO = new Date(sale.createdAt).toISOString();
    
    // Formata valores monetários sem símbolos para facilitar parsing
    // Usa ponto como separador decimal
    const unitPriceFormatted = unitPrice.toFixed(2).replace('.', ',');
    const totalValueFormatted = totalValue.toFixed(2).replace('.', ',');

    return [
      sale.id.toString(),
      dateISO, // ISO format para facilitar parsing
      sale.type === 'SALE'
        ? 'Venda'
        : sale.type === 'SERVICE'
          ? 'Serviço'
          : sale.type === 'RETURN'
            ? 'Devolução'
            : 'Reembolso',
      sale.product.name,
      quantity.toString(),
      sale.customerName || '',
      sale.customerCpf || '',
      sale.customerEmail || '',
      sale.paymentMethod || '',
      unitPriceFormatted, // Formato simples: "10,50" ao invés de "R$ 10,50"
      totalValueFormatted, // Formato simples: "10,50" ao invés de "R$ 10,50"
      sale.observations || '',
    ];
  });

  // Gera o CSV com formato mais simples para facilitar restauração
  // Linha 1: Nome da empresa (para extração)
  // Linha 2: Data de geração (informação)
  // Linha 3: vazia
  // Linha 4: Cabeçalho (sem aspas para facilitar detecção)
  // Linhas seguintes: Dados (com aspas para valores que podem conter vírgulas)
  const csvLines: string[] = [];
  
  // Metadados
  csvLines.push(`Backup de Movimentações - ${company?.name || 'Empresa'}`);
  csvLines.push(`Gerado em: ${new Date().toISOString()}`);
  csvLines.push(''); // Linha vazia
  
  // Cabeçalho (sem aspas para facilitar detecção)
  csvLines.push(headers.join(','));
  
  // Dados (com aspas para valores que podem conter vírgulas)
  rows.forEach((row) => {
    const escapedRow = row.map((cell) => {
      const str = String(cell);
      // Se contém vírgula, aspas ou quebra de linha, precisa de aspas
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvLines.push(escapedRow.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Processa CSV de backup e restaura empresa com movimentações
 */
export async function restoreCompanyFromCSV(
  csvContent: string,
  userId: number,
): Promise<{ company: any; salesCount: number }> {
  // Remove BOM (Byte Order Mark) se presente
  let cleanContent = csvContent;
  if (csvContent.length > 0 && csvContent.charCodeAt(0) === 0xfeff) {
    cleanContent = csvContent.slice(1);
  }
  
  // Parse do CSV - normaliza quebras de linha
  cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanContent.split('\n');
  
  // Remove linhas vazias e encontra o cabeçalho
  let dataStartIndex = -1;
  let headerLine = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Procura linha que contenha 'ID' e 'Data' (cabeçalho)
    // Remove aspas se houver para comparação
    const cleanLine = line.replace(/"/g, '');
    if (cleanLine.includes('ID') && cleanLine.includes('Data')) {
      headerLine = line;
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1 || !headerLine) {
    throw new Error('Formato de CSV inválido. Cabeçalho não encontrado.');
  }

  // Extrai nome da empresa do cabeçalho (primeira linha)
  let companyName = 'Empresa Restaurada';
  const firstLine = lines[0];
  const nameMatch = firstLine.match(/Backup de Movimentações - (.+)/);
  if (nameMatch) {
    companyName = nameMatch[1].trim();
  }

  // Parse das linhas de dados
  const salesData: Array<{
    date: string;
    type: string;
    productName: string;
    quantity: number;
    customerName: string;
    customerCpf?: string;
    customerEmail?: string;
    paymentMethod?: string;
    unitPrice: number;
    observations?: string;
  }> = [];

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (considerando aspas e vírgulas)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          // Aspas duplas escapadas
          current += '"';
          j++;
        } else {
          // Toggle aspas
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Vírgula fora de aspas = separador
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // Adiciona último valor
    values.push(current.trim());

    // Valida que tem pelo menos 12 colunas
    if (values.length < 12) {
      console.warn(`Linha ${i + 1} ignorada: apenas ${values.length} colunas encontradas`);
      continue;
    }

    try {
      // Remove aspas de todos os valores
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
      
      // Extrai valores
      // const id = cleanValues[0] || '';
      const date = cleanValues[1] || '';
      const typeStr = cleanValues[2] || '';
      const productName = cleanValues[3] || '';
      const quantityStr = cleanValues[4] || '1';
      const customerName = cleanValues[5] || '';
      const customerCpf = cleanValues[6] || '';
      const customerEmail = cleanValues[7] || '';
      const paymentMethod = cleanValues[8] || '';
      const unitPriceStr = cleanValues[9] || '0';
      const observations = cleanValues[11] || '';

      // Valida campos obrigatórios
      if (!productName || !customerName) {
        console.warn(`Linha ${i + 1} ignorada: produto ou cliente vazio`);
        continue;
      }

      // Converte quantidade (formato esperado: número com vírgula ou ponto decimal)
      const cleanQuantity = quantityStr.replace(/[^\d.,-]/g, '').replace(',', '.');
      const quantity = parseFloat(cleanQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        console.warn(`Linha ${i + 1} ignorada: quantidade inválida: ${quantityStr}`);
        continue;
      }

      // Converte preço unitário
      // Formato esperado: "10,50" (vírgula como separador decimal)
      // ou "R$ 10,50" (com símbolo de moeda)
      let cleanPrice = unitPriceStr
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .trim();
      
      // Se tem vírgula, assume formato brasileiro (10,50)
      if (cleanPrice.includes(',')) {
        // Remove pontos de milhar se houver
        cleanPrice = cleanPrice.replace(/\.(?=\d{3})/g, '');
        // Converte vírgula para ponto
        cleanPrice = cleanPrice.replace(',', '.');
      }
      
      const unitPrice = parseFloat(cleanPrice) || 0;

      // Mapeia tipo
      let type: 'SALE' | 'SERVICE' | 'RETURN' | 'REFUND' = 'SALE';
      if (typeStr.includes('Serviço')) {
        type = 'SERVICE';
      } else if (typeStr.includes('Devolução')) {
        type = 'RETURN';
      } else if (typeStr.includes('Reembolso')) {
        type = 'REFUND';
      }

      salesData.push({
        date,
        type,
        productName,
        quantity,
        customerName,
        customerCpf: customerCpf || undefined,
        customerEmail: customerEmail || undefined,
        paymentMethod: paymentMethod as any,
        unitPrice,
        observations: observations || undefined,
      });
    } catch (err) {
      console.error(`Erro ao processar linha ${i + 1}:`, err);
      // Continua processando outras linhas
    }
  }

  if (salesData.length === 0) {
    throw new Error('Nenhuma movimentação válida encontrada no CSV.');
  }

  // Cria a empresa e restaura as movimentações em uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Cria a empresa
    const company = await tx.company.create({
      data: {
        name: companyName,
      },
    });

    // Cria o vínculo CompanyUser
    await tx.companyUser.create({
      data: {
        userId,
        companyId: company.id,
        role: 'ADMIN',
      },
    });

    // Agrupa produtos por nome para criar/recuperar
    const productsMap = new Map<string, number>();
    let salesCount = 0;

    // Processa cada movimentação
    for (const saleData of salesData) {
      // Busca ou cria o produto/serviço
      let productId = productsMap.get(saleData.productName);
      
      if (!productId) {
        const isService = saleData.type === 'SERVICE';
        const product = await tx.product.create({
          data: {
            name: saleData.productName,
            companyId: company.id,
            isService,
            unitPrice: saleData.unitPrice,
            currentStock: isService ? 0 : saleData.quantity, // Para serviços, estoque é 0
          },
        });
        productId = product.id;
        productsMap.set(saleData.productName, productId);
      }

      // Cria a venda/movimentação
      await tx.sale.create({
        data: {
          productId,
          companyId: company.id,
          userId,
          type: saleData.type,
          quantity: saleData.quantity,
          customerName: saleData.customerName,
          customerCpf: saleData.customerCpf || null,
          customerEmail: saleData.customerEmail || null,
          paymentMethod: saleData.paymentMethod || null,
          observations: saleData.observations || null,
          createdAt: saleData.date
            ? parseDate(saleData.date) || new Date()
            : new Date(),
        },
      });

      salesCount++;
    }

    return { company, salesCount };
  });

  return result;
}

