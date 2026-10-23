import React, { useState, useEffect, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Barcode, 
  Printer, 
  Layers, 
  Settings2, 
  Check, 
  Sparkles, 
  Search, 
  Maximize2, 
  Plus, 
  RefreshCw, 
  Eye, 
  Download,
  Tag,
  ArrowRight,
  Info,
  FileSpreadsheet
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product, LengthUnit, LabelTemplate } from '../types';

export const LabelStudio: React.FC = () => {
  const { products, settings, addToCart, setActiveTab, showToast, openScanner, triggerScannedSaleProduct } = usePOS();

  // Presets definition
  const A4_PRESETS: LabelTemplate[] = [
    {
      id: 'a4-65',
      name: 'A4 — 65 Labels (Micro Utility)',
      category: 'A4',
      sheetType: 'A4',
      width: 38.1,
      height: 21.2,
      unit: 'mm',
      columns: 5,
      rows: 13,
      labelsPerSheet: 65,
      description: 'Ideal for pens, erasers, small accessories and compact shelf tags (Avery 7160 compatible).',
    },
    {
      id: 'a4-40',
      name: 'A4 — 40 Labels (Stationery Standard)',
      category: 'A4',
      sheetType: 'A4',
      width: 48.5,
      height: 25.4,
      unit: 'mm',
      columns: 4,
      rows: 10,
      labelsPerSheet: 40,
      description: 'Standard retail price tags with high-contrast barcode and QR code (Avery 7161 compatible).',
    },
    {
      id: 'a4-24',
      name: 'A4 — 24 Labels (Shelf Talker)',
      category: 'A4',
      sheetType: 'A4',
      width: 63.5,
      height: 33.9,
      unit: 'mm',
      columns: 3,
      rows: 8,
      labelsPerSheet: 24,
      description: 'Generous shelf edge labels with prominent price, product description, and large QR code.',
    },
    {
      id: 'a4-14',
      name: 'A4 — 14 Labels (Parcel / Ream Box)',
      category: 'A4',
      sheetType: 'A4',
      width: 99.1,
      height: 38.1,
      unit: 'mm',
      columns: 2,
      rows: 7,
      labelsPerSheet: 14,
      description: 'Large format stickers for paper reams, lever arch files, and heavy merchandise.',
    },
    {
      id: 'thermal-50x30',
      name: 'Thermal Roll — 50mm × 30mm',
      category: 'Roll',
      sheetType: 'Roll',
      width: 50,
      height: 30,
      unit: 'mm',
      columns: 1,
      rows: 1,
      labelsPerSheet: 1,
      description: 'Standard single-feed desktop thermal printer (Zebra / Dymo / Brother roll).',
    },
    {
      id: 'thermal-40x20',
      name: 'Thermal Roll — 40mm × 20mm (Mini)',
      category: 'Roll',
      sheetType: 'Roll',
      width: 40,
      height: 20,
      unit: 'mm',
      columns: 1,
      rows: 1,
      labelsPerSheet: 1,
      description: 'Compact barcode adhesive roll for writing instruments and desk tools.',
    },
  ];

  // Selected Preset or Custom
  const [selectedPresetId, setSelectedPresetId] = useState<string>('a4-40');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Custom Dimensions & Units
  const [customUnit, setCustomUnit] = useState<LengthUnit>('mm');
  const [customWidth, setCustomWidth] = useState<number>(50);
  const [customHeight, setCustomHeight] = useState<number>(25);
  const [customMarginX, setCustomMarginX] = useState<number>(7);
  const [customMarginY, setCustomMarginY] = useState<number>(10);
  const [customGapX, setCustomGapX] = useState<number>(2.5);
  const [customGapY, setCustomGapY] = useState<number>(2.5);

  // Label Design Controls
  const [codeType, setCodeType] = useState<'qr' | 'barcode' | 'dual'>('dual');
  const [labelTheme, setLabelTheme] = useState<'clean_white' | 'luxury_gold' | 'inverted_dark'>('clean_white');
  const [showStoreHeader, setShowStoreHeader] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showSku, setShowSku] = useState<boolean>(true);
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [promoNote, setPromoNote] = useState<string>('Quick Scan at Register');

  // Items Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set(products.slice(0, 8).map(p => p.id))
  );
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  // Custom Ad-Hoc Item for custom promotion
  const [customItemEnabled, setCustomItemEnabled] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('Special Copy & Binding Bundle');
  const [customItemSku, setCustomItemSku] = useState<string>('SRV-BND-SP');
  const [customItemPrice, setCustomItemPrice] = useState<string>('12.50');
  const [customItemCopies, setCustomItemCopies] = useState<number>(4);

  // Generated QR Data URLs Cache
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  // Active Template
  const activeTemplate = useMemo(() => {
    if (isCustomMode) {
      // Calculate max utility layout on A4 paper (210mm x 297mm)
      // Convert user unit to mm
      let widthInMm = customWidth;
      let heightInMm = customHeight;
      let marginXInMm = customMarginX;
      let marginYInMm = customMarginY;
      let gapXInMm = customGapX;
      let gapYInMm = customGapY;

      if (customUnit === 'cm') {
        widthInMm *= 10;
        heightInMm *= 10;
        marginXInMm *= 10;
        marginYInMm *= 10;
        gapXInMm *= 10;
        gapYInMm *= 10;
      } else if (customUnit === 'pt') {
        widthInMm *= 0.352778;
        heightInMm *= 0.352778;
        marginXInMm *= 0.352778;
        marginYInMm *= 0.352778;
        gapXInMm *= 0.352778;
        gapYInMm *= 0.352778;
      } else if (customUnit === 'in') {
        widthInMm *= 25.4;
        heightInMm *= 25.4;
        marginXInMm *= 25.4;
        marginYInMm *= 25.4;
        gapXInMm *= 25.4;
        gapYInMm *= 25.4;
      }

      const printableWidth = 210 - (marginXInMm * 2);
      const printableHeight = 297 - (marginYInMm * 2);

      const cols = Math.max(1, Math.floor((printableWidth + gapXInMm) / (widthInMm + gapXInMm)));
      const rows = Math.max(1, Math.floor((printableHeight + gapYInMm) / (heightInMm + gapYInMm)));
      const labelsPerSheet = cols * rows;

      return {
        id: 'custom-user',
        name: `Custom A4 Max Utility (${customWidth}×${customHeight} ${customUnit})`,
        category: 'Custom' as const,
        sheetType: 'A4' as const,
        width: customWidth,
        height: customHeight,
        unit: customUnit,
        columns: cols,
        rows: rows,
        labelsPerSheet,
        widthMm: widthInMm,
        heightMm: heightInMm,
        marginX: marginXInMm,
        marginY: marginYInMm,
        gapX: gapXInMm,
        gapY: gapYInMm,
        description: `Mathematically packed: fits ${cols} across × ${rows} down = ${labelsPerSheet} labels per A4 sheet.`,
      };
    }

    const preset = A4_PRESETS.find(p => p.id === selectedPresetId) || A4_PRESETS[1];
    return {
      ...preset,
      widthMm: preset.width,
      heightMm: preset.height,
      marginX: preset.sheetType === 'Roll' ? 0 : 7,
      marginY: preset.sheetType === 'Roll' ? 0 : 10,
      gapX: 2.5,
      gapY: 2.5,
    };
  }, [selectedPresetId, isCustomMode, customUnit, customWidth, customHeight, customMarginX, customMarginY, customGapX, customGapY]);

  // Unit conversion helper
  const handleUnitChange = (newUnit: LengthUnit) => {
    if (newUnit === customUnit) return;
    // Convert existing customWidth and customHeight to mm first
    let wMm = customWidth;
    let hMm = customHeight;
    if (customUnit === 'cm') { wMm *= 10; hMm *= 10; }
    else if (customUnit === 'pt') { wMm *= 0.352778; hMm *= 0.352778; }
    else if (customUnit === 'in') { wMm *= 25.4; hMm *= 25.4; }

    // Convert wMm to newUnit
    let newW = wMm;
    let newH = hMm;
    if (newUnit === 'cm') { newW = wMm / 10; newH = hMm / 10; }
    else if (newUnit === 'pt') { newW = wMm * 2.83465; newH = hMm * 2.83465; }
    else if (newUnit === 'in') { newW = wMm / 25.4; newH = hMm / 25.4; }

    setCustomUnit(newUnit);
    setCustomWidth(Number(newW.toFixed(2)));
    setCustomHeight(Number(newH.toFixed(2)));
  };

  // Filtered Products for selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Flattened Target Labels Queue
  const targetLabelsQueue = useMemo(() => {
    const list: Array<{
      id: string;
      productId?: string;
      name: string;
      sku: string;
      barcode: string;
      price: number;
      category: string;
      payload: string;
    }> = [];

    // Add selected products
    products.forEach((prod) => {
      if (selectedProductIds.has(prod.id)) {
        for (let i = 0; i < copiesPerItem; i++) {
          list.push({
            id: `${prod.id}-copy-${i}`,
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            barcode: prod.barcode,
            price: prod.price,
            category: prod.category,
            payload: `RAHEL:${prod.sku}:${prod.price.toFixed(2)}`,
          });
        }
      }
    });

    // Add ad-hoc custom label if enabled
    if (customItemEnabled && customItemName.trim()) {
      const priceNum = parseFloat(customItemPrice) || 0;
      for (let i = 0; i < customItemCopies; i++) {
        list.push({
          id: `custom-item-copy-${i}`,
          name: customItemName,
          sku: customItemSku || 'RAHEL-CUST',
          barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          price: priceNum,
          category: 'Custom Offer',
          payload: `RAHEL:${customItemSku || 'CUST'}:${priceNum.toFixed(2)}`,
        });
      }
    }

    return list;
  }, [products, selectedProductIds, copiesPerItem, customItemEnabled, customItemName, customItemSku, customItemPrice, customItemCopies]);

  // Generate QR codes for all distinct payloads
  useEffect(() => {
    const distinctPayloads = Array.from(new Set(targetLabelsQueue.map(t => t.payload)));
    
    distinctPayloads.forEach((payload) => {
      if (!qrCache[payload]) {
        QRCode.toDataURL(payload, {
          width: 160,
          margin: 1,
          color: {
            dark: labelTheme === 'luxury_gold' ? '#000000' : '#000000',
            light: '#ffffff',
          },
        })
          .then((url) => {
            setQrCache(prev => ({ ...prev, [payload]: url }));
          })
          .catch((err) => {
            console.error('Error generating QR', err);
          });
      }
    });
  }, [targetLabelsQueue, labelTheme]);

  // Toggle selection helpers
  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(products.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  // Test Quick Sale Trigger (Simulates scanning this label at the desk)
  const handleTestQuickSaleScan = (item: typeof targetLabelsQueue[0]) => {
    const matched = products.find(p => p.id === item.productId || p.sku === item.sku);
    if (matched) {
      triggerScannedSaleProduct(matched);
      setActiveTab('sales');
      showToast(`Simulated QR/Barcode Scan: Added "${matched.name}" (ETB ${matched.price.toFixed(2)}) to Sale Order!`);
    } else {
      addToCart({
        type: 'product',
        productId: item.productId,
        name: item.name,
        category: item.category,
        unitPrice: item.price,
        costPrice: item.price * 0.5,
        quantity: 1,
        discountPercent: 0,
        taxable: true,
        details: `Quick Scan verified from SKU [${item.sku}]`,
      });
      showToast(`Quick Scan: Verified ${item.name} (ETB ${item.price.toFixed(2)})!`);
    }
  };

  const handlePrintLabels = () => {
    window.print();
  };

  // Calculate pages required
  const labelsPerPage = activeTemplate.labelsPerSheet || 24;
  const totalPages = Math.max(1, Math.ceil(targetLabelsQueue.length / labelsPerPage));

  // Pseudo-Barcode SVG lines generator based on SKU string
  const renderBarcodeLines = (skuString: string) => {
    const chars = skuString.split('');
    return (
      <div className="flex items-end justify-center h-5 w-full overflow-hidden gap-[1.5px] px-1">
        {chars.map((char, i) => {
          const charCode = char.charCodeAt(0);
          const widthClass = charCode % 3 === 0 ? 'w-[2.5px]' : charCode % 2 === 0 ? 'w-[1.5px]' : 'w-[1px]';
          return (
            <div
              key={i}
              className={`h-full bg-neutral-900 shrink-0 ${widthClass}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Bar in Black & Gold */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Barcode &amp; QR Label</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Studio</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Generate maximum-utility A4 sticker sheets and custom shelf tags for rapid POS register scanning.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-neutral-400 block font-mono">
              Queue: {targetLabelsQueue.length} labels ({totalPages} sheet{totalPages > 1 ? 's' : ''})
            </span>
            <span className="text-xs font-semibold text-amber-300">
              {activeTemplate.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openScanner('lookup')}
            className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Open Camera / Laser Barcode & QR Scanner"
          >
            <Barcode className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Verify / Scan Label</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-amber-500/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Import items via Excel to generate new product labels"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Bulk Import (Excel)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintLabels}
            disabled={targetLabelsQueue.length === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label Sheet ({targetLabelsQueue.length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left (5 cols) & Live Sheet Layout Preview on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
        
        {/* Left Column: Preset Selector, Custom Sizes, Design Options & Inventory Picker */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Section 1: Template & Geometry Presets */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Sheet &amp; Label Geometry</span>
              </span>
              <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    !isCustomMode ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    isCustomMode ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Custom Size
                </button>
              </div>
            </div>

            {/* Presets List */}
            {!isCustomMode ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-neutral-400">
                  Select Optimized A4 or Roll Preset
                </label>
                <div className="space-y-1.5">
                  {A4_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPresetId(p.id)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-neutral-950 ring-1 ring-amber-400/40 shadow-xs'
                            : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-200' : 'text-neutral-200'}`}>
                            {p.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {p.width}mm × {p.height}mm · {p.description}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono-numbers font-bold text-amber-300">
                            {p.labelsPerSheet} / sheet
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Size Studio */
              <div className="space-y-3.5 bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-200">
                    Custom Dimension Units
                  </span>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    {(['mm', 'cm', 'pt', 'in'] as LengthUnit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleUnitChange(u)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                          customUnit === u ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Label Width ({customUnit})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 10)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-900 text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                      Label Height ({customUnit})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 10)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-900 text-amber-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-800/80">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">
                      Horizontal Margins ({customUnit})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={customMarginX}
                      onChange={(e) => setCustomMarginX(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs font-mono-numbers rounded border border-neutral-800 bg-neutral-900 text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">
                      Vertical Margins ({customUnit})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={customMarginY}
                      onChange={(e) => setCustomMarginY(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs font-mono-numbers rounded border border-neutral-800 bg-neutral-900 text-neutral-200"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-neutral-900 border border-amber-500/30 text-[11px] text-amber-300 flex items-center justify-between">
                  <span>A4 Space Efficiency:</span>
                  <span className="font-bold font-mono-numbers">
                    {activeTemplate.columns} cols × {activeTemplate.rows} rows ({activeTemplate.labelsPerSheet} / page)
                  </span>
                </div>
              </div>
            )}

            {/* Section 2: Code Format & Content Toggles */}
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                2. Quick Sale Code Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                {[
                  { id: 'dual' as const, label: 'Dual QR + Barcode' },
                  { id: 'qr' as const, label: 'QR Code Only' },
                  { id: 'barcode' as const, label: '1D Barcode Only' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCodeType(c.id)}
                    className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      codeType === c.id ? 'bg-amber-400 text-neutral-950 shadow-xs' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Elements display toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStoreHeader}
                    onChange={(e) => setShowStoreHeader(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                  />
                  <span className="text-[11px]">Store Name</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                  />
                  <span className="text-[11px]">Price ({settings.currencySymbol})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={(e) => setShowSku(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                  />
                  <span className="text-[11px]">SKU Number</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCutLines}
                    onChange={(e) => setShowCutLines(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                  />
                  <span className="text-[11px]">Cut Guide Lines</span>
                </label>
              </div>

              {/* Visual theme for labels */}
              <div className="pt-2">
                <label className="block text-[10px] font-semibold text-neutral-400 mb-1">
                  Label Print Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'clean_white' as const, label: 'Clean White (100% Scan)' },
                    { id: 'luxury_gold' as const, label: 'Luxury Gold Foil' },
                    { id: 'inverted_dark' as const, label: 'Dark Obsidian' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setLabelTheme(st.id)}
                      className={`p-1.5 text-[10px] font-medium rounded-lg border text-center transition-all cursor-pointer ${
                        labelTheme === st.id
                          ? 'border-amber-400 bg-neutral-950 text-amber-300 ring-1 ring-amber-400/30'
                          : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Items to Print & Inventory Selection */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Target Items Queue ({selectedProductIds.size})</span>
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  All ({products.length})
                </button>
                <span className="text-neutral-600">·</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-neutral-400 hover:underline cursor-pointer"
                >
                  None
                </button>
              </div>
            </div>

            {/* Copies per item stepper */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-800 bg-neutral-950">
              <span className="text-xs text-neutral-300">Copies to print per item:</span>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 8].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCopiesPerItem(c)}
                    className={`px-2 py-0.5 text-xs font-mono-numbers rounded font-bold cursor-pointer ${
                      copiesPerItem === c
                        ? 'bg-amber-400 text-neutral-950 shadow-xs'
                        : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    ×{c}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter and Search Products */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500/50"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-200"
              >
                <option value="All">All Categories</option>
                <option value="Notebooks & Paper">Notebooks</option>
                <option value="Writing Instruments">Pens &amp; Writing</option>
                <option value="Office & Desk">Desk Supplies</option>
                <option value="Filing & Folders">Filing</option>
                <option value="Art & Craft">Art &amp; Craft</option>
              </select>
            </div>

            {/* Items selection scroll area */}
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredProducts.map((p) => {
                const isChecked = selectedProductIds.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-amber-500/40 bg-amber-950/20 text-neutral-100'
                        : 'border-neutral-800/80 bg-neutral-950/40 text-neutral-400 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleProduct(p.id)}
                        className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-900 border-neutral-700"
                      />
                      <span className="truncate font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-amber-400/90">{p.sku}</span>
                      <span className="font-mono-numbers font-bold text-neutral-100">ETB {p.price.toFixed(2)}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Optional Ad-hoc Custom Item */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-amber-400 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={customItemEnabled}
                  onChange={(e) => setCustomItemEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-500 bg-neutral-900 border-neutral-700"
                />
                <span>Include Custom Promotional Bundle / Service Tag</span>
              </label>

              {customItemEnabled && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-neutral-400">Bundle / Promo Title</label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-neutral-800 bg-neutral-900 text-neutral-100"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400">SKU</label>
                      <input
                        type="text"
                        value={customItemSku}
                        onChange={(e) => setCustomItemSku(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-800 bg-neutral-900 text-amber-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400">Price (ETB)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-800 bg-neutral-900 text-amber-300 font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400">Copies</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={customItemCopies}
                        onChange={(e) => setCustomItemCopies(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 text-xs rounded border border-neutral-800 bg-neutral-900 text-neutral-100 font-mono-numbers"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Live Sheet Layout Preview & Quick Scan Interactive Testing */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Preview Status Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-100">
                Live Sheet Preview: {activeTemplate.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-amber-400 font-mono">
                {activeTemplate.widthMm}mm × {activeTemplate.heightMm}mm
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">
                Click any label to <strong className="text-amber-300">Test Scan</strong> to register
              </span>
            </div>
          </div>

          {/* Sheet Preview Container (Rendered to match scale) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-x-auto min-h-[640px] flex justify-center">
            
            {/* The Sheet Paper Canvas */}
            <div 
              className={`w-full max-w-2xl rounded-lg p-4 shadow-xl transition-all ${
                labelTheme === 'clean_white'
                  ? 'bg-white text-neutral-900 border border-neutral-300'
                  : labelTheme === 'luxury_gold'
                  ? 'bg-neutral-950 text-neutral-100 border border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'bg-neutral-900 text-neutral-100 border border-neutral-700'
              }`}
            >
              {/* Sheet Header metadata (Small watermarked layout info) */}
              <div className="pb-3 mb-3 border-b border-dashed border-neutral-300/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>RAHEL STATIONERY ATELIER — LABEL BATCH SHEET</span>
                <span>{activeTemplate.sheetType} · {targetLabelsQueue.length} LABELS TOTAL</span>
              </div>

              {/* Dynamic CSS Grid packing labels */}
              <div 
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${activeTemplate.columns || 3}, minmax(0, 1fr))`,
                }}
              >
                {targetLabelsQueue.map((item, idx) => {
                  const qrUrl = qrCache[item.payload];

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTestQuickSaleScan(item)}
                      title="Click to simulate laser barcode/QR scan directly into register!"
                      className={`relative rounded p-2 text-left transition-all cursor-pointer group flex flex-col justify-between ${
                        showCutLines ? 'border border-dashed border-neutral-300 hover:border-amber-500' : 'border border-transparent'
                      } ${
                        labelTheme === 'clean_white'
                          ? 'bg-white text-neutral-950 hover:bg-neutral-50 shadow-2xs'
                          : labelTheme === 'luxury_gold'
                          ? 'bg-neutral-900 text-neutral-100 border-amber-500/40 hover:border-amber-400 shadow-md'
                          : 'bg-neutral-950 text-neutral-100 hover:bg-neutral-900'
                      }`}
                      style={{
                        minHeight: `${Math.max(65, activeTemplate.heightMm * 2.2)}px`,
                      }}
                    >
                      {/* Top Brand & Product Title */}
                      <div>
                        {showStoreHeader && (
                          <div className={`text-[8px] uppercase tracking-wider font-extrabold leading-none mb-1 ${
                            labelTheme === 'luxury_gold' ? 'text-amber-400' : 'text-neutral-500'
                          }`}>
                            Rahel Stationary
                          </div>
                        )}
                        {showProductName && (
                          <div className="text-[10px] font-bold line-clamp-1 leading-tight text-neutral-900 dark:text-neutral-100">
                            {item.name}
                          </div>
                        )}
                      </div>

                      {/* Middle: Barcode / QR Codes */}
                      <div className="my-1.5 flex items-center justify-between gap-1.5">
                        {/* QR Code */}
                        {(codeType === 'qr' || codeType === 'dual') && (
                          <div className="shrink-0 bg-white p-0.5 rounded border border-neutral-200">
                            {qrUrl ? (
                              <img 
                                src={qrUrl} 
                                alt="QR Code" 
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-neutral-200 animate-pulse" />
                            )}
                          </div>
                        )}

                        {/* Barcode lines or SKU */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          {(codeType === 'barcode' || codeType === 'dual') && (
                            <div className="w-full">
                              {renderBarcodeLines(item.sku)}
                            </div>
                          )}

                          {showSku && (
                            <div className="text-[8px] font-mono text-center tracking-wider text-neutral-600 mt-0.5 truncate">
                              {item.sku}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Price & Quick Sale Tag */}
                      <div className="pt-1 border-t border-dotted border-neutral-300/80 flex items-baseline justify-between">
                        {showPrice && (
                          <span className={`text-xs font-bold font-mono-numbers leading-none ${
                            labelTheme === 'luxury_gold' ? 'text-amber-400' : 'text-neutral-950'
                          }`}>
                            ETB {item.price.toFixed(2)}
                          </span>
                        )}

                        <span className="text-[8px] text-neutral-400 italic truncate ml-1 font-sans">
                          {promoNote}
                        </span>
                      </div>

                      {/* Quick scan test hover indicator */}
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 rounded border border-amber-500 flex items-center justify-center pointer-events-none transition-opacity">
                        <span className="bg-neutral-950 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded shadow">
                          Test Scan &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {targetLabelsQueue.length === 0 && (
                <div className="py-24 text-center text-neutral-400 text-xs">
                  No items selected in the queue. Check items on the left to populate label sheet.
                </div>
              )}
            </div>

          </div>

          {/* Interactive instruction banner */}
          <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Standard laser &amp; inkjet sticker paper (Avery 7160/7161, Herma, or continuous thermal rolls) can be fed into the printer.
              </span>
            </div>
            <button
              onClick={handlePrintLabels}
              className="text-amber-400 hover:underline font-semibold whitespace-nowrap ml-2"
            >
              Print Now &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          PRINT ONLY CONTAINER: Exactly formatted for physical printer output
          ========================================================================= */}
      <div className="hidden print-only-container">
        <div 
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${activeTemplate.columns || 3}, minmax(0, 1fr))`,
            padding: `${activeTemplate.marginY || 10}mm ${activeTemplate.marginX || 7}mm`,
          }}
        >
          {targetLabelsQueue.map((item) => {
            const qrUrl = qrCache[item.payload];

            return (
              <div
                key={item.id}
                className="p-2 border border-dashed border-neutral-300 rounded text-neutral-900 bg-white flex flex-col justify-between"
                style={{
                  minHeight: `${activeTemplate.heightMm || 25}mm`,
                  pageBreakInside: 'avoid',
                }}
              >
                <div>
                  {showStoreHeader && (
                    <div className="text-[8px] uppercase tracking-wider font-extrabold text-neutral-600 mb-0.5">
                      Rahel Stationary
                    </div>
                  )}
                  {showProductName && (
                    <div className="text-[10px] font-bold line-clamp-1 leading-tight text-black">
                      {item.name}
                    </div>
                  )}
                </div>

                <div className="my-1 flex items-center justify-between gap-1">
                  {(codeType === 'qr' || codeType === 'dual') && qrUrl && (
                    <img 
                      src={qrUrl} 
                      alt="QR" 
                      className="w-9 h-9 object-contain"
                    />
                  )}
                  <div className="flex-1 text-center">
                    {(codeType === 'barcode' || codeType === 'dual') && (
                      <div className="w-full">
                        {renderBarcodeLines(item.sku)}
                      </div>
                    )}
                    {showSku && (
                      <div className="text-[8px] font-mono text-neutral-800">
                        {item.sku}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-0.5 border-t border-dotted border-neutral-300 flex items-baseline justify-between">
                  {showPrice && (
                    <span className="text-xs font-bold font-mono text-black">
                      ETB {item.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[8px] text-neutral-600">
                    {promoNote}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
