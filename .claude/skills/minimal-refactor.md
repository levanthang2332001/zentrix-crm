# Minimalist Framework-First Refactor

**Objective**: Maximize code efficiency and minimize technical debt by prioritizing built-in framework features over external libraries and manual implementations.

**Guiding Principles**:

1. **Framework Sovereignty**: If the current framework (e.g., NestJS, Next.js, Fastify) provides a built-in solution for a problem, it MUST be prioritized. External dependencies should only be introduced if the framework lacks the capability or the external library offers significant, non-reproducible value.
2. **Dependency Pruning**: Actively audit `package.json`. Every dependency must justify its existence. If a library's functionality can be achieved with a few lines of native code or a framework utility, propose its removal.
3. **Abstraction over Direct Implementation**: Favor the framework's abstraction layers (e.g., NestJS Guards/Interceptors) over direct manipulation of underlying engine objects (e.g., Express Request/Response) whenever possible. This ensures portability and cleaner code.
4. **Zero-Impact Logic**: Optimization is strictly for structure, readability, and maintenance. Functional inputs and outputs must remain 100% identical to the original implementation.

**Execution Workflow**:

1. **Dependency Audit**: Compare `package.json` with imports in the source code. Look for "hidden" transitives or redundant explicit declarations (like `express` when using `@nestjs/platform-express`).
2. **Pattern Recognition**: Identify "manual" or "boilerplate" code blocks that handle standard tasks (e.g., body parsing, manual validation pipes, custom error filters that exist in the framework).
3. **Comparative Proposal**: Before applying changes, present a concise comparison:
   - **Legacy**: [Complexity, Dependencies, Boilerplate]
   - **Minimalist**: [Built-in feature, Removed packages, Lines reduced]
4. **Type-Safe Verification**: Ensure that after the refactor, TypeScript types remain robust and the external API contract (Swagger/Response format) is unchanged.
