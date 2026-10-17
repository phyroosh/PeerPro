import { AssetRegistry } from '../assets/registry';
import { AssetManifestEntry } from '../assets/types';
import {
  CharacterDefinition,
  CharacterPartRef,
  ResolvedCharacterPart,
} from './types';
import { CharacterDefinitionSchema } from './schema';

export interface SolverOptions {
  variant?: string;
  partOverrides?: Record<string, string>;
  strictStyle?: boolean;
}

/**
 * Solves character part positions and socket attachments deterministically.
 */
export function solveCharacterParts(
  definition: CharacterDefinition,
  registry: AssetRegistry,
  options: SolverOptions = {}
): ResolvedCharacterPart[] {
  // 1. Validate definition structure
  const parseResult = CharacterDefinitionSchema.safeParse(definition);
  if (!parseResult.success) {
    const msgs = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Invalid CharacterDefinition "${definition.id}": ${msgs}`);
  }

  // 2. Resolve variant overrides
  const effectiveSlots: Record<string, CharacterPartRef> = {
    ...definition.slots,
  };
  let effectiveRootPart: CharacterPartRef = { ...definition.rootPart };

  if (options.variant && options.variant !== 'default') {
    const variantDef = definition.variants?.[options.variant];
    if (!variantDef) {
      const available = definition.variants ? Object.keys(definition.variants).join(', ') : 'none';
      throw new Error(
        `Variant "${options.variant}" does not exist on character "${definition.id}". Available variants: ${available}.`
      );
    }
    for (const [slotKey, assetId] of Object.entries(variantDef.overrides)) {
      if (!assetId) continue;
      if (slotKey === 'rootPart') {
        effectiveRootPart = { ...effectiveRootPart, assetId };
      } else {
        effectiveSlots[slotKey] = {
          ...(effectiveSlots[slotKey] || {}),
          assetId,
        };
      }
    }
  }

  // Direct manual overrides
  if (options.partOverrides) {
    for (const [slotKey, assetId] of Object.entries(options.partOverrides)) {
      if (!assetId) continue;
      if (slotKey === 'rootPart') {
        effectiveRootPart = { ...effectiveRootPart, assetId };
      } else {
        effectiveSlots[slotKey] = {
          ...(effectiveSlots[slotKey] || {}),
          assetId,
        };
      }
    }
  }

  // 3. Resolve Root Part (Body)
  const rootAsset = registry.get(effectiveRootPart.assetId);
  validatePartStyle(rootAsset, definition.styleFamily, options.strictStyle);

  // Root part placement in local space relative to character origin (0, 0)
  // Character anchor is at (0, 0) in local space.
  const rootLocalX = -(rootAsset.anchor.x * rootAsset.dimensions.width) + (effectiveRootPart.offset?.x || 0);
  const rootLocalY = -(rootAsset.anchor.y * rootAsset.dimensions.height) + (effectiveRootPart.offset?.y || 0);

  const resolvedMap = new Map<string, ResolvedCharacterPart>();

  resolvedMap.set('rootPart', {
    slot: 'rootPart',
    asset: rootAsset,
    x: rootLocalX,
    y: rootLocalY,
    width: rootAsset.dimensions.width,
    height: rootAsset.dimensions.height,
    scale: effectiveRootPart.scale ?? 1.0,
    rotation: effectiveRootPart.rotation ?? 0,
    opacity: effectiveRootPart.opacity ?? 1.0,
    zIndex: 0,
  });

  // Calculate body sockets in local space
  const neckSocket = rootAsset.attachmentSockets?.neck;
  let headLocalX = rootLocalX + (rootAsset.dimensions.width / 2) - 120; // fallback center
  let headLocalY = rootLocalY + 50;

  let headAsset: AssetManifestEntry | undefined;

  // 4. Resolve Head Part
  if (effectiveSlots.head) {
    headAsset = registry.get(effectiveSlots.head.assetId);
    validatePartStyle(headAsset, definition.styleFamily, options.strictStyle);
    verifyRequiredSockets(headAsset, rootAsset, 'rootPart');

    const neckSocketOnHead = headAsset.attachmentSockets?.neck_socket;
    if (neckSocket && neckSocketOnHead) {
      // Align neck socket on body with neck_socket on head
      headLocalX = rootLocalX + neckSocket.x - neckSocketOnHead.x + (effectiveSlots.head.offset?.x || 0);
      headLocalY = rootLocalY + neckSocket.y - neckSocketOnHead.y + (effectiveSlots.head.offset?.y || 0);
    } else {
      headLocalX = rootLocalX + (rootAsset.dimensions.width - headAsset.dimensions.width) / 2 + (effectiveSlots.head.offset?.x || 0);
      headLocalY = rootLocalY - headAsset.dimensions.height + 60 + (effectiveSlots.head.offset?.y || 0);
    }

    resolvedMap.set('head', {
      slot: 'head',
      asset: headAsset,
      x: headLocalX,
      y: headLocalY,
      width: headAsset.dimensions.width,
      height: headAsset.dimensions.height,
      scale: effectiveSlots.head.scale ?? 1.0,
      rotation: effectiveSlots.head.rotation ?? 0,
      opacity: effectiveSlots.head.opacity ?? 1.0,
      zIndex: 0,
    });
  }

  // 5. Resolve Head-Attached Parts (Eyes, Mouth, HairFront, HairBack)
  const headAttachedSlots: Array<{ slot: string; socketKey: string; plugKey: string }> = [
    { slot: 'eyes', socketKey: 'eyes', plugKey: 'eyes_socket' },
    { slot: 'mouth', socketKey: 'mouth', plugKey: 'mouth_socket' },
    { slot: 'hairFront', socketKey: 'hair', plugKey: 'hair_socket' },
    { slot: 'hairBack', socketKey: 'hair', plugKey: 'hair_socket' },
  ];

  for (const { slot, socketKey, plugKey } of headAttachedSlots) {
    const partRef = effectiveSlots[slot];
    if (!partRef) continue;

    const childAsset = registry.get(partRef.assetId);
    validatePartStyle(childAsset, definition.styleFamily, options.strictStyle);

    let childX = headLocalX;
    let childY = headLocalY;

    if (headAsset) {
      verifyRequiredSockets(childAsset, headAsset, 'head');
      const parentSocket = headAsset.attachmentSockets?.[socketKey];
      const childPlug = childAsset.attachmentSockets?.[plugKey];

      if (parentSocket && childPlug) {
        childX = headLocalX + parentSocket.x - childPlug.x + (partRef.offset?.x || 0);
        childY = headLocalY + parentSocket.y - childPlug.y + (partRef.offset?.y || 0);
      } else {
        // Fallback: center alignment relative to head
        childX = headLocalX + (headAsset.dimensions.width - childAsset.dimensions.width) / 2 + (partRef.offset?.x || 0);
        childY = headLocalY + (headAsset.dimensions.height - childAsset.dimensions.height) / 2 + (partRef.offset?.y || 0);
      }
    }

    resolvedMap.set(slot, {
      slot,
      asset: childAsset,
      x: childX,
      y: childY,
      width: childAsset.dimensions.width,
      height: childAsset.dimensions.height,
      scale: partRef.scale ?? 1.0,
      rotation: partRef.rotation ?? 0,
      opacity: partRef.opacity ?? 1.0,
      zIndex: 0,
    });
  }

  // 6. Resolve Remaining Slots (clothing, arms, accessories)
  for (const [slotName, partRef] of Object.entries(effectiveSlots)) {
    if (resolvedMap.has(slotName) || !partRef) continue;
    const asset = registry.get(partRef.assetId);
    validatePartStyle(asset, definition.styleFamily, options.strictStyle);

    resolvedMap.set(slotName, {
      slot: slotName,
      asset,
      x: rootLocalX + (partRef.offset?.x || 0),
      y: rootLocalY + (partRef.offset?.y || 0),
      width: asset.dimensions.width,
      height: asset.dimensions.height,
      scale: partRef.scale ?? 1.0,
      rotation: partRef.rotation ?? 0,
      opacity: partRef.opacity ?? 1.0,
      zIndex: 0,
    });
  }

  // 7. Sort by layerOrder back-to-front
  const result: ResolvedCharacterPart[] = [];
  definition.layerOrder.forEach((slotName, index) => {
    const part = resolvedMap.get(slotName);
    if (part) {
      part.zIndex = index + 1;
      result.push(part);
    }
  });

  // Catch any parts not explicitly listed in layerOrder and append on top
  for (const [slotName, part] of resolvedMap.entries()) {
    if (!definition.layerOrder.includes(slotName)) {
      part.zIndex = result.length + 1;
      result.push(part);
    }
  }

  return result;
}

function validatePartStyle(asset: AssetManifestEntry, expectedFamily: string, strict = false): void {
  if (asset.style.family !== expectedFamily) {
    const message = `Style mismatch: Part "${asset.id}" has style family "${asset.style.family}", expected "${expectedFamily}".`;
    if (strict) {
      throw new Error(message);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }
}

function verifyRequiredSockets(child: AssetManifestEntry, parent: AssetManifestEntry, parentSlotName: string): void {
  if (!child.requiredSockets || child.requiredSockets.length === 0) return;

  for (const required of child.requiredSockets) {
    if (!parent.attachmentSockets || !parent.attachmentSockets[required]) {
      const available = parent.attachmentSockets ? Object.keys(parent.attachmentSockets).join(', ') : 'none';
      throw new Error(
        `Incompatible part connection: Part "${child.id}" requires socket "${required}" which is missing on parent "${parent.id}" (${parentSlotName}). Available sockets on parent: ${available}.`
      );
    }
  }
}
