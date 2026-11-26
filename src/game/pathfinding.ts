import type { ZoneId } from '../data/gameData';

/**
 * 2D Grid A* Pathfinding & Physical Obstacle Collision Engine (1024 x 1536 World)
 * Covers all 6 interconnected zones:
 * - interior (3-Room Apothecary Cottage)
 * - outskirts (Fenced Homestead, Gate & Arched Brook Footbridge -> SW Deepwood Trail & East Village Road)
 * - village (4-Way Crossroads Square -> West Homestead, East Deepwood, South Mistfen Bog, North Frostpeak Crags)
 * - whisperwood (Thornveil Deepwood — winding woodland trails, druid arch, mushroom logs, SE pond)
 * - mire (Sunken Mistfen Bog — narrow wooden plank boardwalks & stepping-stone islands over impassable mire)
 * - crag (Frostpeak Crags & Crystal Grotto — switchback trail, steaming pool, narrow chasm rope bridge, grotto)
 */

const WORLD_W = 1024;
const WORLD_H = 1536;
const CELL = 16;
const COLS = WORLD_W / CELL; // 64
const ROWS = WORLD_H / CELL; // 96

export interface DynamicObstacleFlags {
  cozyResidenceNook?: boolean;
  grandShelfHutch?: boolean;
  entranceLanterns?: boolean;
}

type Grid = Uint8Array;

function idx(cx: number, cy: number): number {
  return cy * COLS + cx;
}

function blockRect(g: Grid, x0: number, y0: number, x1: number, y1: number, pad = 10) {
  const c0 = Math.max(0, Math.floor((x0 - pad) / CELL));
  const c1 = Math.min(COLS - 1, Math.floor((x1 + pad) / CELL));
  const r0 = Math.max(0, Math.floor((y0 - pad) / CELL));
  const r1 = Math.min(ROWS - 1, Math.floor((y1 + pad) / CELL));
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      g[idx(c, r)] = 1;
    }
  }
}

function clearRect(g: Grid, x0: number, y0: number, x1: number, y1: number) {
  const c0 = Math.max(0, Math.floor(x0 / CELL));
  const c1 = Math.min(COLS - 1, Math.floor(x1 / CELL));
  const r0 = Math.max(0, Math.floor(y0 / CELL));
  const r1 = Math.min(ROWS - 1, Math.floor(y1 / CELL));
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      g[idx(c, r)] = 0;
    }
  }
}

function blockCircle(g: Grid, cxPx: number, cyPx: number, radiusPx: number, pad = 10) {
  const rSq = (radiusPx + pad) * (radiusPx + pad);
  const c0 = Math.max(0, Math.floor((cxPx - radiusPx - pad) / CELL));
  const c1 = Math.min(COLS - 1, Math.ceil((cxPx + radiusPx + pad) / CELL));
  const r0 = Math.max(0, Math.floor((cyPx - radiusPx - pad) / CELL));
  const r1 = Math.min(ROWS - 1, Math.ceil((cyPx + radiusPx + pad) / CELL));
  for (let r = r0; r <= r1; r++) {
    const py = r * CELL + CELL * 0.5;
    for (let c = c0; c <= c1; c++) {
      const px = c * CELL + CELL * 0.5;
      const dx = px - cxPx;
      const dy = py - cyPx;
      if (dx * dx + dy * dy <= rSq) {
        g[idx(c, r)] = 1;
      }
    }
  }
}

function distToSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy;
  let t = lenSq > 0 ? (wx * vx + wy * vy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return dx * dx + dy * dy;
}

function setCapsule(g: Grid, ax: number, ay: number, bx: number, by: number, halfWidth: number, val: 0 | 1) {
  const hwSq = halfWidth * halfWidth;
  for (let r = 0; r < ROWS; r++) {
    const py = r * CELL + CELL * 0.5;
    for (let c = 0; c < COLS; c++) {
      const px = c * CELL + CELL * 0.5;
      if (distToSegmentSq(px, py, ax, ay, bx, by) <= hwSq) {
        g[idx(c, r)] = val;
      }
    }
  }
}

