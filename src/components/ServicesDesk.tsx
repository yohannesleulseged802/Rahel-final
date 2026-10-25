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
  Sparkles
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ServiceType } from '../types';

export const ServicesDesk: React.FC = () => {
  const { recordServiceJob, setActiveTab, showToast, settings } = usePOS();
  const [selectedService, setSelectedService] = useState<ServiceType>('print_copy');
  const [priceOverride, setPriceOverride] = useState<string>('');

  // 1. Printing & Copying State
  const [printColor, setPrintColor] = useState<'bw' | 'color'>('bw');
  const [printSize, setPrintSize] = useState<'A4' | 'A3' | 'Letter'>('A4');
  const [printPaper, setPrintPaper] = useState<'80gsm' | '120gsm' | 'photo' | 'cardstock'>('80gsm');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');
  const [printPages, setPrintPages] = useState<number>(10);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [printStaple, setPrintStaple] = useState<boolean>(false);
  const [printPunch, setPrintPunch] = useState<boolean>(false);

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

  const handleSaveServiceRecord = () => {
    let price = 0;
    let cost = 0;
    let name = '';
    let details = '';

    if (selectedService === 'print_copy') {
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
      customerName: customerRef || (selectedService === 'custom_job' ? customCustomer : undefined),
      notes: selectedService === 'custom_job' ? customNotes : undefined
    });
    setPriceOverride('');
  };

  const handleSaveAndGoToReports = () => {
    handleSaveServiceRecord();
    setActiveTab('reports');
  };

  const servicesList: { id: ServiceType; title: string; subtitle: string; icon: any }[] = [
    { id: 'print_copy', title: 'Printing & Copying', subtitle: 'B&W, Full Color, A4/A3, Heavy stock', icon: Printer },
    { id: 'binding', title: 'Document Binding', subtitle: 'Spiral coil, wire-o, thermal, comb', icon: BookOpen },
    { id: 'lamination', title: 'Lamination Bureau', subtitle: '75-250 micron pouches, ID to Poster', icon: Layers },
    { id: 'scanning', title: 'Scanning & Digitize', subtitle: 'High-speed ADF PDF, 600dpi flatbed', icon: Scan },
    { id: 'custom_stamp', title: 'Custom Rubber Stamps', subtitle: 'Self-inking address, date, seals', icon: Stamp },
    { id: 'passport_photo', title: 'Passport & ID Photos', subtitle: 'Biometric 6-pack + digital file', icon: Camera },
    { id: 'custom_job', title: 'Custom Workshop Job', subtitle: 'Typesetting, large format, bespoke', icon: Wrench },
  ];

  let currentActiveSummary = { price: 0, cost: 0, desc: '' };
  if (selectedService === 'print_copy') currentActiveSummary = computePrinting();
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
                    <div className={`text-sm font-semibold truncate leading-tight ${isSelected ? 'text-amber-200' : 'text-neutral-100'}`}>
                      {srv.title}
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
          <div className="pt-4 border-t border-neutral-800 mt-6">
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              Customer / Account Tag (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe / Apex Design Studio"
              value={customerRef}
              onChange={(e) => setCustomerRef(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Right Column: Active Job Configuration Panel */}
        <div className="lg:col-span-8 bg-neutral-900 rounded-2xl border border-neutral-800/90 p-6 shadow-xl shadow-black/40">
          
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
