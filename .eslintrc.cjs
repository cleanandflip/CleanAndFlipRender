// .eslintrc.cjs
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "@radix-ui/react-select", message: "Use src/components/ui/Dropdown instead." },
          { name: "headlessui", message: "Use src/components/ui/Dropdown instead." },
          { name: "@/components/UnifiedDropdown", message: "Use src/components/ui/Dropdown instead." },
          { name: "@/components/StandardDropdown", message: "Use src/components/ui/Dropdown instead." },
          { name: "@/components/dropdown-menu", message: "Use src/components/ui/Dropdown instead." },
          { name: "@/components/ui/select", message: "Use src/components/ui/Dropdown instead." },
        ],
        patterns: [
          "*storage*",
          "*SessionCart*",
          "*cart-legacy*",
          "*addresses-legacy*",
          "*checkout-old*",
          "*checkout-simple*",
          "*onboarding*",
          "*ensureProfileComplete*"
        ]
      },
    ],
  },
};