export class NavMesh {
  private grid: Grid;

  constructor(zone: ZoneId, flags: DynamicObstacleFlags = {}) {
    this.grid = new Uint8Array(COLS * ROWS);
    if (zone === 'interior') {
      this.buildInterior(flags);
    } else if (zone === 'outskirts') {
      this.buildOutskirts(flags);
    } else if (zone === 'village') {
      this.buildVillage();
    } else if (zone === 'whisperwood') {
      this.buildWhisperwood();
    } else if (zone === 'mire') {
      this.buildMire();
    } else if (zone === 'crag') {
      this.buildCrag();
    } else if (zone === 'grove') {
      this.buildGrove();
    } else if (zone === 'sanctum') {
      this.buildSanctum();
    } else {
      this.buildGrotto();
    }
  }

  private buildInterior(flags: DynamicObstacleFlags) {
    const g = this.grid;
    blockRect(g, 0, 0, 1024, 178, 6);
    blockRect(g, 0, 0, 134, 1536, 6);
    blockRect(g, 886, 0, 1024, 1536, 6);
    blockRect(g, 0, 1342, 424, 1536, 6);
    blockRect(g, 588, 1342, 1024, 1536, 6);
    blockRect(g, 420, 1438, 592, 1536, 4);

    blockRect(g, 0, 742, 226, 794, 8);
    blockRect(g, 362, 742, 642, 794, 8);
    blockRect(g, 758, 742, 1024, 794, 8);

    blockRect(g, 480, 0, 524, 346, 8);
    blockRect(g, 480, 470, 524, 794, 8);

    clearRect(g, 240, 720, 348, 816);
    clearRect(g, 656, 720, 744, 816);
    clearRect(g, 456, 362, 548, 454);

    blockRect(g, 132, 175, 240, 294, 8);
    blockRect(g, 240, 175, 398, 272, 8);
    blockCircle(g, 438, 244, 46, 8);
    blockRect(g, 132, 300, 260, 560, 10);
    blockRect(g, 132, 570, 276, 740, 8);
    blockRect(g, 404, 380, 482, 570, 8);
    blockRect(g, 420, 622, 482, 740, 8);

    blockRect(g, 522, 175, 675, 258, 8);
    blockCircle(g, 578, 302, 46, 6);
    blockRect(g, 686, 175, 748, 238, 6);
    blockRect(g, 748, 175, 888, 398, 10);
    blockRect(g, 800, 398, 888, 720, 8);
    blockRect(g, 522, 576, 588, 726, 8);

    if (flags.cozyResidenceNook) {
      blockRect(g, 558, 474, 656, 548, 6);
    }

    blockRect(g, 132, 792, 258, 848, 6);
    blockRect(g, 132, 848, 236, 1344, 10);
    blockRect(g, 132, 1264, 384, 1344, 8);
    blockRect(g, 398, 792, 616, 848, 8);

    blockRect(g, 660, 968, 756, 1246, 10);
    blockRect(g, 660, 1152, 888, 1246, 10);

    if (flags.grandShelfHutch) {
      blockRect(g, 774, 792, 876, 868, 6);
    }
    if (flags.entranceLanterns) {
      blockCircle(g, 388, 1320, 26, 4);
      blockCircle(g, 622, 1320, 26, 4);
    }
  }

