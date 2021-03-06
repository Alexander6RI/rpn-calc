class ParseError extends Error { name = "SyntaxError" }
class MathError extends Error { name = "MathError" }

function MathOp(opName, symbol, args, func) {
    this.opName = opName;
    this.symbol = symbol;
    this.args = args;
    this.func = func;
}
const MATH_OPS = [
    new MathOp("addition", "+", 2, (a, b) => a+b),
    new MathOp("subtraction", "-", 2, (a, b) => a-b),
    new MathOp("multiplication", ["*", "\u00d7", "x"], 2, (a, b) => {
        if ((a == Infinity && b == 0) || (a == 0 && b == Infinity)) throw new MathError(`cannot multiply ${formatMathematicalNumber(a)} by ${formatMathematicalNumber(b)}`);
        return a*b;
    }),
    new MathOp("division", ["/", "\u00f7"], 2, (a, b) => {
        if (b == 0) throw new MathError(`cannot divide by 0`);
        return a/b;
    }),
    new MathOp("factorial", "!", 1, (a) => {
        if (!Number.isSafeInteger(a) || a < 0) throw new MathError(`cannot find the factorial of ${formatMathematicalNumber(a)}`);
        var result = 1;
        var step = a;
        while (step > 0) {
            result *= step;
            step--;
        }
        return result;
    }),
    new MathOp("exponentiation", ["^", "**"], 2, (a, b) => {
        return Math.pow(a, b);
    }),
    new MathOp("remainder", "%", 2, (a, b) => {
        if (b == 0) throw new MathError(`cannot divide by 0`);
        return a % b;
    }),
    new MathOp("modulo", ["mod", "%%"], 2, (a, b) => {
        if (b == 0) throw new MathError(`cannot divide by 0`);
        return ((a % b ) + b ) % b;
    }),
    new MathOp("root", "root", 2, (a, b) => {
        if (b == 0) throw new MathError(`cannot find a 0th root`);
        return Math.pow(a, 1/b);
    }),
    new MathOp("square root", ["sqrt", "\u221a"], 1, (a) => {
        return Math.sqrt(a);
    }),
    new MathOp("absolute value", ["|", "abs"], 1, (a) => {
        return Math.abs(a);
    }),

    new MathOp("equation", "=", 2, (a, b) => {
        if (a === b) return 1;
        else return 0;
    }),
    new MathOp("equation", "!=", 2, (a, b) => {
        if (a !== b) return 1;
        else return 0;
    }),
    new MathOp("comparison", "<", 2, (a, b) => {
        if (a < b) return 1;
        else return 0;
    }),
    new MathOp("comparison", ">", 2, (a, b) => {
        if (a > b) return 1;
        else return 0;
    }),
    new MathOp("comparison", "<=", 2, (a, b) => {
        if (a <= b) return 1;
        else return 0;
    }),
    new MathOp("comparison", ">=", 2, (a, b) => {
        if (a >= b) return 1;
        else return 0;
    }),
];

function MathConstant(name, symbols, value) {
    this.name = name;
    this.symbols = symbols;
    this.value = value;
}
const MATH_CONSTANTS = [
    new MathConstant("\u03c0", ["pi", "\u03c0"], Math.PI),
    new MathConstant("\u03c4", ["tau", "\u03c4"], 2*Math.PI),
    new MathConstant("\u03c6", ["phi", "\u03c6"], (1 + Math.sqrt(5)) / 2),
    new MathConstant("\u221e", ["infinity", "\u221e"], Infinity),
    new MathConstant("e", ["e"], Math.E),
]

function formatMathematicalNumber(value) {
    for (var constant of MATH_CONSTANTS) {
        if (value == constant.value) {
            return constant.name;
        }
    }
    for (var constant of MATH_CONSTANTS) {
        if (value == -constant.value) {
            return "-"+constant.name;
        }
    }
    
    // turn to fixed-length string and back to number so that, for example, 0.30000000000000004 gets converted to 0.3
    return Number(value.toFixed(8)).toString();
}

