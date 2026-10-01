/** Build-time contract: CSS and JS consumers share literal millisecond tokens. */
export function assertMotionContract(source, label = 'Academy CSS') {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations = /(--(?:motion|slider|accordion)-duration)\s*:\s*([^;}]+)/g;
  for (const [, token, declaration] of css.matchAll(declarations)) {
    const value = declaration.replace(/\s*!important\s*$/i, '').trim();
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)ms$/.test(value)) {
      throw new Error(`${label}: ${token}: ${value}; use a non-negative duration in ms (for example 300ms), shared by CSS and JavaScript.`);
    }
  }
}
