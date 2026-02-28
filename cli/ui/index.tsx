import React from 'react';
import { render } from 'ink';
import { TerminalApp } from './TerminalApp.ts';
import { SonicEngine } from '../../packages/sonic-core/src/engine-interface.ts';

export const runTUI = async (engine: SonicEngine) => {
  const { waitUntilExit } = render(<TerminalApp engine={engine} />);
  await waitUntilExit();
};
