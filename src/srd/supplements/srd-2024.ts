import type { Supplement } from '../mergeSupplement'

// Texto oficial del SRD 5.2.1 (© Wizards of the Coast, CC-BY-4.0). Rellena huecos que la API deja vacíos
// (hoy Open5e no sirve condiciones para srd-2024). Fuente: https://www.dndbeyond.com/srd
export const srd2024Supplement: Supplement = {
    conditions: [
        {
            name: 'Blinded',
            desc: '- A Blinded creature can\'t see and automatically fails any ability check that requires sight.\n'
                + '- Attack rolls against the creature have Advantage, and the creature\'s attack rolls have Disadvantage.',
        },
        {
            name: 'Charmed',
            desc: '- A Charmed creature can\'t attack the charmer or target the charmer with damaging abilities or magical effects.\n'
                + '- The charmer has Advantage on any ability check to interact socially with the Charmed creature.',
        },
        {
            name: 'Deafened',
            desc: '- A Deafened creature can\'t hear and automatically fails any ability check that requires hearing.',
        },
        {
            name: 'Exhaustion',
            desc: 'While you have the Exhaustion condition, you experience the following effects.\n'
                + '- **D20 Tests Affected:** When you make a D20 Test, the roll is reduced by 2 times your Exhaustion level.\n'
                + '- **Speed Reduced:** Your Speed is reduced by a number of feet equal to 5 times your Exhaustion level.\n'
                + '- **Removing Exhaustion Levels:** Finishing a Long Rest removes 1 of your Exhaustion levels. When your Exhaustion level is 0, the condition ends.\n'
                + '- **Dying:** You die if your Exhaustion level reaches 6.',
        },
        {
            name: 'Frightened',
            desc: '- A Frightened creature has Disadvantage on ability checks and attack rolls while the source of its fear is within line of sight.\n'
                + '- The creature can\'t willingly move closer to the source of its fear.',
        },
        {
            name: 'Grappled',
            desc: '- A Grappled creature\'s Speed becomes 0, and it can\'t benefit from any bonus to its Speed.\n'
                + '- The condition ends if the Grappler has the Incapacitated condition.\n'
                + '- The condition also ends if the creature is moved outside the reach of the Grappler or the effect that Grappled it.',
        },
        {
            name: 'Incapacitated',
            desc: '- An Incapacitated creature can\'t take any Action, Bonus Action, or Reaction.\n'
                + '- Its Concentration is broken.\n'
                + '- The creature can\'t speak.\n'
                + '- If the creature is Incapacitated when it rolls Initiative, it has Disadvantage on the roll.',
        },
        {
            name: 'Invisible',
            desc: '- If an Invisible creature rolls Initiative, it has Advantage on the roll.\n'
                + '- The creature isn\'t affected by any effect that requires its target to be seen unless the effect\'s creator can somehow see it. Any equipment it is wearing or carrying is also concealed.\n'
                + '- Attack rolls against the creature have Disadvantage, and its attack rolls have Advantage. If another creature can somehow see it, that creature doesn\'t gain this benefit.',
        },
        {
            name: 'Paralyzed',
            desc: '- A Paralyzed creature has the Incapacitated condition.\n'
                + '- Its Speed is 0 and can\'t increase.\n'
                + '- The creature automatically fails Strength and Dexterity saving throws.\n'
                + '- Attack rolls against the creature have Advantage.\n'
                + '- Any attack roll that hits the creature is a Critical Hit if the attacker is within 5 feet of it.',
        },
        {
            name: 'Petrified',
            desc: '- A Petrified creature is transformed, along with any nonmagical objects it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.\n'
                + '- The creature has the Incapacitated condition.\n'
                + '- Its Speed is 0 and can\'t increase.\n'
                + '- Attack rolls against the creature have Advantage.\n'
                + '- The creature automatically fails Strength and Dexterity saving throws.\n'
                + '- The creature has Resistance to all damage.\n'
                + '- The creature has Immunity to the Poisoned condition.',
        },
        {
            name: 'Poisoned',
            desc: '- A Poisoned creature has Disadvantage on attack rolls and ability checks.',
        },
        {
            name: 'Prone',
            desc: '- A Prone creature\'s only movement option is to crawl, unless it stands up and thereby ends the condition.\n'
                + '- The creature has Disadvantage on attack rolls.\n'
                + '- An attack roll against the creature has Advantage if the attacker is within 5 feet of the creature. Otherwise, that attack roll has Disadvantage.',
        },
        {
            name: 'Restrained',
            desc: '- A Restrained creature\'s Speed is 0, and it can\'t benefit from any bonus to its Speed.\n'
                + '- Attack rolls against the creature have Advantage, and the creature\'s attack rolls have Disadvantage.\n'
                + '- The creature has Disadvantage on Dexterity saving throws.',
        },
        {
            name: 'Stunned',
            desc: '- A Stunned creature has the Incapacitated condition.\n'
                + '- The creature automatically fails Strength and Dexterity saving throws.\n'
                + '- Attack rolls against the creature have Advantage.',
        },
        {
            name: 'Unconscious',
            desc: '- An Unconscious creature has the Incapacitated and Prone conditions, and it drops whatever it\'s holding. When this condition ends, the creature remains Prone.\n'
                + '- Its Speed is 0 and can\'t increase.\n'
                + '- Attack rolls against the creature have Advantage.\n'
                + '- The creature automatically fails Strength and Dexterity saving throws.\n'
                + '- Any attack roll that hits the creature is a Critical Hit if the attacker is within 5 feet of it.\n'
                + '- The creature is unaware of its surroundings.',
        },
    ],
}
