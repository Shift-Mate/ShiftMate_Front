import React from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SubstituteRequest, SubstituteStatus } from "@/types/schedule";

interface SubstituteRequestCardProps {
    request: SubstituteRequest;
    onAccept?: (id: string) => void;
    onReject?: (id: string) => void;
}

const getStatusVariant = (
    status: SubstituteStatus
): "success" | "warning" | "error" | "info" => {
    switch (status) {
        case "approved":
            return "success";
        case "pending":
            return "warning";
        case "rejected":
            return "error";
        case "filled":
            return "info";
        default:
            return "info";
    }
};

const getStatusLabel = (status: SubstituteStatus): string => {
    switch (status) {
        case "approved":
            return "승인됨";
        case "pending":
            return "대기 중";
        case "rejected":
            return "거부됨";
        case "filled":
            return "완료됨";
        default:
            return status;
    }
};

export const SubstituteRequestCard: React.FC<SubstituteRequestCardProps> = ({
    request,
    onAccept,
    onReject,
}) => {
    const statusVariant = getStatusVariant(request.status);
    const statusLabel = getStatusLabel(request.status);

    return (
        <Card>
            <CardBody className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="material-icons text-slate-600 dark:text-slate-400">
                                person
                            </span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                {request.requesterName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(request.createdAt).toLocaleDateString("ko-KR")}
                            </p>
                        </div>
                    </div>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="material-icons text-primary text-base">
                            calendar_today
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {new Date(request.date).toLocaleDateString("ko-KR", {
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="material-icons text-primary text-base">
                            schedule
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                            {request.shiftTime}
                        </span>
                    </div>
                    {request.reason && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">사유:</span> {request.reason}
                            </p>
                        </div>
                    )}
                </div>
            </CardBody>

            {request.status === "pending" && onAccept && onReject && (
                <CardFooter className="flex gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => onReject(request.id)}
                    >
                        거부
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onAccept(request.id)}
                    >
                        수락
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};
