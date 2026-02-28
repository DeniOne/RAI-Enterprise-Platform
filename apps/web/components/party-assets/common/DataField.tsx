'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EditModeContextType {
    isEdit: boolean;
    setEdit: (v: boolean) => void;
}

const EditModeContext = React.createContext<EditModeContextType>({
    isEdit: false,
    setEdit: () => { },
});

export const useEditMode = () => React.useContext(EditModeContext);

export function EditModeProvider({ children }: { children: React.ReactNode }) {
    const [isEdit, setEdit] = React.useState(false);
    return (
        <EditModeContext.Provider value={{ isEdit, setEdit }}>
            {children}
        </EditModeContext.Provider>
    );
}

interface DataFieldProps {
    label: string;
    value?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    emptyValue?: string;
    isReadOnly?: boolean;
    required?: boolean;
}

/**
 * Универсальный компонент для отображения данных:
 * - В режиме просмотра показывает Label + Value
 * - В режиме редактирования показывает Label + Input
 */
export function DataField({
    label,
    value,
    children,
    className,
    emptyValue = '—',
    isReadOnly = false,
    required = false
}: DataFieldProps) {
    const { isEdit } = useEditMode();

    return (
        <div className={cn("space-y-1.5 min-h-[52px]", className)}>
            <div className="flex items-center gap-1">
                <label className="text-[13px] font-medium text-gray-500 pl-0.5">{label}</label>
                {required && isEdit && <span className="text-[14px] text-red-500 font-bold leading-none">*</span>}
            </div>
            <div className="flex items-center min-h-[24px]">
                {!isReadOnly && isEdit ? (
                    <div className="w-full animate-in fade-in slide-in-from-top-1 duration-200">
                        {children}
                    </div>
                ) : (
                    <div className={cn(
                        "text-sm font-normal text-gray-900 animate-in fade-in duration-200",
                        isReadOnly && isEdit && "opacity-50 cursor-not-allowed bg-gray-50 px-2 py-1 rounded border border-dashed border-black/5"
                    )}>
                        {value || emptyValue}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Компонент, который отображается ТОЛЬКО в режиме редактирования
 */
export function EditableField({ children }: { children: React.ReactNode }) {
    const { isEdit } = useEditMode();
    if (!isEdit) return null;
    return <div className="animate-in fade-in duration-200 w-full">{children}</div>;
}

/**
 * Компонент, который отображается ТОЛЬКО в режиме просмотра
 */
export function ViewField({ value, emptyValue = '—' }: { value?: React.ReactNode; emptyValue?: string }) {
    const { isEdit } = useEditMode();
    if (isEdit) return null;
    return <div className="text-sm font-normal text-gray-900 animate-in fade-in duration-200">{value || emptyValue}</div>;
}
