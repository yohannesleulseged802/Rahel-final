import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Layers, 
  Scan, 
  Stamp, 
  Camera, 
  Wrench, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Gauge, 
  Scroll, 
  Maximize2, 
  Compass, 
  Calendar, 
  RotateCcw,
  Coins,
  Search,
  FileText
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ServiceType, PaymentMethod, PAYMENT_METHOD_NAMES } from '../types';

// Default standard base unit prices in ETB
const DEFAULT_UNIT_PRICES: Record<string, number> = {
  a1_black: 45.00,
  a2_black: 30.00,
  a1_color: 75.00,
  a2_color: 55.00,
  a1_glossy_color: 120.00,
  a2_glossy_color: 90.00,
  a1_blueprint: 60.00,
  a2_blueprint: 45.00,
  somali_print: 110.00,
  a4_color_print: 25.00,
  a4_black_copy_print: 5.00,
  a3_color_print: 50.00,
  a3_copy_print: 10.00,
  print_counter: 1.50,
  binding: 3.50,
  lamination: 2.00,
  scanning: 1.50,
  custom_stamp: 22.00,
  passport_photo: 14.00,
};

export const ServicesDesk: React.FC = () => {
  const { recordServiceJob, setActiveTab, showToast } = usePOS();
  const [selectedService, setSelectedService] = useState<ServiceType>('a1_black');
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerRef, setCustomerRef] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'printing' | 'atelier' | 'meter'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Centralized Editable Unit Prices State (Persisted in LocalStorage)
  // ---------------------------------------------------------------------------
  const [unitPrices, setUnitPrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('paperpress_service_unit_prices');
      if (saved) {
        return { ...DEFAULT_UNIT_PRICES, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_UNIT_PRICES };
  });

  const getUnitPrice = (serviceKey: string, fallbackDefault: number): number => {
    return unitPrices[serviceKey] ?? fallbackDefault;
  };

  const handleSetUnitPrice = (serviceKey: string, newRate: number) => {
    const safeRate = Math.max(0, newRate);
    setUnitPrices(prev => {
      const updated = { ...prev, [serviceKey]: safeRate };
      try {
        localStorage.setItem('paperpress_service_unit_prices', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleResetUnitPrice = (serviceKey: string) => {
    const defaultVal = DEFAULT_UNIT_PRICES[serviceKey] ?? 10.0;
    handleSetUnitPrice(serviceKey, defaultVal);
    showToast(`Reset ${serviceKey.replace(/_/g, ' ')} unit price to default (ETB ${defaultVal.toFixed(2)})`);
  };

  // ---------------------------------------------------------------------------
  // 1. Large Format Plans & Posters (A1/A2 Black, Color, Glossy, Blueprint)
  // ---------------------------------------------------------------------------
  const [largeFormatSheets, setLargeFormatSheets] = useState<number>(1);
  const [largeFormatCopies, setLargeFormatCopies] = useState<number>(1);
  const [largeFormatMedia, setLargeFormatMedia] = useState<'bond_80gsm' | 'tracing_110gsm' | 'heavy_180gsm' | 'photo_glossy'>('bond_80gsm');
  const [largeFormatFinishing, setLargeFormatFinishing] = useState<'rolled' | 'folded_a4' | 'tube'>('rolled');
  const [blueprintTone, setBlueprintTone] = useState<'blue_line' | 'diazo_ammonia' | 'sepia_archival'>('blue_line');
  const [blueprintBinding, setBlueprintBinding] = useState<'loose' | 'corner_staple' | 'edge_bound'>('loose');

  // ---------------------------------------------------------------------------
  // 2. Somali Print (Roll / Fabric / Banner)
  // ---------------------------------------------------------------------------
  const [somaliWidth, setSomaliWidth] = useState<'60cm' | '90cm' | '120cm' | '150cm'>('90cm');
  const [somaliLengthMeters, setSomaliLengthMeters] = useState<number>(2.0);
  const [somaliDensity, setSomaliDensity] = useState<'standard' | 'high_density' | 'full_color'>('standard');
  const [somaliFinishing, setSomaliFinishing] = useState<'none' | 'eyelets' | 'hemmed'>('none');
  const [somaliCopies, setSomaliCopies] = useState<number>(1);

  // ---------------------------------------------------------------------------
  // 3. Standard Office Copy & Print (A4 Color, A4 Black, A3 Color, A3 Copy)
  // ---------------------------------------------------------------------------
  const [officePages, setOfficePages] = useState<number>(10);
  const [officeCopies, setOfficeCopies] = useState<number>(1);
  const [officePaper, setOfficePaper] = useState<'80gsm' | '120gsm' | 'photo' | 'cardstock'>('80gsm');
  const [officeSides, setOfficeSides] = useState<'single' | 'double'>('single');
  const [officeStaple, setOfficeStaple] = useState<boolean>(false);
  const [officePunch, setOfficePunch] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // 4. End-of-Day Print Counter Log State
  // ---------------------------------------------------------------------------
  const [counterMachine, setCounterMachine] = useState<'copier_main' | 'plotter_a1' | 'plotter_blueprint' | 'printer_somale'>('copier_main');
  const [counterOpening, setCounterOpening] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('paperpress_last_counter_copier_main');
      return saved ? parseInt(saved, 10) : 48200;
    } catch {
      return 48200;
    }
  });
  const [counterClosing, setCounterClosing] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('paperpress_last_counter_copier_main');
      const op = saved ? parseInt(saved, 10) : 48200;
      return op + 350;
    } catch {
      return 48550;
    }
  });
  const [counterWaste, setCounterWaste] = useState<number>(5);
  const [counterDate, setCounterDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [counterNotes, setCounterNotes] = useState<string>('End-of-day print counter meter reading');

  // ---------------------------------------------------------------------------
  // 5. Finishing Atelier (Binding, Lamination, Scanning, Stamps, Photos)
  // ---------------------------------------------------------------------------
  const [bindingType, setBindingType] = useState<'spiral' | 'wire' | 'thermal' | 'comb'>('spiral');
  const [bindingPages, setBindingPages] = useState<number>(60);
  const [bindingCovers, setBindingCovers] = useState<'standard' | 'premium' | 'none'>('standard');
  const [bindingQuantity, setBindingQuantity] = useState<number>(1);

  const [lamiSize, setLamiSize] = useState<'ID' | 'A5' | 'A4' | 'A3' | 'Poster'>('A4');
  const [lamiPouch, setLamiPouch] = useState<'75u' | '125u' | '250u'>('125u');
  const [lamiFinish, setLamiFinish] = useState<'gloss' | 'matte'>('gloss');
  const [lamiQuantity, setLamiQuantity] = useState<number>(2);

  const [scanType, setScanType] = useState<'feeder_pdf' | 'flatbed' | 'photo'>('feeder_pdf');
  const [scanPages, setScanPages] = useState<number>(15);
  const [scanEmailDelivery, setScanEmailDelivery] = useState<boolean>(true);

  const [stampModel, setStampModel] = useState<'pocket' | 'address_3line' | 'dater' | 'seal'>('address_3line');
  const [stampText, setStampText] = useState<string>('APPROVED - PAID');
  const [stampInk, setStampInk] = useState<'Black' | 'Blue' | 'Red'>('Black');

  const [photoType, setPhotoType] = useState<'passport_us' | 'passport_eu' | 'visa'>('passport_us');
  const [includeDigitalCopy, setIncludeDigitalCopy] = useState<boolean>(true);
  const [photoSets, setPhotoSets] = useState<number>(1);

  const [customJobTitle, setCustomJobTitle] = useState<string>('Custom Document Typography & Typesetting');
  const [customPrice, setCustomPrice] = useState<string>('25.00');
  const [customCost, setCustomCost] = useState<string>('5.00');
  const [customCustomer, setCustomCustomer] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('Client provided raw manuscript file on USB.');

  // ---------------------------------------------------------------------------
  // Computations
  // ---------------------------------------------------------------------------
  const computeLargeFormat = (serviceKey: string, size: 'A1' | 'A2', kind: 'black' | 'color' | 'glossy' | 'blueprint') => {
    const defaultRate = DEFAULT_UNIT_PRICES[serviceKey] ?? (size === 'A1' ? 45.0 : 30.0);
    const unitPrice = getUnitPrice(serviceKey, defaultRate);

    let mediaExtra = 0;
    if (kind !== 'glossy' && kind !== 'blueprint') {
      if (largeFormatMedia === 'tracing_110gsm') mediaExtra = size === 'A1' ? 25.0 : 18.0;
      if (largeFormatMedia === 'heavy_180gsm') mediaExtra = size === 'A1' ? 20.0 : 15.0;
      if (largeFormatMedia === 'photo_glossy') mediaExtra = size === 'A1' ? 50.0 : 40.0;
    }

    let finishExtra = 0;
    if (kind === 'blueprint') {
      if (blueprintBinding === 'corner_staple') finishExtra = 2.0 * largeFormatCopies;
      if (blueprintBinding === 'edge_bound') finishExtra = (size === 'A1' ? 15.0 : 12.0) * largeFormatCopies;
    } else {
      if (largeFormatFinishing === 'folded_a4') finishExtra = 5.0 * largeFormatCopies;
      if (largeFormatFinishing === 'tube') finishExtra = (size === 'A1' ? 25.0 : 20.0);
    }

    const totalImpressions = largeFormatSheets * largeFormatCopies;
    const price = Number(((unitPrice + mediaExtra) * totalImpressions + finishExtra).toFixed(2));
    const cost = Number((price * 0.28).toFixed(2));

    const mediaLabel = kind === 'glossy' 
      ? 'High-Gloss Photo Stock' 
      : kind === 'blueprint' 
        ? `${blueprintTone === 'blue_line' ? 'White on Blue' : blueprintTone === 'diazo_ammonia' ? 'Diazo Ammonia' : 'Sepia Archival'} Tone` 
        : (largeFormatMedia === 'bond_80gsm' ? '80gsm Bond' : largeFormatMedia === 'tracing_110gsm' ? '110gsm Tracing' : largeFormatMedia === 'heavy_180gsm' ? '180gsm Heavy Coated' : 'Glossy Photo');

    const finishLabel = kind === 'blueprint'
      ? (blueprintBinding === 'corner_staple' ? ' + Corner Stapled' : blueprintBinding === 'edge_bound' ? ' + Edge Bound' : ' · Loose Sheets')
      : (largeFormatFinishing === 'folded_a4' ? ' + Folded to A4' : largeFormatFinishing === 'tube' ? ' + Mailing Tube' : ' · Rolled');

    const desc = `${size} ${kind === 'black' ? 'Black' : kind === 'color' ? 'Color' : kind === 'glossy' ? 'Glossy Color' : 'Blueprint'} · ${largeFormatSheets} sheet(s) × ${largeFormatCopies} set(s) [Rate: ETB ${unitPrice.toFixed(2)}/sh] · ${mediaLabel}${finishLabel}`;

    return { price, cost, desc, unitPrice, totalImpressions };
  };

  const computeSomali = () => {
    const baseRate = getUnitPrice('somali_print', DEFAULT_UNIT_PRICES.somali_print);

    let widthMult = 1.0;
    if (somaliWidth === '60cm') widthMult = 0.75;
    if (somaliWidth === '120cm') widthMult = 1.35;
    if (somaliWidth === '150cm') widthMult = 1.70;

    let finishPerMeter = 0;
    if (somaliFinishing === 'eyelets') finishPerMeter = 20.0;
    if (somaliFinishing === 'hemmed') finishPerMeter = 30.0;

    let densityExtra = 0;
    if (somaliDensity === 'high_density') densityExtra = 35.0;
    if (somaliDensity === 'full_color') densityExtra = 70.0;

    const meterRate = (baseRate * widthMult) + densityExtra + finishPerMeter;
    const totalMeters = somaliLengthMeters * somaliCopies;
    const price = Number((meterRate * totalMeters).toFixed(2));
    const cost = Number((price * 0.35).toFixed(2));

    const densityLabel = somaliDensity === 'standard' ? 'Standard Line/Text' : somaliDensity === 'high_density' ? 'High-Density CAD/Map' : 'Full-Color Banner';
    const finishLabel = somaliFinishing === 'eyelets' ? ' + Brass Eyelets' : somaliFinishing === 'hemmed' ? ' + Hemmed Edges' : '';
    const desc = `Somali Print · ${somaliWidth} × ${somaliLengthMeters}m · [Base Rate: ETB ${baseRate.toFixed(2)}/m] · ${densityLabel}${finishLabel} · Qty: ${somaliCopies}`;

    return { price, cost, desc, unitPrice: baseRate, totalImpressions: totalMeters };
  };

  const computeOffice = (serviceKey: string, size: 'A4' | 'A3', isColor: boolean) => {
    const defaultRate = DEFAULT_UNIT_PRICES[serviceKey] ?? (isColor ? (size === 'A4' ? 25.0 : 50.0) : (size === 'A4' ? 5.0 : 10.0));
    const unitPrice = getUnitPrice(serviceKey, defaultRate);

    let sidesMult = officeSides === 'double' ? 1.75 : 1.0;
    let paperExtra = 0;
    if (officePaper === '120gsm') paperExtra = size === 'A4' ? 2.5 : 5.0;
    if (officePaper === 'photo') paperExtra = size === 'A4' ? 10.0 : 18.0;
    if (officePaper === 'cardstock') paperExtra = size === 'A4' ? 5.0 : 10.0;

    let finishingFee = 0;
    if (officeStaple) finishingFee += (size === 'A4' ? 1.0 : 2.0) * officeCopies;
    if (officePunch) finishingFee += (size === 'A4' ? 1.0 : 2.0) * officeCopies;

    const totalImpressions = officePages * officeCopies;
    const price = Number(((unitPrice * sidesMult + paperExtra) * totalImpressions + finishingFee).toFixed(2));
    const cost = Number((price * 0.22).toFixed(2));

    const desc = `${size} ${isColor ? 'Color Print' : size === 'A4' ? 'Black Copy & Print' : 'Copy & Print'} · ${officePages} pgs × ${officeCopies} set(s) [Rate: ETB ${unitPrice.toFixed(2)}/pg] · ${officePaper} · ${officeSides === 'double' ? '2-Sided' : '1-Sided'}${officeStaple ? ' + Stapled' : ''}${officePunch ? ' + Punched' : ''}`;

    return { price, cost, desc, unitPrice, totalImpressions };
  };

  const computePrintCounter = () => {
    const unitRate = getUnitPrice('print_counter', counterMachine === 'copier_main' ? 1.50 : counterMachine === 'plotter_a1' ? 45.00 : counterMachine === 'plotter_blueprint' ? 35.00 : 120.00);
    const grossImpressions = Math.max(0, counterClosing - counterOpening);
    const netBillablePrints = Math.max(0, grossImpressions - counterWaste);
    const price = Number((netBillablePrints * unitRate).toFixed(2));
    const cost = Number((price * 0.22).toFixed(2));
    const machineName = counterMachine === 'copier_main' ? 'Main Copier (A4/A3)' : counterMachine === 'plotter_a1' ? 'A1 CAD Plotter' : counterMachine === 'plotter_blueprint' ? 'Blueprint Copier' : 'Somale Wide Banner';
    const desc = `Print Counter EOD Meter [${machineName}] · Closing: ${counterClosing} - Opening: ${counterOpening} = ${grossImpressions} gross · Spoilage: -${counterWaste} · Net Billable: ${netBillablePrints} prints @ ETB ${unitRate.toFixed(2)}/impression`;

    return { price, cost, desc, unitPrice: unitRate, totalImpressions: netBillablePrints };
  };

  const computeBinding = () => {
    const baseRate = getUnitPrice('binding', DEFAULT_UNIT_PRICES.binding);
    let rate = baseRate;
    if (bindingType === 'wire') rate += 1.30;
    if (bindingType === 'thermal') rate += 3.00;
    if (bindingType === 'comb') rate -= 0.55;

    if (bindingPages > 150) rate += 2.00;
    else if (bindingPages > 75) rate += 1.00;

    if (bindingCovers === 'premium') rate += 1.50;
    if (bindingCovers === 'none') rate -= 0.50;

    const price = Number((Math.max(1, rate) * bindingQuantity).toFixed(2));
    const cost = Number((price * 0.25).toFixed(2));
    const typeLabel = 
      bindingType === 'spiral' ? 'Plastic Spiral Coil' :
      bindingType === 'wire' ? 'Wire-O Twin Loop' :
      bindingType === 'thermal' ? 'Thermal Hardcover Book' : 'Plastic Comb';
    const desc = `${typeLabel} Binding · ${bindingPages} pgs · [Base: ETB ${baseRate.toFixed(2)}] · ${bindingCovers} covers · Qty: ${bindingQuantity}`;
    return { price, cost, desc, unitPrice: baseRate, totalImpressions: bindingQuantity };
  };

  const computeLamination = () => {
    const baseRate = getUnitPrice('lamination', DEFAULT_UNIT_PRICES.lamination);
    let rate = baseRate;
    if (lamiSize === 'ID') rate = Math.max(0.75, baseRate * 0.5);
    if (lamiSize === 'A5') rate = Math.max(1.00, baseRate * 0.75);
    if (lamiSize === 'A3') rate = baseRate * 1.75;
    if (lamiSize === 'Poster') rate = baseRate * 4.25;

    if (lamiPouch === '250u') rate += 1.00;
    if (lamiFinish === 'matte') rate += 0.50;

    const price = Number((rate * lamiQuantity).toFixed(2));
    const cost = Number((price * 0.20).toFixed(2));
    const desc = `${lamiSize} Lamination · [Base: ETB ${baseRate.toFixed(2)}] · ${lamiPouch} ${lamiFinish} pouch · Qty: ${lamiQuantity}`;
    return { price, cost, desc, unitPrice: baseRate, totalImpressions: lamiQuantity };
  };

  const computeScanning = () => {
    const baseRate = getUnitPrice('scanning', DEFAULT_UNIT_PRICES.scanning);
    let price = 0;
    if (scanType === 'feeder_pdf') {
      price = 1.00 + scanPages * baseRate;
    } else if (scanType === 'flatbed') {
      price = 2.00 + scanPages * (baseRate * 1.5);
    } else {
      price = scanPages * (baseRate * 2.5);
    }
    const cost = 0.50;
    const typeLabel = scanType === 'feeder_pdf' ? 'ADF Multi-page PDF' : scanType === 'flatbed' ? 'High-Res Flatbed' : 'Archival Photo Scan';
    const desc = `${typeLabel} · [Rate: ETB ${baseRate.toFixed(2)}/pg] · ${scanPages} page(s)${scanEmailDelivery ? ' · Digital Delivery via Email' : ' · USB Save'}`;
    return { price: Number(price.toFixed(2)), cost, desc, unitPrice: baseRate, totalImpressions: scanPages };
  };

  const computeStamp = () => {
    const baseRate = getUnitPrice('custom_stamp', DEFAULT_UNIT_PRICES.custom_stamp);
    let price = baseRate;
    if (stampModel === 'pocket') price = baseRate * 0.75;
    if (stampModel === 'dater') price = baseRate * 1.25;
    if (stampModel === 'seal') price = baseRate * 1.55;
    const cost = Number((price * 0.30).toFixed(2));
    const desc = `Custom Rubber Stamp (${stampModel}) · [Base: ETB ${baseRate.toFixed(2)}] · Ink: ${stampInk} · "${stampText}"`;
    return { price, cost, desc, unitPrice: baseRate, totalImpressions: 1 };
  };

  const computePassportPhoto = () => {
    const baseRate = getUnitPrice('passport_photo', DEFAULT_UNIT_PRICES.passport_photo);
    let price = baseRate * photoSets;
    if (includeDigitalCopy) price += 3.50;
    const cost = 2.20 * photoSets;
    const desc = `Biometric Photos (${photoType.replace('_', ' ').toUpperCase()}) · [Base: ETB ${baseRate.toFixed(2)}/set] · ${photoSets * 6} prints${includeDigitalCopy ? ' + Digital JPEG code' : ''}`;
    return { price: Number(price.toFixed(2)), cost, desc, unitPrice: baseRate, totalImpressions: photoSets };
  };

  // Get active summary
  const getCurrentSummary = () => {
    switch (selectedService) {
      // 1. The 13 individual printing services
      case 'a1_black':
        return computeLargeFormat('a1_black', 'A1', 'black');
      case 'a2_black':
        return computeLargeFormat('a2_black', 'A2', 'black');
      case 'a1_color':
        return computeLargeFormat('a1_color', 'A1', 'color');
      case 'a2_color':
        return computeLargeFormat('a2_color', 'A2', 'color');
      case 'a1_glossy_color':
        return computeLargeFormat('a1_glossy_color', 'A1', 'glossy');
      case 'a2_glossy_color':
        return computeLargeFormat('a2_glossy_color', 'A2', 'glossy');
      case 'a1_blueprint':
        return computeLargeFormat('a1_blueprint', 'A1', 'blueprint');
      case 'a2_blueprint':
        return computeLargeFormat('a2_blueprint', 'A2', 'blueprint');
      case 'somali_print':
      case 'somale_print':
        return computeSomali();
      case 'a4_color_print':
        return computeOffice('a4_color_print', 'A4', true);
      case 'a4_black_copy_print':
        return computeOffice('a4_black_copy_print', 'A4', false);
      case 'a3_color_print':
        return computeOffice('a3_color_print', 'A3', true);
      case 'a3_copy_print':
      case 'print_copy':
        return computeOffice('a3_copy_print', 'A3', false);

      // 2. Atelier & Meter services
      case 'print_counter':
        return computePrintCounter();
      case 'binding':
        return computeBinding();
      case 'lamination':
        return computeLamination();
      case 'scanning':
        return computeScanning();
      case 'custom_stamp':
        return computeStamp();
      case 'passport_photo':
        return computePassportPhoto();
      default: {
        const price = Number(parseFloat(customPrice) || 0);
        const cost = Number(parseFloat(customCost) || 0);
        return {
          price,
          cost,
          desc: `${customJobTitle} · ${customNotes}`,
          unitPrice: price,
          totalImpressions: 1,
        };
      }
    }
  };

  const currentActiveSummary = getCurrentSummary();
  const calculatedPrice = currentActiveSummary.price;
  const effectivePrice = priceOverride !== '' ? (parseFloat(priceOverride) || 0) : calculatedPrice;

  // ---------------------------------------------------------------------------
  // Save Job Record
  // ---------------------------------------------------------------------------
  const handleSaveServiceRecord = () => {
    let name = '';
    let details = currentActiveSummary.desc;
    const price = effectivePrice;
    const cost = currentActiveSummary.cost;

    // Determine service title
    const srv = servicesList.find(s => s.id === selectedService);
    name = srv ? srv.title : 'Stationery Printing Service';

    if (customerRef) {
      details += ` · Client Ref: ${customerRef}`;
    }

    if (priceOverride !== '') {
      details += ` · [Custom Rate Override: ETB ${price.toFixed(2)}]`;
    }

    if (selectedService === 'print_counter') {
      try {
        localStorage.setItem(`paperpress_last_counter_${counterMachine}`, String(counterClosing));
      } catch {}
    }

    recordServiceJob({
      name,
      category: 'Print & Copy Services',
      details,
      price,
      cost,
      customerName: customerRef || (selectedService === 'custom_job' ? customCustomer : (selectedService === 'print_counter' ? 'End-of-Day Print Counter' : undefined)),
      notes: selectedService === 'print_counter' ? counterNotes : (selectedService === 'custom_job' ? customNotes : undefined),
      paymentMethod,
      date: selectedService === 'print_counter' ? counterDate : undefined,
    });

    setPriceOverride('');
  };

  const handleSaveAndGoToReports = () => {
    handleSaveServiceRecord();
    setActiveTab('reports');
  };

  // ---------------------------------------------------------------------------
  // Complete Master Services List with the 13 Individual Printing Services
  // ---------------------------------------------------------------------------
  const servicesList: { 
    id: ServiceType; 
    title: string; 
    subtitle: string; 
    unitLabel: string;
    category: 'printing' | 'atelier' | 'meter';
    icon: any; 
    tag: string;
  }[] = [
    // --- The 13 Individual Printing Services from Specification ---
    { id: 'a1_black', title: 'A1 black', subtitle: 'A1 monochrome CAD line drawings & engineering plans', unitLabel: 'sheet', category: 'printing', icon: Maximize2, tag: 'A1 CAD' },
    { id: 'a2_black', title: 'A2 Black', subtitle: 'A2 monochrome CAD & architectural drawings', unitLabel: 'sheet', category: 'printing', icon: Maximize2, tag: 'A2 CAD' },
    { id: 'a1_color', title: 'A1 color', subtitle: 'A1 full color architectural CAD, maps & posters', unitLabel: 'sheet', category: 'printing', icon: Maximize2, tag: 'A1 Color' },
    { id: 'a2_color', title: 'A2 color', subtitle: 'A2 full color CAD plans, presentation drawings', unitLabel: 'sheet', category: 'printing', icon: Maximize2, tag: 'A2 Color' },
    { id: 'a1_glossy_color', title: 'A1 glossy color', subtitle: 'A1 photographic high-gloss presentation prints', unitLabel: 'sheet', category: 'printing', icon: Sparkles, tag: 'A1 Gloss' },
    { id: 'a2_glossy_color', title: 'A2 glossy color', subtitle: 'A2 photographic high-gloss color prints & displays', unitLabel: 'sheet', category: 'printing', icon: Sparkles, tag: 'A2 Gloss' },
    { id: 'a1_blueprint', title: 'A1 blueprint', subtitle: 'A1 architectural blue line / digital blueprint plan sets', unitLabel: 'sheet', category: 'printing', icon: Compass, tag: 'A1 Blue' },
    { id: 'a2_blueprint', title: 'A2 blueprint', subtitle: 'A2 architectural blue line / digital blueprint plans', unitLabel: 'sheet', category: 'printing', icon: Compass, tag: 'A2 Blue' },
    { id: 'somali_print', title: 'Somali print', subtitle: 'Wide-format roll banner, somali fabric & heavy poster', unitLabel: 'meter', category: 'printing', icon: Scroll, tag: 'Roll/M' },
    { id: 'a4_color_print', title: 'A4 color print', subtitle: 'A4 high-res full color documents, flyers & graphics', unitLabel: 'page', category: 'printing', icon: Printer, tag: 'A4 Color' },
    { id: 'a4_black_copy_print', title: 'A4 black copy and print', subtitle: 'A4 standard monochrome document printing & copies', unitLabel: 'page', category: 'printing', icon: Printer, tag: 'A4 B&W' },
    { id: 'a3_color_print', title: 'A3 color print', subtitle: 'A3 ledger full color spreads, presentations & reports', unitLabel: 'page', category: 'printing', icon: Printer, tag: 'A3 Color' },
    { id: 'a3_copy_print', title: 'A3 copy and print', subtitle: 'A3 monochrome ledger photocopying & printing', unitLabel: 'page', category: 'printing', icon: Printer, tag: 'A3 B&W' },

    // --- Atelier Finishing & Daily Meter Services ---
    { id: 'print_counter', title: 'End-of-Day Print Counter', subtitle: 'Reconcile daily closing meter readings & batch settlement', unitLabel: 'impression', category: 'meter', icon: Gauge, tag: 'EOD Daily' },
    { id: 'binding', title: 'Document Binding', subtitle: 'Spiral coil, wire-o, thermal, comb book binding', unitLabel: 'book', category: 'atelier', icon: BookOpen, tag: 'Binding' },
    { id: 'lamination', title: 'Lamination Bureau', subtitle: '75-250 micron pouches, ID to Poster sizes', unitLabel: 'pouch', category: 'atelier', icon: Layers, tag: 'Lami' },
    { id: 'scanning', title: 'Scanning & Digitize', subtitle: 'High-speed ADF PDF, 600dpi flatbed & photo archival', unitLabel: 'page', category: 'atelier', icon: Scan, tag: 'Scan' },
    { id: 'custom_stamp', title: 'Custom Rubber Stamps', subtitle: 'Self-inking address, signature, date, seals', unitLabel: 'stamp', category: 'atelier', icon: Stamp, tag: 'Stamp' },
    { id: 'passport_photo', title: 'Passport & ID Photos', subtitle: 'Biometric 6-pack prints + optional digital JPEG', unitLabel: 'set', category: 'atelier', icon: Camera, tag: 'Photo' },
    { id: 'custom_job', title: 'Custom Workshop Job', subtitle: 'Typesetting, bespoke graphics, custom commissions', unitLabel: 'job', category: 'atelier', icon: Wrench, tag: 'Custom' },
  ];

  // Filtered Services List
  const filteredServices = servicesList.filter(s => {
    if (categoryFilter === 'printing' && s.category !== 'printing') return false;
    if (categoryFilter === 'atelier' && s.category !== 'atelier') return false;
    if (categoryFilter === 'meter' && s.category !== 'meter') return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q);
    }
    return true;
  });

  const activeDef = servicesList.find(s => s.id === selectedService) || servicesList[0];
  const activeUnitLabel = activeDef.unitLabel;
  const activeCurrentRate = getUnitPrice(selectedService, DEFAULT_UNIT_PRICES[selectedService] ?? 10.0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header section in Black & Gold */}
      <div className="mb-6 pb-4 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Stationery &amp; Printing Services</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Atelier</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Individual printing stations with editable unit prices, architectural CAD plotters, somali roll banners, and daily meter reconciliation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Job Total</span>
            <span className="text-xl font-bold font-mono-numbers text-amber-300">
              ETB {effectivePrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleSaveServiceRecord}
            className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-amber-500/40 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Check className="w-4 h-4 text-amber-400" />
            <span>Record Job</span>
          </button>
          <button
            onClick={handleSaveAndGoToReports}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>Save &amp; View Reports</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Service Selector (Navigation list in Black & Gold) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800 overflow-x-auto no-scrollbar">
            {[
              { id: 'all' as const, label: 'All (20)' },
              { id: 'printing' as const, label: 'Printing (13)' },
              { id: 'atelier' as const, label: 'Finishing (6)' },
              { id: 'meter' as const, label: 'EOD Meter (1)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search printing services..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900/80 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* List of Services */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredServices.map((srv) => {
              const Icon = srv.icon;
              const isSelected = selectedService === srv.id;
              const currentRate = getUnitPrice(srv.id, DEFAULT_UNIT_PRICES[srv.id] ?? 10.0);

              return (
                <button
                  key={srv.id}
                  onClick={() => {
                    setSelectedService(srv.id);
                    setPriceOverride('');
                  }}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/80 bg-neutral-900 text-neutral-100 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-amber-400 text-neutral-950 shadow-xs' : 'bg-neutral-900 text-amber-400/80'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-semibold truncate leading-tight ${isSelected ? 'text-amber-200' : 'text-neutral-100'}`}>
                        {srv.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                        ETB {currentRate.toFixed(2)}/{srv.unitLabel === 'impression' ? 'pr' : srv.unitLabel}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5 truncate">
                      {srv.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Customer Reference Attachment */}
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>Customer / Account Tag</span>
                <span className="text-[10px] text-neutral-500">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Design Bureau / Walk-in"
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>Payment &amp; Settlement</span>
                <span className="text-[10px] text-amber-400 font-mono font-medium">Recorded at cashier</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="cash">Cash Settlement (Drawer)</option>
                <option value="telebirr_maria">Telebirr (Maria)</option>
                <option value="telebirr_rahel">Telebirr (Rahel)</option>
                <option value="cbe">CBE (Commercial Bank of Ethiopia)</option>
                <option value="abyssinia">Abyssinia Bank</option>
                <option value="awash">Awash Bank</option>
                <option value="dashen">Dashen Bank</option>
                <option value="store_credit">Internal Account / Store Credit</option>
              </select>
              {paymentMethod === 'store_credit' && (
                <p className="text-[11px] text-amber-400 mt-1">
                  Customer name above is required to link debt with Credit Ledger.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Job Configuration Panel */}
        <div className="lg:col-span-8 bg-neutral-900 rounded-2xl border border-neutral-800/90 p-6 shadow-xl shadow-black/40 space-y-6">
          
          {/* Header of Active Service */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <activeDef.icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  <span>{activeDef.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {activeDef.tag}
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  {activeDef.subtitle}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Station Total</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                ETB {calculatedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* CRITICAL: EDITABLE UNIT PRICE CONTROL BANNER                     */}
          {/* ----------------------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-100 uppercase tracking-wide">
                    Unit Price (per {activeUnitLabel})
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Editable Rate
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Base rate per single {activeUnitLabel}. Edit directly below to adjust for discount, custom job quote, or bulk pricing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-amber-400">ETB</span>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={activeCurrentRate}
                  onChange={(e) => handleSetUnitPrice(selectedService, parseFloat(e.target.value) || 0)}
                  className="w-36 pl-12 pr-3 py-2 text-base font-bold font-mono-numbers rounded-xl border border-amber-500/60 bg-neutral-900 text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => handleResetUnitPrice(selectedService)}
                title="Reset unit price to default standard rate"
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-amber-300 border border-neutral-700/80 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 1. Large Format Configuration (A1 Black, A2 Black, A1 Color, etc) */}
          {/* ----------------------------------------------------------------- */}
          {(selectedService === 'a1_black' || 
            selectedService === 'a2_black' || 
            selectedService === 'a1_color' || 
            selectedService === 'a2_color' || 
            selectedService === 'a1_glossy_color' || 
            selectedService === 'a2_glossy_color' || 
            selectedService === 'a1_blueprint' || 
            selectedService === 'a2_blueprint') && (
            <div className="space-y-5">
              
              {/* Sheets & Copies Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Number of Unique Sheets</span>
                    <span className="text-amber-400 font-mono text-[11px]">{largeFormatSheets} sheets</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={largeFormatSheets}
                      onChange={(e) => setLargeFormatSheets(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 25].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setLargeFormatSheets(cnt)}
                          className={`px-2 py-1 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                            largeFormatSheets === cnt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Copies / Sets to Print</span>
                    <span className="text-amber-400 font-mono text-[11px]">{largeFormatCopies} set(s)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={largeFormatCopies}
                      onChange={(e) => setLargeFormatCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 5, 10].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setLargeFormatCopies(cnt)}
                          className={`px-2 py-1 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                            largeFormatCopies === cnt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Media selection for standard CAD & Posters */}
              {!selectedService.includes('glossy') && !selectedService.includes('blueprint') && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Paper Media Stock
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'bond_80gsm' as const, name: '80gsm Standard Bond', sub: 'Standard architectural CAD' },
                      { id: 'tracing_110gsm' as const, name: '110gsm Tracing Paper', sub: 'Translucent architectural' },
                      { id: 'heavy_180gsm' as const, name: '180gsm Heavy Coated', sub: 'Presentation matte card' },
                      { id: 'photo_glossy' as const, name: 'Photo Glossy Stock', sub: 'Vibrant full-color render' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setLargeFormatMedia(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          largeFormatMedia === m.id
                            ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/40 text-neutral-100'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{m.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{m.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blueprint Specific Tone */}
              {selectedService.includes('blueprint') && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Blueprint Tone &amp; Reproduction Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'blue_line' as const, name: 'White on Blue (Traditional)', sub: 'Inverted blueprint drawing' },
                      { id: 'diazo_ammonia' as const, name: 'Classic Ammonia Diazo', sub: 'Standard blue lines on light' },
                      { id: 'sepia_archival' as const, name: 'Sepia Archival Reproduction', sub: 'Drafting archival brown tone' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => setBlueprintTone(tone.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          blueprintTone === tone.id
                            ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/40 text-neutral-100'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{tone.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{tone.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finishing & Binding */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Plan Set Finishing &amp; Delivery Option
                </label>
                {selectedService.includes('blueprint') ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'loose' as const, name: 'Loose Sheets', sub: 'Standard flat or rolled' },
                      { id: 'corner_staple' as const, name: 'Corner Stapled', sub: 'Heavy steel corner staple (+ETB 2.00)' },
                      { id: 'edge_bound' as const, name: 'Edge Heavy Card Bound', sub: 'Heavy card strip binding (+ETB 15.00)' },
                    ].map((fin) => (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => setBlueprintBinding(fin.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          blueprintBinding === fin.id
                            ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/40 text-neutral-100'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{fin.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{fin.sub}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'rolled' as const, name: 'Rolled in Sleeve', sub: 'Protective paper sleeve (Free)' },
                      { id: 'folded_a4' as const, name: 'Folded to A4 Format', sub: 'Professional engineering fold (+ETB 5.00)' },
                      { id: 'tube' as const, name: 'Heavy Mailing Tube', sub: 'Rigid postal protection tube (+ETB 25.00)' },
                    ].map((fin) => (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => setLargeFormatFinishing(fin.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          largeFormatFinishing === fin.id
                            ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/40 text-neutral-100'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{fin.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">{fin.sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 2. Somali Print Configuration                                    */}
          {/* ----------------------------------------------------------------- */}
          {(selectedService === 'somali_print' || selectedService === 'somale_print') && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Roll Width Dimension
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {(['60cm', '90cm', '120cm', '150cm'] as const).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSomaliWidth(w)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          somaliWidth === w ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Print Density Grade
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {[
                      { id: 'standard' as const, label: 'Line / Text' },
                      { id: 'high_density' as const, label: 'CAD / Map' },
                      { id: 'full_color' as const, label: 'Full Color' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSomaliDensity(d.id)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          somaliDensity === d.id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center justify-between">
                    <span>Length (Meters)</span>
                    <span className="text-amber-400 font-mono text-[11px]">{somaliLengthMeters}m</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={somaliLengthMeters}
                    onChange={(e) => setSomaliLengthMeters(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center justify-between">
                    <span>Quantity / Copies</span>
                    <span className="text-amber-400 font-mono text-[11px]">{somaliCopies} banner(s)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={somaliCopies}
                    onChange={(e) => setSomaliCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Finishing Edges
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {[
                      { id: 'none' as const, label: 'Raw' },
                      { id: 'eyelets' as const, label: 'Eyelets' },
                      { id: 'hemmed' as const, label: 'Hemmed' },
                    ].map((fin) => (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => setSomaliFinishing(fin.id)}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          somaliFinishing === fin.id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {fin.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 3. Office Prints (A4 Color, A4 Black, A3 Color, A3 Copy)          */}
          {/* ----------------------------------------------------------------- */}
          {(selectedService === 'a4_color_print' || 
            selectedService === 'a4_black_copy_print' || 
            selectedService === 'a3_color_print' || 
            selectedService === 'a3_copy_print' ||
            selectedService === 'print_copy') && (
            <div className="space-y-5">
              
              {/* Pages & Sets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Number of Pages in Document</span>
                    <span className="text-amber-400 font-mono text-[11px]">{officePages} page(s)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={officePages}
                      onChange={(e) => setOfficePages(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 5, 10, 25, 50, 100].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setOfficePages(cnt)}
                          className={`px-2 py-1 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                            officePages === cnt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Copies / Sets to Print</span>
                    <span className="text-amber-400 font-mono text-[11px]">{officeCopies} set(s)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={officeCopies}
                      onChange={(e) => setOfficeCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 20].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setOfficeCopies(cnt)}
                          className={`px-2 py-1 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                            officeCopies === cnt ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sides & Paper */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Print Sides (Duplex / Simplex)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setOfficeSides('single')}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        officeSides === 'single' ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Single Sided (1-Page)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfficeSides('double')}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        officeSides === 'double' ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Double Sided (Duplex)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Paper Media Weight
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {[
                      { id: '80gsm' as const, label: '80gsm Bond' },
                      { id: '120gsm' as const, label: '120gsm Smooth' },
                      { id: 'cardstock' as const, label: '200g Card' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setOfficePaper(p.id)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          officePaper === p.id ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Finishing checklist */}
              <div className="flex items-center gap-6 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={officeStaple}
                    onChange={(e) => setOfficeStaple(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                  />
                  <span className="text-neutral-300 font-medium">Corner Stapling (+ETB 1.00/set)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={officePunch}
                    onChange={(e) => setOfficePunch(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                  />
                  <span className="text-neutral-300 font-medium">2/4 Hole Punch (+ETB 1.00/set)</span>
                </label>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 4. End-of-Day Print Counter Log                                   */}
          {/* ----------------------------------------------------------------- */}
          {selectedService === 'print_counter' && (
            <div className="space-y-5">
              {/* Machine Selection Strip */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Select Production Machine / Printer
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'copier_main' as const, name: 'Main Copier (A4/A3)', defaultRate: 1.50, sub: 'High-speed office duplex' },
                    { id: 'plotter_a1' as const, name: 'A1 CAD Plotter', defaultRate: 45.00, sub: 'Engineering plan roll' },
                    { id: 'plotter_blueprint' as const, name: 'Blueprint Copier', defaultRate: 35.00, sub: 'Ammonia/Laser architectural' },
                    { id: 'printer_somale' as const, name: 'Somale Wide Banner', defaultRate: 120.00, sub: 'Large-format roll press' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setCounterMachine(m.id);
                        try {
                          const saved = localStorage.getItem(`paperpress_last_counter_${m.id}`);
                          const op = saved ? parseInt(saved, 10) : (m.id === 'copier_main' ? 48200 : m.id === 'plotter_a1' ? 3200 : m.id === 'plotter_blueprint' ? 1850 : 920);
                          setCounterOpening(op);
                          setCounterClosing(op + (m.id === 'copier_main' ? 350 : m.id === 'plotter_a1' ? 24 : m.id === 'plotter_blueprint' ? 30 : 12));
                        } catch {}
                        handleSetUnitPrice('print_counter', m.defaultRate);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        counterMachine === m.id
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{m.name}</div>
                      <div className="text-[11px] text-amber-300 font-mono mt-0.5">ETB {m.defaultRate.toFixed(2)}/unit</div>
                      <div className="text-[10px] text-neutral-400 mt-1">{m.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meter Readings Console */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/90 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>Opening Meter Reading</span>
                      <span className="text-[10px] text-neutral-500 font-mono">Morning Start</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={counterOpening}
                      onChange={(e) => setCounterOpening(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span className="text-amber-300 font-bold">Closing Meter Reading</span>
                      <span className="text-[10px] text-amber-400 font-mono font-bold">End of Day</span>
                    </label>
                    <input
                      type="number"
                      min={counterOpening}
                      value={counterClosing}
                      onChange={(e) => setCounterClosing(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-amber-500/60 bg-neutral-900 text-amber-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>Spoilage / Test Sheets</span>
                      <span className="text-[10px] text-neutral-500 font-mono">Deducted</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={counterWaste}
                      onChange={(e) => setCounterWaste(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-base font-bold font-mono rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-neutral-400 text-[11px] block">Meter Difference:</span>
                      <strong className="text-sm font-mono text-neutral-200">
                        {Math.max(0, counterClosing - counterOpening).toLocaleString()} prints
                      </strong>
                    </div>
                    <span className="text-neutral-600 font-bold">-</span>
                    <div>
                      <span className="text-neutral-400 text-[11px] block">Spoilage:</span>
                      <strong className="text-sm font-mono text-rose-400">{counterWaste} prints</strong>
                    </div>
                    <span className="text-neutral-600 font-bold">=</span>
                    <div>
                      <span className="text-emerald-400 text-[11px] font-semibold block">Net Billable:</span>
                      <strong className="text-base font-mono text-emerald-400">
                        {Math.max(0, (counterClosing - counterOpening) - counterWaste).toLocaleString()} prints
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reconciliation Date</span>
                  </label>
                  <input
                    type="date"
                    value={counterDate}
                    onChange={(e) => setCounterDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Closing Notes
                  </label>
                  <input
                    type="text"
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 5. Finishing Atelier Panels (Binding, Lamination, Scanning, etc.) */}
          {/* ----------------------------------------------------------------- */}
          {selectedService === 'binding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Binding Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'spiral' as const, name: 'Plastic Spiral' },
                      { id: 'wire' as const, name: 'Wire-O Twin' },
                      { id: 'thermal' as const, name: 'Thermal Book' },
                      { id: 'comb' as const, name: 'Plastic Comb' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBindingType(b.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer ${
                          bindingType === b.id ? 'border-amber-400 bg-amber-950/20 text-amber-200' : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Pages to Bind</label>
                    <input
                      type="number"
                      min="5"
                      value={bindingPages}
                      onChange={(e) => setBindingPages(Math.max(5, parseInt(e.target.value) || 5))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Quantity of Books</label>
                    <input
                      type="number"
                      min="1"
                      value={bindingQuantity}
                      onChange={(e) => setBindingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedService === 'lamination' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Pouch Size</label>
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {(['ID', 'A5', 'A4', 'A3', 'Poster'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLamiSize(s)}
                        className={`py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                          lamiSize === s ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Quantity to Laminate</label>
                  <input
                    type="number"
                    min="1"
                    value={lamiQuantity}
                    onChange={(e) => setLamiQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedService === 'scanning' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Scanning Mode</label>
                <div className="space-y-2">
                  {[
                    { id: 'feeder_pdf' as const, name: 'ADF Feeder (Multi-page PDF)' },
                    { id: 'flatbed' as const, name: '600 DPI Flatbed Glass' },
                    { id: 'photo' as const, name: 'High-Res Photo / Artwork Scan' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScanType(s.id)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                        scanType === s.id ? 'border-amber-400 bg-amber-950/20 text-amber-200' : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Total Pages Scanned</label>
                <input
                  type="number"
                  min="1"
                  value={scanPages}
                  onChange={(e) => setScanPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                />
              </div>
            </div>
          )}

          {selectedService === 'custom_stamp' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Stamp Model</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'pocket' as const, name: 'Pocket Mini' },
                    { id: 'address_3line' as const, name: 'Standard 3-Line' },
                    { id: 'dater' as const, name: 'Date Stamper' },
                    { id: 'seal' as const, name: 'Official Seal' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setStampModel(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer ${
                        stampModel === m.id ? 'border-amber-400 bg-amber-950/20 text-amber-200' : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Custom Stamp Text</label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono"
                />
              </div>
            </div>
          )}

          {selectedService === 'passport_photo' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Photo Standard</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                  {(['passport_us', 'passport_eu', 'visa'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPhotoType(t)}
                      className={`py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                        photoType === t ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400'
                      }`}
                    >
                      {t.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Photo Sets (6 prints each)</label>
                <input
                  type="number"
                  min="1"
                  value={photoSets}
                  onChange={(e) => setPhotoSets(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                />
              </div>
            </div>
          )}

          {selectedService === 'custom_job' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Custom Job Title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Custom Quoted Price (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-neutral-800 bg-neutral-950 text-amber-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Internal Job Specifications &amp; Notes</label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                />
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Bottom Summary Strip & Final Price Override                       */}
          {/* ----------------------------------------------------------------- */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-neutral-400 block font-medium">Job Specifications Summary:</span>
                <p className="text-neutral-200 font-mono text-[11px] leading-relaxed">
                  {currentActiveSummary.desc}
                </p>
              </div>

              {/* Optional Custom Final Price Override */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="text-neutral-400 text-xs whitespace-nowrap">Final Price Override:</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-neutral-400">ETB</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder={calculatedPrice.toFixed(2)}
                    value={priceOverride}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    className="w-28 pl-10 pr-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-neutral-700 bg-neutral-900 text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-850 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>Unit Rate: <strong className="text-amber-300 font-mono">ETB {activeCurrentRate.toFixed(2)}/{activeUnitLabel}</strong></span>
                <span>•</span>
                <span>Est. Production Cost: <strong className="text-neutral-300 font-mono">ETB {currentActiveSummary.cost.toFixed(2)}</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveServiceRecord}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Record Station Job
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndGoToReports}
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Complete &amp; Settle (ETB {effectivePrice.toFixed(2)})
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
