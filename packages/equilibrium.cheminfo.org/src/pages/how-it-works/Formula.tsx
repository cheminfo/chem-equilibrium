import type { ReactNode } from 'react';

interface FormulaProps {
  children: ReactNode;
  /** A short caption printed under the expression. */
  caption?: ReactNode;
}

/**
 * A display expression, written as selectable text rather than an image.
 *
 * Everything on this page is plain HTML with `<sub>` and `<sup>`, so a formula
 * can be copied into a mail or a exam sheet, and read by a screen reader.
 * @param props - The expression and its caption.
 * @returns The formula block.
 */
export function Formula(props: FormulaProps) {
  const { children, caption } = props;
  return (
    <div style={{ margin: '12px 0' }}>
      <div className="formula bp6-code-block" style={{ margin: 0 }}>
        {children}
      </div>
      {caption ? (
        <div
          className="bp6-text-small bp6-text-muted"
          style={{ marginTop: 4, paddingLeft: 12 }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}

interface TextProps {
  children: ReactNode;
}

/**
 * An expression inside a sentence, in the same face as the display blocks.
 * @param props - The expression.
 * @returns The inline formula.
 */
export function Inline(props: TextProps) {
  return (
    <code className="bp6-code" style={{ whiteSpace: 'nowrap' }}>
      {props.children}
    </code>
  );
}

/**
 * A subscripted index, e.g. the `i` of `C_i`.
 * @param props - The index.
 * @returns The subscript.
 */
export function Sub(props: TextProps) {
  return <sub style={{ fontSize: '0.75em' }}>{props.children}</sub>;
}

/**
 * A superscripted exponent, e.g. the `a` of `[C]^a`.
 * @param props - The exponent.
 * @returns The superscript.
 */
export function Sup(props: TextProps) {
  return <sup style={{ fontSize: '0.75em' }}>{props.children}</sup>;
}
