import { ERRORS, isError, SpreadsheetError, CellValue, ComputedMap } from './types';
import { expandRange } from './refs';

// ── Tokenizer ──────────────────────────────────────────────────────────────
type TNum    = { t: 'num';   v: number };
type TStr    = { t: 'str';   v: string };
type TBool   = { t: 'bool';  v: boolean };
type TRange  = { t: 'range'; v: string };
type TCell   = { t: 'cell';  v: string };
type TName   = { t: 'name';  v: string };
type TOp     = { t: 'op';    v: string };
type TParen  = { t: '(' | ')' };
type TComma  = { t: ',' };

type Token = TNum | TStr | TBool | TRange | TCell | TName | TOp | TParen | TComma;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }

    // Number
    if (/[0-9]/.test(input[i]) || (input[i] === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let s = '';
      while (i < input.length && /[0-9.]/.test(input[i])) s += input[i++];
      tokens.push({ t: 'num', v: parseFloat(s) });
      continue;
    }

    // String literal
    if (input[i] === '"') {
      let s = ''; i++;
      while (i < input.length && input[i] !== '"') {
        if (input[i] === '\\' && input[i + 1] === '"') { s += '"'; i += 2; }
        else s += input[i++];
      }
      i++;
      tokens.push({ t: 'str', v: s });
      continue;
    }

    // Names, cell refs, ranges, booleans
    if (/[A-Za-z_]/.test(input[i])) {
      let s = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) s += input[i++];
      const upper = s.toUpperCase();
      if (upper === 'TRUE') { tokens.push({ t: 'bool', v: true }); continue; }
      if (upper === 'FALSE') { tokens.push({ t: 'bool', v: false }); continue; }
      // Check for range A1:B3
      if (/^[A-Z]+[0-9]+$/.test(upper) && input[i] === ':') {
        let s2 = ''; i++;
        while (i < input.length && /[A-Za-z0-9]/.test(input[i])) s2 += input[i++];
        if (/^[A-Z]+[0-9]+$/i.test(s2)) {
          tokens.push({ t: 'range', v: `${upper}:${s2.toUpperCase()}` });
        } else {
          tokens.push({ t: 'cell', v: upper });
        }
        continue;
      }
      if (/^[A-Z]+[0-9]+$/.test(upper)) { tokens.push({ t: 'cell', v: upper }); continue; }
      tokens.push({ t: 'name', v: upper });
      continue;
    }

    // Multi-char operators
    if (input[i] === '<' && input[i + 1] === '>') { tokens.push({ t: 'op', v: '<>' }); i += 2; continue; }
    if (input[i] === '<' && input[i + 1] === '=') { tokens.push({ t: 'op', v: '<=' }); i += 2; continue; }
    if (input[i] === '>' && input[i + 1] === '=') { tokens.push({ t: 'op', v: '>=' }); i += 2; continue; }

    const ch = input[i++];
    if ('+-*/&<>='.includes(ch)) { tokens.push({ t: 'op', v: ch }); continue; }
    if (ch === '(') { tokens.push({ t: '(' }); continue; }
    if (ch === ')') { tokens.push({ t: ')' }); continue; }
    if (ch === ',' || ch === ';') { tokens.push({ t: ',' }); continue; }
  }
  return tokens;
}

// ── Parser ─────────────────────────────────────────────────────────────────
type Ctx = { computed: ComputedMap };
type Pos = { i: number };
type Val = CellValue | SpreadsheetError;

function expr(tok: Token[], p: Pos, ctx: Ctx): Val { return concatExpr(tok, p, ctx); }

function concatExpr(tok: Token[], p: Pos, ctx: Ctx): Val {
  let left = compareExpr(tok, p, ctx);
  while (p.i < tok.length && tok[p.i].t === 'op' && (tok[p.i] as TOp).v === '&') {
    p.i++;
    const right = compareExpr(tok, p, ctx);
    if (isError(left) || isError(right)) return left as SpreadsheetError;
    left = String(left ?? '') + String(right ?? '');
  }
  return left;
}

function compareExpr(tok: Token[], p: Pos, ctx: Ctx): Val {
  let left = addExpr(tok, p, ctx);
  while (p.i < tok.length && tok[p.i].t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes((tok[p.i] as TOp).v)) {
    const op = (tok[p.i++] as TOp).v;
    const right = addExpr(tok, p, ctx);
    if (isError(left) || isError(right)) return left as SpreadsheetError;
    switch (op) {
      case '=':  left = left === right; break;
      case '<>': left = left !== right; break;
      case '<':  left = (left as number) < (right as number); break;
      case '>':  left = (left as number) > (right as number); break;
      case '<=': left = (left as number) <= (right as number); break;
      case '>=': left = (left as number) >= (right as number); break;
    }
  }
  return left;
}

function addExpr(tok: Token[], p: Pos, ctx: Ctx): Val {
  let left = mulExpr(tok, p, ctx);
  while (p.i < tok.length && tok[p.i].t === 'op' && ['+', '-'].includes((tok[p.i] as TOp).v)) {
    const op = (tok[p.i++] as TOp).v;
    const right = mulExpr(tok, p, ctx);
    if (isError(left) || isError(right)) return left as SpreadsheetError;
    const l = toNum(left), r = toNum(right);
    if (l === null || r === null) return ERRORS.VALUE;
    left = op === '+' ? l + r : l - r;
  }
  return left;
}