window.addEventListener("load", () => {

    const input = document.getElementById("input");

    function doTheMath(input) {
        var tokens = input.split(/ /g);

        var output = [];
        for (var char of tokens) {
            var token = char;
            var factor = 1;
            if (token.length > 1 && token[0] == "-") {
                token = token.slice(1);
                factor *= -1;
            }
            if (/^[0-9\.]*$/.test(token)) output.push(Number(token)*factor);
            else if (MATH_OPS.some(i => (Array.isArray(i.symbol) && i.symbol.includes(token)) || i.symbol == token)) {
                const thisOp = MATH_OPS.find(i => (Array.isArray(i.symbol) && i.symbol.includes(token)) || i.symbol == token);
                if (output.length < thisOp.args) throw new MathError(`cannot perform ${thisOp.opName} operation on ${output.length} values`);
                else {
                    var newNum = thisOp.func(...output.slice(output.length-thisOp.args));
                    for (var i=0;i<thisOp.args;i++) output.pop();
                    output.push(newNum);
                }
            }
            else if (MATH_CONSTANTS.some(i => i.symbols.includes(token))) {
                const thisConst = MATH_CONSTANTS.find(i => i.symbols.includes(token));
                output.push(thisConst.value*factor);
            }
            else throw new ParseError(`bad token ${token}`);
        }

        return output;
    }

    function calcAndDisplay() {
        
        var output = "0";
        var ex;
        try {
            output = doTheMath(input.value.trim().toLowerCase());

            for (var item = 0; item < output.length; item++) {
                output[item] = formatMathematicalNumber(output[item]);
            }

            output = output.join(", ");
        }
        catch (e) {
            output = e.toString();
            ex = e;
        }

        var answers = document.getElementById("answers").querySelectorAll(".answer");
        var thisAnswer = answers[answers.length-1];
        thisAnswer.textContent = output;
        if (ex != undefined && !(ex instanceof MathError || ex instanceof ParseError)) throw ex;
    }

    input.addEventListener("input", calcAndDisplay);
    calcAndDisplay(); // autofill

    input.addEventListener("keydown", ev => {
        if (ev.key == "Enter") {
            var answers = document.getElementById("answers").querySelectorAll(".answer");
            var oldAnswer = answers[answers.length-1];
            oldAnswer.dataset.expression = input.value;
            oldAnswer.title = input.value;
            oldAnswer.addEventListener("click", function(ev) {
                input.value = this.dataset.expression;
                calcAndDisplay();
                input.focus();
            });

            const newEl = document.getElementById("answers").appendChild(document.createElement("p"));
            newEl.classList.add("answer");
            calcAndDisplay();
            newEl.scrollIntoView();
        }
        else if (ev.key == "Escape") {
            input.value = "";
            calcAndDisplay();
        }
    });

    function pressKey(ev) {
        var text = ev.currentTarget.textContent;
        var lengthToMoveOver = text.length;
        var selection = {start: input.selectionStart, end: input.selectionEnd}
        var newText = input.value.slice(0, Math.min(selection.start, selection.end));
        if (newText[newText.length-1] != " ") {
            newText += " ";
            lengthToMoveOver++;
        }
        newText += text;
        newText += input.value.slice(Math.max(selection.start, selection.end));
        input.value = newText;
        calcAndDisplay();
        input.selectionStart = Math.min(selection.start, selection.end)+lengthToMoveOver;
        input.selectionEnd = Math.min(selection.start, selection.end)+lengthToMoveOver;
        input.focus();
    }

    Array.from(document.getElementById("keys").querySelectorAll("button")).forEach(el => el.addEventListener("click", pressKey));

    try {
        navigator.serviceWorker.register("worker.js"); // required in order to be considered a pwa in chromium browsers
    }
    catch (ex) {}

});