  private buildOutskirts(flags: DynamicObstacleFlags) {
    const g = this.grid;
    blockRect(g, 0, 0, 1024, 136, 4);
    blockRect(g, 0, 0, 48, 1380, 4);
    blockRect(g, 984, 0, 1024, 840, 4);
    blockRect(g, 984, 960, 1024, 1536, 4);
    blockRect(g, 220, 1496, 1024, 1536, 4);

    blockRect(g, 0, 235, 98, 425, 6);
    blockRect(g, 0, 518, 150, 742, 6);
    blockRect(g, 902, 132, 1024, 435, 6);
    blockCircle(g, 218, 848, 48, 6);
    blockCircle(g, 965, 625, 52, 6);
    blockCircle(g, 965, 1110, 52, 6);
    blockCircle(g, 858, 1268, 64, 6);
    blockCircle(g, 965, 1445, 56, 6);

    blockRect(g, 330, 96, 712, 366, 10);
    blockRect(g, 558, 356, 648, 396, 6);

    blockRect(g, 104, 122, 336, 168, 8);
    blockRect(g, 700, 122, 902, 168, 8);
    blockRect(g, 100, 128, 132, 580, 8);
    blockRect(g, 876, 128, 908, 580, 8);
    blockRect(g, 100, 542, 462, 582, 8);
    blockRect(g, 546, 542, 908, 582, 8);
    clearRect(g, 474, 512, 534, 605);

    blockRect(g, 162, 286, 282, 352, 8);
    blockRect(g, 152, 388, 348, 522, 6);
    blockCircle(g, 756, 472, 42, 8);
    blockRect(g, 818, 254, 886, 444, 8);

    if (flags.entranceLanterns) {
      blockCircle(g, 426, 544, 24, 4);
      blockCircle(g, 582, 544, 24, 4);
    }

    blockRect(g, 782, 816, 892, 875, 8);
    clearRect(g, 745, 886, 980, 968);

    // Brook water + Arched Wooden Bridge + SW Deepwood Trailhead!
    setCapsule(g, -20, 955, 225, 1145, 96, 1);
    setCapsule(g, 210, 1135, 420, 1335, 88, 1);
    setCapsule(g, 395, 1320, 585, 1545, 96, 1);

    setCapsule(g, 212, 1326, 488, 1166, 36, 0);
    setCapsule(g, 194, 1292, 456, 1136, 11, 1);
    setCapsule(g, 242, 1362, 506, 1202, 11, 1);
    setCapsule(g, 206, 1332, 492, 1164, 22, 0);
    // Walkable SW riverbank & cobblestone path beyond bridge to Thornveil Deepwood portal (above bottom dock!)
    setCapsule(g, 225, 1325, 115, 1285, 58, 0);
    setCapsule(g, 208, 1332, 68, 1465, 48, 0);
  }

  private buildVillage() {
    const g = this.grid;
    // Outer tree border — leaving ALL 4 village roads open (West, East, North, South)!
    blockRect(g, 0, 0, 496, 110, 4);
    blockRect(g, 574, 0, 1024, 110, 4);
    blockRect(g, 0, 0, 44, 686, 4);
    blockRect(g, 0, 814, 44, 1536, 4);
    blockRect(g, 982, 0, 1024, 690, 4);
    blockRect(g, 982, 815, 1024, 1536, 4);
    blockRect(g, 0, 1496, 512, 1536, 4);
    blockRect(g, 648, 1496, 1024, 1536, 4);

    // Top-Left Blacksmith Forge, Tools, Trough & Anvil
    blockRect(g, 32, 64, 494, 378, 8);
    blockRect(g, 32, 220, 255, 430, 8);
    blockRect(g, 156, 446, 228, 522, 8);
    blockCircle(g, 316, 478, 38, 6);
    blockRect(g, 0, 245, 132, 595, 6);

    // West Road Flowerbeds & Signposts
    blockRect(g, 0, 606, 242, 686, 6);
    blockRect(g, 0, 814, 242, 888, 6);
    clearRect(g, 48, 694, 256, 806);

    // Top-Right Bakery Cottage, Tables & Bread Rack
    blockRect(g, 578, 38, 995, 396, 8);
    blockRect(g, 735, 280, 968, 520, 8);
    blockCircle(g, 588, 424, 42, 6);
    blockRect(g, 734, 416, 878, 548, 8);
    blockCircle(g, 838, 608, 48, 6);
    blockRect(g, 898, 320, 1024, 645, 6);
    blockRect(g, 835, 820, 1024, 960, 6);

    // Ensure North Forest Trail (x=504..568), East Road (y=700..805), and South Road (x=520..640) are open!
    clearRect(g, 504, 130, 566, 445);
    clearRect(g, 755, 700, 978, 805);
    clearRect(g, 520, 980, 642, 1492);

    // Central Octagonal Fountain, Planter Boxes & Plaza Benches
    blockCircle(g, 512, 748, 108, 8);
    blockRect(g, 452, 595, 562, 642, 6);
    blockRect(g, 452, 868, 562, 916, 6);
    blockRect(g, 348, 698, 396, 804, 6);
    blockRect(g, 628, 698, 676, 804, 6);
    blockCircle(g, 402, 650, 32, 4);
    blockCircle(g, 618, 650, 32, 4);
    blockCircle(g, 402, 846, 32, 4);
    blockCircle(g, 618, 846, 32, 4);

    // Bottom-Left Beekeeper's Cottage & Fenced Apiary Enclosure
    blockRect(g, 0, 888, 224, 1536, 8);
    blockRect(g, 185, 1052, 492, 1536, 8);
    setCapsule(g, 288, 1026, 488, 1136, 18, 1);

    // Bottom-Right Weaver's Cottage, Loom Porch & Baskets
    blockRect(g, 880, 880, 1024, 1536, 8);
    blockRect(g, 718, 960, 892, 1435, 8);
    blockRect(g, 655, 1418, 1024, 1536, 6);
  }

