import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ZipCheckProps {
  onResolved: (isLocal: boolean) => void;
}

export function ZipCheck({ onResolved }: ZipCheckProps) {
  const [zip, setZip] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCheck = async () => {
    if (!zip.trim() || zip.length < 5) {
      toast({
        title: "Invalid ZIP code",
        description: "Please enter a valid 5-digit ZIP code.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/locality/status?zip=${encodeURIComponent(zip.trim())}`);
      const data = await response.json();
      
      if (response.ok) {
        onResolved(data.isLocal);
        toast({
          title: data.isLocal ? "Great news!" : "Location confirmed",
          description: data.isLocal 
            ? "You're in our free delivery zone!" 
            : "This location is outside our delivery area.",
          variant: data.isLocal ? "default" : "destructive",
        });
      } else {
        throw new Error(data.message || 'Failed to check location');
      }
    } catch (error) {
      toast({
        title: "Check failed",
        description: "Unable to verify location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <div className="flex items-center gap-2 max-w-sm">
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
        <Input
          type="text"
          placeholder="Enter ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10"
          maxLength={10}
          aria-label="ZIP code for delivery area check"
        />
      </div>
      <Button 
        onClick={handleCheck} 
        disabled={isChecking || !zip.trim()}
        size="sm"
        className="px-4"
      >
        {isChecking ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          'Check'
        )}
      </Button>
    </div>
  );
}

export default ZipCheck;