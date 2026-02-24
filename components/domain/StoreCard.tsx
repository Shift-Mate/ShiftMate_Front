import React from "react";
import Link from "next/link";
import { CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Store, StoreStatus } from "@/types/store";

interface StoreCardProps {
    store: Store;
    href?: string;
    onDelete?: (store: Store) => void;
    isDeleting?: boolean;
}

const getStatusVariant = (
    status: StoreStatus
): "success" | "warning" | "default" => {
    switch (status) {
        case "open":
            return "success";
        case "opening_soon":
            return "warning";
        default:
            return "default";
    }
};

const getStatusLabel = (status: StoreStatus): string => {
    switch (status) {
        case "open":
            return "영업 중";
        case "opening_soon":
            return "오픈 예정";
        case "closed":
            return "휴무";
        default:
            return status;
    }
};

export const StoreCard: React.FC<StoreCardProps> = ({
    store,
    href,
    onDelete,
    isDeleting = false,
}) => {
    const statusVariant = getStatusVariant(store.status);
    const statusLabel = getStatusLabel(store.status);
    const businessHours =
        store.openTime && store.closeTime
            ? `${store.openTime} - ${store.closeTime}`
            : "영업시간 미설정";

    return (
        <Link
            href={href || `/dashboard/store/${store.id}`}
            className="group relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full"
        >
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
                <Badge variant={statusVariant} dot>
                    {statusLabel}
                </Badge>
            </div>

            {/* Store Image Header */}
            <div className="h-32 bg-slate-100 dark:bg-slate-800 relative">
                {store.image ? (
                    <img
                        src={store.image}
                        alt={store.name}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-icons text-4xl text-slate-300 dark:text-slate-600">
                            store
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">
                        {store.name}
                    </h3>
                    <p className="text-xs text-slate-200">{store.code}</p>
                </div>
            </div>

            {/* Card Body */}
            <CardBody className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                            <span className="material-icons text-primary text-base mr-2">
                                people
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-200 mr-1">
                                {store.activeStaff}
                            </span>{" "}
                            활성 직원
                        </div>
                    </div>

                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                        <span className="material-icons text-primary text-base mr-2">schedule</span>
                        {businessHours}
                    </div>
                </div>
            </CardBody>

            {/* Card Footer Action */}
            <CardFooter className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <span className="material-icons text-sm mr-1">location_on</span>{" "}
                    {store.location}
                </span>
                <button
                    type="button"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!isDeleting) {
                            onDelete?.(store);
                        }
                    }}
                    className="text-red-500 text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDeleting}
                    aria-label={`${store.name} 삭제`}
                >
                    {isDeleting ? "삭제 중..." : "삭제"}
                </button>
            </CardFooter>
        </Link>
    );
};
