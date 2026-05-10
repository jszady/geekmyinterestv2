import { LoadingShell } from "@/components/layout/LoadingShell";
import { GeekRouteLoading } from "@/components/ui/GeekRouteLoading";

export default function Loading() {
  return (
    <LoadingShell>
      <GeekRouteLoading />
    </LoadingShell>
  );
}
