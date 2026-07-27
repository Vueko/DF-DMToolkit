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

// adultBronzeDragonXmm: recorte del Adult Bronze Dragon (XMM, formato 2024) del
// "Export List" de 5etools; ejercita spellcasting, initiative, soundClip y tags 2024.
export const adultBronzeDragonXmm = {
    name: 'Adult Bronze Dragon',
    source: 'XMM',
    size: ['H'],
    type: { type: 'dragon', tags: ['metallic'] },
    alignment: ['L', 'G'],
    ac: [18],
    hp: { average: 212, formula: '17d12 + 102' },
    speed: { walk: 40, fly: 80, swim: 40 },
    initiative: { proficiency: 2 },
    str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 20,
    save: { dex: '+5', wis: '+7' },
    skill: { insight: '+7', perception: '+12', stealth: '+5' },
    senses: ['Blindsight 60 ft.', 'Darkvision 120 ft.'],
    passive: 22,
    immune: ['lightning'],
    languages: ['Common', 'Draconic'],
    cr: { cr: '15', xpLair: 15000 },
    spellcasting: [
        {
            name: 'Spellcasting',
            type: 'spellcasting',
            headerEntries: [
                'The dragon casts one of the following spells, requiring no Material components and using Charisma as the spellcasting ability (spell save {@dc 17}, {@hit 10} to hit with spell attacks):',
            ],
            will: [
                '{@spell Detect Magic|XPHB}',
                '{@spell Guiding Bolt|XPHB} (level 2 version)',
                '{@spell Speak with Animals|XPHB}',
                '{@spell Thaumaturgy|XPHB}',
            ],
            daily: {
                '1e': ['{@spell Detect Thoughts|XPHB}', '{@spell Water Breathing|XPHB}'],
            },
            ability: 'cha',
            displayAs: 'action',
        },
    ],
    trait: [
        { name: 'Amphibious', entries: ['The dragon can breathe air and water.'] },
        { name: 'Legendary Resistance (3/Day, or 4/Day in Lair)', entries: ['If the dragon fails a saving throw, it can choose to succeed instead.'] },
    ],
    action: [
        { name: 'Multiattack', entries: ['The dragon makes three Rend attacks. It can replace one attack with a use of (A) Repulsion Breath or (B) Spellcasting to cast {@spell Guiding Bolt|XPHB} (level 2 version).'] },
        { name: 'Rend', entries: ['{@atkr m} {@hit 12}, reach 10 ft. {@h}16 ({@damage 2d8 + 7}) Slashing damage plus 5 ({@damage 1d10}) Lightning damage.'] },
        { name: 'Lightning Breath {@recharge 5}', entries: ['{@actSave dex} {@dc 19}, each creature in a 90-foot-long, 5-foot-wide {@variantrule Line [Area of Effect]|XPHB|Line}. {@actSaveFail} 55 ({@damage 10d10}) Lightning damage. {@actSaveSuccess} Half damage.'] },
    ],
    legendary: [
        { name: 'Pounce', entries: ['The dragon moves up to half its {@variantrule Speed|XPHB}, and it makes one Rend attack.'] },
    ],
    soundClip: { type: 'internal', path: 'bestiary/bronze-dragon.opus' },
    environment: ['coastal'],
    dragonAge: 'adult',
}
