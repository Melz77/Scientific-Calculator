// calculator.ts
import { Parser } from './parser';

export class Calculator {
  private input: string = '';
  private parser = new Parser();

  constructor(private onChange: (s: string) => void) {}

  append(value: string) {
    // Allow only digits, letters for functions/constants, operators, dot, parentheses
    if (!/^[0-9a-zA-Z+\-*/^().]*$/.test(value)) return;
    this.input += value;
    this.onChange(this.input || '0');
  }

  backspace() {
    this.input = this.input.slice(0, -1);
    this.onChange(this.input || '0');
  }

  clear() {
    this.input = '';
    this.onChange('0');
  }

  evaluate(): void {
    try {
      const result = this.parser.evaluate(this.input || '0');
      const out = Number.isFinite(result) ? this.format(result) : 'Error';
      this.input = String(out);
      this.onChange(this.input);
    } catch (e) {
      this.onChange('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  private format(n: number): string {
    // up to 12 significant digits, trim trailing zeros
    const s = Number.parseFloat(String(n)).toPrecision(12);
    return s.replace(/(?:\.0+|(?<=\.[0-9]*[1-9])0+)$/, '').replace(/\.?0+$/, '');
  }
}
