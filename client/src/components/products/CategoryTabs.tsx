import { useLocation } from "wouter";
import { CATEGORY_LABELS, CategoryLabel, fromSlug, toSlug } from "@/lib/categories";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";

export default function CategoryTabs() {
  const [location, setLocation] = useLocation();
  
  // Parse current URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const current: CategoryLabel = fromSlug(urlParams.get("category"));

  const select = (label: CategoryLabel) => {
    const next = new URLSearchParams(urlParams);
    const slug = toSlug(label);
    
    if (slug) {
      next.set("category", slug);
    } else {
      next.delete("category"); // All Categories = no param
    }

    // Keep existing search term and other params intact
    const query = next.toString();
    const newPath = `/products${query ? `?${query}` : ""}`;
    setLocation(newPath);
  };

  return (
    <nav aria-label="Product Categories" className="space-y-2">
      <h3 
        className="font-bebas text-2xl mb-4 tracking-wider"
        style={{ color: theme.colors.text.primary }}
      >
        CATEGORIES
      </h3>
      <ul className="space-y-1">
        {CATEGORY_LABELS.map((label) => {
          const active = label === current;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => select(label)}
                aria-current={active ? "page" : undefined}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-all duration-200
                  hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${active 
                    ? 'font-semibold border-l-4' 
                    : 'font-medium hover:font-semibold'
                  }
                `}
                style={{
                  color: active ? theme.colors.brand.blue : theme.colors.text.secondary,
                  backgroundColor: active ? `${theme.colors.brand.blue}20` : 'transparent',
                  borderLeftColor: active ? theme.colors.brand.blue : 'transparent'
                }}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}