  private buildWhisperwood() {
    const g = this.grid;
    g.fill(1); // Dense ancient forest, brambles & dark pond blocked by default

    // Carve West Cobblestone Entrance (from Willowmere East Road)
    clearRect(g, 48, 695, 360, 815);
    // Carve Central Sunlit Mossy Clearing
    setCapsule(g, 340, 520, 680, 915, 175, 0);
    // Carve NE Druid Arch Trail
    setCapsule(g, 565, 640, 685, 415, 92, 0);
    setCapsule(g, 685, 415, 812, 248, 64, 0);
    // Carve SW Trail to Outskirts Footbridge
    setCapsule(g, 345, 780, 455, 1075, 82, 0);
    setCapsule(g, 455, 1075, 235, 1285, 72, 0);
    setCapsule(g, 235, 1285, 68, 1475, 64, 0);

    // Re-enforce thickets, fallen glowing logs, boulders & SE forest pool
    blockRect(g, 0, 480, 238, 690, 4);      // West bramble thicket above road
    blockRect(g, 0, 820, 185, 1120, 4);     // West bramble thicket below road
    blockCircle(g, 228, 995, 84, 6);        // SW mossy boulder
    setCapsule(g, 495, 345, 675, 250, 46, 1); // Left glowing mushroom log
    setCapsule(g, 735, 525, 945, 405, 52, 1); // Right glowing mushroom log
    blockRect(g, 795, 540, 1024, 980, 4);   // East bramble & roots
    blockCircle(g, 735, 1235, 210, 6);      // SE dark forest pond
  }

  private buildMire() {
    const g = this.grid;
    g.fill(1); // Deep mire water & swamp trees impassable!

    // 1. North Cobblestone Causeway (from Willowmere South Road)
    clearRect(g, 444, 48, 576, 410);
    // 2. Boardwalk #1
    clearRect(g, 468, 268, 548, 408);
    // 3. Upper Stepping-Stone Island
    setCapsule(g, 448, 436, 564, 436, 56, 0);
    // 4. Boardwalk #2
    clearRect(g, 468, 480, 548, 660);
    // 5. Central Stone Lantern Island
    setCapsule(g, 438, 735, 574, 755, 96, 0);
    blockCircle(g, 506, 726, 28, 4); // Central carved stone lantern
    // 6. West Boardwalk & West Mossy Island
    clearRect(g, 204, 718, 405, 780);
    setCapsule(g, 92, 748, 178, 765, 72, 0);
    // 7. SE Diagonal Boardwalk & Standing-Stone Sanctum Island
    setCapsule(g, 572, 818, 684, 1028, 36, 0);
    setCapsule(g, 615, 1135, 815, 1295, 134, 0);
    // Standing stone pillars on SE island
    blockCircle(g, 614, 1148, 30, 4);
    blockCircle(g, 658, 1248, 30, 4);
    blockCircle(g, 805, 1068, 38, 4);
    blockCircle(g, 805, 1248, 38, 4);
  }

