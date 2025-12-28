"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
    title: string;
    description?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({
        title: 'Are you sure?',
        confirmText: 'Continue',
        cancelText: 'Cancel',
        variant: 'default',
    });
    const [resolver, setResolver] = useState<(value: boolean) => void>(() => { });

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions({
            title: opts.title || 'Are you sure?',
            description: opts.description,
            confirmText: opts.confirmText || 'Continue',
            cancelText: opts.cancelText || 'Cancel',
            variant: opts.variant || 'default',
        });
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        resolver(true);
        setOpen(false);
    };

    const handleCancel = () => {
        resolver(false);
        setOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent onEscapeKeyDown={handleCancel}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options.title}</AlertDialogTitle>
                        {options.description && (
                            <AlertDialogDescription>
                                {options.description}
                            </AlertDialogDescription>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel} className="bg-transparent border-border hover:bg-white/5 text-slate-300">
                            {options.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={
                                options.variant === 'destructive'
                                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-none'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white border-none'
                            }
                        >
                            {options.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmModalProvider');
    }
    return context;
}
