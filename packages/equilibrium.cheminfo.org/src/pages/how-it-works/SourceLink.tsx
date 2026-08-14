const BASE =
  'https://github.com/cheminfo/chem-equilibrium/blob/main/packages/chem-equilibrium/src/';

interface SourceLinkProps {
  /** Path inside `packages/chem-equilibrium/src/`, e.g. `core/NewtonRaphton.ts`. */
  file: string;
  /** Text of the link; the file name is used when it is left out. */
  children?: string;
}

/**
 * A link to the file of the solver a section describes.
 *
 * The page is only worth reading if it can be checked against the code, so
 * every claim made here points at the function that implements it.
 * @param props - Which file to link to.
 * @returns The link.
 */
export function SourceLink(props: SourceLinkProps) {
  const { file, children } = props;
  return (
    <a
      href={`${BASE}${file}`}
      target="_blank"
      rel="noopener"
      className="bp6-code"
    >
      {children ?? file.slice(file.lastIndexOf('/') + 1)}
    </a>
  );
}
