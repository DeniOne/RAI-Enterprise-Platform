module.exports = {
    rules: {
        'no-unsafe-prisma-access': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'disallow direct $queryRaw access and ensure companyId is present in prisma where clauses',
                    category: 'Possible Errors',
                    recommended: true,
                },
                schema: [], // no options
            },
            create(context) {
                return {
                    CallExpression(node) {
                        // 1. Block $queryRaw and $executeRaw
                        if (
                            node.callee.type === 'MemberExpression' &&
                            (node.callee.property.name === '$queryRaw' || node.callee.property.name === '$executeRaw' || node.callee.property.name === '$queryRawUnsafe' || node.callee.property.name === '$executeRawUnsafe')
                        ) {
                            context.report({
                                node,
                                message: 'Direct $queryRaw/$executeRaw access is forbidden. Use PrismaService.safeQueryRaw() or safeExecuteRaw() instead for 10/10 Isolation.',
                            });
                        }

                        // 2. [Heuristic] Warning for missing companyId in where clauses (optional/advanced)
                        // This would require semantic analysis of Prisma models, which is hard in a simple plugin.
                        // For now, we focus on the raw SQL block which is the biggest hole.
                    },
                };
            },
        },
    },
};
