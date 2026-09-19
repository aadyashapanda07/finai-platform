import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  ShoppingBag,
  FileText,
  DollarSign,
  Tag,
  Calendar,
  Sparkles,
  Camera,
  Video
} from 'lucide-react';
import { api } from '../utils/api';

export default function ReceiptScannerModal({ isOpen, onClose, onSuccess, apiKey }) {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extractedReceipt, setExtractedReceipt] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadSamples();
    } else {
      stopCamera();
      setSelectedSample(null);
      setUploadedFile(null);
      setPreviewUrl(null);
      setExtractedReceipt(null);
      setCameraError(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please verify browser camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      stopCamera();
      if (!blob) return;

      const file = new File([blob], `receipt_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setUploadedFile(file);
      setSelectedSample(null);
      setPreviewUrl(URL.createObjectURL(blob));
      setScanning(true);

      try {
        const formData = new FormData();
        formData.append('receipt', file);
        if (apiKey) formData.append('apiKey', apiKey);

        const res = await api.scanReceipt(formData);
        if (res.success) {
          setExtractedReceipt(res.extracted);
        }
      } catch (err) {
        console.error('Captured receipt scan error:', err);
      } finally {
        setScanning(false);
      }
    }, 'image/jpeg', 0.92);
  };

  const loadSamples = async () => {
    try {
      const res = await api.getSampleReceipts();
      if (res.success) {
        setSamples(res.data);
      }
    } catch (err) {
      console.error('Error fetching sample receipts:', err);
    }
  };

  const handleSelectSample = async (sample) => {
    setSelectedSample(sample);
    setUploadedFile(null);
    setPreviewUrl(sample.image);
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append('sampleId', sample.id);
      if (apiKey) formData.append('apiKey', apiKey);

      const res = await api.scanReceipt(formData);
      if (res.success) {
        setExtractedReceipt(res.extracted);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setSelectedSample(null);
    setPreviewUrl(URL.createObjectURL(file));
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append('receipt', file);
      if (apiKey) formData.append('apiKey', apiKey);

      const res = await api.scanReceipt(formData);
      if (res.success) {
        setExtractedReceipt(res.extracted);
      }
    } catch (err) {
      console.error('File scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleCommitTransaction = async () => {
    if (!extractedReceipt) return;
    setCommitting(true);

    try {
      const itemsSummary = extractedReceipt.items
        ? extractedReceipt.items.map(i => `${i.name} ($${i.price})`).join(', ')
        : 'Receipt items';

      const res = await api.createTransaction({
        amount: extractedReceipt.total,
        type: 'expense',
        category: extractedReceipt.category || 'Shopping',
        merchant: extractedReceipt.merchant || 'Merchant',
        description: `Receipt: ${itemsSummary.slice(0, 100)}`,
        date: extractedReceipt.date || new Date().toISOString().split('T')[0],
        payment_method: extractedReceipt.payment_method || 'Scanned Receipt',
        tags: 'receipt,ocr'
      });

      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Commit receipt error:', err);
    } finally {
      setCommitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                Smart Receipt Scanner & OCR
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multimodal AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload any receipt image or click a sample to parse line-items and totals automatically.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Quick Demo Samples */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Instant Demo Samples (Click to test without a photo):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s)}
                  className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                    selectedSample?.id === s.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs truncate text-slate-100">{s.name}</div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono">
                    <span>{s.items.length} items</span>
                    <span className="font-bold text-emerald-400">${s.total.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone or Live Camera */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 bg-black flex flex-col items-center p-3 space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-72 rounded-xl object-cover"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Receipt Photo</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
                >
                  Cancel Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Drag and drop your receipt image, or <span className="text-emerald-400 underline">browse files</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Supports PNG, JPG, JPEG, WebP</p>
                </div>
              </div>

              {/* Or take photo with camera button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={startCamera}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/40 text-slate-300 hover:text-white flex items-center gap-2 transition-all"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Or use Camera / Webcam to take photo</span>
                </button>
              </div>

              {cameraError && (
                <div className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-500/30 p-2 rounded-lg text-center">
                  {cameraError}
                </div>
              )}
            </div>
          )}

          {/* Scanning Status Indicator */}
          {scanning && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs font-medium text-slate-200">
                AI is analyzing receipt, detecting merchant, line items & taxes...
              </span>
            </div>
          )}

          {/* Extracted Receipt Breakdown */}
          {extractedReceipt && !scanning && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    {extractedReceipt.merchant}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{extractedReceipt.date}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{extractedReceipt.category}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    ${extractedReceipt.total.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">{extractedReceipt.payment_method}</div>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              {extractedReceipt.items && extractedReceipt.items.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Itemized Breakdown:
                  </div>
                  <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40">
                    {extractedReceipt.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-slate-200">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary subtotal & taxes */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs text-slate-400 font-mono bg-slate-900/50 p-2.5 rounded-lg">
                <div>Subtotal: <span className="text-slate-200 font-bold">${extractedReceipt.subtotal?.toFixed(2) || '0.00'}</span></div>
                <div>Tax: <span className="text-slate-200 font-bold">${extractedReceipt.tax?.toFixed(2) || '0.00'}</span></div>
                <div>Tip: <span className="text-slate-200 font-bold">${extractedReceipt.tip?.toFixed(2) || '0.00'}</span></div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCommitTransaction}
                  disabled={committing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  {committing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Add Receipt to Transactions Ledger</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
