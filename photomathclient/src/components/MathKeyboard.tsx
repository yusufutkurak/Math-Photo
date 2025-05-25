import React, { useState, useRef, useEffect } from "react";
import '../style/mathKeyboard.css';
import { useTranslation } from 'react-i18next';

interface IMathKeyboardProps {
    equation: string;
    setEquation: React.Dispatch<React.SetStateAction<string>>
};

type MathButton = {
    label: string;
    value: string;
};

const bracketedFunctions = ['cos()', 'sin()', 'tan()', 'cot()', 'log()', 'ln()', '^()'] as const;
type BracketedFunction = typeof bracketedFunctions[number];

const exampleEquations = [
  "sin(x) + cos(x)",
  "log(x) * x^2",
  "√(x) + e^x",
  "π * x / 2",
  "ln(x) + 3*x^2"
];

const allowedKeys = [
  'x','0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '+', '-', '*', '/', '^', '(', ')', '.', 'π', 'e', '√',
  'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'
];

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
  }
};

function MathKeyboard({equation, setEquation}: IMathKeyboardProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const [suggestedEquation, setSuggestedEquation] = useState(exampleEquations[0]);


    const handleInsert = (value: string) => {
      const cursorPos = inputRef.current?.selectionStart ?? equation.length;

      setEquation(prev => {
        const updated = prev.slice(0, cursorPos) + value + prev.slice(cursorPos);
        return updated;
      });

      setTimeout(() => {
        const pos = cursorPos + (bracketedFunctions.includes(value as BracketedFunction) ? value.length - 1 : value.length);
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(pos, pos);
      }, 0);
    };

    const handleClear = () => setEquation("");

    const handleRandomClick = () => {
      const random = exampleEquations[Math.floor(Math.random() * exampleEquations.length)];
      setSuggestedEquation(random);
      setEquation(random);
    };


    const insertSuggestedEquation = () => {
      setEquation(suggestedEquation);
    };


    

    return (
      <div className="math-keyboard-container">
        <div className="input-container">
          <label>
            f(x):{" "}
          </label>
           <input
              ref={inputRef}
              type="text"
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              onKeyDown={handleKeyDown}
              className="math-input"
              placeholder={equation.length === 0 ? `💡 ${suggestedEquation}` : ''}
            />
        </div>

        <div className="keyboard-grid">
          {mathButtons.map((btn) => (
            <button key={btn.label} onClick={() => handleInsert(btn.value)}>
              {btn.label}
            </button>
          ))}
          <button onClick={handleRandomClick} className="random-button">
            🎲 
          </button>

          <button onClick={handleClear} className="clear-button">{t('clear')}</button>
        </div>
      </div>
    );
}

const mathButtons: MathButton[] = [
  { label: "+", value: "+" },
  { label: "-", value: "-" },
  { label: "×", value: "*" },
  { label: "÷", value: "/" },
  { label: "√", value: "√" },
  { label: "cos", value: "cos()" },
  { label: "sin", value: "sin()" },
  { label: "tan", value: "tan()" },
  { label: "cot", value: "cot()" },
  { label: "x²", value: "^(2)" },
  { label: "xʸ", value: "^()" },
  { label: "π", value: "π" },
  { label: "e", value: "e" },
  { label: "log", value: "log()" },
  { label: "ln", value: "ln()" },
];

export default MathKeyboard;
