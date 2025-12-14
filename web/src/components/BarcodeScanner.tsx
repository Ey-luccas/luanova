/**
 * Componente de Scanner de Código de Barras
 *
 * Utiliza html5-qrcode para escanear códigos de barras via câmera
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({
  onScanSuccess,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Erro ao parar scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Aguarda o elemento estar disponível no DOM usando requestAnimationFrame
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)
        
        const checkElement = () => {
          const element = document.getElementById('barcode-scanner');
          if (element) {
            resolve();
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkElement, 100);
          } else {
            reject(new Error('Elemento do scanner não encontrado no DOM após múltiplas tentativas'));
          }
        };
        
        requestAnimationFrame(checkElement);
      });

      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      // Configurações para códigos de barras
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 200 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Câmera traseira
        config,
        (decodedText, decodedResult) => {
          // Código escaneado com sucesso
          setScannedCode(decodedText);
          stopScanner();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignora erros de decodificação (normal durante a busca)
        },
      );
    } catch (err: any) {
      console.error('Erro ao iniciar scanner:', err);
      
      let errorMessage = 'Erro ao acessar a câmera.';
      
      if (err.message?.includes('Elemento do scanner não encontrado')) {
        errorMessage = 'Erro ao inicializar scanner. Tente novamente.';
      } else if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('No camera')) {
        errorMessage = 'Nenhuma câmera encontrada. Verifique se há uma câmera conectada ao dispositivo.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Erro ao acessar a câmera. Verifique as permissões do navegador.';
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  }, [onScanSuccess, stopScanner]);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      // Aguarda o elemento estar no DOM antes de iniciar o scanner
      const timer = setTimeout(() => {
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  const handleClose = () => {
    stopScanner();
    setScannedCode(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear Código de Barras</DialogTitle>
          <DialogDescription>
            Posicione o código de barras dentro da área de leitura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {scannedCode && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Código escaneado: <strong>{scannedCode}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="relative">
            <div
              id="barcode-scanner"
              className="w-full rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center"
            >
              {!isScanning && !error && (
                <div className="text-white text-center p-4">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Iniciando câmera...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
