import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
} from '@blueprintjs/core';
import { useState } from 'react';

interface TsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** The whole table, tab separated, headers included. */
  tsv: string;
  /** Number of lines the table holds, headers excluded. */
  rowCount: number;
}

/**
 * Hand the whole table over as text, to paste into a spreadsheet.
 *
 * The text is shown rather than downloaded: a teacher can read what is being
 * copied, and the page never has to offer a file whose content is invisible.
 * @param props - The table to hand over.
 * @returns The dialog.
 */
export function TsvDialog(props: TsvDialogProps) {
  const { isOpen, onClose, title, tsv, rowCount } = props;
  const [copied, setCopied] = useState(false);

  function copy(): void {
    void navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="th"
      style={{ width: 'min(900px, 92vw)' }}
    >
      <DialogBody>
        <Callout intent="primary" compact icon="info-sign">
          {rowCount} rows, tab separated. Copy them, then paste into a
          spreadsheet: every column of the bundled table is there, including the
          sources and the warnings.
        </Callout>
        <textarea
          readOnly
          value={tsv}
          spellCheck={false}
          aria-label={title}
          className="bp6-input"
          style={{
            width: '100%',
            height: 320,
            marginTop: 12,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            whiteSpace: 'pre',
            overflowWrap: 'normal',
            overflowX: 'auto',
          }}
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Close" onClick={onClose} />
            <Button
              intent="primary"
              icon={copied ? 'tick' : 'clipboard'}
              text={copied ? 'Copied' : 'Copy to clipboard'}
              onClick={copy}
            />
          </>
        }
      />
    </Dialog>
  );
}
