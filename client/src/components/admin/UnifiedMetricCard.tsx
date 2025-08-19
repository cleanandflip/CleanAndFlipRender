import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export function UnifiedMetricCard({ label, value, hint }: Props) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint ? <div className="text-xs text-muted-foreground mt-1">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export default UnifiedMetricCard;