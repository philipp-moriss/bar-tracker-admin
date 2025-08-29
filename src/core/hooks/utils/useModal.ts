import { useState, useCallback } from 'react';

export const useModal = <T = unknown>() => {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const open = useCallback((modalData?: T) => {
        setIsOpen(true);
        if (modalData) {
            setData(modalData);
        }
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setData(null);
    }, []);

    return {
        isOpen,
        data,
        open,
        close
    };
}; 