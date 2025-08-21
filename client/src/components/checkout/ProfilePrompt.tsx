import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, User } from 'lucide-react';

export function ProfilePrompt() {
  // Onboarding removed; no prompt needed
  return null;
}