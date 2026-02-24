
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { NativeEngine } from './engine/native-engine.js';
import { RackModuleType } from '../packages/sonic-core/src/types.js';

export interface FilterNode {
    type: RackModuleType;
    parameters: Record<string, number>;
}

export function parseFilterString(filterStr: string): FilterNode[] {
    if (!filterStr) return [];

    return filterStr.split(',').map(part => {
        const firstEqualIndex = part.indexOf('=');
        let name: string;
        let paramsStr: string | undefined;

        if (firstEqualIndex !== -1) {
            name = part.substring(0, firstEqualIndex);
            paramsStr = part.substring(firstEqualIndex + 1);
        } else {
            name = part;
        }

        // Convert k-case to CONSTANT_CASE
        const type = name.toUpperCase().replace(/-/g, '_') as RackModuleType;
        const parameters: Record<string, number> = {};

        if (paramsStr) {
            paramsStr.split(':').forEach(paramPart => {
                const innerEqualIndex = paramPart.indexOf('=');
                if (innerEqualIndex !== -1) {
                    const pName = paramPart.substring(0, innerEqualIndex);
                    const pVal = paramPart.substring(innerEqualIndex + 1);
                    parameters[pName] = parseFloat(pVal);
                }
            });
        }

        return { type, parameters };
    });
}

export async function processAudio(options: {
    input: string;
    output?: string;
    filters?: string;
    config?: string;
    wasmPath: string;
    preview?: boolean;
    start?: number;
    abCompare?: boolean;
    params?: string[];
    bitrate?: string;
    sampleRate?: number;
    channels?: number;
}) {
    const { input, output, filters, config, wasmPath, preview, start = 0, abCompare, params = [], bitrate, sampleRate = 44100, channels = 2 } = options;

    if (!fs.existsSync(input)) {
        throw new Error(`Input file not found: ${input}`);
    }

    const engine = new NativeEngine(wasmPath);
    await engine.init();

    const audioBuffer = fs.readFileSync(input);
    await engine.loadAudio(audioBuffer);

    // Load filter chain
    let filterChain: FilterNode[] = [];

    // 1. Load from config if provided
    if (config && fs.existsSync(config)) {
        const configData = JSON.parse(fs.readFileSync(config, 'utf8'));
        if (configData.rack) {
            filterChain = configData.rack;
        } else if (Array.isArray(configData)) {
            filterChain = configData;
        }
    }

    // 2. Load from CLI filters and append
    if (filters) {
        const cliFilters = parseFilterString(filters);
        filterChain = [...filterChain, ...cliFilters];
    }

    // 3. Apply overrides from params
    params.forEach(paramStr => {
        const parts = paramStr.split(':');
        if (parts.length < 2) return;
        
        const target = parts[0];
        const paramPart = parts[1];
        const [pName, pVal] = paramPart.split('=');
        if (!pName || !pVal) return;

        const value = parseFloat(pVal);
        const index = parseInt(target);

        if (!isNaN(index)) {
            // Target by index
            if (filterChain[index]) {
                filterChain[index].parameters[pName] = value;
            }
        } else {
            // Target by type
            const type = target.toUpperCase().replace(/-/g, '_');
            filterChain.forEach(node => {
                if (node.type === type) {
                    node.parameters[pName] = value;
                }
            });
        }
    });

    // Apply to engine
    for (const node of filterChain) {
        await engine.addModule(node.type);
        const rack = await engine.getRack();
        const lastMod = rack[rack.length - 1];
        for (const [key, val] of Object.entries(node.parameters)) {
            await engine.updateParam(lastMod.id, key, val);
        }
    }

    if (preview) {
        console.log(`\n--- Preview Mode ---`);
        console.log(`Input: ${path.basename(input)}`);
        console.log(`Start Time: ${start}s`);
        console.log(`Controls:`);
        console.log(`  [Space] Play/Pause`);
        console.log(`  [Left/Right] Seek -5s/+5s`);
        if (abCompare) {
            console.log(`  [a] Original (A)`);
            console.log(`  [b] Processed (B)`);
        }
        console.log(`  [q] Quit`);
        console.log(`--------------------\n`);

        await engine.seek(start);
        await engine.togglePlay();
        
        // Interactive Keypress Handling
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', (str, key) => {
            if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
                engine.close();
                process.exit();
            } else if (key.name === 'space') {
                engine.togglePlay();
                engine.getPlaybackState().then(state => {
                    console.log(state.isPlaying ? '▶ Playing' : '⏸ Paused');
                });
            } else if (key.name === 'left') {
                engine.getPlaybackState().then(state => {
                    engine.seek(Math.max(0, state.currentTime - 5));
                    console.log(`⏪ Seek: ${Math.max(0, state.currentTime - 5).toFixed(1)}s`);
                });
            } else if (key.name === 'right') {
                engine.getPlaybackState().then(state => {
                    engine.seek(state.currentTime + 5);
                    console.log(`⏩ Seek: ${(state.currentTime + 5).toFixed(1)}s`);
                });
            } else if (abCompare && key.name === 'a') {
                engine.setABMode('A');
                console.log('👂 Mode: Original (A)');
            } else if (abCompare && key.name === 'b') {
                engine.setABMode('B');
                console.log('👂 Mode: Processed (B)');
            }
        });

        // Loop to update position if needed?
        // Or just let it run.
        return; 
    }

    if (output) {
        console.log(`Processing and exporting to ${output}...`);
        const success = await engine.exportAudio(output);
        if (success) {
            console.log('Export successful.');
        } else {
            throw new Error('Export failed.');
        }
    }
}
