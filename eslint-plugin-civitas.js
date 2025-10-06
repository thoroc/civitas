/* Custom ESLint plugin for Civitas project */
/**
 * Rule: options-object-params
 * Enforces that functions should not declare more than two scalar parameters.
 * If a function requires more than two pieces of input data, they should be
 * grouped into a single options object typed by an interface named *Options or *Config.
 */
module.exports = {
  rules: {
    'options-object-params': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Prefer a single typed options object instead of >2 parameters',
          recommended: false,
        },
        messages: {
          preferOptions:
            'Function has more than 2 parameters. Use a single options object interface (e.g. FooOptions).',
        },
        schema: [],
      },
      create(context) {
        function check(node) {
          const params = node.params || [];
          if (params.length <= 2) return;
          // Allow if the function already uses exactly one parameter which is an object pattern (handled above) — here length>2 so always report.
          context.report({ node, messageId: 'preferOptions' });
        }
        return {
          FunctionDeclaration: check,
          FunctionExpression: check,
          ArrowFunctionExpression: check,
        };
      },
    },
  },
};