  private buildCrag() {
    const g = this.grid;
    g.fill(1); // Cliff walls, deep chasm, thermal pool & snow pines blocked!

    // 1. South Pine Trailhead (from Willowmere North Forest Trail)
    clearRect(g, 456, 1215, 585, 1492);
    // 2. Lower Switchback Cobble Path (curving around steaming turquoise pool)
    setCapsule(g, 510, 1380, 608, 1215, 66, 0);
    setCapsule(g, 608, 1215, 502, 965, 70, 0);
    setCapsule(g, 425, 985, 565, 965, 60, 0);
    // Re-ensure steaming pool & rocks are solid
    blockCircle(g, 288, 1168, 165, 6);
    blockCircle(g, 348, 958, 58, 4);
    blockCircle(g, 695, 1045, 78, 4);

    // 3. Narrow Wooden Rope Suspension Bridge across Center Chasm
    clearRect(g, 474, 612, 534, 958);

    // 4. Upper Snowy Alpine Plateau & Crystal Grotto Mouth
    setCapsule(g, 225, 445, 795, 465, 122, 0);
    setCapsule(g, 468, 625, 542, 225, 76, 0);
    blockCircle(g, 330, 472, 54, 4);
    blockCircle(g, 728, 595, 52, 4);
  }

  private buildGrove() {
    const g = this.grid;
    g.fill(1); // Dense elder roots, briar hedges & spring water blocked by default

    // 1. South Rune-Stone Archway & Mossy Trail
    clearRect(g, 436, 980, 588, 1465);

    // 2. Central Circular Sunlit Flagstone Terrace ringing the Spring Pool
    setCapsule(g, 512, 748, 512, 748, 252, 0);
    // Block central turquoise lily-pad spring water
    blockCircle(g, 512, 752, 168, 6);

    // 3. West & East Root Alcoves (Silver-Briar Terraces)
    clearRect(g, 110, 712, 295, 790);
    clearRect(g, 728, 712, 915, 790);

    // 4. North Hollowed Elder-Tree Stone Sanctuary Platform
    setCapsule(g, 512, 545, 512, 368, 114, 0);
  }

  private buildSanctum() {
    const g = this.grid;
    g.fill(1); // Deep sunken lotus water & ancient walls impassable

    // 1. NW Mossy Stone Stairway & Causeway Entrance
    setCapsule(g, 205, 145, 325, 385, 66, 0);
    setCapsule(g, 325, 385, 468, 645, 44, 0);

    // 2. Central Circular 4-Brazier Stone Altar Island
    setCapsule(g, 552, 742, 552, 742, 168, 0);
    blockCircle(g, 422, 708, 26, 4);
    blockCircle(g, 585, 628, 26, 4);
    blockCircle(g, 686, 755, 26, 4);
    blockCircle(g, 522, 855, 26, 4);

    // 3. SW Narrow Stone Bridge & Rune-Obelisk Island
    setCapsule(g, 455, 865, 355, 1045, 38, 0);
    setCapsule(g, 298, 1138, 298, 1138, 112, 0);
    blockCircle(g, 278, 1102, 32, 4);

    // 4. SE Narrow Stone Bridge & Sunken Pillar Shrine Terrace
    setCapsule(g, 635, 885, 745, 1085, 38, 0);
    setCapsule(g, 735, 1195, 875, 1265, 132, 0);
    blockCircle(g, 642, 1165, 28, 4);
    blockCircle(g, 895, 1055, 28, 4);
    blockCircle(g, 782, 1345, 30, 4);
  }

