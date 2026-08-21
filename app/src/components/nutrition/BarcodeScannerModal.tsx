import React, { useState, useEffect } from 'react';
import { LoaderPulse } from '../BroskyIcon';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let html5QrCode: any = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;
        html5QrCode = new Html5Qrcode("barcode-reader");
        const config = {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const boxWidth = Math.min(width * 0.8, 280);
            const boxHeight = Math.min(height * 0.4, 140);
            return { width: boxWidth, height: boxHeight };
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            if (isMounted) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // ignore scan errors
          }
        );
        if (isMounted) {
          setCameraLoading(false);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Camera init failed:", err);
        if (isMounted) {
          setError(
            err?.message ||
              "Не удалось запустить камеру. Проверьте разрешения в браузере."
          );
          setCameraLoading(false);
        }
      }
    };

    const timer = setTimeout(startCamera, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .catch((e: any) => console.error("Error stopping scanner in cleanup:", e));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="glass-panel fixed inset-0 flex flex-col items-center justify-center z-[10000] p-4 bg-black/30 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="barcode-modal-title" aria-describedby="barcode-modal-desc">
      <div className="bg-white/95 border border-gym-border/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative flex flex-col items-center gap-4 text-center overflow-hidden backdrop-blur-md">
        <div>
          <h3 id="barcode-modal-title" className="font-display font-black text-gray-800 text-lg tracking-tight">
            Сканирование штрих-кода
          </h3>
          <p id="barcode-modal-desc" className="text-xs text-gray-500 font-semibold mt-1">
            Наведите камеру на штрих-код продукта питания
          </p>
        </div>

        <div className="w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-gym-border/40 relative flex items-center justify-center">
          {cameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 z-20">
              <LoaderPulse size={32} className="text-gym-accent animate-spin" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Подключение камеры...</span>
            </div>
          )}

          {error ? (
            <div className="p-4 text-red-500 text-xs font-semibold leading-relaxed z-20">
              {error}
            </div>
          ) : (
            <div id="barcode-reader" className="w-full h-full object-cover [&_video]:object-cover" />
          )}

          {!cameraLoading && !error && (
            <div className="absolute inset-0 border-[3px] border-gym-accent/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-[85%] h-[2px] bg-red-500 shadow-[0_0_8px_#f43f5e] absolute animate-[scannerLaser_2s_infinite_ease-in-out]" />
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gym-accent rounded-tl-md" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gym-accent rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gym-accent rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gym-accent rounded-br-md" />
            </div>
          )}
        </div>

        <div className="w-full mt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-250 active:scale-[0.96] transition-all cursor-pointer btn-interactive"
          >
            Отмена
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scannerLaser {
          0%, 100% { transform: translateY(-40px); }
          50% { transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
};
