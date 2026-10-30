import React, { useState } from 'react';
import { 
  Printer, 
  BookOpen, 
  Layers, 
  Scan, 
  Stamp, 
  Camera, 
  Wrench, 
  Plus, 
  Check, 
  ArrowRight,
  Info,
  Sparkles,
  Gauge,
  Scroll,
  Maximize2,
  Compass,
  FileCheck,
  Calendar,
  Wallet,
  Clock,
  RotateCcw
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ServiceType, PaymentMethod, PAYMENT_METHOD_NAMES } from '../types';

export const ServicesDesk: React.FC = () => {
  const { recordServiceJob, setActiveTab, showToast, settings } = usePOS();
  const [selectedService, setSelectedService] = useState<ServiceType>('print_counter');
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // 1. Printing & Copying State (A4/A3 Standard)
  const [printColor, setPrintColor] = useState<'bw' | 'color'>('bw');
  const [printSize, setPrintSize] = useState<'A4' | 'A3' | 'Letter'>('A4');
  const [printPaper, setPrintPaper] = useState<'80gsm' | '120gsm' | 'photo' | 'cardstock'>('80gsm');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');
  const [printPages, setPrintPages] = useState<number>(10);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printStaple, setPrintStaple] = useState<boolean>(false);
  const [printPunch, setPrintPunch] = useState<boolean>(false);

  // 1.1. Somale Printing State (Large Format / Roll Banner / Fabric)
  const [somaleWidth, setSomaleWidth] = useState<'60cm' | '90cm' | '120cm' | '150cm'>('90cm');
  const [somaleLengthMeters, setSomaleLengthMeters] = useState<number>(2.0);
  const [somaleDensity, setSomaleDensity] = useState<'standard' | 'high_density' | 'full_color'>('standard');
  const [somaleFinishing, setSomaleFinishing] = useState<'none' | 'eyelets' | 'hemmed'>('none');
  const [somaleCopies, setSomaleCopies] = useState<number>(1);

  // 1.2. A1 Architectural / Engineering CAD & Poster Printing State
  const [a1InkMode, setA1InkMode] = useState<'bw_cad' | 'color_cad' | 'full_render'>('bw_cad');
  const [a1Media, setA1Media] = useState<'bond_80gsm' | 'tracing_110gsm' | 'heavy_180gsm' | 'photo_glossy'>('bond_80gsm');
  const [a1Sheets, setA1Sheets] = useState<number>(3);
  const [a1Sets, setA1Sets] = useState<number>(1);
  const [a1Finishing, setA1Finishing] = useState<'rolled' | 'folded_a4' | 'tube'>('rolled');

  // 1.3. Blueprint Printing State (Diazo Ammonia / Digital Laser / Sepia)
  const [bpType, setBpType] = useState<'diazo_ammonia' | 'digital_laser' | 'sepia_archival'>('diazo_ammonia');
  const [bpSize, setBpSize] = useState<'A1' | 'A0' | 'A2'>('A1');
  const [bpSheets, setBpSheets] = useState<number>(5);
  const [bpSets, setBpSets] = useState<number>(1);
  const [bpBinding, setBpBinding] = useState<'loose' | 'bound_booklet' | 'hanging_clamp'>('loose');

  // 1.4. End-of-Day Print Counter Log State
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
  const [counterRate, setCounterRate] = useState<number>(1.50);
  const [counterDate, setCounterDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [counterNotes, setCounterNotes] = useState<string>('End-of-day print counter meter reading');

  // 2. Binding State
  const [bindingType, setBindingType] = useState<'spiral' | 'wire' | 'thermal' | 'comb'>('spiral');
  const [bindingPages, setBindingPages] = useState<number>(60);
  const [bindingCovers, setBindingCovers] = useState<'standard' | 'premium' | 'none'>('standard');
  const [bindingQuantity, setBindingQuantity] = useState<number>(1);

  // 3. Lamination State
  const [lamiSize, setLamiSize] = useState<'ID' | 'A5' | 'A4' | 'A3' | 'Poster'>('A4');
  const [lamiPouch, setLamiPouch] = useState<'75u' | '125u' | '250u'>('125u');
  const [lamiFinish, setLamiFinish] = useState<'gloss' | 'matte'>('gloss');
  const [lamiQuantity, setLamiQuantity] = useState<number>(2);

  // 4. Scanning State
  const [scanType, setScanType] = useState<'feeder_pdf' | 'flatbed' | 'photo'>('feeder_pdf');
  const [scanPages, setScanPages] = useState<number>(15);
  const [scanEmailDelivery, setScanEmailDelivery] = useState<boolean>(true);

  // 5. Custom Stamp State
  const [stampModel, setStampModel] = useState<'pocket' | 'address_3line' | 'dater' | 'seal'>('address_3line');
  const [stampText, setStampText] = useState<string>('APPROVED - PAID');
  const [stampInk, setStampInk] = useState<'Black' | 'Blue' | 'Red'>('Black');

  // 6. Passport Photo State
  const [photoType, setPhotoType] = useState<'passport_us' | 'passport_eu' | 'visa'>('passport_us');
  const [includeDigitalCopy, setIncludeDigitalCopy] = useState<boolean>(true);
  const [photoSets, setPhotoSets] = useState<number>(1);

  // 7. Custom Ad-hoc Job
  const [customJobTitle, setCustomJobTitle] = useState<string>('Custom Document Typography & Typesetting');
  const [customPrice, setCustomPrice] = useState<string>('25.00');
  const [customCost, setCustomCost] = useState<string>('5.00');
  const [customCustomer, setCustomCustomer] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('Client provided raw manuscript file on USB.');

  // Common customer reference
  const [customerRef, setCustomerRef] = useState<string>('');

  // Cost and Price Computations
  const computePrinting = () => {
    let baseRate = printColor === 'color' ? 0.65 : 0.15;
    if (printSize === 'A3') baseRate *= 1.8;
    if (printPaper === '120gsm') baseRate += 0.10;
    if (printPaper === 'photo') baseRate += 0.40;
    if (printPaper === 'cardstock') baseRate += 0.25;
    if (printSides === 'double') baseRate = baseRate * 1.7;

    let finishingFee = 0;
    if (printStaple) finishingFee += 0.25 * printCopies;
    if (printPunch) finishingFee += 0.25 * printCopies;

    const totalImpressions = printPages * printCopies;
    const price = Number((totalImpressions * baseRate + finishingFee).toFixed(2));
    const cost = Number((price * 0.22).toFixed(2));

    const desc = `${printColor === 'color' ? 'Full Color' : 'B&W'} ${printSize} · ${printPages} pgs × ${printCopies} set(s) · ${printPaper} · ${printSides === 'double' ? '2-Sided' : '1-Sided'}${printStaple ? ' + Stapled' : ''}${printPunch ? ' + Hole Punched' : ''}`;

    return { price, cost, desc };
  };

  const computeBinding = () => {
    let rate = 3.50;
    if (bindingType === 'wire') rate = 4.80;
    if (bindingType === 'thermal') rate = 6.50;
    if (bindingType === 'comb') rate = 2.95;

    if (bindingPages > 150) rate += 2.00;
    else if (bindingPages > 75) rate += 1.00;

    if (bindingCovers === 'premium') rate += 1.50;
    if (bindingCovers === 'none') rate -= 0.50;

    const price = Number((rate * bindingQuantity).toFixed(2));
    const cost = Number((price * 0.25).toFixed(2));
    const typeLabel = 
      bindingType === 'spiral' ? 'Plastic Spiral Coil' :
      bindingType === 'wire' ? 'Wire-O Twin Loop' :
      bindingType === 'thermal' ? 'Thermal Hardcover Book' : 'Plastic Comb';
    const desc = `${typeLabel} Binding · ${bindingPages} pgs · ${bindingCovers} covers · Qty: ${bindingQuantity}`;
    return { price, cost, desc };
  };

  const computeLamination = () => {
    let rate = 2.00;
    if (lamiSize === 'ID') rate = 1.00;
    if (lamiSize === 'A5') rate = 1.50;
    if (lamiSize === 'A3') rate = 3.50;
    if (lamiSize === 'Poster') rate = 8.50;

    if (lamiPouch === '250u') rate += 1.00;
    if (lamiFinish === 'matte') rate += 0.50;

    const price = Number((rate * lamiQuantity).toFixed(2));
    const cost = Number((price * 0.20).toFixed(2));
    const desc = `${lamiSize} Lamination · ${lamiPouch} ${lamiFinish} pouch · Qty: ${lamiQuantity}`;
    return { price, cost, desc };
  };

  const computeScanning = () => {
    let price = 0;
    if (scanType === 'feeder_pdf') {
      price = 1.50 + scanPages * 0.12;
    } else if (scanType === 'flatbed') {
      price = 2.50 + scanPages * 0.35;
    } else {
      price = 3.50 * scanPages;
    }
    const cost = 0.50;
    const typeLabel = scanType === 'feeder_pdf' ? 'ADF Multi-page PDF' : scanType === 'flatbed' ? 'High-Res Flatbed' : 'Archival Photo Scan';
    const desc = `${typeLabel} · ${scanPages} page(s)${scanEmailDelivery ? ' · Digital Delivery via Email' : ' · USB Save'}`;
    return { price: Number(price.toFixed(2)), cost, desc };
  };

  const computeStamp = () => {
    let price = 22.00;
    if (stampModel === 'pocket') price = 16.50;
    if (stampModel === 'dater') price = 28.00;
    if (stampModel === 'seal') price = 34.00;
    const cost = Number((price * 0.30).toFixed(2));
    const desc = `Custom Rubber Stamp (${stampModel}) · Ink: ${stampInk} · "${stampText}"`;
    return { price, cost, desc };
  };

  const computePassportPhoto = () => {
    let price = 14.00 * photoSets;
    if (includeDigitalCopy) price += 3.50;
    const cost = 2.20 * photoSets;
    const desc = `Biometric Photos (${photoType.replace('_', ' ').toUpperCase()}) · ${photoSets * 6} prints${includeDigitalCopy ? ' + Digital JPEG code' : ''}`;
    return { price: Number(price.toFixed(2)), cost, desc };
  };

  const computeSomale = () => {
    let basePerMeter = 110.0;
    if (somaleDensity === 'high_density') basePerMeter = 165.0;
    if (somaleDensity === 'full_color') basePerMeter = 240.0;

    let widthMult = 1.0;
    if (somaleWidth === '60cm') widthMult = 0.75;
    if (somaleWidth === '120cm') widthMult = 1.35;
    if (somaleWidth === '150cm') widthMult = 1.70;

    let finishPerMeter = 0;
    if (somaleFinishing === 'eyelets') finishPerMeter = 20.0;
    if (somaleFinishing === 'hemmed') finishPerMeter = 30.0;

    const meterRate = (basePerMeter * widthMult) + finishPerMeter;
    const price = Number((meterRate * somaleLengthMeters * somaleCopies).toFixed(2));
    const cost = Number((price * 0.35).toFixed(2));

    const densityLabel = somaleDensity === 'standard' ? 'Standard Line/Text' : somaleDensity === 'high_density' ? 'High-Density CAD/Map' : 'Full-Color Banner';
    const finishLabel = somaleFinishing === 'eyelets' ? ' + Eyelets' : somaleFinishing === 'hemmed' ? ' + Hemmed Edges' : '';
    const desc = `Somale Printing · ${somaleWidth} × ${somaleLengthMeters}m · ${densityLabel}${finishLabel} · Qty: ${somaleCopies}`;
    return { price, cost, desc };
  };

  const computeA1 = () => {
    let rate = 45.00;
    if (a1InkMode === 'color_cad') rate = 75.00;
    if (a1InkMode === 'full_render') rate = 120.00;

    if (a1Media === 'tracing_110gsm') rate += 25.00;
    if (a1Media === 'heavy_180gsm') rate += 20.00;
    if (a1Media === 'photo_glossy') rate += 50.00;

    let foldRate = 0;
    if (a1Finishing === 'folded_a4') foldRate = 5.00;
    let tubeRate = 0;
    if (a1Finishing === 'tube') tubeRate = 40.00;

    const totalSheets = a1Sheets * a1Sets;
    const price = Number((((rate + foldRate) * totalSheets) + tubeRate).toFixed(2));
    const cost = Number((price * 0.28).toFixed(2));

    const inkLabel = a1InkMode === 'bw_cad' ? 'B&W CAD Drawing' : a1InkMode === 'color_cad' ? 'Color CAD Plan' : '3D Photo Render';
    const mediaLabel = a1Media === 'bond_80gsm' ? '80gsm Bond' : a1Media === 'tracing_110gsm' ? '110gsm Tracing Paper' : a1Media === 'heavy_180gsm' ? '180gsm Heavy' : 'Glossy Photo';
    const finishLabel = a1Finishing === 'folded_a4' ? ' · Folded to A4 Packet' : a1Finishing === 'tube' ? ' · Protected in Tube' : ' · Rolled';
    const desc = `A1 Printing · ${inkLabel} · ${mediaLabel} · ${a1Sheets} plan(s) × ${a1Sets} set(s)${finishLabel}`;
    return { price, cost, desc };
  };

  const computeBlueprint = () => {
    let rate = 35.00;
    if (bpType === 'digital_laser') rate = 40.00;
    if (bpType === 'sepia_archival') rate = 85.00;

    let sizeMult = 1.0;
    if (bpSize === 'A2') sizeMult = 0.75;
    if (bpSize === 'A0') sizeMult = 1.80;

    let bindingTotal = 0;
    if (bpBinding === 'bound_booklet') bindingTotal = 30.00 * bpSets;
    if (bpBinding === 'hanging_clamp') bindingTotal = 55.00;

    const totalDrawings = bpSheets * bpSets;
    const price = Number(((rate * sizeMult * totalDrawings) + bindingTotal).toFixed(2));
    const cost = Number((price * 0.25).toFixed(2));

    const typeLabel = bpType === 'diazo_ammonia' ? 'Diazo Blue Line' : bpType === 'digital_laser' ? 'Digital Laser Blueprint' : 'Archival Sepia/Mylar';
    const bindingLabel = bpBinding === 'bound_booklet' ? ' · Bound Plan Set' : bpBinding === 'hanging_clamp' ? ' · Jobsite Clamp' : ' · Loose';
    const desc = `Blueprint Printing · ${typeLabel} (${bpSize}) · ${bpSheets} drawing(s) × ${bpSets} set(s)${bindingLabel}`;
    return { price, cost, desc };
  };

  const computePrintCounter = () => {
    const gross = Math.max(0, counterClosing - counterOpening);
    const netBillable = Math.max(0, gross - counterWaste);
    const price = Number((netBillable * counterRate).toFixed(2));
    const cost = Number((price * 0.22).toFixed(2));

    const machineName = 
      counterMachine === 'copier_main' ? 'Main Digital Copier (A4/A3)' :
      counterMachine === 'plotter_a1' ? 'A1 Large-Format Plotter' :
      counterMachine === 'plotter_blueprint' ? 'Blueprint Copier' : 'Somale Wide-Format Press';

    const desc = `Daily Print Counter [${machineName}] · Meter: ${counterOpening.toLocaleString()} → ${counterClosing.toLocaleString()} (${gross} gross - ${counterWaste} spoiled = ${netBillable} billable @ ETB ${counterRate.toFixed(2)}/pg)`;
    return { price, cost, desc, netBillable, gross };
  };

  const handleSaveServiceRecord = () => {
    if (paymentMethod === 'store_credit' && !customerRef.trim()) {
      showToast('Customer / Account Name is mandatory when charging service to Store Credit.');
      return;
    }

    let price = 0;
    let cost = 0;
    let name = '';
    let details = '';

    if (selectedService === 'print_counter') {
      const res = computePrintCounter();
      price = res.price;
      cost = res.cost;
      name = 'End-of-Day Print Counter Settlement';
      details = res.desc;
      // Persist closing reading to remember for tomorrow's opening reading
      try {
        localStorage.setItem(`paperpress_last_counter_${counterMachine}`, String(counterClosing));
      } catch {}
    } else if (selectedService === 'somale_print') {
      const res = computeSomale();
      price = res.price;
      cost = res.cost;
      name = `Somale Printing (${somaleWidth} Roll)`;
      details = res.desc;
    } else if (selectedService === 'a1_print') {
      const res = computeA1();
      price = res.price;
      cost = res.cost;
      name = `A1 Plan & Poster Printing`;
      details = res.desc;
    } else if (selectedService === 'blueprint_print') {
      const res = computeBlueprint();
      price = res.price;
      cost = res.cost;
      name = `Blueprint Architectural Plan Printing`;
      details = res.desc;
    } else if (selectedService === 'print_copy') {
      const res = computePrinting();
      price = res.price;
      cost = res.cost;
      name = `Document Print / Copy (${printColor.toUpperCase()})`;
      details = res.desc;
    } else if (selectedService === 'binding') {
      const res = computeBinding();
      price = res.price;
      cost = res.cost;
      name = 'Document Finishing & Binding';
      details = res.desc;
    } else if (selectedService === 'lamination') {
      const res = computeLamination();
      price = res.price;
      cost = res.cost;
      name = `Protective Lamination (${lamiSize})`;
      details = res.desc;
    } else if (selectedService === 'scanning') {
      const res = computeScanning();
      price = res.price;
      cost = res.cost;
      name = 'Document Scanning & Archival';
      details = res.desc;
    } else if (selectedService === 'custom_stamp') {
      const res = computeStamp();
      price = res.price;
      cost = res.cost;
      name = 'Custom Self-Inking Rubber Stamp';
      details = res.desc;
    } else if (selectedService === 'passport_photo') {
      const res = computePassportPhoto();
      price = res.price;
      cost = res.cost;
      name = 'Biometric Passport & ID Photos';
      details = res.desc;
    } else {
      price = Number(parseFloat(customPrice) || 0);
      cost = Number(parseFloat(customCost) || 0);
      name = customJobTitle;
      details = `${customNotes} ${customCustomer ? `(Client: ${customCustomer})` : ''}`;
    }

    if (customerRef) {
      details += ` · Client Ref: ${customerRef}`;
    }

    const calculatedBase = Math.max(0, price);
    const finalBillablePrice = priceOverride !== '' ? Math.max(0, parseFloat(priceOverride) || 0) : calculatedBase;
    if (priceOverride !== '') {
      details += ` · [Custom Rate: ETB ${finalBillablePrice.toFixed(2)}]`;
    }

    recordServiceJob({
      name,
      category: 'Print & Copy Services',
      details,
      price: finalBillablePrice,
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

  const servicesList: { id: ServiceType; title: string; subtitle: string; icon: any; tag?: string }[] = [
    { id: 'print_counter', title: 'End-of-Day Print Counter', subtitle: 'Reconcile meter closing impressions & daily settlement', icon: Gauge, tag: 'EOD Daily' },
    { id: 'somale_print', title: 'Somale Printing', subtitle: 'Large format roll banner, fabric & heavy somale print', icon: Scroll, tag: 'Roll/Banner' },
    { id: 'a1_print', title: 'A1 Printing', subtitle: 'Architectural CAD, engineering plans & large posters', icon: Maximize2, tag: 'A1 CAD' },
    { id: 'blueprint_print', title: 'Blueprint Printing', subtitle: 'Ammonia blue line & digital architectural plan sets', icon: Compass, tag: 'Plans' },
    { id: 'print_copy', title: 'Printing & Copying', subtitle: 'B&W, Full Color, A4/A3, Heavy stock', icon: Printer },
    { id: 'binding', title: 'Document Binding', subtitle: 'Spiral coil, wire-o, thermal, comb', icon: BookOpen },
    { id: 'lamination', title: 'Lamination Bureau', subtitle: '75-250 micron pouches, ID to Poster', icon: Layers },
    { id: 'scanning', title: 'Scanning & Digitize', subtitle: 'High-speed ADF PDF, 600dpi flatbed', icon: Scan },
    { id: 'custom_stamp', title: 'Custom Rubber Stamps', subtitle: 'Self-inking address, date, seals', icon: Stamp },
    { id: 'passport_photo', title: 'Passport & ID Photos', subtitle: 'Biometric 6-pack + digital file', icon: Camera },
    { id: 'custom_job', title: 'Custom Workshop Job', subtitle: 'Typesetting, large format, bespoke', icon: Wrench },
  ];

  let currentActiveSummary = { price: 0, cost: 0, desc: '' };
  if (selectedService === 'print_counter') currentActiveSummary = computePrintCounter();
  else if (selectedService === 'somale_print') currentActiveSummary = computeSomale();
  else if (selectedService === 'a1_print') currentActiveSummary = computeA1();
  else if (selectedService === 'blueprint_print') currentActiveSummary = computeBlueprint();
  else if (selectedService === 'print_copy') currentActiveSummary = computePrinting();
  else if (selectedService === 'binding') currentActiveSummary = computeBinding();
  else if (selectedService === 'lamination') currentActiveSummary = computeLamination();
  else if (selectedService === 'scanning') currentActiveSummary = computeScanning();
  else if (selectedService === 'custom_stamp') currentActiveSummary = computeStamp();
  else if (selectedService === 'passport_photo') currentActiveSummary = computePassportPhoto();
  else {
    currentActiveSummary = {
      price: parseFloat(customPrice) || 0,
      cost: parseFloat(customCost) || 0,
      desc: customJobTitle,
    };
  }

  const calculatedPrice = currentActiveSummary.price;
  const effectivePrice = priceOverride !== '' ? (parseFloat(priceOverride) || 0) : calculatedPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header section in Black & Gold */}
      <div className="mb-6 pb-4 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Stationery Services &amp; Copy Atelier</span>
            <span className="text-amber-400 font-serif italic text-base font-normal">Desk</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            On-demand job costing for printing, thesis binding, protective lamination, and bespoke stationery commissions.
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
            <span>Record Service Job</span>
          </button>
          <button
            onClick={handleSaveAndGoToReports}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>Save &amp; View Records</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Service Selector (Navigation list in Black & Gold) */}
        <div className="lg:col-span-4 space-y-2">
          <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wider">
            Select Service Station
          </label>
          <div className="space-y-2">
            {servicesList.map((srv) => {
              const Icon = srv.icon;
              const isSelected = selectedService === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => {
                    setSelectedService(srv.id);
                    setPriceOverride('');
                  }}
                  className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/80 bg-neutral-900 text-neutral-100 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-400 text-neutral-950 shadow-xs' : 'bg-neutral-900 text-amber-400/80'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-sm font-semibold truncate leading-tight ${isSelected ? 'text-amber-200' : 'text-neutral-100'}`}>
                        {srv.title}
                      </span>
                      {srv.tag && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          {srv.tag}
                        </span>
                      )}
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
          <div className="pt-4 border-t border-neutral-800 mt-5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>Customer / Account Tag</span>
                <span className="text-[10px] text-neutral-500">Optional</span>
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe / Apex Design Studio"
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
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
                  ⚠️ Customer name above is required to link debt with Credit Ledger.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Job Configuration Panel */}
        <div className="lg:col-span-8 bg-neutral-900 rounded-2xl border border-neutral-800/90 p-6 shadow-xl shadow-black/40">
          
          {/* 0. End-of-Day Print Counter Settlement Configuration */}
          {selectedService === 'print_counter' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Gauge className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      <span>End-of-Day Print Counter Settlement</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Reconcile daily printer machine meter readings at closing and record batch revenue
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-medium">
                  EOD Closing Protocol
                </span>
              </div>

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
                        setCounterRate(m.defaultRate);
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
                  {/* Opening Reading */}
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
                      className="w-full px-3 py-2 text-base font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 focus:border-amber-500/50"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">Previous recorded shift closing</span>
                  </div>

                  {/* Closing Reading */}
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
                      className="w-full px-3 py-2 text-base font-bold font-mono-numbers rounded-xl border border-amber-500/60 bg-neutral-900 text-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">Read from printer physical counter</span>
                  </div>

                  {/* Waste / Spoilage Deduction */}
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
                      className="w-full px-3 py-2 text-base font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 focus:border-amber-500/50"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">Paper jams &amp; test calibration prints</span>
                  </div>
                </div>

                {/* Calculation Strip */}
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
                      <strong className="text-sm font-mono text-rose-400">
                        {counterWaste} prints
                      </strong>
                    </div>
                    <span className="text-neutral-600 font-bold">=</span>
                    <div>
                      <span className="text-emerald-400 text-[11px] font-semibold block">Net Billable Prints:</span>
                      <strong className="text-base font-mono text-emerald-400">
                        {Math.max(0, (counterClosing - counterOpening) - counterWaste).toLocaleString()} prints
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 text-[11px]">Billing Rate:</span>
                    <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 font-mono">ETB</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={counterRate}
                        onChange={(e) => setCounterRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 text-right font-mono font-bold text-xs bg-transparent text-amber-300 focus:outline-none"
                      />
                      <span className="text-[10px] text-neutral-400">/pg</span>
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Closing Notes / Shift Reference
                  </label>
                  <input
                    type="text"
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    placeholder="e.g. End of day counter verified at 07:30 PM closing"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1.1. Somale Printing Configuration */}
          {selectedService === 'somale_print' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Scroll className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      <span>Somale Printing Studio (Roll Banner &amp; Fabric)</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Heavy Somale material, wide roll banners, custom meter length signage
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-mono-numbers font-medium">
                  Large Format Roll
                </span>
              </div>

              {/* Roll Width & Density */}
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
                        onClick={() => setSomaleWidth(w)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          somaleWidth === w 
                            ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs' 
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Print Inking &amp; Density Grade
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                    {[
                      { id: 'standard' as const, label: 'Line / Text' },
                      { id: 'high_density' as const, label: 'CAD / Map' },
                      { id: 'full_color' as const, label: 'Full Graphic' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSomaleDensity(d.id)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          somaleDensity === d.id 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold shadow-xs' 
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Length and Copies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Print Length (Meters)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="100"
                      value={somaleLengthMeters}
                      onChange={(e) => setSomaleLengthMeters(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                    />
                    <span className="text-xs text-neutral-400 font-mono">meters</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {[1, 1.5, 2, 2.5, 3, 5].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSomaleLengthMeters(m)}
                        className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono transition-colors cursor-pointer"
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Finishing &amp; Edges
                  </label>
                  <select
                    value={somaleFinishing}
                    onChange={(e) => setSomaleFinishing(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="none">Raw Edge Cut (Standard)</option>
                    <option value="eyelets">Corner &amp; Edge Eyelets / Grommets (+ETB 20/m)</option>
                    <option value="hemmed">Reinforced Hemmed Border (+ETB 30/m)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={somaleCopies}
                    onChange={(e) => setSomaleCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 1.2. A1 Architectural & Poster Printing Configuration */}
          {selectedService === 'a1_print' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Maximize2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      <span>A1 Architectural &amp; Engineering Plan Printing</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Standard A1 (594 × 841 mm) CAD line drawings, municipal plans, full-color elevations
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-mono-numbers font-medium">
                  594 × 841 mm
                </span>
              </div>

              {/* Ink Mode */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Inking &amp; Render Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'bw_cad' as const, label: 'B&W CAD Drawing', price: 'ETB 45.00/sheet', sub: 'Floor plans, elevations, sections' },
                    { id: 'color_cad' as const, label: 'Color CAD Lines', price: 'ETB 75.00/sheet', sub: 'Colored plumbing, electrical, HVAC' },
                    { id: 'full_render' as const, label: '3D Render / Poster', price: 'ETB 120.00/sheet', sub: 'Full graphic presentation renders' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setA1InkMode(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        a1InkMode === m.id
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{m.label}</div>
                      <div className="text-xs font-mono font-medium text-amber-300 mt-0.5">{m.price}</div>
                      <div className="text-[10px] text-neutral-400 mt-1">{m.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Paper Stock */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Paper Stock Grade
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bond_80gsm' as const, label: '80gsm CAD Bond', note: 'Standard draft' },
                    { id: 'tracing_110gsm' as const, label: '110gsm Tracing Paper', note: '+ETB 25 (Vellum)' },
                    { id: 'heavy_180gsm' as const, label: '180gsm Heavy Matte', note: '+ETB 20 (Presentation)' },
                    { id: 'photo_glossy' as const, label: 'Glossy Photo Poster', note: '+ETB 50 (Photo quality)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setA1Media(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        a1Media === p.id
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{p.label}</div>
                      <div className="text-[10px] text-amber-400/80 mt-0.5">{p.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheets, Sets, Finishing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Drawing Sheets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={a1Sheets}
                    onChange={(e) => setA1Sheets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Plan Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={a1Sets}
                    onChange={(e) => setA1Sets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Packaging / Finishing
                  </label>
                  <select
                    value={a1Finishing}
                    onChange={(e) => setA1Finishing(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="rolled">Rolled Clean</option>
                    <option value="folded_a4">Folded to A4 Binder Packet (+ETB 5/sheet)</option>
                    <option value="tube">Hard Plastic Protective Tube (+ETB 40)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 1.3. Blueprint Printing Configuration */}
          {selectedService === 'blueprint_print' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Compass className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      <span>Blueprint Architectural &amp; Engineering Plan Printing</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Classic ammonia diazo blue lines, digital high-contrast blueprints, construction permit sets
                    </p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-mono-numbers font-medium">
                  Construction Blueprints
                </span>
              </div>

              {/* Blueprint Process Type */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Blueprint Reproduction Process
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'diazo_ammonia' as const, label: 'Diazo Ammonia Blue Line', price: 'ETB 35.00/sheet', sub: 'Traditional blueprint blue line' },
                    { id: 'digital_laser' as const, label: 'Digital Laser Blueprint', price: 'ETB 40.00/sheet', sub: 'High-contrast waterproof laser' },
                    { id: 'sepia_archival' as const, label: 'Sepia / Archival Mylar', price: 'ETB 85.00/sheet', sub: 'Permanent engineering master' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setBpType(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        bpType === p.id
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{p.label}</div>
                      <div className="text-xs font-mono font-medium text-amber-300 mt-0.5">{p.price}</div>
                      <div className="text-[10px] text-neutral-400 mt-1">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sheet Dimensions */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Blueprint Sheet Size
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                  {[
                    { id: 'A1' as const, label: 'A1 (594 × 841 mm)', note: 'Standard Architectural Plan' },
                    { id: 'A0' as const, label: 'A0 (841 × 1189 mm)', note: 'Mega Master Plan' },
                    { id: 'A2' as const, label: 'A2 (420 × 594 mm)', note: 'Site / Detail Plan' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBpSize(s.id)}
                      className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        bpSize === s.id
                          ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawings, Sets, Binding */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Drawings
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={bpSheets}
                    onChange={(e) => setBpSheets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Plan Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bpSets}
                    onChange={(e) => setBpSets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Blueprint Set Binding
                  </label>
                  <select
                    value={bpBinding}
                    onChange={(e) => setBpBinding(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="loose">Loose Drawings (Rolled)</option>
                    <option value="bound_booklet">Bound Plan Booklet (Blue Strip + Heavy Staple) +ETB 30/set</option>
                    <option value="hanging_clamp">Aluminum Jobsite Hanging Clamp (+ETB 55)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 1. Printing & Copying Configuration */}
          {selectedService === 'print_copy' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span>Document Printing &amp; Copying Specs</span>
                </h3>
                <span className="text-xs text-amber-400 font-mono-numbers font-medium">
                  Est. Gross Margin: 78%
                </span>
              </div>

              {/* Color Mode & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Color Inking Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPrintColor('bw')}
                      className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        printColor === 'bw' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-xs font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      B&amp;W (ETB 0.15/pg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintColor('color')}
                      className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        printColor === 'color' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 shadow-xs font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Full Color (ETB 0.65/pg)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Paper Size
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                    {(['A4', 'A3', 'Letter'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPrintSize(sz)}
                        className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          printSize === sz ? 'bg-neutral-800 text-amber-300 border border-amber-500/40 shadow-xs' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Paper Media Stock */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Paper Stock Grade
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '80gsm', label: '80gsm Standard', note: 'Regular copy paper' },
                    { id: '120gsm', label: '120gsm Bond', note: '+ETB 0.10/pg (Smooth)' },
                    { id: 'photo', label: '200gsm Glossy', note: '+ETB 0.40/pg (Photo)' },
                    { id: 'cardstock', label: '250gsm Ivory', note: '+ETB 0.25/pg (Card)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrintPaper(p.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        printPaper === p.id 
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs' 
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{p.label}</div>
                      <div className="text-[11px] text-amber-400/80 mt-0.5">{p.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sides, Pages, and Copies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Sides
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPrintSides('single')}
                      className={`py-2 text-xs font-medium rounded-md cursor-pointer ${
                        printSides === 'single' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      1-Sided
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSides('double')}
                      className={`py-2 text-xs font-medium rounded-md cursor-pointer ${
                        printSides === 'double' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      2-Sided
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Original Pages in Doc
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={printPages}
                    onChange={(e) => setPrintPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Sets / Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={printCopies}
                    onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Finishing Addons */}
              <div className="pt-2 border-t border-neutral-800 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-300">
                  <input
                    type="checkbox"
                    checked={printStaple}
                    onChange={(e) => setPrintStaple(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
                  />
                  <span>Corner Staple (+ETB 0.25/set)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-300">
                  <input
                    type="checkbox"
                    checked={printPunch}
                    onChange={(e) => setPrintPunch(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700 focus:ring-amber-500"
                  />
                  <span>Standard 2-Hole / 3-Hole Punch (+ETB 0.25/set)</span>
                </label>
              </div>
            </div>
          )}

          {/* 2. Document Binding Configuration */}
          {selectedService === 'binding' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Document Finishing &amp; Binding Atelier</span>
                </h3>
                <span className="text-xs text-neutral-400 font-mono-numbers">
                  Includes Clear Front &amp; Leatherette Back
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Binding Spine Architecture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'spiral', name: 'Plastic Spiral Coil', price: 'ETB 3.50 base', note: 'Lays 360° flat' },
                    { id: 'wire', name: 'Wire-O Twin Loop', price: 'ETB 4.80 base', note: 'Executive metal twin' },
                    { id: 'thermal', name: 'Thermal Book', price: 'ETB 6.50 base', note: 'Square hardcover spine' },
                    { id: 'comb', name: 'Plastic Comb', price: 'ETB 2.95 base', note: 'Standard reports' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBindingType(b.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        bindingType === b.id
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs'
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100">{b.name}</div>
                      <div className="text-xs font-mono-numbers font-medium text-amber-300 mt-0.5">{b.price}</div>
                      <div className="text-[11px] text-neutral-400 mt-1">{b.note}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Estimated Page Count
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="450"
                    value={bindingPages}
                    onChange={(e) => setBindingPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    {bindingPages > 150 ? 'Large coil required (+ETB 2.00)' : bindingPages > 75 ? 'Medium coil (+ETB 1.00)' : 'Small coil'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Covers Configuration
                  </label>
                  <select
                    value={bindingCovers}
                    onChange={(e) => setBindingCovers(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="standard">Standard (Clear PVC + Black Card)</option>
                    <option value="premium">Premium (Frosted Matte + Navy Leatherette) +ETB 1.50</option>
                    <option value="none">No Covers (-ETB 0.50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Bound Booklets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={bindingQuantity}
                    onChange={(e) => setBindingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Lamination Configuration */}
          {selectedService === 'lamination' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Protective Thermal Lamination</span>
                </h3>
                <span className="text-xs text-neutral-400 font-mono-numbers">
                  Waterproof &amp; Tear-Proof Seal
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Lamination Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'ID', label: 'Badge / ID Card', price: 'ETB 1.00' },
                    { id: 'A5', label: 'A5 Half Sheet', price: 'ETB 1.50' },
                    { id: 'A4', label: 'A4 Standard', price: 'ETB 2.00' },
                    { id: 'A3', label: 'A3 Large', price: 'ETB 3.50' },
                    { id: 'Poster', label: 'Poster 18x24"', price: 'ETB 8.50' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setLamiSize(sz.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        lamiSize === sz.id 
                          ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50 shadow-xs' 
                          : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-neutral-100">{sz.label}</div>
                      <div className="text-xs font-mono-numbers text-amber-300 mt-1">{sz.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Pouch Thickness
                  </label>
                  <select
                    value={lamiPouch}
                    onChange={(e) => setLamiPouch(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="75u">75 Micron (Flexible)</option>
                    <option value="125u">125 Micron (Heavy Duty - Most Popular)</option>
                    <option value="250u">250 Micron (Rigid Menu Board) +ETB 1.00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Finish Texture
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setLamiFinish('gloss')}
                      className={`py-2 text-xs font-medium rounded-md cursor-pointer ${
                        lamiFinish === 'gloss' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      High Gloss
                    </button>
                    <button
                      type="button"
                      onClick={() => setLamiFinish('matte')}
                      className={`py-2 text-xs font-medium rounded-md cursor-pointer ${
                        lamiFinish === 'matte' ? 'bg-neutral-800 text-amber-300 font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Anti-Glare Matte (+ETB 0.50)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={lamiQuantity}
                    onChange={(e) => setLamiQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Scanning Configuration */}
          {selectedService === 'scanning' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Scan className="w-5 h-5 text-amber-400" />
                  <span>High-Resolution Document Scanning &amp; Archival</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'feeder_pdf', title: 'ADF Bulk Feeder (PDF)', desc: 'Multi-page legal docs (ETB 1.50 base + ETB 0.12/pg)' },
                  { id: 'flatbed', title: 'Flatbed Bound Book Scan', desc: 'Passports, deeds (ETB 2.50 base + ETB 0.35/pg)' },
                  { id: 'photo', title: 'Archival Photo Scan (600 DPI)', desc: 'Color restored TIFF / JPEG (ETB 3.50/photo)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScanType(s.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      scanType === s.id ? 'border-amber-400 bg-amber-950/20 ring-1 ring-amber-400/50' : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-neutral-100">{s.title}</div>
                    <div className="text-[11px] text-neutral-400 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of Pages / Photographs
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={scanPages}
                    onChange={(e) => setScanPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scanEmailDelivery}
                      onChange={(e) => setScanEmailDelivery(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                    />
                    <span>Email encrypted PDF directly to customer</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 5. Custom Rubber Stamps */}
          {selectedService === 'custom_stamp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-amber-400" />
                  <span>Custom Self-Inking Rubber Stamps</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Stamp Shell Type
                  </label>
                  <select
                    value={stampModel}
                    onChange={(e) => setStampModel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="pocket">Pocket Foldable Stamp (ETB 16.50)</option>
                    <option value="address_3line">Standard 3-Line Address Stamp (ETB 22.00)</option>
                    <option value="dater">Heavy Duty Date &amp; Text Stamp (ETB 28.00)</option>
                    <option value="seal">Corporate Circular Seal (ETB 34.00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Ink Pad Color
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                    {(['Black', 'Blue', 'Red'] as const).map((clr) => (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => setStampInk(clr)}
                        className={`py-2 text-xs font-medium rounded-md cursor-pointer ${
                          stampInk === clr ? 'bg-neutral-800 text-amber-300 font-semibold border border-amber-500/30' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Stamp Inscription Text (Line 1 - 3)
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono"
                  placeholder="e.g. APPROVED FOR PAYMENT / SIGNATURE"
                />
              </div>
            </div>
          )}

          {/* 6. Passport Photos */}
          {selectedService === 'passport_photo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <span>Biometric Passport &amp; ID Photos</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Jurisdiction / Size Specification
                  </label>
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  >
                    <option value="passport_us">US Passport / Visa (2" × 2" - White Background)</option>
                    <option value="passport_eu">EU / UK Passport (35mm × 45mm - Light Grey)</option>
                    <option value="visa">Schengen / International Visa Specifics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Number of 6-Photo Sheets
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={photoSets}
                    onChange={(e) => setPhotoSets(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDigitalCopy}
                    onChange={(e) => setIncludeDigitalCopy(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-700"
                  />
                  <span>Generate official digital photo verification code + email copy (+ETB 3.50)</span>
                </label>
              </div>
            </div>
          )}

          {/* 7. Custom Ad-hoc Job */}
          {selectedService === 'custom_job' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <span>Bespoke Workshop Job / Custom Service</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Service Job Title
                  </label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Customer Name / Project
                  </label>
                  <input
                    type="text"
                    value={customCustomer}
                    onChange={(e) => setCustomCustomer(e.target.value)}
                    placeholder="e.g. City Council Project"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Billable Retail Price (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Internal Cost of Materials (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-numbers rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  Job Specifications &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-100"
                />
              </div>
            </div>
          )}

          {/* Real-time Order Summary Strip in Black & Gold */}
          <div className="mt-8 pt-5 border-t border-neutral-800 bg-neutral-950/80 -mx-6 -mb-6 p-6 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-100">
                  {currentActiveSummary.desc || 'Configured Service Job'}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {settings.taxEnabled !== false ? `Taxable at store standard ${((settings.taxRate ?? 0.15) * 100).toFixed(1)}% VAT` : 'Tax Exempt'} · On-demand counter delivery
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <span className="text-[10px] text-neutral-400 uppercase font-mono font-semibold">
                    Chargeable Price
                  </span>
                  {priceOverride !== '' && (
                    <button
                      type="button"
                      onClick={() => setPriceOverride('')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                      title="Reset to calculated formula rate"
                    >
                      (Reset: ETB {calculatedPrice.toFixed(2)})
                    </button>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-xl border border-amber-500/50 shadow-inner focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
                  <span className="text-xs font-bold text-amber-400 font-mono">ETB</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={calculatedPrice.toFixed(2)}
                    value={priceOverride !== '' ? priceOverride : calculatedPrice.toFixed(2)}
                    onChange={(e) => setPriceOverride(e.target.value)}
                    className="w-28 text-right bg-transparent text-xl font-bold font-mono-numbers text-amber-300 focus:outline-none"
                    title="Click to edit service price as needed"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveServiceRecord}
                className="min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Save Service Record</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
