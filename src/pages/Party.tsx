import { useEffect, useRef, useState } from 'react'
import type { PartyMember } from '../types'
import { useCampaignStore } from '../store/campaignStore'
import { usePartyStore, partyOf } from '../store/partyStore'
import { applyPcHp } from '../utils/combat'
import { HpTracker } from '../components/combat/HpTracker'
import { DeathSaveTracker } from '../components/combat/DeathSaveTracker'
import { ConditionBadge } from '../components/conditions/ConditionBadge'
import { ConditionPicker } from '../components/conditions/ConditionPicker'
import { Button, Input, Textarea, Panel, PageHeader, EmptyState } from '../components/ui'
import { useT } from '../i18n'
import { RequirementNotice } from '../components/ui/RequirementNotice'

// Retrato del PC: guardado en el almacén de imágenes existente (fs:save-player-image).
function PcAvatar({ member, onChange }: { member: PartyMember; onChange: (imageStoredId: string) => void }) {
    const t = useT()
    const [url, setUrl] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        let mounted = true
        let objectUrl: string | null = null
        if (member.imageStoredId) {
            window.electron.fs.getPlayerImage(member.imageStoredId).then((data) => {
                if (!mounted || !data) return
                objectUrl = URL.createObjectURL(new Blob([new Uint8Array(data)]))
                setUrl(objectUrl)
            })
        } else {
            // Intentional sync: limpiar el retrato inmediatamente cuando se quita la imagen
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUrl(null)
        }
        return () => {
            mounted = false
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [member.imageStoredId])

    const handleFile = async (file: File | undefined) => {
        if (!file) return
        const id = `pc-${crypto.randomUUID()}`
        await window.electron.fs.savePlayerImage(id, await file.arrayBuffer())
        if (member.imageStoredId) window.electron.fs.deletePlayerImage(member.imageStoredId)
        onChange(id)
    }

    return (
        <button
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 border-danger-primary/40 bg-ui-surface2 hover:border-danger-primary transition-colors flex items-center justify-center"
            title={t('party.changePortrait')}
        >
            {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
            ) : (
                <span className="text-2xl opacity-50">🛡</span>
            )}
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </button>
    )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v?: string) => void; placeholder?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{label}</label>
            <Input value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value.trim() === '' ? undefined : e.target.value)} />
        </div>
    )
}

function NumField({ label, value, onChange, max }: { label: string; value?: number; onChange: (v?: number) => void; max?: number }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{label}</label>
            <Input
                type="number" min={0} max={max}
                value={value ?? ''}
                onChange={(e) => {
                    if (e.target.value === '') return onChange(undefined)
                    const n = Math.max(0, Math.round(+e.target.value || 0))
                    onChange(max !== undefined ? Math.min(max, n) : n)
                }}
            />
        </div>
    )
}

function Party() {
    const t = useT()
    const { campaigns, currentCampaignId } = useCampaignStore()
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const members = usePartyStore((s) => partyOf(s, currentCampaignId))
    const { addMember, updateMember, removeMember } = usePartyStore()

    if (!currentCampaignId || !campaign) {
        return <RequirementNotice title={t('party.noCampaign')} hint={t('party.noCampaignHint')} link="/campaigns" linkLabel={t('nav.campaigns')} />
    }

    const patch = (id: string, updates: Partial<PartyMember>) => updateMember(currentCampaignId, id, updates)

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title={t('party.title')} subtitle={`${campaign.name} — ${t('party.subtitle')}`}>
                <Button variant="primary" onClick={() => addMember(currentCampaignId, { id: crypto.randomUUID(), name: '', level: 1, conditions: [] })}>
                    {t('party.add')}
                </Button>
            </PageHeader>

            {members.length === 0 && <EmptyState title={t('party.empty')} />}

            <div className="grid grid-cols-2 gap-4">
                {members.map((m) => (
                    <Panel key={m.id} className="flex flex-col gap-3">
                        {/* Cabecera con retrato */}
                        <div className="flex items-center gap-3">
                            <PcAvatar member={m} onChange={(imageStoredId) => patch(m.id, { imageStoredId })} />
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={m.name}
                                        placeholder={t('party.name')}
                                        onChange={(e) => patch(m.id, { name: e.target.value })}
                                        className="font-display font-bold"
                                    />
                                    <span className="shrink-0 text-xs font-black text-danger-primary bg-danger-primary/10 border border-danger-primary/30 px-2 py-1 rounded-lg">
                                        {t('party.levelBadge', { level: m.level ?? 1 })}
                                    </span>
                                </div>
                                <p className="text-ui-muted text-xs truncate">
                                    {[m.race, m.characterClass].filter(Boolean).join(' · ') || t('party.noDetails')}
                                    {m.playerName ? ` — ${m.playerName}` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <NumField label={t('party.level')} value={m.level} onChange={(level) => patch(m.id, { level: level && level > 0 ? Math.min(20, level) : 1 })} max={20} />
                            <div className="col-span-3">
                                <TextField label={t('party.player')} value={m.playerName} onChange={(playerName) => patch(m.id, { playerName })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <TextField label={t('party.race')} value={m.race} onChange={(race) => patch(m.id, { race })} />
                            <TextField label={t('party.class')} value={m.characterClass} onChange={(characterClass) => patch(m.id, { characterClass })} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <NumField label={t('party.ac')} value={m.ac} onChange={(ac) => patch(m.id, { ac })} />
                            <NumField label={t('party.pp')} value={m.passivePerception} onChange={(passivePerception) => patch(m.id, { passivePerception })} />
                            <NumField label={t('party.maxHp')} value={m.maxHp} onChange={(maxHp) => patch(m.id, { maxHp, hpCurrent: maxHp !== undefined ? Math.min(m.hpCurrent ?? maxHp, maxHp) : undefined })} />
                        </div>

                        {m.maxHp !== undefined && m.maxHp > 0 && (
                            <HpTracker
                                current={m.hpCurrent ?? m.maxHp}
                                max={m.maxHp}
                                temp={m.tempHp ?? 0}
                                onApply={(delta) => patch(m.id, applyPcHp(m, delta))}
                                onSetTemp={(tempHp) => patch(m.id, { tempHp })}
                            />
                        )}
                        {m.maxHp !== undefined && m.maxHp > 0 && (m.hpCurrent ?? m.maxHp) === 0 && (
                            <DeathSaveTracker
                                deathSaves={m.deathSaves ?? { successes: 0, failures: 0 }}
                                onChange={(deathSaves) => patch(m.id, { deathSaves })}
                            />
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{t('party.conditions')}</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {m.conditions.map((c, i) => (
                                    <ConditionBadge
                                        key={`${c.conditionId}-${i}`}
                                        condition={c}
                                        onUpdate={(updates) => patch(m.id, { conditions: m.conditions.map((x, j) => (j === i ? { ...x, ...updates } : x)) })}
                                        onRemove={() => patch(m.id, { conditions: m.conditions.filter((_, j) => j !== i) })}
                                    />
                                ))}
                                <ConditionPicker applied={m.conditions} onAdd={(c) => patch(m.id, { conditions: [...m.conditions, c] })} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{t('party.notes')}</label>
                            <Textarea rows={2} value={m.notes ?? ''} onChange={(e) => patch(m.id, { notes: e.target.value.trim() === '' ? undefined : e.target.value })} />
                        </div>

                        <div className="flex justify-end">
                            <Button variant="destructive" size="sm" onClick={() => removeMember(currentCampaignId, m.id)}>
                                {t('party.delete')}
                            </Button>
                        </div>
                    </Panel>
                ))}
            </div>
        </div>
    )
}

export default Party