  private buildGrotto() {
    const g = this.grid;
    g.fill(1); // Cavern walls, thermal pools, starlight river chasm & giant crystal clusters blocked

    // 1. South Cavern Stone Archway & Winding Slate Path
    clearRect(g, 434, 1230, 560, 1475);
    setCapsule(g, 496, 1265, 452, 1115, 62, 0);
    setCapsule(g, 452, 1115, 528, 945, 64, 0);
    setCapsule(g, 528, 945, 496, 815, 62, 0);

    // 2. Narrow Carved Stone Arch Bridge over Subterranean Starlight Stream
    clearRect(g, 448, 560, 544, 825);

    // 3. Northern Circular Crystal Cathedral Sanctuary Platform
    setCapsule(g, 345, 395, 658, 395, 148, 0);
    setCapsule(g, 502, 290, 502, 562, 132, 0);
  }

  public isWalkableWorld(wx: number, wy: number): boolean {
    const c = Math.floor(wx / CELL);
    const r = Math.floor(wy / CELL);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
    return this.grid[idx(c, r)] === 0;
  }

  public findNearestWalkable(wx: number, wy: number): { x: number; y: number } {
    const startC = Math.max(0, Math.min(COLS - 1, Math.floor(wx / CELL)));
    const startR = Math.max(0, Math.min(ROWS - 1, Math.floor(wy / CELL)));
    if (this.grid[idx(startC, startR)] === 0) {
      return { x: wx, y: wy };
    }

    for (let rad = 1; rad <= 32; rad++) {
      let bestDist = Infinity;
      let bestPt: { x: number; y: number } | null = null;
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
          const nc = startC + dc;
          const nr = startR + dr;
          if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
          if (this.grid[idx(nc, nr)] === 0) {
            const px = nc * CELL + CELL * 0.5;
            const py = nr * CELL + CELL * 0.5;
            const d = (px - wx) * (px - wx) + (py - wy) * (py - wy);
            if (d < bestDist) {
              bestDist = d;
              bestPt = { x: px, y: py };
            }
          }
        }
      }
      if (bestPt) return bestPt;
    }
    return { x: 510, y: 750 };
  }

  private hasLineOfSight(ax: number, ay: number, bx: number, by: number): boolean {
    const dist = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(2, Math.ceil(dist / 6));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = ax + (bx - ax) * t;
      const py = ay + (by - ay) * t;
      if (
        !this.isWalkableWorld(px, py) ||
        !this.isWalkableWorld(px - 5, py) ||
        !this.isWalkableWorld(px + 5, py) ||
        !this.isWalkableWorld(px, py - 5) ||
        !this.isWalkableWorld(px, py + 5)
      ) {
        return false;
      }
    }
    return true;
  }

  public findPath(fromX: number, fromY: number, rawToX: number, rawToY: number): { x: number; y: number }[] {
    const safeStart = this.findNearestWalkable(fromX, fromY);
    const safeGoal = this.findNearestWalkable(rawToX, rawToY);

    if (this.hasLineOfSight(safeStart.x, safeStart.y, safeGoal.x, safeGoal.y)) {
      return [safeGoal];
    }

    const sc = Math.max(0, Math.min(COLS - 1, Math.floor(safeStart.x / CELL)));
    const sr = Math.max(0, Math.min(ROWS - 1, Math.floor(safeStart.y / CELL)));
    const gc = Math.max(0, Math.min(COLS - 1, Math.floor(safeGoal.x / CELL)));
    const gr = Math.max(0, Math.min(ROWS - 1, Math.floor(safeGoal.y / CELL)));

    const startId = idx(sc, sr);
    const goalId = idx(gc, gr);
    if (startId === goalId) return [safeGoal];

    const total = COLS * ROWS;
    const gScore = new Float32Array(total);
    gScore.fill(Infinity);
    const fScore = new Float32Array(total);
    fScore.fill(Infinity);
    const cameFrom = new Int32Array(total);
    cameFrom.fill(-1);
    const closed = new Uint8Array(total);
    const inOpen = new Uint8Array(total);
    const open: number[] = [startId];

    gScore[startId] = 0;
    fScore[startId] = Math.hypot(gc - sc, gr - sr);
    inOpen[startId] = 1;

    const dirs = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, 1.4142],
      [1, -1, 1.4142],
      [-1, 1, 1.4142],
      [-1, -1, 1.4142]
    ];

    let reached = false;
    while (open.length > 0) {
      let bestIdxInOpen = 0;
      let bestF = fScore[open[0]];
      for (let i = 1; i < open.length; i++) {
        const f = fScore[open[i]];
        if (f < bestF) {
          bestF = f;
          bestIdxInOpen = i;
        }
      }

      const cur = open[bestIdxInOpen];
      open[bestIdxInOpen] = open[open.length - 1];
      open.pop();
      inOpen[cur] = 0;

      if (cur === goalId) {
        reached = true;
        break;
      }
      closed[cur] = 1;

      const cc = cur % COLS;
      const cr = Math.floor(cur / COLS);

      for (const [dc, dr, cost] of dirs) {
        const nc = cc + dc;
        const nr = cr + dr;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
        const nid = idx(nc, nr);
        if (closed[nid] || this.grid[nid] !== 0) continue;

        if (dc !== 0 && dr !== 0) {
          if (this.grid[idx(cc + dc, cr)] !== 0 || this.grid[idx(cc, cr + dr)] !== 0) {
            continue;
          }
        }

        const tentativeG = gScore[cur] + cost;
        if (tentativeG < gScore[nid]) {
          cameFrom[nid] = cur;
          gScore[nid] = tentativeG;
          fScore[nid] = tentativeG + Math.hypot(gc - nc, gr - nr);
          if (!inOpen[nid]) {
            open.push(nid);
            inOpen[nid] = 1;
          }
        }
      }
    }

    if (!reached) {
      let closestId = startId;
      let closestDist = Infinity;
      for (let i = 0; i < total; i++) {
        if (closed[i] && i !== startId) {
          const ic = i % COLS;
          const ir = Math.floor(i / COLS);
          const d = (ic - gc) * (ic - gc) + (ir - gr) * (ir - gr);
          if (d < closestDist) {
            closestDist = d;
            closestId = i;
          }
        }
      }
      if (closestId === startId) return [];
      return this.reconstructAndSmooth(cameFrom, closestId, safeStart, {
        x: (closestId % COLS) * CELL + CELL * 0.5,
        y: Math.floor(closestId / COLS) * CELL + CELL * 0.5
      });
    }

    return this.reconstructAndSmooth(cameFrom, goalId, safeStart, safeGoal);
  }

  private reconstructAndSmooth(
    cameFrom: Int32Array,
    endId: number,
    startPt: { x: number; y: number },
    endPt: { x: number; y: number }
  ): { x: number; y: number }[] {
    const rawPts: { x: number; y: number }[] = [endPt];
    let cur = cameFrom[endId];
    while (cur !== -1 && cameFrom[cur] !== -1) {
      const c = cur % COLS;
      const r = Math.floor(cur / COLS);
      rawPts.push({ x: c * CELL + CELL * 0.5, y: r * CELL + CELL * 0.5 });
      cur = cameFrom[cur];
    }
    rawPts.push(startPt);
    rawPts.reverse();

    const smooth: { x: number; y: number }[] = [];
    let anchor = 0;
    while (anchor < rawPts.length - 1) {
      let furthest = anchor + 1;
      for (let probe = rawPts.length - 1; probe > anchor + 1; probe--) {
        if (this.hasLineOfSight(rawPts[anchor].x, rawPts[anchor].y, rawPts[probe].x, rawPts[probe].y)) {
          furthest = probe;
          break;
        }
      }
      smooth.push(rawPts[furthest]);
      anchor = furthest;
    }
    return smooth;
  }
}
