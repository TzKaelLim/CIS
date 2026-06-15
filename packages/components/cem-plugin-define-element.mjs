/**
 * CEM analyzer plugin: recognise our `defineElement('tag', Class)` registration
 * helper (the analyzer only auto-detects literal `customElements.define`) and
 * back-fill `tagName` + `customElement` onto the matching class declaration,
 * so the manifest drives React wrappers, autodocs, and IDE data correctly.
 */
export function defineElementPlugin() {
  const defines = []; // { tagName, className }
  return {
    name: 'tc-define-element',
    analyzePhase({ ts, node }) {
      if (
        ts.isCallExpression(node) &&
        node.expression.getText() === 'defineElement' &&
        node.arguments.length >= 2
      ) {
        const [tagArg, classArg] = node.arguments;
        if (ts.isStringLiteralLike(tagArg)) {
          defines.push({ tagName: tagArg.text, className: classArg.getText() });
        }
      }
    },
    packageLinkPhase({ customElementsManifest }) {
      for (const mod of customElementsManifest.modules) {
        for (const decl of mod.declarations ?? []) {
          const match = defines.find((d) => d.className === decl.name);
          if (match) {
            decl.customElement = true;
            decl.tagName = match.tagName;
          }
        }
      }
    },
  };
}
