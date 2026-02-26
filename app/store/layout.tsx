import type { ReactNode } from "react";
import { Suspense } from "react";
import { StoreSidebar } from "@/components/domain/StoreSidebar";

type StoreLayoutProps = {
  children: ReactNode;
};

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <>
      <Suspense fallback={null}>
        <StoreSidebar />
      </Suspense>
      {children}
    </>
  );
}
