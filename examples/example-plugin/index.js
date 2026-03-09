/**
 * Example Tailwind Architect plugin.
 * Install in your project and add to tailwind-architect.config.json:
 *   "plugins": ["tailwind-architect-plugin-example"]
 */
export default {
  name: "tailwind-architect-plugin-example",

  lintRules: [
    (ctx) => {
      const messages = [];
      if (ctx.classList.some((c) => c === "!important" || c.startsWith("!"))) {
        messages.push({ message: "Avoid important modifier in classes" });
      }
      return messages;
    }
  ],

  sortGroups: [
    { name: "custom-first", test: (utility) => utility.startsWith("my-"), order: 0 }
  ],

  suggest(ctx) {
    if (ctx.classList.length > 15) {
      return [
        { before: ctx.classList.slice(0, 2), after: "/* consider extracting */", kind: "extract" }
      ];
    }
    return [];
  }
};
