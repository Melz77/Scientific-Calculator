// main.ts
import { Calculator } from './calculator';

const display = document.getElementById('display') as HTMLElement;
const buttons = document.getElementById('buttons') as HTMLElement;

const calc = new Calculator((s) => { display.textContent = s; });

buttons.addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement;
  if (!target) return;
  const fn = target.getAttribute('data-fn');
  const val = target.getAttribute('data-val');
  if (fn) {
    switch (fn) {
      case 'clear': calc.clear(); break;
      case 'back': calc.backspace(); break;
      case 'equals': calc.evaluate(); break;
    }
  } else if (val) {
    // for functions like sin, append 'sin(' so user can add parameter
    if (/^[a-z]+$/.test(val)) calc.append(val + '(');
    else calc.append(val);
  }
});

// keyboard support
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') { ev.preventDefault(); calc.evaluate(); return; }
  if (ev.key === 'Backspace') { ev.preventDefault(); calc.backspace(); return; }
  if (ev.key === 'Escape') { calc.clear(); return; }
  // allow digits, operators, parentheses, dot
  if (/^[0-9+\-*/^().]$/.test(ev.key)) { calc.append(ev.key); }
});

// initialize display
calc.clear();
