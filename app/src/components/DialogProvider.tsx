/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { AlertTriangle, HelpCircle, Info } from './BroskyIcon';

interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  type?: 'confirm' | 'alert';
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive: boolean;
    type: 'confirm' | 'alert';
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Подтверждение',
        message: options.message,
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        isDestructive: options.isDestructive ?? false,
        type: 'confirm',
        resolve,
      });
    });
  };

  const alert = (message: string, title: string = 'Внимание') => {
    return new Promise<void>((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        type: 'alert',
        resolve: () => resolve(),
      });
    });
  };

  const handleCancel = () => {
    if (dialogState?.resolve) dialogState.resolve(false);
    setDialogState(null);
  };

  const handleConfirm = () => {
    if (dialogState?.resolve) dialogState.resolve(true);
    setDialogState(null);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialogState?.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/25 backdrop-blur-[6px] animate-fadeIn">
          <div className="bg-white/80 border border-white/50 backdrop-filter backdrop-blur-2xl rounded-[28px] p-6 max-w-sm w-full shadow-[0_16px_48px_rgba(0,0,0,0.08)] animate-scaleUp text-center">
            {/* Icon Header */}
            <div className="flex justify-center mb-4">
              {dialogState.isDestructive ? (
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              ) : dialogState.type === 'confirm' ? (
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                  <HelpCircle className="w-7 h-7" />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl">
                  <Info className="w-7 h-7" />
                </div>
              )}
            </div>

            {/* Content */}
            <h3 className="font-display font-semibold text-lg text-slate-800 tracking-tight mb-2">
              {dialogState.title}
            </h3>
            <p className="text-slate-500 text-sm font-sans leading-relaxed px-2 mb-6">
              {dialogState.message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              {dialogState.type === 'confirm' && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-[0.96] transition-all duration-200"
                >
                  {dialogState.cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white active:scale-[0.96] transition-all duration-200 shadow-md ${
                  dialogState.isDestructive
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
