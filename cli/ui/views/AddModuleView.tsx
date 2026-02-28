import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { useTUIStore } from '../store.ts';
import { SonicEngine } from '../../../packages/sonic-core/src/engine-interface.ts';

export const AddModuleView = ({ engine }: { engine: SonicEngine }) => {
  const { setView, moduleDescriptors } = useTUIStore();

  const availableTypes = Object.keys(moduleDescriptors);
  const items = availableTypes.map(t => ({ label: t, value: t }));
  items.push({ label: '< Cancel', value: 'BACK' });
  
  return (
    <Box flexDirection="column">
      <Text bold>Add Module</Text>
      <SelectInput limit={10} items={items} onSelect={async (item) => {
        if (item.value === 'BACK') setView('RACK');
        else {
          await engine.addModule(item.value as any);
          setView('RACK');
        }
      }} />
    </Box>
  );
};
