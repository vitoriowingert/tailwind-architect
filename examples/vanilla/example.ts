/**
 * Example file for Tailwind Architect.
 * Run from repo root (after npm install in examples/vanilla):
 *   npx tailwind-architect analyze .
 *   npx tailwind-architect fix .
 */

const buttonClasses =
  "pb-4 pt-4 px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600";

const cardClasses = "p-4 rounded-lg border border-gray-200 shadow-md";

export function getButtonClasses(): string {
  return buttonClasses;
}

export function getCardClasses(): string {
  return cardClasses;
}
