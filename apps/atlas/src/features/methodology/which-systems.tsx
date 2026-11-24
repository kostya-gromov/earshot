import type { ReactNode } from 'react';
import { Part } from './how-we-measure';

/** The inclusion rule (ADR 0006), applied the same way to every candidate system. */
export function WhichSystems({ children }: { children?: ReactNode }) {
  return (
    <Part id="systems" title="Which systems are measured">
      <p>
        A design system or component library is measured for a pattern when its maintainers ship a
        component for it, or document it as a composition of their own published components. The
        same check applies to every candidate. A system with neither is listed as having no
        equivalent component, with a link to where its docs show that.
      </p>
      <p>
        A composition is built exactly as the docs write it, and the system&rsquo;s column says
        &ldquo;Docs composition, assembled by Earshot&rdquo;, so you know we measured our assembly
        of their example. Community packages and compositions we would design ourselves are not
        measured.
      </p>
      {children}
    </Part>
  );
}
