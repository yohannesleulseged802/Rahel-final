import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, 
  QrCode, 
  Camera, 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Upload, 
  Volume2, 
  VolumeX, 
  Plus, 
  ShoppingBag, 
  Truck, 
  Package, 
  Tag, 
  Zap,
  History
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { usePOS } from '../context/POSContext';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target?: 'lookup' | 'sales' | 'purchase';
  onScanResult?: (scannedCode: string, matchedProduct: Product | null) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  target = 'lookup',
  onScanResult
}) => {
  const { 
    products, 
    setActiveTab, 
    showToast, 
    isCloudConnected,
    triggerScannedSaleProduct,
    triggerScannedPurchaseProduct,
    triggerScannedInventoryCode
  } = usePOS();

  // Mode: 'camera' | 'upload' | 'manual'
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  
  // Camera state
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousScan, setContinuousScan] = useState(false);

  // Manual input state
  const [manualInput, setManualInput] = useState('');

  // Scanned item state
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [autoDispatchedLabel, setAutoDispatchedLabel] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; product: Product | null; time: string }>>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Web Audio POS beep sound
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High A (pleasant retail register tone)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch (e) {
      /* Audio not supported or blocked */
    }
  };

  // Match scanned string against product catalog (supports EAN/UPC, SKU, ID, and RAHEL:SKU:PRICE QR codes)
  const findMatchingProduct = (rawCode: string): Product | null => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return null;

    // 1. Check LabelStudio QR format: RAHEL:<SKU>:<PRICE>
    if (cleanCode.toUpperCase().startsWith('RAHEL:')) {
      const parts = cleanCode.split(':');
      if (parts.length >= 2) {
        const qrSku = parts[1].trim().toLowerCase();
        const byQrSku = products.find(
          p => p.sku.toLowerCase() === qrSku || p.barcode === parts[1].trim() || p.id.toLowerCase() === qrSku
        );
        if (byQrSku) return byQrSku;
      }
    }

    // 2. Direct match on barcode, SKU, or product ID
    const lower = cleanCode.toLowerCase();
    return (
      products.find(
        p =>
          p.barcode === cleanCode ||
          p.sku.toLowerCase() === lower ||
          p.id.toLowerCase() === lower
      ) || null
    );
  };

  // Hardware scanner keyboard listener (rapid keystroke sequence ending in Enter)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleCodeDetected(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        if (diff > 120) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, products, target, continuousScan]);

  // Enumerate cameras when modal opens
  useEffect(() => {
    if (!isOpen) {
      setAutoDispatchedLabel(null);
      return;
    }

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          // Even if getCameras returns empty prior to permission, try starting with facingMode
          setSelectedCameraId('environment');
        }
      })
      .catch(() => {
        // Fallback to facingMode constraint so browser requests permission or shows clean fallback
        setSelectedCameraId('environment');
      });
  }, [isOpen]);

  // Start / Stop camera scanner with fallback from environment to user camera
  const startCamera = async (cameraOrMode: string) => {
    setCameraError(null);

    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      } catch (e) {}
    }

    const viewportEl = document.getElementById('interactive-scanner-viewport');
    if (!viewportEl) return;

    try {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ];

      const qrCode = new Html5Qrcode('interactive-scanner-viewport', { formatsToSupport, verbose: false });
      html5QrCodeRef.current = qrCode;

      const scanConfig = {
        fps: 15,
        qrbox: { width: 250, height: 220 },
      };

      const onSuccess = (decodedText: string) => {
        const now = Date.now();
        // Debounce duplicate frames of the same barcode within 1.5s
        if (
          lastScanTimeRef.current.code === decodedText &&
          now - lastScanTimeRef.current.time < 1500
        ) {
          return;
        }
        lastScanTimeRef.current = { code: decodedText, time: now };
        handleCodeDetected(decodedText);
      };

      try {
        const constraint =
          cameraOrMode === 'environment' || !cameraOrMode
            ? { facingMode: 'environment' }
            : cameraOrMode === 'user'
            ? { facingMode: 'user' }
            : cameraOrMode;

        await qrCode.start(constraint, scanConfig, onSuccess, () => {});
      } catch {
        // Fallback to front/default camera if environment camera fails
        await qrCode.start({ facingMode: 'user' }, scanConfig, onSuccess, () => {});
      }

      isScanningRef.current = true;
      setIsCameraActive(true);
    } catch (err: any) {
      setIsCameraActive(false);
      setCameraError(
        err?.message ||
          'Camera stream unavailable on this device or browser permission denied. Use Manual Entry or Upload Image below.'
      );
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {}
      isScanningRef.current = false;
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera' && selectedCameraId) {
      const t = setTimeout(() => {
        startCamera(selectedCameraId);
      }, 150);
      return () => {
        clearTimeout(t);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen, scanMode, selectedCameraId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // When a code is detected by camera, laser wand, image upload, or manual entry
  const handleCodeDetected = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playBeep();
    setLastScannedCode(cleanCode);
    setAutoDispatchedLabel(null);

    const found = findMatchingProduct(cleanCode);
    setMatchedProduct(found);

    // Update session history
    setScanHistory(prev => [
      {
        code: cleanCode,
        product: found,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      ...prev.slice(0, 7)
    ]);

    if (found) {
      // If opened specifically from Sales or Purchase tab, automatically add the item!
      if (target === 'sales') {
        triggerScannedSaleProduct(found);
        setAutoDispatchedLabel(`Added 1× "${found.name}" to current Sale Order`);
        showToast(`Scanned & Added to Sale: ${found.name} (ETB ${found.price.toFixed(2)})`);
      } else if (target === 'purchase') {
        triggerScannedPurchaseProduct(found);
        setAutoDispatchedLabel(`Added "${found.name}" to current Purchase Order`);
        showToast(`Scanned & Added to Purchase Order: ${found.name}`);
      } else {
        showToast(`Scanned: ${found.name} (Stock: ${found.stock})`);
      }
    } else {
      showToast(`Scanned: "${cleanCode}" (New barcode — not yet in catalog)`);
    }

    if (onScanResult) {
      onScanResult(cleanCode, found);
    }

    if (!continuousScan) {
      stopCamera();
    }
  };

  // Image file scan (with native BarcodeDetector fallback if available)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const qrCode = new Html5Qrcode('file-scanner-temp');
      const result = await qrCode.scanFile(file, true);
      handleCodeDetected(result);
      qrCode.clear();
    } catch {
      // Fallback to native browser BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          const bitmap = await createImageBitmap(file);
          const detector = new (window as any).BarcodeDetector();
          const detected = await detector.detect(bitmap);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            handleCodeDetected(detected[0].rawValue);
            return;
          }
        } catch {}
      }
      showToast('Could not decode a barcode or QR code from this image. Try a clearer image or Manual Entry.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleCodeDetected(manualInput.trim());
      setManualInput('');
    }
  };

  // Action buttons for matched product
  const handleAddToSalesOrder = () => {
    if (matchedProduct) {
      triggerScannedSaleProduct(matchedProduct);
      setActiveTab('sales');
      onClose();
      showToast(`Added "${matchedProduct.name}" to Sale Order.`);
    }
  };

  const handleAddToPurchaseOrder = () => {
    if (matchedProduct) {
      triggerScannedPurchaseProduct(matchedProduct);
      setActiveTab('purchase');
      onClose();
      showToast(`Added "${matchedProduct.name}" to Purchase Order.`);
    }
  };

  const handleGoToInventory = () => {
    if (lastScannedCode) {
      triggerScannedInventoryCode(lastScannedCode, matchedProduct);
    }
    setActiveTab('inventory');
    onClose();
  };

  const handleGoToLabels = () => {
    setActiveTab('labels');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-neutral-100">
                  Barcode &amp; QR Code Scanner
                </h3>
                {target !== 'lookup' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 uppercase tracking-wider">
                    {target === 'sales' ? 'Auto-Add to Sale' : 'Auto-Add to Purchase'}
                  </span>
                )}
                {isCloudConnected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Cloud DB
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Scan 1D barcodes (EAN-13, UPC, Code-128) or Rahel Studio QR codes via camera, photo, or laser wand
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="p-2.5 bg-neutral-950/70 border-b border-neutral-850 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScanMode('camera')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                scanMode === 'camera'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Stream</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                scanMode === 'upload'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Scan Image File</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('manual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                scanMode === 'manual'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual / Quick Test</span>
            </button>
          </div>

          {/* Continuous scan toggle */}
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={(e) => setContinuousScan(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span className="hidden sm:inline">Continuous Scan</span>
          </label>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Hardware Wand Status Banner */}
          <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Hardware Laser Wand:</strong> Active (Scan physical barcode with USB/Bluetooth scanner anytime)</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
              Ready
            </span>
          </div>

          {/* MODE 1: LIVE CAMERA VIEW */}
          {scanMode === 'camera' && (
            <div className="space-y-3">
              {/* Camera device picker if multiple */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-neutral-400">Active Camera:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-500/50"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.slice(0, 6)}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Viewport Box with Scanning Reticle and Laser Animation */}
              <div className="relative w-full h-64 sm:h-72 bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center shadow-inner">
                <div id="interactive-scanner-viewport" className="w-full h-full object-cover" />

                {/* Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-52 h-48 sm:w-64 sm:h-52 border-2 border-amber-400/60 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    {isCameraActive && (
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-lg shadow-red-500/50 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                    )}

                    <div className="absolute -bottom-7 inset-x-0 text-center text-[11px] font-mono text-amber-300 bg-neutral-950/80 py-0.5 rounded px-2 backdrop-blur-xs">
                      Align Barcode or QR Code within frame
                    </div>
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center text-xs">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="font-semibold text-neutral-200 mb-1">Camera Notice</span>
                    <p className="text-neutral-400 max-w-sm mb-3">{cameraError}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera('environment')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanMode('manual')}
                        className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold rounded-lg cursor-pointer"
                      >
                        Use Manual / Quick Scan
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isCameraActive && !cameraError && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => startCamera(selectedCameraId || 'environment')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Resume Camera Stream</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: IMAGE FILE SCAN */}
          {scanMode === 'upload' && (
            <div className="p-8 border-2 border-dashed border-neutral-750 hover:border-amber-500/60 rounded-2xl bg-neutral-950/60 text-center transition-colors">
              <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-200">Upload Barcode or QR Label Image</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto mb-4">
                Select a photo, screenshot, or saved label image to decode the barcode or QR code automatically.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Choose Photo / Image
              </button>
              <div id="file-scanner-temp" className="hidden" />
            </div>
          )}

          {/* MODE 3: MANUAL ENTRY & QUICK TEST */}
          {scanMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="text-xs font-medium text-neutral-300 block">
                Type or Scan Barcode / SKU / QR Payload (e.g., <code className="text-amber-300">RAHEL:NB-RHO-A5D:24.50</code>):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. 3037921188012, NB-RHO-A5D, or RAHEL:NB-RHO-A5D:24.50"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 font-mono focus:outline-hidden focus:border-amber-500/50"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Scan / Lookup
                </button>
              </div>

              {/* Sample Quick Barcodes & QR Codes from live catalog */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] text-neutral-400 block">
                  Click any catalog item below to simulate an instant Barcode / QR scan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {products.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleCodeDetected(p.barcode)}
                      className="p-2 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          EAN: {p.barcode} · SKU: {p.sku}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                        ETB {p.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* SCANNED RESULT CARD */}
          {lastScannedCode && (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-850 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-neutral-100">Decoded:</span>
                  <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {lastScannedCode}
                  </span>
                </div>
                {autoDispatchedLabel && (
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {autoDispatchedLabel}
                  </span>
                )}
              </div>

              {matchedProduct ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">{matchedProduct.name}</h4>
                      <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>SKU: {matchedProduct.sku}</span>
                        <span>•</span>
                        <span>Barcode: {matchedProduct.barcode}</span>
                        <span>•</span>
                        <span>{matchedProduct.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 block">Retail Price</span>
                        <span className="text-base font-bold font-mono-numbers text-amber-400">
                          ETB {matchedProduct.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-neutral-400 block">Live Stock</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                          matchedProduct.stock === 0 
                            ? 'bg-red-500/20 text-red-400' 
                            : matchedProduct.stock < 5 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {matchedProduct.stock} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Actions for matched product */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={handleAddToSalesOrder}
                      className="px-2.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{target === 'sales' ? 'Add +1 More' : 'Add to Sale'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddToPurchaseOrder}
                      className="px-2.5 py-2 bg-neutral-850 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{target === 'purchase' ? 'Add More PO' : 'Restock PO'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToInventory}
                      className="px-2.5 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Edit Stock</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToLabels}
                      className="px-2.5 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Print Label</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-200 block">Unrecognized Barcode / QR Code</span>
                    <span className="text-neutral-400 text-[11px]">
                      No existing product matches "{lastScannedCode}". Click to register it with this barcode pre-filled.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToInventory}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register in Inventory</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCAN HISTORY IN THIS SESSION */}
          {scanHistory.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1.5">
                <History className="w-3 h-3 text-neutral-500" />
                Recent Scans This Session ({scanHistory.length})
              </span>
              <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden text-xs">
                {scanHistory.map((s, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between hover:bg-neutral-900 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Barcode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono text-neutral-200 shrink-0">{s.code}</span>
                      <span className="text-neutral-400 truncate">
                        {s.product ? `— ${s.product.name} (ETB ${s.product.price.toFixed(2)})` : '(Unrecognized item)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Universal QR &amp; Barcode Scanner · Synced with Live Cloud DB</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
