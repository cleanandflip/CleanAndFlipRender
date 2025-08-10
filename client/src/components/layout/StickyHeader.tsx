import Navigation from './navigation';
import { LocalBenefitsBanner } from '../shared/LocalBenefitsBanner';

export function StickyHeader() {
  return (
    <div className="sticky top-0 z-50">
      <Navigation />
      <LocalBenefitsBanner />
    </div>
  );
}