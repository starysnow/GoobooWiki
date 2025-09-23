// jsToLatex.js

/**
 * 递归函数，将 Babel AST 节点转换为 LaTeX 字符串
 * @param {object} node - AST 节点
 * @returns {string} - LaTeX 字符串
 */
export function jsToLatex(node) {
    if (!node) return '';

    switch (node.type) {
        case 'NumericLiteral':
            // 处理数字，并处理科学记数法 e+...
            if (node.extra && node.extra.raw && node.extra.raw.includes('e')) {
                 return node.extra.raw.replace(/e\+?/, ' \\times 10^{') + '}';
            }
            return node.value.toString();

        case 'StringLiteral':
            return `\\text{${node.value}}`;

        case 'Identifier':
            return node.name;

        case 'BinaryExpression': {
            const left = jsToLatex(node.left);
            const right = jsToLatex(node.right);
            let operator = node.operator;

            if (operator === '*') {
                operator = ' \\cdot ';
            } else if (operator === '/') {
                return `\\frac{${left}}{${right}}`;
            } else {
                operator = ` ${operator} `;
            }
            return `(${left}${operator}${right})`;
        }

        case 'CallExpression': {
            const calleeName = getNodeName(node.callee);
            const args = node.arguments.map(arg => jsToLatex(arg)).join(', ');

            if (calleeName === 'Math.pow') {
                const [base, exponent] = node.arguments.map(jsToLatex);
                // 优化：如果底数是一个复杂的表达式，加括号
                const baseNeedsParen = node.arguments[0].type === 'BinaryExpression';
                return `${baseNeedsParen ? `(${base})` : base}^{${exponent}}`;
            }
            if (calleeName === 'Math.floor') {
                return `\\lfloor ${args} \\rfloor`;
            }
            if (calleeName === 'Math.round') {
                return `\\text{round}(${args})`;
            }
            // 对于 getSequence, fallbackArray 等自定义函数，保持原样表示
            return `\\text{${calleeName}}(${args})`;
        }

        case 'MemberExpression':
            return getNodeName(node);

        case 'ArrayExpression':
            const elements = node.elements.map(jsToLatex).join(', ');
            return `[${elements}]`;

        default:
            return `[NODE: ${node.type}]`;
    }
}

/**
 * 辅助函数，用于获取节点名称，特别是处理 MemberExpression 如 a.b.c
 * @param {object} node
 * @returns {string}
 */
function getNodeName(node) {
    if (node.type === 'Identifier') {
        return node.name;
    }
    if (node.type === 'MemberExpression') {
        return `${getNodeName(node.object)}.${getNodeName(node.property)}`;
    }
    return '[unknown]';
}