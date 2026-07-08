import type { Supplement } from '../mergeSupplement'
import { srd2024Supplement } from './srd-2024'
import { srd2024Rules } from './srd-2024-rules'

const SUPPLEMENTS: Record<string, Supplement> = {
    'srd-2024': { ...srd2024Supplement, rules: srd2024Rules },
}

export function getSupplement(documentKey: string): Supplement {
    return SUPPLEMENTS[documentKey] ?? {}
}

export const SUPPLEMENT_ATTRIBUTION =
    'Condition and rules-glossary text includes material from the System Reference Document 5.2.1 by Wizards of the Coast LLC, available under CC-BY-4.0.'
