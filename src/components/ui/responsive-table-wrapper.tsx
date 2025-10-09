import { ReactNode } from "react";

interface ResponsiveTableWrapperProps {
  children: ReactNode;
}

export function ResponsiveTableWrapper({ children }: ResponsiveTableWrapperProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-md border">
          {children}
        </div>
      </div>
    </div>
  );
}
