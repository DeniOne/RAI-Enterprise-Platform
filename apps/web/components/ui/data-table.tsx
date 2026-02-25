import React from 'react';

type Primitive = string | number | boolean | null | undefined;

export interface DataTableColumn<T extends Record<string, Primitive>> {
    key: keyof T;
    header: string;
}

export function DataTable<T extends Record<string, Primitive>>({
    columns,
    data,
}: {
    columns: Array<DataTableColumn<T>>;
    data: T[];
}) {
    return (
        <div className="overflow-x-auto rounded-xl border border-black/10">
            <table className="min-w-full bg-white text-sm">
                <thead>
                    <tr className="border-b border-black/10 bg-gray-50">
                        {columns.map((column) => (
                            <th key={String(column.key)} className="px-3 py-2 text-left font-semibold text-gray-700">
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} className="border-b border-black/5 last:border-b-0">
                            {columns.map((column) => (
                                <td key={String(column.key)} className="px-3 py-2 text-gray-800">
                                    {String(row[column.key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
