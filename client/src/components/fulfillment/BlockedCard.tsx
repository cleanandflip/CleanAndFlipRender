// BlockedCard.tsx - Reusable component for blocking non-local users
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface BlockedCardProps {
  title: string;
  message: string;
}

export function BlockedCard({ title, message }: BlockedCardProps) {
  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle className="text-amber-800 dark:text-amber-200">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-amber-700 dark:text-amber-300 text-center">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}