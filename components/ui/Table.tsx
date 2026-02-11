import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
    width?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
}

export function Table<T extends { id: string }>({
    data,
    columns,
    onRowClick,
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={index}
                                className={cn(
                                    "px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                                    column.width
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-surface-dark divide-y divide-slate-200 dark:divide-slate-700">
                    {data.map((item) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick?.(item)}
                            className={cn(
                                "transition-colors",
                                onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            {columns.map((column, index) => (
                                <td
                                    key={index}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white"
                                >
                                    {column.render
                                        ? column.render(item)
                                        : String(item[column.key as keyof T] ?? "")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {data.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-surface-dark">
                    <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-2">
                        inbox
                    </span>
                    <p className="text-slate-500 dark:text-slate-400">데이터가 없습니다</p>
                </div>
            )}
        </div>
    );
}
