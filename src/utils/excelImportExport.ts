import * as XLSX from 'xlsx';
import { Product, ProductCategory, ParsedImportItem } from '../types';

export const VALID_CATEGORIES: ProductCategory[] = [
  'Notebooks & Paper',
  'Writing Instruments',
  'Office & Desk',
  'Filing & Folders',
  'Art & Craft',
  'Print & Copy Services',
];

/**
 * Downloads a pre-formatted Excel (.xlsx) template for Rahel Stationary bulk import.
 * Contains two sheets: Item_Catalog_Template with realistic stationery samples,
 * and Instructions & Valid Values.
 */
export const downloadExcelTemplate = () => {
  // Sample stationery items demonstrating different categories and units
  const templateRows = [
    {
      'Product Name *': 'Leuchtturm1917 A5 Hardcover Dotted (Black)',
      'SKU': 'NB-LT-A5D',
      'Barcode': '4004117435123',
      'Category *': 'Notebooks & Paper',
      'Retail Price *': 26.50,
      'Cost Price': 13.25,
      'Opening Stock *': 35,
      'Min Stock Alert': 8,
      'Unit': 'each',
      'Description': '251 numbered pages, 80gsm ink-proof acid-free paper, 2 page markers and back pocket.',
    },
    {
      'Product Name *': 'Sakura Pigma Micron Fineliner Set (6 Pens, Black)',
      'SKU': 'WR-SAK-M6',
      'Barcode': '084511306371',
      'Category *': 'Writing Instruments',
      'Retail Price *': 18.95,
      'Cost Price': 9.50,
      'Opening Stock *': 40,
      'Min Stock Alert': 10,
      'Unit': 'pack',
      'Description': 'Archival Pigma pigment ink, waterproof and fade-proof. Sizes: 005, 01, 02, 03, 05, 08.',
    },
    {
      'Product Name *': 'Clairefontaine Triomphe A4 Writing Pad (Blank)',
      'SKU': 'NB-CF-TR4',
      'Barcode': '3329680373004',
      'Category *': 'Notebooks & Paper',
      'Retail Price *': 11.50,
      'Cost Price': 5.20,
      'Opening Stock *': 50,
      'Min Stock Alert': 12,
      'Unit': 'each',
      'Description': 'Extra white 90gsm satin-finish vellum paper, micro-perforated sheets, fountain pen friendly.',
    },
    {
      'Product Name *': 'Tombow Dual Brush Pens Pastel Palette (10-Pack)',
      'SKU': 'ART-TMB-10P',
      'Barcode': '085014561852',
      'Category *': 'Art & Craft',
      'Retail Price *': 29.90,
      'Cost Price': 15.00,
      'Opening Stock *': 25,
      'Min Stock Alert': 6,
      'Unit': 'set',
      'Description': 'Flexible brush tip and fine bullet tip in one pen. Water-based blendable ink for lettering and art.',
    },
    {
      'Product Name *': 'Kokuyo Harinacs Needleless Stapler (White)',
      'SKU': 'OF-KOK-H01',
      'Barcode': '4901480287478',
      'Category *': 'Office & Desk',
      'Retail Price *': 16.50,
      'Cost Price': 8.00,
      'Opening Stock *': 30,
      'Min Stock Alert': 5,
      'Unit': 'each',
      'Description': 'Press-fastens up to 10 sheets without metallic staple wires. Eco-friendly desktop essential.',
    },
    {
      'Product Name *': 'Maruman Mnemosyne N182 A5 Memo Pad (5mm Grid)',
      'SKU': 'NB-MRM-N182',
      'Barcode': '4979093182022',
      'Category *': 'Notebooks & Paper',
      'Retail Price *': 9.80,
      'Cost Price': 4.50,
      'Opening Stock *': 60,
      'Min Stock Alert': 15,
      'Unit': 'each',
      'Description': 'Micro-perforated 80gsm Japanese paper, wirebound with protective plastic covers.',
    },
    {
      'Product Name *': 'Midori Brass Ruler 16cm (Solid Brass)',
      'SKU': 'OF-MID-R16',
      'Barcode': '4945846421679',
      'Category *': 'Office & Desk',
      'Retail Price *': 22.00,
      'Cost Price': 10.00,
      'Opening Stock *': 20,
      'Min Stock Alert': 4,
      'Unit': 'each',
      'Description': 'Solid brass with laser engraved metric millimeter scale. Develops unique antique patina over time.',
    },
    {
      'Product Name *': 'Bantex Lever Arch File A4 PP 70mm (Midnight Black)',
      'SKU': 'FL-BTX-70B',
      'Barcode': '5702231456012',
      'Category *': 'Filing & Folders',
      'Retail Price *': 8.50,
      'Cost Price': 3.80,
      'Opening Stock *': 45,
      'Min Stock Alert': 10,
      'Unit': 'each',
      'Description': 'Strong cardboard core coated in wipe-clean polypropylene. Rado locking mechanism with spine ring.',
    },
  ];

  // Sheet 1: Template data
  const ws1 = XLSX.utils.json_to_sheet(templateRows);

  // Set column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 45 }, // Product Name
    { wch: 18 }, // SKU
    { wch: 18 }, // Barcode
    { wch: 24 }, // Category
    { wch: 14 }, // Retail Price
    { wch: 14 }, // Cost Price
    { wch: 16 }, // Opening Stock
    { wch: 16 }, // Min Stock Alert
    { wch: 10 }, // Unit
    { wch: 60 }, // Description
  ];

  // Sheet 2: Guidelines and Valid Enums
  const instructionsRows = [
    { 'Field / Column': 'Product Name *', 'Requirement': 'MANDATORY', 'Description': 'Brand and full product name (e.g. Rhodia Webnotebook A5 Dot Grid).' },
    { 'Field / Column': 'SKU', 'Requirement': 'RECOMMENDED', 'Description': 'Store unique item code. If left blank, Rahel POS auto-generates a unique SKU (e.g. ST-4821).' },
    { 'Field / Column': 'Barcode', 'Requirement': 'OPTIONAL', 'Description': 'Manufacturer UPC/EAN or store barcode. If left blank, a valid 12-digit barcode is auto-generated.' },
    { 'Field / Column': 'Category *', 'Requirement': 'MANDATORY', 'Description': 'Must match one of: Notebooks & Paper, Writing Instruments, Office & Desk, Filing & Folders, Art & Craft.' },
    { 'Field / Column': 'Retail Price *', 'Requirement': 'MANDATORY', 'Description': 'Numeric price charged at register (e.g. 24.50). Do not include currency symbols (ETB).' },
    { 'Field / Column': 'Cost Price', 'Requirement': 'RECOMMENDED', 'Description': 'Wholesale purchase cost used for margin and profit reporting (e.g. 12.00). Defaults to 50% of retail if omitted.' },
    { 'Field / Column': 'Opening Stock *', 'Requirement': 'MANDATORY', 'Description': 'Initial physical inventory count on shelf and in backroom (e.g. 25). Defaults to 10 if blank.' },
    { 'Field / Column': 'Min Stock Alert', 'Requirement': 'RECOMMENDED', 'Description': 'Threshold for low-stock reorder alerts (e.g. 5). Defaults to 5.' },
    { 'Field / Column': 'Unit', 'Requirement': 'OPTIONAL', 'Description': 'Unit of measure: each, pack, box, ream, set, bottle, roll. Defaults to "each".' },
    { 'Field / Column': 'Description', 'Requirement': 'OPTIONAL', 'Description': 'Detailed specifications, paper weight (gsm), ink characteristics, or size dimensions.' },
  ];

  const ws2 = XLSX.utils.json_to_sheet(instructionsRows);
  ws2['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 80 },
  ];

  // Create workbook and append sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Item_Catalog_Template');
  XLSX.utils.book_append_sheet(wb, ws2, 'Instructions & Valid Values');

  // Download file
  XLSX.writeFile(wb, 'Rahel_Stationary_Item_Import_Template.xlsx');
};

