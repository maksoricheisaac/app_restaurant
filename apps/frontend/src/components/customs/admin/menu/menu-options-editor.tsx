'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  useItemOptions,
  useOptionMutations,
  type MenuOptionGroup,
} from '@/hooks/api/useMenuOptions';

/**
 * Éditeur des groupes d'options / suppléments d'un plat (mode édition uniquement,
 * le plat doit déjà exister pour porter un menuItemId). Chaque changement est
 * persisté immédiatement via l'API et rafraîchi par invalidation de la query.
 */
export function MenuOptionsEditor({ menuItemId }: { menuItemId: string }) {
  const { data: groups = [], isLoading } = useItemOptions(menuItemId);
  const m = useOptionMutations(menuItemId);
  const [newGroupName, setNewGroupName] = useState('');

  const addGroup = () => {
    const name = newGroupName.trim();
    if (name.length < 2) return;
    m.createGroup.mutate(
      { name, required: false, minSelect: 0, maxSelect: 1 },
      {
        onSuccess: () => setNewGroupName(''),
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : 'Erreur'),
      },
    );
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold">Options & suppléments</h3>
        <p className="text-sm text-muted-foreground">
          Ex. « Cuisson » (choix unique obligatoire), « Suppléments » (choix
          multiples avec prix). Le prix affiché au client s&apos;ajuste
          automatiquement.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} m={m} />
          ))}
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Aucun groupe d&apos;options pour ce plat.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addGroup();
            }
          }}
          placeholder="Nom d'un nouveau groupe (ex. Cuisson)"
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addGroup}
          disabled={m.createGroup.isPending || newGroupName.trim().length < 2}
        >
          <Plus className="h-4 w-4 mr-1" /> Groupe
        </Button>
      </div>
    </div>
  );
}

function GroupCard({
  group,
  m,
}: {
  group: MenuOptionGroup;
  m: ReturnType<typeof useOptionMutations>;
}) {
  const [newOption, setNewOption] = useState({ name: '', priceDelta: '' });

  const patchGroup = (data: Record<string, unknown>) =>
    m.updateGroup.mutate({ id: group.id, data });

  const addOption = () => {
    const name = newOption.name.trim();
    if (name.length < 1) return;
    m.createOption.mutate(
      {
        groupId: group.id,
        name,
        priceDelta: Number(newOption.priceDelta) || 0,
      },
      { onSuccess: () => setNewOption({ name: '', priceDelta: '' }) },
    );
  };

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      {/* Group header */}
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          defaultValue={group.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== group.name) patchGroup({ name: v });
          }}
          className="h-8 flex-1 font-medium"
          aria-label="Nom du groupe"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => m.deleteGroup.mutate(group.id)}
          aria-label="Supprimer le groupe"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Group constraints */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <Switch
            checked={group.required}
            onCheckedChange={(v) =>
              patchGroup({ required: v, minSelect: v ? Math.max(1, group.minSelect) : group.minSelect })
            }
          />
          Obligatoire
        </label>
        <label className="flex items-center gap-1.5">
          Min
          <Input
            type="number"
            min={0}
            defaultValue={group.minSelect}
            onBlur={(e) => patchGroup({ minSelect: Number(e.target.value) || 0 })}
            className="h-8 w-16"
            aria-label="Minimum de choix"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Max
          <Input
            type="number"
            min={0}
            defaultValue={group.maxSelect}
            onBlur={(e) => patchGroup({ maxSelect: Number(e.target.value) || 0 })}
            className="h-8 w-16"
            aria-label="Maximum de choix (0 = illimité)"
          />
          <span className="text-xs text-muted-foreground">(0 = illimité)</span>
        </label>
      </div>

      {/* Options */}
      <div className="space-y-2 pl-6">
        {group.options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <Input
              defaultValue={opt.name}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== opt.name)
                  m.updateOption.mutate({ id: opt.id, data: { name: v } });
              }}
              className="h-8 flex-1"
              aria-label="Nom de l'option"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">+</span>
              <Input
                type="number"
                step={50}
                defaultValue={Number(opt.priceDelta)}
                onBlur={(e) =>
                  m.updateOption.mutate({
                    id: opt.id,
                    data: { priceDelta: Number(e.target.value) || 0 },
                  })
                }
                className="h-8 w-24"
                aria-label="Prix supplémentaire"
              />
            </div>
            <Switch
              checked={opt.available}
              onCheckedChange={(v) =>
                m.updateOption.mutate({ id: opt.id, data: { available: v } })
              }
              aria-label="Disponible"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => m.deleteOption.mutate(opt.id)}
              aria-label="Supprimer l'option"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add option row */}
        <div className="flex items-center gap-2">
          <Input
            value={newOption.name}
            onChange={(e) =>
              setNewOption((s) => ({ ...s, name: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addOption();
              }
            }}
            placeholder="Nouvelle option"
            className="h-8 flex-1"
          />
          <Input
            type="number"
            step={50}
            value={newOption.priceDelta}
            onChange={(e) =>
              setNewOption((s) => ({ ...s, priceDelta: e.target.value }))
            }
            placeholder="+0"
            className="h-8 w-24"
            aria-label="Prix supplémentaire"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={addOption}
            disabled={m.createOption.isPending}
            aria-label="Ajouter l'option"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