function mulExpr(tok: Token[], p: Pos, ctx: Ctx): Val {
  let left = unary(tok, p, ctx);
  while (p.i < tok.length && tok[p.i].t === 'op' && ['*', '/'].includes((tok[p.i] as TOp).v)) {
    const op = (tok[p.i++] as TOp).v;
    const right = unary(tok, p, ctx);
    if (isError(left) || isError(right)) return left as SpreadsheetError;
    const l = toNum(left), r = toNum(right);
    if (l === null || r === null) return ERRORS.VALUE;
    if (op === '/' && r === 0) return ERRORS.DIV0;
    left = op === '*' ? l * r : l / r;
  }
  return left;
}

function unary(tok: Token[], p: Pos, ctx: Ctx): Val {
  if (p.i < tok.length && tok[p.i].t === 'op' && (tok[p.i] as TOp).v === '-') {
    p.i++;
    const v = primary(tok, p, ctx);
    if (isError(v)) return v;
    const n = toNum(v);
    return n === null ? ERRORS.VALUE : -n;
  }
  return primary(tok, p, ctx);
}

function primary(tok: Token[], p: Pos, ctx: Ctx): Val {
  if (p.i >= tok.length) return ERRORS.VALUE;
  const t = tok[p.i];

  if (t.t === '(') {
    p.i++;
    const v = expr(tok, p, ctx);
    if (p.i < tok.length && tok[p.i].t === ')') p.i++;
    return v;
  }
  if (t.t === 'num')  { p.i++; return t.v; }
  if (t.t === 'str')  { p.i++; return t.v; }
  if (t.t === 'bool') { p.i++; return t.v; }
  if (t.t === 'cell') {
    p.i++;
    const v = ctx.computed[t.v];
    return v !== undefined ? v : null;
  }
  if (t.t === 'name') {
    const name = t.v; p.i++;
    if (p.i < tok.length && tok[p.i].t === '(') {
      p.i++;
      const args: Val[] = [];
      const rawArgs: (Val | Val[])[] = [];
      while (p.i < tok.length && tok[p.i].t !== ')') {
        if (tok[p.i].t === ',') { p.i++; continue; }
        if (tok[p.i].t === 'range') {
          const refs = expandRange((tok[p.i++] as TRange).v);
          const vals = refs.map(r => { const v = ctx.computed[r]; return v !== undefined ? v : null as Val; });
          rawArgs.push(vals);
          args.push(...vals);
        } else {
          const v = expr(tok, p, ctx);
          rawArgs.push(v);
          args.push(v);
        }
      }
      if (p.i < tok.length && tok[p.i].t === ')') p.i++;
      return callFn(name, args, rawArgs as (Val | Val[])[]);
    }
    return ERRORS.NAME;
  }
  return ERRORS.VALUE;
}

function toNum(v: Val): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === null) return 0;
  if (typeof v === 'string') { const n = Number(v); return isNaN(n) ? null : n; }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function callFn(name: string, args: Val[], _rawArgs: (Val | Val[])[]): Val {
  const nums = args.map(toNum).filter((n): n is number => n !== null);
  switch (name) {
    case 'SUM':           return nums.reduce((a, b) => a + b, 0);
    case 'AVERAGE':       return nums.length === 0 ? ERRORS.DIV0 : nums.reduce((a, b) => a + b, 0) / nums.length;
    case 'MIN':           return nums.length === 0 ? 0 : Math.min(...nums);
    case 'MAX':           return nums.length === 0 ? 0 : Math.max(...nums);
    case 'COUNT':         return nums.length;
    case 'COUNTA':        return args.filter(v => v !== null && v !== '').length;
    case 'IF':            return (args[0] === true || args[0] === 1 || args[0] === 'TRUE') ? (args[1] ?? null) : (args[2] ?? null);
    case 'CONCAT':
    case 'CONCATENATE':   return args.map(v => String(v ?? '')).join('');
    case 'ABS':           { const n = toNum(args[0] ?? null); return n === null ? ERRORS.VALUE : Math.abs(n); }
    case 'ROUND':         { const n = toNum(args[0] ?? null); const d = toNum(args[1] ?? 0) ?? 0; if (n === null) return ERRORS.VALUE; const f = Math.pow(10, d); return Math.round(n * f) / f; }
    case 'LEN':           return String(args[0] ?? '').length;
    case 'UPPER':         return String(args[0] ?? '').toUpperCase();
    case 'LOWER':         return String(args[0] ?? '').toLowerCase();
    case 'TRIM':          return String(args[0] ?? '').trim();
    case 'NOW':           return new Date().toLocaleString();
    case 'TODAY':         return new Date().toLocaleDateString();
    default:              return ERRORS.NAME;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────
export function evaluateFormula(formula: string, computed: ComputedMap): CellValue | SpreadsheetError {
  if (typeof formula !== 'string' || !formula.startsWith('=')) return formula as CellValue;
  try {
    const tokens = tokenize(formula.slice(1));
    const pos: Pos = { i: 0 };
    const ctx: Ctx = { computed };
    return expr(tokens, pos, ctx) ?? null;
  } catch {
    return ERRORS.VALUE;
  }
}

export function extractDeps(formula: string): string[] {
  if (typeof formula !== 'string' || !formula.startsWith('=')) return [];
  const tokens = tokenize(formula.slice(1));
  const deps = new Set<string>();
  for (const t of tokens) {
    if (t.t === 'cell') deps.add(t.v);
    if (t.t === 'range') for (const r of expandRange(t.v)) deps.add(r);
  }
  return Array.from(deps);
}
