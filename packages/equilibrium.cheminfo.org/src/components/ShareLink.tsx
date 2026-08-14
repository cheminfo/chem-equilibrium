import { Button, Tooltip } from '@blueprintjs/core';
import { useState } from 'react';

/**
 * Copy the current URL, which carries the whole configuration of the tool.
 * @returns The share button.
 */
export function ShareLink() {
  const [copied, setCopied] = useState(false);

  return (
    <Tooltip
      content={
        copied
          ? 'Link copied'
          : 'Copy a link that reproduces exactly what you see'
      }
      compact
    >
      <Button
        icon={copied ? 'tick' : 'link'}
        text="Share"
        variant="minimal"
        onClick={() => {
          void navigator.clipboard
            .writeText(globalThis.location.href)
            .then(() => {
              setCopied(true);
              globalThis.setTimeout(() => setCopied(false), 2000);
            });
        }}
      />
    </Tooltip>
  );
}
