// Fixtures reales de monstruos homebrew en formato 5etools, aportados por el usuario.
// chillbornZombie: de "Conflux's Zombies". smallTreant: de "Bogo's Homebrews".

export const chillbornZombie = {
    name: 'Chillborn Zombie',
    source: 'ConfluxsZombies',
    size: ['M'],
    type: 'undead',
    alignment: ['U'],
    ac: [{ ac: 14, from: ['natural armor'] }],
    hp: { average: 75, formula: '10d8 + 30' },
    speed: { walk: 30 },
    str: 16, dex: 8, con: 17, int: 3, wis: 6, cha: 5,
    skill: { athletics: '+5' },
    senses: ['darkvision 60 ft.'],
    passive: 8,
    immune: ['cold', 'poison'],
    conditionImmune: ['poisoned'],
    cr: '3',
    trait: [
        { name: 'Chillborne Aura', entries: ['A creature that starts its turn within 10 ft. of one or more chillborn zombies takes 4 ({@damage 1d8}) cold damage for each chillborn zombie within 10 ft. of it.'] },
        { name: 'Supercooled', entries: ['If the zombie takes any bludgeoning damage, after taking damage it gains vulnerablity to bludgeoning damage until the beginning of its next turn.'] },
    ],
    action: [
        { name: 'Multiattack', entries: ['The zombie makes two melee attacks.'] },
        { name: 'Ice Reaper Slam', entries: ["{@atk mw} {@hit 7} to hit, reach 5 ft., one target. {@h}11 ({@dice 2d6 + 4}) bludgeoning plus 10 ({@damage 3d6}) cold damage and the target's movement speed is reduced by 10 until the end of its next turn."] },
    ],
    reaction: [
        { name: 'Flash Freeze (Recharge 6)', entries: ["As a reaction when a creature within 5 ft. has its movmement speed reduced to 0, the zombie forces it to succeed on a {@dc 13} Constitution saving throw or be Paralyzed until the end of the zombie's next turn."] },
    ],
}

export const smallTreant = {
    name: 'Small Treant',
    source: 'BOGO',
    size: ['S'],
    type: 'plant',
    alignment: ['A'],
    ac: [{ ac: 14, from: ['natural armor'] }],
    hp: { formula: '4d12 + 8', average: 34 },
    speed: { walk: 30, burrow: 10 },
    str: 15, dex: 8, con: 15, int: 12, wis: 16, cha: 12,
    senses: ['darkvision 30 ft.'],
    passive: 13,
    resist: ['bludgeoning'],
    vulnerable: ['fire'],
    conditionImmune: ['charmed', 'prone', 'unconscious'],
    languages: ['Common', 'Druidic', 'Elvish', 'Sylvan'],
    cr: '1',
    trait: [
        { name: 'Pack Tactics', entries: ["The small treant has advantage on an attack roll against a creature if at least one of the kobold's allies is within 5 feet of the creature and the ally isn't {@condition incapacitated}."] },
    ],
    action: [
        { name: 'Lash', entries: ['{@atk mw} {@hit 4} to hit, reach 10 ft., one target. {@h}7 ({@damage 1d10 + 2}) bludgeoning damage.'] },
    ],
    environment: ['coastal', 'forest', 'grassland', 'hill', 'mountain', 'swamp', 'underwater'],
}
