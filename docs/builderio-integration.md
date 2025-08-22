# Builder.io Integration (Placeholder)

Do not integrate yet. This document outlines steps to integrate when ready:

1. Install SDK
   - Choose Builder React SDK and add it to the client build
   - Add `<BuilderProvider apiKey={process.env.BUILDER_PUBLIC_KEY}>` at the app root

2. Routing
   - Add a catch-all route (e.g., `/[...builder].tsx`) to render Builder pages
   - Ensure it doesn’t conflict with existing routes

3. Code Components
   - Register design system components (buttons, cards, grids) as code components
   - Map props and default content for safe use in Builder

4. Content Security & Styling
   - Ensure global CSS doesn’t block Builder slots
   - Keep Tailwind tokens minimal and stable

5. Preview & Publishing
   - Configure preview origin using `FRONTEND_ORIGIN`
   - Optionally connect Builder GitHub app for content sync

6. Environment Variables
   - `BUILDER_PUBLIC_KEY` and optional private key for server usage

7. Testing
   - Add smoke tests to ensure Builder route renders and doesn’t break other pages