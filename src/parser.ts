// parser.ts
// Safe tokenizer + shunting-yard parser and evaluator.
// Supports numbers, parentheses, operators (+ - * / ^), functions (sin, cos, tan, log, ln, sqrt), and constants (pi, e).

export type Token = {
  type: 'number' | 'op' | 'fn' | 'paren' | 'const';
  value: string;
};

const FUNCTIONS = new Set(['sin','cos','tan','log','ln','sqrt']);
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

const PRECEDENCE: Record<string, number> = { '+':1, '-':1, '*':2, '/':2, '^':3 };
const RIGHT_ASSOC = new Set(['^']);

export class Parser {
  tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    const cleaned = expr.replace(/\s+/g, '');
    let i = 0;

    while (i < cleaned.length) {
      const ch = cleaned[i];

      // number (including decimal)
      if (/[0-9.]/.test(ch)) {
        let num = ch;
        i++;
        while (i < cleaned.length && /[0-9.]/.test(cleaned[i])) { num += cleaned[i++]; }
        if (num.split('.').length > 2) throw new Error('Invalid number format');
        tokens.push({ type: 'number', value: num });
        continue;
      }

      // letters: function name or constant
      if (/[a-zA-Z]/.test(ch)) {
        let id = ch;
        i++;
        while (i < cleaned.length && /[a-zA-Z0-9]/.test(cleaned[i])) { id += cleaned[i++]; }
        if (FUNCTIONS.has(id)) tokens.push({ type:'fn', value: id });
        else if (id in CONSTANTS) tokens.push({ type:'const', value: id });
        else throw new Error(`Unknown identifier: ${id}`);
        continue;
      }

      // parentheses
      if (ch === '(' || ch === ')') { tokens.push({ type:'paren', value: ch }); i++; continue; }

      // operators
      if (/[+\-*/^]/.test(ch)) { tokens.push({ type:'op', value: ch }); i++; continue; }

      throw new Error(`Invalid character: ${ch}`);
    }

    return tokens;
  }

  toRPN(tokens: Token[]): Token[] {
    const output: Token[] = [];
    const ops: Token[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'number' || t.type === 'const') {
        output.push(t);
      } else if (t.type === 'fn') {
        ops.push(t);
      } else if (t.type === 'op') {
        while (ops.length > 0) {
          const top = ops[ops.length - 1];
          if (top.type === 'fn') { output.push(ops.pop()!); continue; }
          if (top.type === 'op') {
            const p1 = PRECEDENCE[top.value];
            const p2 = PRECEDENCE[t.value];
            if ((RIGHT_ASSOC.has(t.value) && p2 < p1) || (!RIGHT_ASSOC.has(t.value) && p2 <= p1)) {
              output.push(ops.pop()!); continue;
            }
          }
          break;
        }
        ops.push(t);
      } else if (t.type === 'paren') {
        if (t.value === '(') { ops.push(t); }
        else { // ')'
          let found = false;
          while (ops.length > 0) {
            const top = ops.pop()!;
            if (top.type === 'paren' && top.value === '(') { found = true; break; }
            output.push(top);
          }
          if (!found) throw new Error('Mismatched parentheses');
          if (ops.length > 0 && ops[ops.length - 1].type === 'fn') output.push(ops.pop()!);
        }
      }
    }

    while (ops.length > 0) {
      const top = ops.pop()!;
      if (top.type === 'paren') throw new Error('Mismatched parentheses');
      output.push(top);
    }

    return output;
  }

  evaluateRPN(rpn: Token[]): number {
    const stack: number[] = [];
    for (const t of rpn) {
      if (t.type === 'number') stack.push(Number(t.value));
      else if (t.type === 'const') stack.push(CONSTANTS[t.value]);
      else if (t.type === 'op') {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error('Invalid expression');
        switch (t.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': if (b === 0) throw new Error('Division by zero'); stack.push(a / b); break;
          case '^': stack.push(Math.pow(a, b)); break;
          default: throw new Error('Unknown operator');
        }
      } else if (t.type === 'fn') {
        const a = stack.pop();
        if (a === undefined) throw new Error('Invalid function call');
        switch (t.value) {
          case 'sin': stack.push(Math.sin(a)); break;
          case 'cos': stack.push(Math.cos(a)); break;
          case 'tan': stack.push(Math.tan(a)); break;
          case 'log':
            if (a <= 0) throw new Error('Log domain error');
            stack.push(Math.log10(a)); break;
          case 'ln':
            if (a <= 0) throw new Error('Ln domain error');
            stack.push(Math.log(a)); break;
          case 'sqrt':
            if (a < 0) throw new Error('Sqrt domain error');
            stack.push(Math.sqrt(a)); break;
          default: throw new Error('Unknown function');
        }
      }
    }
    if (stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
  }

  evaluate(expr: string): number {
    const tokens = this.tokenize(expr);
    const rpn = this.toRPN(tokens);
    return this.evaluateRPN(rpn);
  }
}
