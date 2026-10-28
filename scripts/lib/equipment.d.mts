import type { Equipment } from '../../src/types';

export declare const EQUIPMENT: Equipment[];
export declare function equipmentFromDataset(value: string): Equipment;
export declare function equipmentForHandWritten(name: string): Equipment | undefined;
