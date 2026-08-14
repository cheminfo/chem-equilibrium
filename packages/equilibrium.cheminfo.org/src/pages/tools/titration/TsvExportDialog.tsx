import { Button, Dialog, DialogBody, DialogFooter } from '@blueprintjs/core';
import { useState } from 'react';

interface TsvExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** The whole table, header line included. */
  text: string;
  /** How many data lines it holds, for the caption. */
  pointCount: number;
}

/**
 * The curve as tab-separated text, ready to be pasted into a spreadsheet.
 *
 * The text is shown rather than downloaded: a page embedded in a course site
 * often cannot start a download at all, and selecting the text always works.
 * @param props - The text to show and whether the dialog is open.
 * @returns The dialog.
 */
export function TsvExportDialog(props: TsvExportDialogProps) {
  const { isOpen, onClose, text, pointCount } = props;
  const [copied, setCopied] = useState(false);

  function copy(): void {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Titration curve as tab-delimited values"
      icon="th"
      style={{ width: 560 }}
    >
      <DialogBody>
        <p className="bp6-text-muted">
          {pointCount} point{pointCount === 1 ? '' : 's'}, one per line. Copy
          them, then paste into a spreadsheet.
        </p>
        <textarea
          readOnly
          value={text}
          aria-label="Titration curve as tab-delimited values"
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
          style={{
            width: '100%',
            height: 280,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            boxSizing: 'border-box',
          }}
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button
              icon={copied ? 'tick' : 'clipboard'}
              text={copied ? 'Copied' : 'Copy to clipboard'}
              intent="primary"
              onClick={copy}
            />
            <Button text="Close" onClick={onClose} />
          </>
        }
      />
    </Dialog>
  );
}
