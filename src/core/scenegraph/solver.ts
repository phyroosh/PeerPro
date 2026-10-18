import { defaultAssetRegistry, AssetRegistry } from '../assets/registry';
import {
  BoundingBox2D,
  ResolvedSceneGraphNode,
  SceneGraphDefinition,
  SceneGraphNode,
  SceneGraphReport,
  SpatialConstraint,
} from './types';

/**
 * Pure mathematical spatial constraint solver and forward kinematics engine for PeerPro.
 * Evaluates scene graph hierarchies and constraints in topological order without side-effects.
 */
export function solveSceneGraph(
  sceneGraph: SceneGraphDefinition,
  options: { registry?: AssetRegistry } = {}
): SceneGraphReport {
  const registry = options.registry || defaultAssetRegistry;
  const nodes = sceneGraph.nodes;
  const nodeMap = new Map<string, SceneGraphNode>();
  const conflicts: Array<{ nodeIds: string[]; message: string }> = [];
  const warnings: string[] = [];

  // 1. Index nodes and check for duplicate IDs
  for (const node of nodes) {
    if (nodeMap.has(node.id)) {
      conflicts.push({
        nodeIds: [node.id],
        message: `Duplicate entity ID detected: "${node.id}". Node IDs must be unique within a scene graph.`,
      });
    }
    nodeMap.set(node.id, node);
  }

  // 2. Build dependency graph for topological sorting
  // An edge A -> B means A depends on B (B must be resolved before A)
  const HARD_POSITION_CONSTRAINTS = new Set([
    'attach_socket',
    'place_on_surface',
    'align',
    'relative_offset',
  ]);

  const dependencies = new Map<string, Set<string>>();
  for (const node of nodes) {
    const deps = new Set<string>();
    if (node.parentId) {
      deps.add(node.parentId);
    }
    if (node.constraints) {
      for (const c of node.constraints) {
        if (c.targetId && c.targetId !== node.id && HARD_POSITION_CONSTRAINTS.has(c.type)) {
          deps.add(c.targetId);
        }
      }
    }
    dependencies.set(node.id, deps);
  }

  // 3. Cycle Detection and Topological Sort (Kahn's algorithm / DFS)
  const cyclesDetected: string[][] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const resolutionOrder: string[] = [];

  function detectCycleAndSort(nodeId: string, path: string[]): boolean {
    if (visiting.has(nodeId)) {
      const cycleStartIdx = path.indexOf(nodeId);
      const cycle = path.slice(cycleStartIdx).concat(nodeId);
      cyclesDetected.push(cycle);
      conflicts.push({
        nodeIds: cycle,
        message: `Circular spatial dependency detected: ${cycle.join(' -> ')}`,
      });
      return false;
    }
    if (visited.has(nodeId)) {
      return true;
    }

    visiting.add(nodeId);
    const currentPath = path.concat(nodeId);
    const nodeDeps = dependencies.get(nodeId) || new Set<string>();

    for (const depId of nodeDeps) {
      if (nodeMap.has(depId)) {
        detectCycleAndSort(depId, currentPath);
      } else {
        warnings.push(`Node "${nodeId}" references unknown dependency "${depId}".`);
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    resolutionOrder.push(nodeId);
    return true;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      detectCycleAndSort(node.id, []);
    }
  }

  const resolvedNodes: Record<string, ResolvedSceneGraphNode> = {};

  // 4. Forward Kinematics & Constraint Solving
  for (const nodeId of resolutionOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    // Resolve base dimensions and anchor
    let baseWidth = node.visualBounds?.width ?? 100;
    let baseHeight = node.visualBounds?.height ?? 100;
    let baseAnchorX = node.localTransform?.anchor?.x ?? 0.5;
    let baseAnchorY = node.localTransform?.anchor?.y ?? 1.0;
    let assetSockets: Record<string, { x: number; y: number }> | undefined;

    if (node.assetId && registry.has(node.assetId)) {
      const asset = registry.get(node.assetId);
      if (!node.visualBounds) {
        baseWidth = asset.dimensions.width;
        baseHeight = asset.dimensions.height;
      }
      if (node.localTransform?.anchor === undefined) {
        baseAnchorX = asset.anchor.x;
        baseAnchorY = asset.anchor.y;
      }
      if (asset.attachmentSockets) {
        assetSockets = asset.attachmentSockets;
      }
    } else if (node.characterId) {
      if (!node.visualBounds) {
        baseWidth = 300;
        baseHeight = 600;
      }
      if (node.localTransform?.anchor === undefined) {
        baseAnchorX = 0.5;
        baseAnchorY = 1.0;
      }
    }

    // Combine local transforms with parent transforms
    const parent = node.parentId ? resolvedNodes[node.parentId] : undefined;

    const rawScale = node.localTransform?.scale ?? 1.0;
    const localScaleX = Array.isArray(rawScale) ? rawScale[0] : rawScale;
    const localScaleY = Array.isArray(rawScale) ? rawScale[1] : rawScale;
    const localRot = node.localTransform?.rotation ?? 0;
    const localFlipX = node.localTransform?.flipX ?? false;
    const localOpacity = node.localTransform?.opacity ?? 1.0;
    const localX = node.localTransform?.x ?? 0;
    const localY = node.localTransform?.y ?? 0;

    let worldX = localX;
    let worldY = localY;
    let worldScaleX = localScaleX;
    let worldScaleY = localScaleY;
    let worldRotation = localRot;
    let worldFlipX = localFlipX;
    let worldOpacity = localOpacity;
    let effectiveDepth = node.depth ?? 1.0;
    let effectiveOrder = node.order ?? 10;

    if (parent) {
      effectiveDepth = node.depth ?? parent.effectiveDepth;
      effectiveOrder = node.order ?? (parent.effectiveOrder + 1);
      worldScaleX = parent.worldTransform.scaleX * localScaleX;
      worldScaleY = parent.worldTransform.scaleY * localScaleY;
      worldRotation = parent.worldTransform.rotation + localRot;
      worldFlipX = parent.worldTransform.flipX ? !localFlipX : localFlipX;
      worldOpacity = parent.worldTransform.opacity * localOpacity;

      // Position relative to parent origin
      const flipSign = parent.worldTransform.flipX ? -1 : 1;
      worldX = parent.worldTransform.x + localX * flipSign * parent.worldTransform.scaleX;
      worldY = parent.worldTransform.y + localY * parent.worldTransform.scaleY;
    }

    // Compute bounding box function
    function computeBounds(x: number, y: number, sx: number, sy: number, ax: number, ay: number): BoundingBox2D {
      const w = baseWidth * Math.abs(sx);
      const h = baseHeight * Math.abs(sy);
      const px = ax * w;
      const py = ay * h;
      return {
        x: x - px,
        y: y - py,
        width: w,
        height: h,
      };
    }

    let currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);

    // 5. Evaluate Constraints in Priority Order
    const appliedConstraints: string[] = [];
    const unresolvedConstraints: Array<{ constraint: SpatialConstraint; reason: string }> = [];

    const sortedConstraints = (node.constraints || []).slice().sort((a, b) => (b.priority ?? 10) - (a.priority ?? 10));

    for (const constraint of sortedConstraints) {
      const target = constraint.targetId ? resolvedNodes[constraint.targetId] : parent;

      switch (constraint.type) {
        case 'attach_socket': {
          if (!target) {
            unresolvedConstraints.push({
              constraint,
              reason: `Target entity "${constraint.targetId || node.parentId}" not resolved for attach_socket.`,
            });
            break;
          }

          const socketName = constraint.targetSocket || 'neck';
          let socketCoords: { x: number; y: number } | undefined;

          // Check target asset sockets
          if (target.assetId && registry.has(target.assetId)) {
            const tAsset = registry.get(target.assetId);
            socketCoords = tAsset.attachmentSockets?.[socketName];
          }
          // Or customData sockets
          if (!socketCoords && target.customData?.sockets?.[socketName]) {
            socketCoords = target.customData.sockets[socketName];
          }

          if (!socketCoords) {
            unresolvedConstraints.push({
              constraint,
              reason: `Socket "${socketName}" not found on target entity "${target.id}".`,
            });
            break;
          }

          // Calculate world position of target socket
          const tAssetW = target.visualBounds?.width ?? 100;
          const tAssetH = target.visualBounds?.height ?? 100;
          const tPivotX = target.worldTransform.anchor.x * tAssetW;
          const tPivotY = target.worldTransform.anchor.y * tAssetH;
          const tFlipSign = target.worldTransform.flipX ? -1 : 1;

          const socketWorldX =
            target.worldTransform.x +
            (socketCoords.x - tPivotX) * tFlipSign * target.worldTransform.scaleX;
          const socketWorldY =
            target.worldTransform.y +
            (socketCoords.y - tPivotY) * target.worldTransform.scaleY;

          worldX = socketWorldX + (constraint.offset?.x ?? 0);
          worldY = socketWorldY + (constraint.offset?.y ?? 0);
          currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
          appliedConstraints.push(`attach_socket:${socketName}`);
          break;
        }

        case 'place_on_surface': {
          let surfaceY: number;
          if (target) {
            // Top surface of target entity
            surfaceY = target.worldBounds.y;
          } else {
            surfaceY = sceneGraph.groundY ?? 880;
          }

          // Bottom of this node should sit on surfaceY
          const bottomOffset = (1.0 - baseAnchorY) * currentBounds.height;
          worldY = surfaceY - bottomOffset + (constraint.offset?.y ?? 0);
          if (constraint.offset?.x) {
            worldX += constraint.offset.x;
          }

          currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
          appliedConstraints.push(`place_on_surface:${target ? target.id : 'ground'}`);
          break;
        }

        case 'align': {
          if (!target) {
            unresolvedConstraints.push({
              constraint,
              reason: `Target entity "${constraint.targetId || node.parentId}" not resolved for alignment.`,
            });
            break;
          }

          const alignment = constraint.alignment || 'center';
          const offX = constraint.offset?.x ?? 0;
          const offY = constraint.offset?.y ?? 0;
          const pivotOffsetX = baseAnchorX * currentBounds.width;
          const pivotOffsetY = baseAnchorY * currentBounds.height;

          if (alignment === 'left') {
            worldX = target.worldBounds.x + pivotOffsetX + offX;
          } else if (alignment === 'center') {
            worldX = target.worldBounds.x + target.worldBounds.width / 2 - currentBounds.width / 2 + pivotOffsetX + offX;
          } else if (alignment === 'right') {
            worldX = target.worldBounds.x + target.worldBounds.width - currentBounds.width + pivotOffsetX + offX;
          } else if (alignment === 'top') {
            worldY = target.worldBounds.y + pivotOffsetY + offY;
          } else if (alignment === 'bottom') {
            worldY = target.worldBounds.y + target.worldBounds.height - currentBounds.height + pivotOffsetY + offY;
          }

          currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
          appliedConstraints.push(`align:${alignment}`);
          break;
        }

        case 'relative_offset': {
          if (!target) {
            unresolvedConstraints.push({
              constraint,
              reason: `Target entity "${constraint.targetId || node.parentId}" not resolved for relative_offset.`,
            });
            break;
          }

          worldX = target.worldTransform.x + (constraint.offset?.x ?? 0);
          worldY = target.worldTransform.y + (constraint.offset?.y ?? 0);
          currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
          appliedConstraints.push(`relative_offset:${target.id}`);
          break;
        }

        case 'safe_region': {
          const region = constraint.region || {
            minX: 40,
            minY: 40,
            maxX: (sceneGraph.canvas?.width || 1920) - 40,
            maxY: (sceneGraph.canvas?.height || 1080) - 40,
          };

          let shiftX = 0;
          let shiftY = 0;

          if (currentBounds.x < region.minX) {
            shiftX = region.minX - currentBounds.x;
          } else if (currentBounds.x + currentBounds.width > region.maxX) {
            shiftX = region.maxX - (currentBounds.x + currentBounds.width);
          }

          if (currentBounds.y < region.minY) {
            shiftY = region.minY - currentBounds.y;
          } else if (currentBounds.y + currentBounds.height > region.maxY) {
            shiftY = region.maxY - (currentBounds.y + currentBounds.height);
          }

          if (shiftX !== 0 || shiftY !== 0) {
            worldX += shiftX;
            worldY += shiftY;
            currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
            appliedConstraints.push(`safe_region:clamped(${shiftX},${shiftY})`);
          } else {
            appliedConstraints.push('safe_region:within_bounds');
          }
          break;
        }

        case 'layer_relative': {
          if (!target) {
            unresolvedConstraints.push({
              constraint,
              reason: `Target entity "${constraint.targetId || node.parentId}" not resolved for layer_relative.`,
            });
            break;
          }

          if (constraint.relation === 'front_of') {
            effectiveOrder = Math.max(effectiveOrder, target.effectiveOrder + 5);
            appliedConstraints.push(`layer_relative:front_of(${target.id})`);
          } else if (constraint.relation === 'behind') {
            effectiveOrder = Math.min(effectiveOrder, Math.max(1, target.effectiveOrder - 5));
            appliedConstraints.push(`layer_relative:behind(${target.id})`);
          }
          break;
        }

        case 'look_toward': {
          if (!target) {
            unresolvedConstraints.push({
              constraint,
              reason: `Target entity "${constraint.targetId}" not resolved for look_toward.`,
            });
            break;
          }

          const dx = target.worldTransform.x - worldX;
          // Facing rule: if target is to the left (dx < 0), face left (flipX = true)
          // if target is to the right (dx > 0), face right (flipX = false)
          worldFlipX = dx < 0;
          currentBounds = computeBounds(worldX, worldY, worldScaleX, worldScaleY, baseAnchorX, baseAnchorY);
          appliedConstraints.push(`look_toward:${target.id}:${worldFlipX ? 'left' : 'right'}`);
          break;
        }
      }
    }

    resolvedNodes[nodeId] = {
      ...node,
      worldTransform: {
        x: Math.round(worldX * 100) / 100,
        y: Math.round(worldY * 100) / 100,
        scaleX: Math.round(worldScaleX * 1000) / 1000,
        scaleY: Math.round(worldScaleY * 1000) / 1000,
        rotation: Math.round(worldRotation * 10) / 10,
        flipX: worldFlipX,
        opacity: Math.round(worldOpacity * 100) / 100,
        anchor: {
          x: baseAnchorX,
          y: baseAnchorY,
        },
      },
      worldBounds: {
        x: Math.round(currentBounds.x * 10) / 10,
        y: Math.round(currentBounds.y * 10) / 10,
        width: Math.round(currentBounds.width * 10) / 10,
        height: Math.round(currentBounds.height * 10) / 10,
      },
      effectiveDepth,
      effectiveOrder,
      appliedConstraints,
      unresolvedConstraints,
    };
  }

  // 5b. Pass 2: Evaluate orientation (look_toward) and relative layering across all resolved nodes
  for (const nodeId of resolutionOrder) {
    const rNode = resolvedNodes[nodeId];
    if (!rNode || !rNode.constraints) continue;

    for (const constraint of rNode.constraints) {
      if (constraint.type === 'look_toward' && constraint.targetId) {
        const target = resolvedNodes[constraint.targetId];
        if (target) {
          const dx = target.worldTransform.x - rNode.worldTransform.x;
          rNode.worldTransform.flipX = dx < 0;
          if (!rNode.appliedConstraints.some((c) => c.startsWith('look_toward:'))) {
            rNode.appliedConstraints.push(`look_toward:${target.id}:${dx < 0 ? 'left' : 'right'}`);
          }
          rNode.unresolvedConstraints = rNode.unresolvedConstraints.filter(
            (u) => u.constraint !== constraint
          );
        }
      } else if (constraint.type === 'layer_relative' && constraint.targetId) {
        const target = resolvedNodes[constraint.targetId];
        if (target) {
          if (constraint.relation === 'front_of') {
            rNode.effectiveOrder = Math.max(rNode.effectiveOrder, target.effectiveOrder + 5);
          } else if (constraint.relation === 'behind') {
            rNode.effectiveOrder = Math.min(
              rNode.effectiveOrder,
              Math.max(1, target.effectiveOrder - 5)
            );
          }
          if (!rNode.appliedConstraints.some((c) => c.startsWith('layer_relative:'))) {
            rNode.appliedConstraints.push(`layer_relative:${constraint.relation}(${target.id})`);
          }
          rNode.unresolvedConstraints = rNode.unresolvedConstraints.filter(
            (u) => u.constraint !== constraint
          );
        }
      }
    }
  }

  // 6. Build hierarchy tree representation for diagnostics
  const hierarchyTree: Array<{
    id: string;
    name?: string;
    kind: string;
    parentId?: string;
    children: string[];
  }> = [];

  for (const node of nodes) {
    const children = nodes.filter((n) => n.parentId === node.id).map((n) => n.id);
    hierarchyTree.push({
      id: node.id,
      name: node.name,
      kind: node.kind,
      parentId: node.parentId,
      children,
    });
  }

  return {
    valid: conflicts.length === 0,
    totalNodes: nodes.length,
    resolvedNodes,
    hierarchyTree,
    resolutionOrder,
    cyclesDetected,
    conflicts,
    warnings,
  };
}
