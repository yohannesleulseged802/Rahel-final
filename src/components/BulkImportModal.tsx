import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  X, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Search, 
  RefreshCw,
  ShoppingBag,
  QrCode,
  Package
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ParsedImportItem, Product } from '../types';
import { 
  downloadExcelTemplate, 
  exportInventoryToExcel, 
  parseUploadedItemSpreadsheet 
} from '../utils/excelImportExport';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLabels?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLabels,
}) => {
  const { products, bulkImportProducts, showToast, setActiveTab } = usePOS();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Parsed Items
  const [parsedRows, setParsedRows] = useState<ParsedImportItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  // Import Mode
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');

  // Preview Filters
  const [filterTab, setFilterTab] = useState<'all' | 'ready' | 'warnings' | 'errors' | 'matches'>('all');
  const [searchPreview, setSearchPreview] = useState('');

  // Post-import State
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const items = await parseUploadedItemSpreadsheet(file, products);
      setParsedRows(items);
      setFileName(file.name);
      setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      showToast(`Successfully analyzed ${items.length} rows from ${file.name}`);
    } catch (err: any) {
      console.error('File parsing error', err);
      setErrorMessage(err.message || 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileProcess(file);
    }
  };

  // Demo Sample File loader (creates an in-memory sample for instant testing)
  const handleLoadSampleBatch = () => {
    const demoItems: ParsedImportItem[] = [
      {
        rowNumber: 2,
        name: 'Fabriano EcoQua A5 Glued Notebook (Grid, Wine)',
        sku: 'NB-FAB-A5W',
        barcode: '8001348182914',
        category: 'Notebooks & Paper',
        price: 8.50,
        costPrice: 4.10,
        stock: 30,
        minStockAlert: 8,
        unit: 'each',
        description: 'Ecological 85gsm Bioprima paper with FSC certified lightfast cover.',
        isValid: true,
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 3,
        name: 'Kaweco Classic Sport Fountain Pen (Fox, Fine)',
        sku: 'WR-KAW-FOX',
        barcode: '4250278601249',
        category: 'Writing Instruments',
        price: 28.00,
        costPrice: 13.50,
        stock: 18,
        minStockAlert: 5,
        unit: 'each',
        description: 'Pocket fountain pen with gold-plated steel nib and iridium tip.',
        isValid: true,
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 4,
        name: 'Rhodia Webnotebook A5 Dot Grid (Black)',
        sku: 'NB-RHO-A5D', // Existing match!
        barcode: '3037921188012',
        category: 'Notebooks & Paper',
        price: 25.00, // Price updated from 24.50
        costPrice: 12.00,
        stock: 45, // Stock restocked
        minStockAlert: 8,
        unit: 'each',
        description: '90gsm Clairefontaine ivory paper, hardcover.',
        isValid: true,
        status: 'warning',
        issues: ['Matches existing product: "Rhodia Webnotebook A5 Dot Grid (Black)" (NB-RHO-A5D)'],
        isExistingMatch: true,
      },
      {
        rowNumber: 5,
        name: 'Rotring 600 Mechanical Pencil 0.5mm (Silver)',
        sku: 'WR-ROT-600',
        barcode: '3501179044439',
        category: 'Writing Instruments',
        price: 38.50,
        costPrice: 19.00,
        stock: 22,
        minStockAlert: 5,
        unit: 'each',
        description: 'Full metal hexagonal body with knurled grip and fixed lead guidance sleeve.',
        isValid: true,
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 6,
        name: 'Pilot Iroshizuku Bottled Ink 50ml (Kon-peki Deep Cerulean)',
        sku: 'WR-PLT-KON',
        barcode: '4902505367625',
        category: 'Writing Instruments',
        price: 24.00,
        costPrice: 11.50,
        stock: 16,
        minStockAlert: 4,
        unit: 'bottle',
        description: 'Luxury Japanese fountain pen ink inspired by beautiful natural landscapes.',
        isValid: true,
        status: 'valid',
        issues: [],
      },
      {
        rowNumber: 7,
        name: 'Deli Heavy Duty 2-Hole Paper Punch 70 Sheets',
        sku: '', // missing SKU - test auto generation
        barcode: '6921734901358',
        category: 'Office & Desk',
        price: 21.50,
        costPrice: 10.00,
        stock: 15,
        minStockAlert: 4,
        unit: 'each',
        description: 'All-metal construction with adjustable centering guide.',
        isValid: true,
        status: 'warning',
        issues: ['Auto-generated SKU [ST-8492]'],
      },
      {
        rowNumber: 8,
        name: 'Winsor & Newton Cotman Watercolor Pocket Plus Set (12 Half Pans)',
        sku: 'ART-WN-COT12',
        barcode: '', // missing barcode - test auto generation
        category: 'Art & Craft',
        price: 27.90,
        costPrice: 13.80,
        stock: 20,
        minStockAlert: 6,
        unit: 'set',
        description: 'High quality fine art pigments with travel brush and integrated mixing palettes.',
        isValid: true,
        status: 'warning',
        issues: ['Auto-generated 12-digit barcode'],
      },
    ];

    setParsedRows(demoItems);
    setFileName('Rahel_Stationary_Demo_Batch.xlsx');
    setFileSize('14.2 KB');
    setErrorMessage(null);
    setImportResult(null);
    showToast('Loaded demo stationery batch with 7 items for preview.');
  };

  // Filtered rows for the audit table
  const filteredRows = parsedRows.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchPreview.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchPreview.toLowerCase()) ||
      item.barcode.includes(searchPreview) ||
      item.category.toLowerCase().includes(searchPreview.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'ready') return item.status === 'valid';
    if (filterTab === 'warnings') return item.status === 'warning';
    if (filterTab === 'errors') return item.status === 'error';
    if (filterTab === 'matches') return !!item.isExistingMatch;
    return true;
  });

  // KPI counts
  const totalCount = parsedRows.length;
  const validCount = parsedRows.filter(r => r.isValid).length;
  const warningsCount = parsedRows.filter(r => r.status === 'warning').length;
  const errorsCount = parsedRows.filter(r => r.status === 'error').length;
  const matchesCount = parsedRows.filter(r => r.isExistingMatch).length;

  const handleCommitImport = async () => {
    const validItemsToImport = parsedRows
      .filter(r => r.isValid)
      .map(r => ({
        name: r.name,
        sku: r.sku,
        barcode: r.barcode,
        category: r.category,
        price: r.price,
        costPrice: r.costPrice,
        stock: r.stock,
        minStockAlert: r.minStockAlert,
        unit: r.unit,
        description: r.description,
      }));

    if (validItemsToImport.length === 0) {
      showToast('No valid items found to import.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    try {
      const res = await bulkImportProducts(validItemsToImport, importMode);
      setImportResult(res);
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setErrorMessage(err.message || 'Failed to import products to database.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName(null);
    setFileSize(null);
    setErrorMessage(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-neutral-800 bg-neutral-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-bold shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-100 tracking-tight">
                  Bulk Item Import &amp; Template Studio
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Excel (.xlsx) &amp; CSV
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Import complete inventory catalogs, restock lists, or download pre-formatted Excel templates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">

          {/* SUCCESS BANNER POST-IMPORT */}
          {importResult && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/50 via-neutral-900 to-neutral-900 border border-emerald-500/40 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-emerald-300">
                    Import Succeeded! Store Catalog Updated
                  </h3>
                  <p className="text-xs text-neutral-300">
                    Successfully processed {importResult.added + importResult.updated} items from <span className="font-semibold text-neutral-100">{fileName}</span> into Rahel Stationary POS.
                  </p>
                </div>
              </div>

              {/* Counts Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                  <div className="text-[11px] text-neutral-400">New Products Added</div>
                  <div className="text-xl font-bold font-mono-numbers text-emerald-400 mt-0.5">
                    +{importResult.added}
                  </div>
                </div>
                <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800">
                  <div className="text-[11px] text-neutral-400">Existing Items Updated</div>
                  <div className="text-xl font-bold font-mono-numbers text-amber-400 mt-0.5">
                    {importResult.updated}
                  </div>
                </div>
                <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-neutral-400">Current Total Catalog</div>
                  <div className="text-xl font-bold font-mono-numbers text-neutral-100 mt-0.5">
                    {products.length} Items
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('inventory');
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>View Updated Inventory Catalog</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('labels');
                    if (onNavigateToLabels) onNavigateToLabels();
                  }}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Generate Labels &amp; QR Codes</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-medium ml-auto flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
              </div>
            </div>
          )}

          {/* TEMPLATE DOWNLOAD & EXPORT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Official Template Download */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/25 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Excel Template (.xlsx)
                  </span>
                  <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">
                    2 Sheets
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-100">
                  Rahel Stationary Item Catalog Template
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Includes formatted columns (Name, SKU, Barcode, Category, Price, Cost, Stock, Unit, Description), 8 pre-filled stationery samples, and category validation instructions.
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-neutral-850 flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadExcelTemplate();
                    showToast('Excel Template downloaded to your computer.');
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Blank Template (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Export Current Live Catalog */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-neutral-400" /> Catalog Backup (.xlsx)
                  </span>
                  <span className="text-[10px] bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">
                    {products.length} Products
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-100">
                  Export Current Inventory Spreadsheet
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Export all active stationery products with current stock counts, prices, costs, barcodes, and profit margins. Can be edited and re-imported anytime.
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-neutral-850 flex items-center gap-2">
                <button
                  onClick={() => {
                    exportInventoryToExcel(products);
                    showToast(`Exported ${products.length} products to Excel spreadsheet.`);
                  }}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Export Live Inventory (.xlsx)</span>
                </button>
              </div>
            </div>

          </div>

          {/* FILE UPLOAD DROPZONE */}
          {!importResult && parsedRows.length === 0 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                  : 'border-neutral-800 hover:border-amber-500/40 bg-neutral-950/60 hover:bg-neutral-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                {isLoading ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>

              <div className="text-sm font-semibold text-neutral-100">
                {isLoading ? 'Analyzing spreadsheet...' : 'Click to browse or drag and drop your spreadsheet here'}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Supports Microsoft Excel files (<span className="text-neutral-200">.xlsx</span>, <span className="text-neutral-200">.xls</span>) and Comma-Separated Values (<span className="text-neutral-200">.csv</span>)
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-[11px] text-neutral-500">or</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSampleBatch();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-amber-300 border border-neutral-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample Stationery Batch (7 Items)</span>
                </button>
              </div>
            </div>
          )}

          {/* PARSED ERROR DISPLAY */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-300 text-xs">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <div className="font-bold text-rose-200">Spreadsheet Parsing Issue</div>
                <div className="mt-0.5 leading-relaxed">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* PARSED DATA PREVIEW & AUDIT LEDGER */}
          {!importResult && parsedRows.length > 0 && (
            <div className="space-y-4">
              
              {/* File Info & Change File Button */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                      <span>{fileName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono font-normal">({fileSize})</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Found {totalCount} rows ready for audit.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* KPI Quality Audit Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-neutral-850 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Total Rows</div>
                  <div className="text-xl font-bold font-mono-numbers text-neutral-100 mt-0.5">{totalCount}</div>
                </button>

                <button
                  onClick={() => setFilterTab('ready')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterTab === 'ready'
                      ? 'bg-neutral-850 border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-emerald-300 mt-0.5">{validCount}</div>
                </button>

                <button
                  onClick={() => setFilterTab('warnings')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterTab === 'warnings'
                      ? 'bg-neutral-850 border-amber-500/60 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Auto-Fixed
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-amber-300 mt-0.5">{warningsCount}</div>
                </button>

                <button
                  onClick={() => setFilterTab('matches')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterTab === 'matches'
                      ? 'bg-neutral-850 border-sky-500/60 ring-1 ring-sky-500/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Matches
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-sky-300 mt-0.5">{matchesCount}</div>
                </button>

                <button
                  onClick={() => setFilterTab('errors')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    filterTab === 'errors'
                      ? 'bg-neutral-850 border-rose-500/60 ring-1 ring-rose-500/40'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Errors
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-rose-400 mt-0.5">{errorsCount}</div>
                </button>
              </div>

              {/* IMPORT MODE CONTROLS */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="text-xs font-bold text-neutral-200">
                  Select Import Action for Existing Products:
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <label
                    onClick={() => setImportMode('upsert')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      importMode === 'upsert'
                        ? 'bg-neutral-900 border-amber-500/50 text-neutral-100 shadow-xs'
                        : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">
                        Upsert / Sync Existing <span className="text-[10px] text-amber-400 font-normal">(Recommended)</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Updates price &amp; stock for items matching SKU or Barcode; inserts new items.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      importMode === 'append'
                        ? 'bg-neutral-900 border-amber-500/50 text-neutral-100 shadow-xs'
                        : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">
                        Append Only
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Adds all rows as new catalog entries. Assigns unique suffix if SKU already exists.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      importMode === 'replace'
                        ? 'bg-rose-950/30 border-rose-500/50 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-500 focus:ring-rose-500"
                    />
                    <div>
                      <div className="text-xs font-semibold text-rose-300">
                        Replace Full Catalog
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Overwrites entire existing inventory with this imported spreadsheet list.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* FILTER & SEARCH BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Search preview rows..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 rounded-lg text-neutral-200 outline-none"
                  />
                </div>

                <div className="text-xs text-neutral-400 self-end sm:self-center">
                  Showing {filteredRows.length} of {parsedRows.length} rows
                </div>
              </div>

              {/* AUDIT TABLE */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/90 text-neutral-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-neutral-800 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Item Name</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Barcode</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Cost</th>
                        <th className="py-2.5 px-3 text-right">Stock</th>
                        <th className="py-2.5 px-3">Status &amp; Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850">
                      {filteredRows.map((item, index) => {
                        return (
                          <tr
                            key={index}
                            className={`hover:bg-neutral-900/60 transition-colors ${
                              item.status === 'error'
                                ? 'bg-rose-950/20'
                                : item.isExistingMatch
                                ? 'bg-sky-950/10'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">
                              #{item.rowNumber}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-neutral-100 max-w-[200px] truncate" title={item.name}>
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-neutral-300">
                              {item.sku}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400">
                              {item.barcode}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-300">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-900 border border-neutral-800">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-300">
                              ETB {item.price.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-neutral-400">
                              ETB {item.costPrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-neutral-200">
                              {item.stock} {item.unit}
                            </td>
                            <td className="py-2.5 px-3">
                              {item.status === 'valid' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                </span>
                              )}
                              {item.status === 'warning' && (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                    <AlertTriangle className="w-3.5 h-3.5" /> 
                                    {item.isExistingMatch ? 'Match Found' : 'Auto-Assigned'}
                                  </span>
                                  {item.issues.map((iss, i) => (
                                    <div key={i} className="text-[10px] text-neutral-400 truncate max-w-[220px]" title={iss}>
                                      • {iss}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {item.status === 'error' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                                  <XCircle className="w-3.5 h-3.5" /> {item.issues.join(', ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            {parsedRows.length > 0 && !importResult ? (
              <span>
                Ready to process <strong className="text-amber-300 font-mono">{validCount}</strong> valid stationery items.
              </span>
            ) : (
              <span>Excel standard .xlsx &amp; CSV compatible.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {importResult ? 'Close' : 'Cancel'}
            </button>

            {!importResult && parsedRows.length > 0 && (
              <button
                onClick={handleCommitImport}
                disabled={validCount === 0 || isImporting}
                className="px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Syncing &amp; Saving to Cloud Database...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>
                      Import {validCount} Items ({importMode.toUpperCase()})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
