import { CellMap, ComputedMap, ERRORS, isError } from './types';
import { evaluateFormula, extractDeps } from './parser';

function isFormula(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('=');
}

export function evaluate(cells: CellMap): ComputedMap {
  const computed: ComputedMap = {};

  // Pass 1: non-formula cells
  for (const [ref, value] of Object.entries(cells)) {
    if (!isFormula(value)) computed[ref] = value;
  }

  // Formula cells
  const formulaRefs = Object.keys(cells).filter(r => isFormula(cells[r]));

  // Build dependency graph
  const deps: Record<string, string[]> = {};
  for (const ref of formulaRefs) {
    deps[ref] = extractDeps(cells[ref] as string);
  }

  // Topological sort with cycle detection
  const sorted: string[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function visit(ref: string): boolean {
    if (visited.has(ref)) return !isError(computed[ref]);
    if (inStack.has(ref)) { computed[ref] = ERRORS.CIRC; return false; }
    if (!isFormula(cells[ref])) { visited.add(ref); return true; }
    inStack.add(ref);
    for (const dep of (deps[ref] ?? [])) {
      if (isFormula(cells[dep]) && !visit(dep)) {
        computed[ref] = ERRORS.CIRC;
        inStack.delete(ref);
        visited.add(ref);
        return false;
      }
    }
    inStack.delete(ref);
    visited.add(ref);
    sorted.push(ref);
    return true;
  }

  for (const ref of formulaRefs) {
    if (!visited.has(ref)) visit(ref);
  }

  // Evaluate in topological order
  for (const ref of sorted) {
    if (computed[ref] === ERRORS.CIRC) continue;
    try {
      computed[ref] = evaluateFormula(cells[ref] as string, computed);
    } catch {
      computed[ref] = ERRORS.VALUE;
    }
  }

  return computed;
}