/**
 * Exports the entire current store inventory as an Excel (.xlsx) spreadsheet.
 */
export const exportInventoryToExcel = (products: Product[]) => {
  const exportRows = products.map((prod) => ({
    'ID': prod.id,
    'Product Name *': prod.name,
    'SKU': prod.sku,
    'Barcode': prod.barcode,
    'Category *': prod.category,
    'Retail Price *': prod.price,
    'Cost Price': prod.costPrice,
    'Margin (%)': prod.price > 0 ? Number((((prod.price - prod.costPrice) / prod.price) * 100).toFixed(1)) : 0,
    'Current Stock *': prod.stock,
    'Min Stock Alert': prod.minStockAlert,
    'Stock Status': prod.stock <= 0 ? 'OUT OF STOCK' : prod.stock <= prod.minStockAlert ? 'LOW STOCK' : 'IN STOCK',
    'Inventory Value (ETB)': Number((prod.price * prod.stock).toFixed(2)),
    'Unit': prod.unit,
    'Description': prod.description,
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws['!cols'] = [
    { wch: 14 }, // ID
    { wch: 42 }, // Name
    { wch: 16 }, // SKU
    { wch: 18 }, // Barcode
    { wch: 22 }, // Category
    { wch: 14 }, // Retail Price
    { wch: 14 }, // Cost Price
    { wch: 12 }, // Margin
    { wch: 16 }, // Current Stock
    { wch: 16 }, // Alert
    { wch: 16 }, // Status
    { wch: 18 }, // Valuation
    { wch: 10 }, // Unit
    { wch: 50 }, // Description
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rahel_Inventory_Catalog');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Rahel_Stationary_Inventory_Export_${dateStr}.xlsx`);
};

/**
 * Normalizes category names matching valid categories or keeps custom user category
 */
const matchCategory = (rawCat?: string): ProductCategory => {
  if (!rawCat || !rawCat.trim()) return 'Office & Desk';
  const clean = rawCat.trim();
  const lower = clean.toLowerCase();

  // Match known standard categories
  const exact = VALID_CATEGORIES.find(c => c.toLowerCase() === lower);
  if (exact) return exact;

  if (lower.includes('note') || lower.includes('paper') || lower.includes('pad') || lower.includes('journal')) {
    return 'Notebooks & Paper';
  }
  if (lower.includes('writ') || lower.includes('pen') || lower.includes('pencil') || lower.includes('marker') || lower.includes('ink')) {
    return 'Writing Instruments';
  }
  if (lower.includes('file') || lower.includes('folder') || lower.includes('binder') || lower.includes('arch')) {
    return 'Filing & Folders';
  }
  if (lower.includes('art') || lower.includes('craft') || lower.includes('paint') || lower.includes('brush') || lower.includes('color')) {
    return 'Art & Craft';
  }
  if (lower.includes('print') || lower.includes('copy') || lower.includes('service') || lower.includes('bind')) {
    return 'Print & Copy Services';
  }

  // Preserve custom category as typed!
  return clean;
};

/**
 * Generates an EAN-13 compatible checksum or 12-digit numeric barcode
 */
const generateRandomBarcode = (): string => {
  return `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
};

/**
 * Robust header normalizer: strips asterisks, symbols, brackets, and extra spaces
 * e.g. "Product Name *" -> "product name"
 * e.g. "Retail Price * (ETB)" -> "retail price etb"
 */
const normalizeHeaderKey = (rawKey: string): string => {
  return String(rawKey || '')
    .toLowerCase()
    .replace(/[*_#:\-()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Cleans numeric strings containing currency symbols, commas, or unit suffixes
 * e.g. "ETB 26.50", "26,50", "15 pcs", "$19.99"
 */
const parseCleanNumber = (val: any): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const str = String(val).trim();
  let cleaned = str.replace(/[^0-9.,-]/g, '').trim();
  if (!cleaned) return undefined;
  // If comma is used as decimal separator (e.g. "26,50" with no dots)
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Parses an Excel (.xlsx / .xls) or CSV file and audits every row
 */
export const parseUploadedItemSpreadsheet = async (
  file: File,
  existingProducts: Product[]
): Promise<ParsedImportItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Empty file content');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 1. Pick the best sheet containing catalog data
        let targetSheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('Item_Catalog_Template')) {
          targetSheetName = 'Item_Catalog_Template';
        } else {
          // Find sheet with the largest data range or non-instruction sheet
          let maxRows = 0;
          for (const name of workbook.SheetNames) {
            const ws = workbook.Sheets[name];
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
            const rowCount = range.e.r - range.s.r + 1;
            const isInstruction = name.toLowerCase().includes('instruction') || name.toLowerCase().includes('guide');
            if (rowCount > maxRows && (!isInstruction || workbook.SheetNames.length === 1)) {
              maxRows = rowCount;
              targetSheetName = name;
            }
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];
        if (!worksheet) {
          throw new Error('Selected worksheet could not be read.');
        }

        // 2. Read raw 2D array of rows to accurately detect header row
        const raw2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!raw2D || raw2D.length === 0) {
          throw new Error('No data rows found in the uploaded spreadsheet.');
        }

        // Header keywords to identify the header row
        const keyIndicatorWords = ['name', 'product', 'item', 'sku', 'code', 'barcode', 'category', 'price', 'cost', 'stock', 'qty', 'unit'];

        let headerRowIndex = 0;
        let bestMatchScore = 0;

        // Scan first 10 rows for the row that has the most matching column names
        const scanDepth = Math.min(10, raw2D.length);
        for (let r = 0; r < scanDepth; r++) {
          const rowCells = raw2D[r];
          if (!Array.isArray(rowCells)) continue;
          let score = 0;
          for (const cell of rowCells) {
            const cellNorm = normalizeHeaderKey(String(cell));
            if (cellNorm && keyIndicatorWords.some(kw => cellNorm.includes(kw))) {
              score++;
            }
          }
          if (score > bestMatchScore) {
            bestMatchScore = score;
            headerRowIndex = r;
          }
        }

        const headerRow = raw2D[headerRowIndex] || [];
        const headers: string[] = headerRow.map((c: any) => String(c).trim());

        // Extract data rows below header row
        const dataRows2D = raw2D.slice(headerRowIndex + 1);
        if (dataRows2D.length === 0) {
          throw new Error('No product data rows found below the header row.');
        }

        const existingSkus = new Set(existingProducts.map(p => p.sku.trim().toLowerCase()));
        const existingBarcodes = new Set(existingProducts.filter(p => p.barcode).map(p => p.barcode.trim()));

        const parsedItems: ParsedImportItem[] = [];

        dataRows2D.forEach((rowArray, idx) => {
          if (!Array.isArray(rowArray)) return;

          // Build row object mapping header -> cell value
          const rowObj: Record<string, any> = {};
          headers.forEach((h, colIdx) => {
            if (h) {
              rowObj[h] = rowArray[colIdx] !== undefined ? rowArray[colIdx] : '';
            }
          });

          // Helper to find value from row object matching candidate names
          const findVal = (candidates: string[]): any => {
            const normCands = candidates.map(c => normalizeHeaderKey(c));
            const entries = Object.entries(rowObj);

            // 1. Exact match on normalized header
            for (const [k, v] of entries) {
              const normK = normalizeHeaderKey(k);
              if (normCands.includes(normK)) {
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                  return v;
                }
              }
            }

            // 2. StartsWith or includes match
            for (const [k, v] of entries) {
              const normK = normalizeHeaderKey(k);
              for (const cand of normCands) {
                if (normK === cand || normK.startsWith(cand + ' ') || normK.includes(cand)) {
                  if (v !== undefined && v !== null && String(v).trim() !== '') {
                    return v;
                  }
                }
              }
            }
            return undefined;
          };

          const rawName = String(findVal(['product name', 'item name', 'name', 'product', 'item', 'title', 'description', 'particulars']) || '').trim();
          let rawSku = String(findVal(['sku', 'item code', 'product code', 'code', 'item no', 'sku code', 'id', 'item id']) || '').trim();
          let rawBarcode = String(findVal(['barcode', 'upc', 'ean', 'gtin', 'bar code', 'serial']) || '').trim();
          const rawCategory = String(findVal(['category', 'dept', 'department', 'group', 'type', 'section']) || '').trim();
          const rawPrice = findVal(['retail price', 'price', 'sell price', 'selling price', 'unit price', 'sales price', 'rate', 'retail', 'etb', 'amount']);
          const rawCost = findVal(['cost price', 'cost', 'buy price', 'purchase price', 'wholesale price', 'unit cost', 'purchase cost']);
          const rawStock = findVal(['opening stock', 'current stock', 'stock', 'quantity', 'qty', 'units', 'count', 'balance', 'on hand', 'inventory']);
          const rawMinStock = findVal(['min stock alert', 'min stock', 'alert', 'reorder level', 'reorder threshold', 'threshold', 'min alert']);
          const rawUnit = String(findVal(['unit', 'unit type', 'uom', 'measure', 'packaging', 'pack']) || 'each').trim();
          const rawDesc = String(findVal(['description', 'desc', 'notes', 'specifications', 'specs', 'details']) || '').trim();

          // Skip completely empty rows
          const isEmptyRow = !rawName && !rawSku && !rawBarcode && rawPrice === undefined && rawStock === undefined;
          if (isEmptyRow) {
            return;
          }

          const rowNum = headerRowIndex + 2 + idx; // 1-based row in Excel
          const issues: string[] = [];

          let isValid = true;
          let status: 'valid' | 'warning' | 'error' = 'valid';

          if (!rawName) {
            isValid = false;
            status = 'error';
            issues.push('Missing product name (mandatory).');
          }

          // SKU handling
          if (!rawSku) {
            rawSku = `ST-${Math.floor(1000 + Math.random() * 9000)}`;
            issues.push(`Auto-generated SKU [${rawSku}]`);
            if (status !== 'error') status = 'warning';
          }

          // Barcode handling
          if (!rawBarcode) {
            rawBarcode = generateRandomBarcode();
            issues.push('Auto-generated 12-digit barcode');
            if (status !== 'error') status = 'warning';
          }

          // Check if already matches existing product
          const matchedProd = existingProducts.find(
            p => p.sku.trim().toLowerCase() === rawSku.toLowerCase() ||
                 (rawBarcode && p.barcode.trim() === rawBarcode)
          );
          const isExistingMatch = !!matchedProd;

          if (isExistingMatch) {
            issues.push(`Matches existing product: "${matchedProd.name}" (${matchedProd.sku})`);
            if (status !== 'error') status = 'warning';
          }

          // Price handling
          let priceNum = parseCleanNumber(rawPrice);
          if (priceNum === undefined || priceNum < 0) {
            priceNum = 9.99;
            issues.push('Invalid price; defaulted to ETB 9.99');
            if (status !== 'error') status = 'warning';
          }

          // Cost handling
          let costNum = parseCleanNumber(rawCost);
          if (costNum === undefined || costNum < 0) {
            costNum = Number((priceNum * 0.5).toFixed(2));
            issues.push('Cost defaulted to 50% of retail price');
            if (status !== 'error') status = 'warning';
          }

          // Stock handling
          let stockNum = parseCleanNumber(rawStock);
          if (stockNum === undefined) {
            stockNum = 15;
            issues.push('Stock defaulted to 15 units');
            if (status !== 'error') status = 'warning';
          }

          // Min alert
          let minAlertNum = parseCleanNumber(rawMinStock);
          if (minAlertNum === undefined || minAlertNum < 0) {
            minAlertNum = 5;
          }

          const resolvedCategory = matchCategory(rawCategory);

          parsedItems.push({
            rowNumber: rowNum,
            name: rawName || 'Unnamed Item',
            sku: rawSku,
            barcode: rawBarcode,
            category: resolvedCategory,
            price: Number(priceNum.toFixed(2)),
            costPrice: Number(costNum.toFixed(2)),
            stock: Math.round(stockNum),
            minStockAlert: Math.round(minAlertNum),
            unit: rawUnit || 'each',
            description: rawDesc,
            isValid,
            status,
            issues,
            isExistingMatch,
            matchedProductId: matchedProd?.id,
          });
        });

        resolve(parsedItems);
      } catch (err: any) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };

    reader.readAsBinaryString(file);
  });
};
