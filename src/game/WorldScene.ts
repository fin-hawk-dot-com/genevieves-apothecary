import Phaser from 'phaser';
import { ITEMS, QUESTS, VILLAGERS, type ToolUpgradeId, type ZoneId } from '../data/gameData';
import { gameStore } from '../state/gameStore';
import { sound } from '../audio/soundEngine';
import { NavMesh } from './pathfinding';

interface InteractTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  onReach: () => void;
}

interface ForageSpot {
  id: string;
  itemId: string;
  x: number;
  y: number;
  requiredToolId?: ToolUpgradeId;
}

interface VillagerBadgeRefs {
  container: Phaser.GameObjects.Container;
  badgeImg: Phaser.GameObjects.Image;
  halo: Phaser.GameObjects.Image;
  checkDot: Phaser.GameObjects.Image;
}

interface HazardEntity {
  container: Phaser.GameObjects.Container;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  speed: number;
  phase: number;
  label: string;
}

const OUTSKIRTS_FORAGE: ForageSpot[] = [
  { id: 'out_cham_1', itemId: 'raw_chamomile', x: 355, y: 695 },
  { id: 'out_cham_2', itemId: 'raw_chamomile', x: 645, y: 660 },
  { id: 'out_mint_1', itemId: 'raw_mint', x: 292, y: 958 },
  { id: 'out_mint_2', itemId: 'raw_mint', x: 565, y: 1295 },
  { id: 'out_willow_1', itemId: 'raw_willowbark', x: 165, y: 740 },
  { id: 'out_ginger_1', itemId: 'raw_ginger', x: 815, y: 710 },
  { id: 'out_resin_1', itemId: 'raw_resin', x: 855, y: 625 },
  { id: 'out_lav_1', itemId: 'raw_lavender', x: 740, y: 1115 },
  { id: 'out_lav_2', itemId: 'raw_lavender', x: 458, y: 920 },
  { id: 'out_moon_1', itemId: 'raw_moonpetal', x: 334, y: 1112 },
  { id: 'out_moon_2', itemId: 'raw_moonpetal', x: 318, y: 1260 }
];

const VILLAGE_FORAGE: ForageSpot[] = [
  { id: 'vil_cham_1', itemId: 'raw_chamomile', x: 528, y: 1125 },
  { id: 'vil_lav_1', itemId: 'raw_lavender', x: 748, y: 725 }
];

const WHISPERWOOD_FORAGE: ForageSpot[] = [
  { id: 'ww_ghost_1', itemId: 'raw_ghostcap', x: 615, y: 395 },
  { id: 'ww_ghost_2', itemId: 'raw_ghostcap', x: 755, y: 295 },
  { id: 'ww_ghost_3', itemId: 'raw_ghostcap', x: 408, y: 1080 },
  { id: 'ww_resin_1', itemId: 'raw_resin', x: 465, y: 585 },
  { id: 'ww_willow_1', itemId: 'raw_willowbark', x: 565, y: 865 }
];

const MIRE_FORAGE: ForageSpot[] = [
  { id: 'mire_sundew_1', itemId: 'raw_sundew', x: 138, y: 748 },
  { id: 'mire_sundew_2', itemId: 'raw_sundew', x: 685, y: 1095 },
  { id: 'mire_sundew_3', itemId: 'raw_sundew', x: 842, y: 1185 },
  { id: 'mire_moon_1', itemId: 'raw_moonpetal', x: 468, y: 432 },
  { id: 'mire_moon_2', itemId: 'raw_moonpetal', x: 560, y: 742 }
];

const CRAG_FORAGE: ForageSpot[] = [
  { id: 'crag_frost_1', itemId: 'raw_frostbloom', x: 415, y: 365 },
  { id: 'crag_frost_2', itemId: 'raw_frostbloom', x: 285, y: 415 },
  { id: 'crag_frost_3', itemId: 'raw_frostbloom', x: 715, y: 425 },
  { id: 'crag_ginger_1', itemId: 'raw_ginger', x: 585, y: 1195 },
  { id: 'crag_resin_1', itemId: 'raw_resin', x: 455, y: 980 }
];

const GROVE_FORAGE: ForageSpot[] = [
  { id: 'grove_heart_1', itemId: 'raw_heartwood', x: 512, y: 395, requiredToolId: 'tool_shears' },
  { id: 'grove_heart_2', itemId: 'raw_heartwood', x: 215, y: 748, requiredToolId: 'tool_shears' },
  { id: 'grove_heart_3', itemId: 'raw_heartwood', x: 805, y: 748, requiredToolId: 'tool_shears' },
  { id: 'grove_moon_1', itemId: 'raw_moonpetal', x: 355, y: 585 },
  { id: 'grove_ghost_1', itemId: 'raw_ghostcap', x: 668, y: 585 }
];

const SANCTUM_FORAGE: ForageSpot[] = [
  { id: 'sanc_lotus_1', itemId: 'raw_starlotus', x: 335, y: 1168, requiredToolId: 'tool_lantern' },
  { id: 'sanc_lotus_2', itemId: 'raw_starlotus', x: 775, y: 1185, requiredToolId: 'tool_lantern' },
  { id: 'sanc_lotus_3', itemId: 'raw_starlotus', x: 865, y: 1255, requiredToolId: 'tool_lantern' },
  { id: 'sanc_sundew_1', itemId: 'raw_sundew', x: 495, y: 765 },
  { id: 'sanc_moon_1', itemId: 'raw_moonpetal', x: 608, y: 712 }
];

const GROTTO_FORAGE: ForageSpot[] = [
  { id: 'grot_prism_1', itemId: 'raw_prismcrystal', x: 315, y: 365, requiredToolId: 'tool_pick' },
  { id: 'grot_prism_2', itemId: 'raw_prismcrystal', x: 502, y: 298, requiredToolId: 'tool_pick' },
  { id: 'grot_prism_3', itemId: 'raw_prismcrystal', x: 692, y: 375, requiredToolId: 'tool_pick' },
  { id: 'grot_frost_1', itemId: 'raw_frostbloom', x: 412, y: 472 },
  { id: 'grot_frost_2', itemId: 'raw_frostbloom', x: 598, y: 472 }
];

const WALK_FRAMES = ['char_genevieve_w1', 'char_genevieve', 'char_genevieve_w2', 'char_genevieve'];

export class WorldScene extends Phaser.Scene {
  private currentZone: ZoneId = 'interior';
  private navMesh!: NavMesh;
  private player!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private playerLanternHalo!: Phaser.GameObjects.Image;
  private playerWardRing!: Phaser.GameObjects.Arc;
  private walkQueue: { x: number; y: number }[] = [];
  private pendingTarget: InteractTarget | null = null;
  private targetRing!: Phaser.GameObjects.Arc;
  private ambientOverlay!: Phaser.GameObjects.Rectangle;
  private lightHalos: Phaser.GameObjects.Image[] = [];
  private shelfPreviewGroup?: Phaser.GameObjects.Container;
  private progressionObjects: Phaser.GameObjects.GameObject[] = [];
  private hazards: HazardEntity[] = [];
  private activePortals: {
    id: string;
    padX: number;
    padY: number;
    footX: number;
    footY: number;
    armed: boolean;
    onTrigger: () => void;
  }[] = [];
  private zoneInteractives: Phaser.GameObjects.GameObject[] = [];
  private isTransitioningZone = false;
  private hasMovedInZone = false;
  private portalGraceUntilMs = 0;
  private forageMap = new Map<string, Phaser.GameObjects.Container>();
  private forageHitMap = new Map<string, Phaser.GameObjects.Zone>();
  private questBadges = new Map<string, VillagerBadgeRefs>();
  private customerBusy = false;
  private customerTimer?: Phaser.Time.TimerEvent;
  private unsubStore?: () => void;
  private walkBobPhase = 0;
  private walkFrameTimer = 0;
  private walkFrameIdx = 0;
  private dustTimer = 0;
  private lastDragPlanMs = 0;
  private lastModalActiveMs = 0;
  private invulnUntilMs = 0;

  private readonly worldW = 1024;
  private readonly worldH = 1536;
  private readonly playerH = 114;
  private readonly footOffsetY = 38;

  constructor() {
    super('WorldScene');
  }

  private registerInteractive<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    obj.setInteractive({ useHandCursor: true });
    this.zoneInteractives.push(obj);
    return obj;
  }

  /**
   * 3-Layer Guard ensuring React menus, HUD buttons, and modal close taps NEVER trigger Phaser clicks or walk paths.
   */
  private isDirectCanvasPointer(pointer?: Phaser.Input.Pointer): boolean {
    if (this.isTransitioningZone) return false;
    const s = gameStore.getSnapshot();
    if (s.activeModal || s.talkingVillagerId || s.activeCareQuestId || !s.seenIntro) {
      this.lastModalActiveMs = performance.now();
      return false;
    }
    if (performance.now() - this.lastModalActiveMs < 260) {
      return false;
    }
    if (pointer) {
      const canvas = this.sys?.game?.canvas;
      const downEl = (pointer as unknown as { downElement?: Element | null }).downElement;
      if (canvas && downEl && downEl !== canvas) return false;
      const evtTarget = pointer.event?.target as Element | null | undefined;
      if (canvas && evtTarget && evtTarget !== canvas) return false;
    }
    return true;
  }

  preload() {
    this.load.image('bg_interior', './assets/backgrounds/bg_interior.png?v=8');
    this.load.image('bg_outskirts', './assets/backgrounds/bg_outskirts.png?v=8');
    this.load.image('bg_village', './assets/backgrounds/bg_village.png?v=8');
    this.load.image('bg_whisperwood', './assets/backgrounds/bg_whisperwood.png?v=8');
    this.load.image('bg_mire', './assets/backgrounds/bg_mire.png?v=8');
    this.load.image('bg_crag', './assets/backgrounds/bg_crag.png?v=8');
    this.load.image('bg_grove', './assets/backgrounds/bg_grove.png?v=12');
    this.load.image('bg_sanctum', './assets/backgrounds/bg_sanctum.png?v=12');
    this.load.image('bg_grotto', './assets/backgrounds/bg_grotto.png?v=12');

    this.load.image('char_genevieve', './assets/characters/genevieve.png?v=8');
    this.load.image('char_genevieve_w1', './assets/characters/genevieve_walk1.png?v=8');
    this.load.image('char_genevieve_w2', './assets/characters/genevieve_walk2.png?v=8');
    this.load.image('char_nutmeg', './assets/characters/nutmeg.png?v=8');
    this.load.image('char_bram', './assets/characters/bram.png?v=8');
    this.load.image('char_clara', './assets/characters/clara.png?v=8');
    this.load.image('char_pip', './assets/characters/pip.png?v=8');
    this.load.image('char_rowan', './assets/characters/rowan.png?v=8');
    this.load.image('char_maeve', './assets/characters/maeve.png?v=8');

    this.load.image('st_shelf_grand', './assets/stations/shelf_grand.png?v=8');
    this.load.image('st_nook', './assets/stations/reading_nook.png?v=8');
    this.load.image('bld_planter', './assets/buildings/planter.png?v=8');
    this.load.image('st_lantern', './assets/stations/lantern_pair.png?v=8');

    this.load.image('emb_cauldron', './assets/ui/emblem_cauldron.png?v=8');
    this.load.image('emb_prep', './assets/ui/emblem_prep.png?v=8');
    this.load.image('emb_poultice', './assets/ui/emblem_poultice.png?v=8');
    this.load.image('emb_sleep', './assets/ui/emblem_sleep.png?v=8');
    this.load.image('emb_door', './assets/ui/emblem_door.png?v=8');
    this.load.image('emb_quest', './assets/ui/emblem_quest.png?v=8');
    this.load.image('emb_check', './assets/ui/emblem_check.png?v=8');
    this.load.image('btn_shop', './assets/ui/btn_shop.png?v=8');
    this.load.image('btn_meadow', './assets/ui/btn_meadow.png?v=8');
    this.load.image('btn_village', './assets/ui/btn_village.png?v=8');
    this.load.image('btn_frontier', './assets/ui/btn_frontier.png?v=8');
    this.load.image('btn_sanctum', './assets/ui/btn_sanctum.png?v=12');
    this.load.image('btn_shelves', './assets/ui/btn_shelves.png?v=8');
    this.load.image('btn_journal', './assets/ui/btn_journal.png?v=8');
    this.load.image('hazard_wisp', './assets/ui/hazard_wisp.png?v=8');
    this.load.image('sanctum_wisp', './assets/ui/sanctum_wisp.png?v=12');
    this.load.image('tool_shears', './assets/ui/tool_shears.png?v=12');
    this.load.image('tool_lantern', './assets/ui/tool_lantern.png?v=12');
    this.load.image('tool_pick', './assets/ui/tool_pick.png?v=12');
    this.load.image('tool_satchel', './assets/ui/tool_satchel.png?v=12');
    this.load.image('emblem_tool_badge', './assets/ui/emblem_tool_badge.png?v=12');
    this.load.image('ui_coin', './assets/ui/icon_coin.png?v=8');
    this.load.image('ui_rune', './assets/ui/icon_rune.png?v=8');
    this.load.image('ui_heart', './assets/ui/icon_heart.png?v=8');

    Object.values(ITEMS).forEach((item) => {
      this.load.image(item.id, item.icon);
    });
  }

  create() {
    this.createProceduralTextures();

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.updateCameraZoom();
    this.scale.on('resize', () => this.updateCameraZoom());

    const snap = gameStore.getSnapshot();
    this.currentZone = snap.currentZone;
    this.buildZone(this.currentZone);

    this.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
        sound.unlock();
        if (!this.isDirectCanvasPointer(pointer)) return;
        if (currentlyOver && currentlyOver.length > 0) return;
        const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.setWalkDestination(wp.x, wp.y, true);
      }
    );

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || pointer.getDistance() < 18) return;
      if (!this.isDirectCanvasPointer(pointer)) return;
      const now = this.time.now;
      if (now - this.lastDragPlanMs < 95) return;
      this.lastDragPlanMs = now;

      const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.pendingTarget = null;
      this.planWalkPathToFoot(wp.x, wp.y);
    });

    this.customerTimer = this.time.addEvent({
      delay: 7500,
      loop: true,
      callback: () => this.trySpawnShopCustomer()
    });

    this.unsubStore = gameStore.subscribe(() => {
      const next = gameStore.getSnapshot();
      const modalOpen = !!(
        next.activeModal ||
        next.talkingVillagerId ||
        next.activeCareQuestId ||
        !next.seenIntro
      );
      if (modalOpen) {
        this.lastModalActiveMs = performance.now();
        this.input.enabled = false;
        this.walkQueue = [];
        this.pendingTarget = null;
        if (this.targetRing) this.targetRing.setVisible(false);
      } else {
        this.input.enabled = true;
      }

      if (next.currentZone !== this.currentZone) {
        const prevZone = this.currentZone;
        this.currentZone = next.currentZone;
        this.isTransitioningZone = true;
        this.walkQueue = [];
        this.pendingTarget = null;
        for (const obj of this.zoneInteractives) {
          if (obj && obj.scene) {
            this.input.disable(obj);
            obj.removeAllListeners();
          }
        }
        this.zoneInteractives = [];
        this.cameras.main.fadeOut(180, 16, 24, 20);
        this.time.delayedCall(190, () => {
          this.buildZone(this.currentZone, prevZone);
          this.isTransitioningZone = false;
          this.cameras.main.fadeIn(220, 16, 24, 20);
        });
      } else {
        this.syncDynamicState();
      }
    });
  }

  private rebuildNavMesh() {
    const s = gameStore.getSnapshot();
    this.navMesh = new NavMesh(this.currentZone, {
      cozyResidenceNook: !!(s.upgrades.upg_cozy_residence || s.completedQuests.length >= 2),
      grandShelfHutch: !!s.upgrades.upg_shelf_6,
      entranceLanterns: !!s.upgrades.upg_lantern_sign
    });
  }

  private createProceduralTextures() {
    if (!this.textures.exists('soft_dot')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.fillCircle(8, 8, 8);
      g.generateTexture('soft_dot', 16, 16);
      g.destroy();
    }

    if (!this.textures.exists('radial_glow')) {
      const canvasTex = this.textures.createCanvas('radial_glow', 128, 128);
      if (canvasTex) {
        const ctx = canvasTex.getContext();
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.35, 'rgba(255, 240, 200, 0.52)');
        grad.addColorStop(1, 'rgba(255, 220, 160, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        canvasTex.refresh();
      }
    }
  }

  private addLightHalo(x: number, y: number, size: number, colorHex: number, baseAlpha = 0.34) {
    const halo = this.add
      .image(x, y, 'radial_glow')
      .setDisplaySize(size, size)
      .setTint(colorHex)
      .setAlpha(baseAlpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3400);

    this.tweens.add({
      targets: halo,
      scaleX: halo.scaleX * 1.08,
      scaleY: halo.scaleY * 1.08,
      duration: 1800 + Math.random() * 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.lightHalos.push(halo);
    return halo;
  }

  private updateCameraZoom() {
    if (!this.cameras || !this.cameras.main) return;
    const vw = this.scale.width;
    const vh = this.scale.height;
    const zoom = Math.max(vw / this.worldW, vh / this.worldH);
    this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.45, 1.35));
  }

  private clearZone() {
    this.tweens.killAll();
    for (const obj of this.zoneInteractives) {
      if (obj && obj.scene) {
        this.input.disable(obj);
        obj.removeAllListeners();
      }
    }
    this.zoneInteractives = [];
    this.activePortals = [];
    this.questBadges.clear();
    this.forageMap.clear();
    this.forageHitMap.clear();
    this.children.removeAll(true);
    this.lightHalos = [];
    this.progressionObjects = [];
    this.hazards = [];
    this.shelfPreviewGroup = undefined;
    this.walkQueue = [];
    this.pendingTarget = null;
    this.customerBusy = false;
    this.hasMovedInZone = false;
    this.portalGraceUntilMs = performance.now() + 750;
  }

  private buildZone(zone: ZoneId, fromZone?: ZoneId) {
    this.clearZone();
    this.rebuildNavMesh();

    const bgKey = `bg_${zone}`;
    const bg = this.add.image(this.worldW / 2, this.worldH / 2, bgKey);
    bg.setDisplaySize(this.worldW, this.worldH);
    bg.setDepth(0);

    this.targetRing = this.add.circle(0, 0, 24, 0xf7df8b, 0.24);
    this.targetRing.setStrokeStyle(3, 0xfff0b3, 0.92);
    this.targetRing.setVisible(false);
    this.targetRing.setDepth(14);

    let desiredFootX = 500;
    let desiredFootY = 1085;

    if (zone === 'interior') {
      desiredFootX = 504;
      desiredFootY = fromZone === 'outskirts' ? 1145 : 1085;
      this.populateInterior();
    } else if (zone === 'outskirts') {
      if (fromZone === 'interior') {
        desiredFootX = 504;
        desiredFootY = 535;
      } else if (fromZone === 'village') {
        desiredFootX = 785;
        desiredFootY = 915;
      } else if (fromZone === 'whisperwood') {
        desiredFootX = 325;
        desiredFootY = 1255;
      } else {
        desiredFootX = 504;
        desiredFootY = 665;
      }
      this.populateOutskirts();
    } else if (zone === 'village') {
      if (fromZone === 'outskirts') {
        desiredFootX = 285;
        desiredFootY = 755;
      } else if (fromZone === 'whisperwood') {
        desiredFootX = 775;
        desiredFootY = 755;
      } else if (fromZone === 'mire') {
        desiredFootX = 578;
        desiredFootY = 1125;
      } else if (fromZone === 'crag') {
        desiredFootX = 535;
        desiredFootY = 365;
      } else {
        desiredFootX = 512;
        desiredFootY = 945;
      }
      this.populateVillage();
    } else if (zone === 'whisperwood') {
      if (fromZone === 'outskirts') {
        desiredFootX = 355;
        desiredFootY = 1145;
      } else if (fromZone === 'grove') {
        desiredFootX = 675;
        desiredFootY = 445;
      } else {
        desiredFootX = 275;
        desiredFootY = 755;
      }
      this.populateWhisperwood();
    } else if (zone === 'mire') {
      if (fromZone === 'sanctum') {
        desiredFootX = 655;
        desiredFootY = 1025;
      } else {
        desiredFootX = 510;
        desiredFootY = 445;
      }
      this.populateMire();
    } else if (zone === 'crag') {
      if (fromZone === 'grotto') {
        desiredFootX = 508;
        desiredFootY = 465;
      } else {
        desiredFootX = 555;
        desiredFootY = 1145;
      }
      this.populateCrag();
    } else if (zone === 'grove') {
      desiredFootX = 512;
      desiredFootY = 1045;
      this.populateGrove();
    } else if (zone === 'sanctum') {
      desiredFootX = 552;
      desiredFootY = 742;
      this.populateSanctum();
    } else {
      desiredFootX = 465;
      desiredFootY = 1105;
      this.populateGrotto();
    }

    const safeSpawnFoot = this.navMesh.findNearestWalkable(desiredFootX, desiredFootY);
    for (const p of this.activePortals) {
      const distSpawn = Math.min(
        Math.hypot(safeSpawnFoot.x - p.padX, safeSpawnFoot.y - p.padY),
        Math.hypot(safeSpawnFoot.x - p.footX, safeSpawnFoot.y - p.footY)
      );
      p.armed = distSpawn > 130;
    }
    const startX = safeSpawnFoot.x;
    const startY = safeSpawnFoot.y - this.footOffsetY;

    this.playerShadow = this.add.ellipse(0, this.footOffsetY + 2, 62, 24, 0x0e1610, 0.44);
    this.playerLanternHalo = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(260, 260)
      .setTint(0xffcf6b)
      .setAlpha(0.38)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.playerWardRing = this.add.circle(0, 6, 56, 0xfde047, 0.14);
    this.playerWardRing.setStrokeStyle(3, 0xfff08a, 0.85);
    this.playerWardRing.setVisible(false);

    this.playerSprite = this.add.image(0, 0, 'char_genevieve');
    this.scaleToHeight(this.playerSprite, this.playerH);

    this.player = this.add.container(startX, startY, [
      this.playerLanternHalo,
      this.playerShadow,
      this.playerWardRing,
      this.playerSprite
    ]);
    this.player.setDepth(startY + this.footOffsetY);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    const particleTints =
      zone === 'crag'
        ? [0xdbeafe, 0x93c5fd, 0xffffff]
        : zone === 'mire' || zone === 'whisperwood'
        ? [0x6ee7b7, 0xa78bfa, 0x67e8f9]
        : [0xfff0a8, 0xa8f5d0, 0xffd27d];

    this.add
      .particles(0, 0, 'soft_dot', {
        x: { min: 70, max: this.worldW - 70 },
        y: { min: 120, max: this.worldH - 70 },
        lifespan: 4800,
        speedY: zone === 'crag' ? { min: 14, max: 38 } : { min: -18, max: -6 },
        speedX: zone === 'crag' ? { min: -28, max: -8 } : { min: -10, max: 10 },
        scale: { start: 0.34, end: 0.04 },
        alpha: { start: 0.62, end: 0 },
        tint: particleTints,
        frequency: 230,
        blendMode: 'ADD'
      })
      .setDepth(3500);

    this.ambientOverlay = this.add
      .rectangle(this.worldW / 2, this.worldH / 2, this.worldW, this.worldH, 0x1a2242, 0)
      .setDepth(3800);

    this.syncDynamicState();
  }

  private populateInterior() {
    this.addLightHalo(325, 210, 290, 0xff8c32, 0.42);
    this.addLightHalo(438, 240, 190, 0x5ff5b0, 0.28);
    this.addLightHalo(145, 395, 240, 0xffe69c, 0.28);
    this.addLightHalo(708, 182, 165, 0xffca64, 0.36);
    this.addLightHalo(825, 945, 290, 0xffe49c, 0.24);
    this.addLightHalo(255, 1395, 240, 0xffe49c, 0.22);
    this.addLightHalo(745, 1395, 240, 0xffe49c, 0.22);

    this.add
      .particles(438, 222, 'soft_dot', {
        lifespan: 1700,
        speedY: { min: -38, max: -14 },
        speedX: { min: -12, max: 12 },
        scale: { start: 0.38, end: 0.05 },
        alpha: { start: 0.72, end: 0 },
        tint: [0x7bf5ba, 0xf7df7a],
        frequency: 260,
        blendMode: 'ADD'
      })
      .setDepth(320);

    this.addGraphicHotspot({
      id: 'st_cauldron',
      emblemTex: 'emb_cauldron',
      emblemX: 438,
      emblemY: 172,
      zoneX: 438,
      zoneY: 238,
      zoneW: 145,
      zoneH: 145,
      interactFootX: 365,
      interactFootY: 325,
      onReach: () => gameStore.openModal('cauldron')
    });

    this.addGraphicHotspot({
      id: 'st_prep',
      emblemTex: 'emb_prep',
      emblemX: 196,
      emblemY: 328,
      zoneX: 196,
      zoneY: 420,
      zoneW: 155,
      zoneH: 255,
      interactFootX: 315,
      interactFootY: 440,
      onReach: () => gameStore.openModal('prep')
    });

    this.addGraphicHotspot({
      id: 'st_poultice',
      emblemTex: 'emb_poultice',
      emblemX: 442,
      emblemY: 400,
      zoneX: 442,
      zoneY: 480,
      zoneW: 125,
      zoneH: 195,
      interactFootX: 355,
      interactFootY: 505,
      onReach: () => gameStore.openModal('poultice')
    });

    this.addGraphicHotspot({
      id: 'st_storage',
      emblemTex: 'btn_journal',
      emblemX: 162,
      emblemY: 575,
      emblemSize: 58,
      zoneX: 172,
      zoneY: 645,
      zoneW: 155,
      zoneH: 185,
      interactFootX: 310,
      interactFootY: 660,
      onReach: () => gameStore.openModal('inventory')
    });

    const nutmeg = this.registerInteractive(this.add.image(575, 298, 'char_nutmeg'));
    this.scaleToHeight(nutmeg, 70);
    nutmeg.setDepth(310);
    this.tweens.add({
      targets: nutmeg,
      scaleY: nutmeg.scaleY * 1.04,
      duration: 1900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    nutmeg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      if (!this.isDirectCanvasPointer(pointer)) return;
      sound.unlock();
      this.walkToAndInteract({
        id: 'nutmeg',
        x: 648,
        y: 355,
        radius: 95,
        onReach: () => {
          gameStore.petNutmeg();
          this.spawnIconBurst(575, 248, 'ui_heart');
        }
      });
    });

    this.addGraphicHotspot({
      id: 'st_bed',
      emblemTex: 'emb_sleep',
      emblemX: 816,
      emblemY: 192,
      zoneX: 816,
      zoneY: 272,
      zoneW: 175,
      zoneH: 255,
      interactFootX: 705,
      interactFootY: 345,
      onReach: () => gameStore.restUntilMorning()
    });

    this.addGraphicHotspot({
      id: 'st_shelf_west',
      emblemTex: 'btn_shelves',
      emblemX: 185,
      emblemY: 945,
      zoneX: 165,
      zoneY: 1095,
      zoneW: 155,
      zoneH: 430,
      interactFootX: 295,
      interactFootY: 1095,
      onReach: () => gameStore.openModal('shelf')
    });

    this.shelfPreviewGroup = this.add.container(158, 1085).setDepth(1290);

    this.addGraphicHotspot({
      id: 'st_counter_east',
      emblemTex: 'ui_coin',
      emblemX: 705,
      emblemY: 1005,
      emblemSize: 56,
      zoneX: 735,
      zoneY: 1120,
      zoneW: 220,
      zoneH: 295,
      interactFootX: 605,
      interactFootY: 1115,
      onReach: () => gameStore.openModal('shelf')
    });

    this.createGraphicPortal({
      id: 'portal_to_outskirts',
      emblemTex: 'emb_door',
      x: 504,
      y: 1295,
      interactFootX: 504,
      interactFootY: 1275,
      onTrigger: () => gameStore.setZone('outskirts')
    });
  }

  private populateOutskirts() {
    this.addLightHalo(430, 315, 165, 0xffbe55, 0.32);
    this.addLightHalo(585, 315, 165, 0xffbe55, 0.32);

    this.add
      .particles(0, 0, 'soft_dot', {
        x: { min: 65, max: 465 },
        y: { min: 930, max: 1460 },
        lifespan: 1400,
        scale: { start: 0.30, end: 0.04 },
        alpha: { start: 0.68, end: 0 },
        tint: [0xbbf7ff, 0xffffff],
        frequency: 220,
        blendMode: 'ADD'
      })
      .setDepth(25);

    this.addGraphicHotspot({
      id: 'cottage_door',
      emblemTex: 'btn_shop',
      emblemX: 504,
      emblemY: 315,
      emblemSize: 68,
      zoneX: 504,
      zoneY: 345,
      zoneW: 165,
      zoneH: 145,
      interactFootX: 504,
      interactFootY: 435,
      onReach: () => gameStore.setZone('interior')
    });

    this.addGraphicHotspot({
      id: 'cottage_planter',
      emblemTex: 'btn_meadow',
      emblemX: 250,
      emblemY: 382,
      emblemSize: 60,
      zoneX: 245,
      zoneY: 445,
      zoneW: 130,
      zoneH: 105,
      interactFootX: 392,
      interactFootY: 465,
      onReach: () => {
        const s = gameStore.getSnapshot();
        if (!s.upgrades.upg_garden_beds) {
          gameStore.openModal('shelf');
        } else if (s.planterReady) {
          gameStore.harvestPlanters();
          this.spawnIconBurst(250, 415, 'raw_moonpetal', '+3');
        } else {
          gameStore.openModal('shelf');
        }
      }
    });

    const pip = VILLAGERS.find((v) => v.id === 'pip')!;
    this.addVillagerActor(pip.id, 'char_pip', pip.x, pip.y);

    for (const spot of OUTSKIRTS_FORAGE) {
      this.createForageNode(spot);
    }

    // East Road -> Willowmere Village Square
    this.createGraphicPortal({
      id: 'portal_to_village',
      emblemTex: 'btn_village',
      x: 920,
      y: 905,
      interactFootX: 890,
      interactFootY: 910,
      onTrigger: () => gameStore.setZone('village')
    });

    // South-West Arched Footbridge Trail -> Thornveil Deepwood (positioned cleanly above bottom dock!)
    this.createGraphicPortal({
      id: 'portal_bridge_to_deepwood',
      emblemTex: 'btn_frontier',
      x: 152,
      y: 1290,
      interactFootX: 175,
      interactFootY: 1300,
      onTrigger: () => gameStore.setZone('whisperwood')
    });
  }

  private populateVillage() {
    for (const [lx, ly] of [
      [355, 655],
      [660, 655],
      [442, 580],
      [578, 580],
      [442, 895],
      [572, 895]
    ]) {
      this.addLightHalo(lx, ly, 175, 0xffca64, 0.30);
    }
    this.addLightHalo(375, 338, 210, 0xff7a2f, 0.36);

    this.add
      .particles(502, 742, 'soft_dot', {
        lifespan: 1250,
        speedY: { min: -32, max: -10 },
        speedX: { min: -16, max: 16 },
        scale: { start: 0.32, end: 0.05 },
        alpha: { start: 0.72, end: 0 },
        tint: [0x9ff3ff, 0xffffff],
        frequency: 175,
        blendMode: 'ADD'
      })
      .setDepth(770);

    this.addGraphicHotspot({
      id: 'village_signpost',
      emblemTex: 'btn_journal',
      emblemX: 215,
      emblemY: 590,
      emblemSize: 56,
      zoneX: 215,
      zoneY: 640,
      zoneW: 115,
      zoneH: 130,
      interactFootX: 268,
      interactFootY: 715,
      onReach: () => gameStore.openModal('quests')
    });

    for (const v of VILLAGERS.filter((vl) => vl.zone === 'village')) {
      this.addVillagerActor(v.id, `char_${v.id}`, v.x, v.y);
    }

    for (const spot of VILLAGE_FORAGE) {
      this.createForageNode(spot);
    }

    // 1. West Road -> Outskirts Homestead
    this.createGraphicPortal({
      id: 'portal_back_outskirts',
      emblemTex: 'btn_meadow',
      x: 108,
      y: 755,
      interactFootX: 158,
      interactFootY: 755,
      onTrigger: () => gameStore.setZone('outskirts')
    });

    // 2. East Road -> Thornveil Deepwood (Danger ★)
    this.createGraphicPortal({
      id: 'portal_village_east_deepwood',
      emblemTex: 'btn_frontier',
      x: 928,
      y: 755,
      interactFootX: 895,
      interactFootY: 755,
      onTrigger: () => gameStore.setZone('whisperwood')
    });

    // 3. South Road -> Sunken Mistfen Bog (Danger ★★) — cleanly above bottom dock!
    this.createGraphicPortal({
      id: 'portal_village_south_mire',
      emblemTex: 'btn_frontier',
      x: 578,
      y: 1292,
      interactFootX: 578,
      interactFootY: 1275,
      onTrigger: () => gameStore.setZone('mire')
    });

    // 4. North Trail -> Frostpeak Crags & Grotto (Danger ★★★)
    this.createGraphicPortal({
      id: 'portal_village_north_crag',
      emblemTex: 'btn_frontier',
      x: 535,
      y: 205,
      interactFootX: 535,
      interactFootY: 245,
      onTrigger: () => gameStore.setZone('crag')
    });
  }

  /**
   * ZONE 4: THORNVEIL DEEPWOOD (East of Village / SW to Outskirts Bridge)
   */
  private populateWhisperwood() {
    this.addLightHalo(585, 285, 220, 0x67e8f9, 0.34);
    this.addLightHalo(845, 455, 240, 0xa78bfa, 0.34);

    for (const spot of WHISPERWOOD_FORAGE) {
      this.createForageNode(spot);
    }

    // Patrolling Spore Wisps
    this.spawnPatrollingHazard(545, 495, 715, 585, 0.95, 'Deepwood Spore Wisp', 0x6ee7b7);
    this.spawnPatrollingHazard(335, 980, 505, 1065, 1.05, 'Bramble Spore Wisp', 0xa78bfa);

    // West Cobblestone Trail -> Willowmere Village
    this.createGraphicPortal({
      id: 'portal_deepwood_to_village',
      emblemTex: 'btn_village',
      x: 108,
      y: 755,
      interactFootX: 158,
      interactFootY: 755,
      onTrigger: () => gameStore.setZone('village')
    });

    // SW Forest Trail -> Outskirts Homestead Bridge (cleanly above bottom dock!)
    this.createGraphicPortal({
      id: 'portal_deepwood_to_outskirts',
      emblemTex: 'btn_meadow',
      x: 198,
      y: 1288,
      interactFootX: 235,
      interactFootY: 1278,
      onTrigger: () => gameStore.setZone('outskirts')
    });

    // NE Mossy Druid Stone Arch -> Hollowroot Druid Grove (Inner Sub-Zone!)
    this.createGraphicPortal({
      id: 'portal_deepwood_to_grove',
      emblemTex: 'btn_sanctum',
      x: 772,
      y: 282,
      interactFootX: 755,
      interactFootY: 306,
      onTrigger: () => gameStore.setZone('grove')
    });
  }

  /**
   * ZONE 5: SUNKEN MISTFEN BOG (South of Village)
   */
  private populateMire() {
    this.addLightHalo(506, 708, 220, 0xffca64, 0.42); // Central stone lantern island
    this.addLightHalo(765, 425, 210, 0x34d399, 0.28); // Bubbling mire glow
    this.addLightHalo(315, 1035, 220, 0x34d399, 0.28);

    for (const spot of MIRE_FORAGE) {
      this.createForageNode(spot);
    }

    // Patrolling Bog Miasma Wisps
    this.spawnPatrollingHazard(442, 436, 572, 436, 0.9, 'Mistfen Miasma Wisp', 0x34d399);
    this.spawnPatrollingHazard(445, 795, 625, 865, 1.05, 'Swamp Will-o’-Wisp', 0x2dd4bf);
    this.spawnPatrollingHazard(645, 1115, 765, 1135, 1.1, 'Sanctum Mire Wisp', 0xa78bfa);

    // North Causeway -> Willowmere Village (cleanly below Frontier Vitality Bar!)
    this.createGraphicPortal({
      id: 'portal_mire_to_village',
      emblemTex: 'btn_village',
      x: 510,
      y: 295,
      interactFootX: 510,
      interactFootY: 318,
      onTrigger: () => gameStore.setZone('village')
    });

    // SE Standing-Stone Ring -> Sunken Standing-Stone Sanctum (Inner Sub-Zone!)
    this.createGraphicPortal({
      id: 'portal_mire_to_sanctum',
      emblemTex: 'btn_sanctum',
      x: 735,
      y: 1215,
      interactFootX: 735,
      interactFootY: 1190,
      onTrigger: () => gameStore.setZone('sanctum')
    });
  }

  /**
   * ZONE 6: FROSTPEAK CRAGS & CRYSTAL GROTTO (North of Village)
   */
  private populateCrag() {
    this.addLightHalo(508, 195, 280, 0xc084fc, 0.42); // Amethyst crystal cavern glow
    this.addLightHalo(685, 245, 210, 0x60a5fa, 0.36);
    this.addLightHalo(288, 1165, 240, 0x67e8f9, 0.30); // Steaming thermal pool

    for (const spot of CRAG_FORAGE) {
      this.createForageNode(spot);
    }

    // Sweeping Alpine Frost Gales
    this.spawnPatrollingHazard(455, 1065, 645, 1125, 1.1, 'Freezing Crag Gale', 0x93c5fd);
    this.spawnPatrollingHazard(435, 608, 575, 608, 1.2, 'Chasm Frost Wisp', 0x60a5fa);
    this.spawnPatrollingHazard(355, 405, 665, 405, 1.35, 'Crystal Grotto Frost', 0xc084fc);

    // South Pine Trailhead -> Willowmere Village (cleanly above bottom dock!)
    this.createGraphicPortal({
      id: 'portal_crag_to_village',
      emblemTex: 'btn_village',
      x: 525,
      y: 1290,
      interactFootX: 525,
      interactFootY: 1265,
      onTrigger: () => gameStore.setZone('village')
    });

    // North Amethyst Cavern Mouth -> Starfall Crystal Grotto (Inner Sub-Zone!)
    this.createGraphicPortal({
      id: 'portal_crag_to_grotto',
      emblemTex: 'btn_sanctum',
      x: 508,
      y: 282,
      interactFootX: 508,
      interactFootY: 308,
      onTrigger: () => gameStore.setZone('grotto')
    });
  }

  /**
   * SUB-ZONE 7: HOLLOWROOT DRUID GROVE (Inner Sanctuary of Thornveil Deepwood)
   */
  private populateGrove() {
    this.addLightHalo(512, 265, 320, 0xfbbf24, 0.42); // Glowing amber sap elder trunk
    this.addLightHalo(512, 748, 280, 0x67e8f9, 0.34); // Sunlit turquoise spring pool

    for (const spot of GROVE_FORAGE) {
      this.createForageNode(spot);
    }

    this.spawnPatrollingHazard(305, 685, 355, 865, 1.0, 'Elder Briar Guardian Wisp', 0xfbbf24, 'sanctum_wisp');
    this.spawnPatrollingHazard(665, 865, 715, 685, 1.0, 'Hollowroot Amber Wisp', 0x34d399, 'sanctum_wisp');

    this.createGraphicPortal({
      id: 'portal_grove_to_deepwood',
      emblemTex: 'btn_frontier',
      x: 512,
      y: 1285,
      interactFootX: 512,
      interactFootY: 1258,
      onTrigger: () => gameStore.setZone('whisperwood')
    });
  }

  /**
   * SUB-ZONE 8: STANDING-STONE SANCTUM (Inner Sunken Temple of Mistfen Bog)
   */
  private populateSanctum() {
    this.addLightHalo(422, 688, 175, 0xff9f43, 0.42);
    this.addLightHalo(585, 608, 175, 0xff9f43, 0.42);
    this.addLightHalo(686, 735, 175, 0xff9f43, 0.42);
    this.addLightHalo(522, 835, 175, 0xff9f43, 0.42);
    this.addLightHalo(278, 1085, 220, 0xa78bfa, 0.38);

    for (const spot of SANCTUM_FORAGE) {
      this.createForageNode(spot);
    }

    this.spawnPatrollingHazard(365, 925, 445, 995, 1.1, 'Obelisk Runic Wisp', 0x818cf8, 'sanctum_wisp');
    this.spawnPatrollingHazard(655, 955, 735, 1045, 1.15, 'Abyssal Sanctum Wisp', 0xc084fc, 'sanctum_wisp');

    this.createGraphicPortal({
      id: 'portal_sanctum_to_mire',
      emblemTex: 'btn_frontier',
      x: 272,
      y: 295,
      interactFootX: 292,
      interactFootY: 328,
      onTrigger: () => gameStore.setZone('mire')
    });
  }

  /**
   * SUB-ZONE 9: STARFALL CRYSTAL GROTTO (Deep Cavern Beneath Frostpeak Crags)
   */
  private populateGrotto() {
    this.addLightHalo(315, 225, 280, 0xc084fc, 0.44);
    this.addLightHalo(502, 195, 290, 0x67e8f9, 0.44);
    this.addLightHalo(692, 235, 280, 0x818cf8, 0.44);
    this.addLightHalo(496, 685, 260, 0x38bdf8, 0.32);

    for (const spot of GROTTO_FORAGE) {
      this.createForageNode(spot);
    }

    this.spawnPatrollingHazard(445, 685, 555, 685, 1.2, 'Starlight Chasm Wisp', 0x67e8f9, 'sanctum_wisp');
    this.spawnPatrollingHazard(345, 395, 665, 395, 1.35, 'Astral Prism Sentinel', 0xe879f9, 'sanctum_wisp');

    this.createGraphicPortal({
      id: 'portal_grotto_to_crag',
      emblemTex: 'btn_frontier',
      x: 496,
      y: 1288,
      interactFootX: 496,
      interactFootY: 1258,
      onTrigger: () => gameStore.setZone('crag')
    });
  }

  private spawnPatrollingHazard(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    speed: number,
    label: string,
    tintHex: number,
    wispTex = 'hazard_wisp'
  ) {
    const glow = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(130, 130)
      .setTint(tintHex)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);

    const orb = this.add.image(0, 0, wispTex);
    this.scaleToHeight(orb, 72);
    if (wispTex === 'hazard_wisp') {
      orb.setTint(tintHex);
    }

    const c = this.add.container(ax, ay, [glow, orb]);
    c.setDepth(ay + 20);

    this.tweens.add({
      targets: orb,
      angle: 360,
      duration: 4200,
      repeat: -1
    });

    this.hazards.push({
      container: c,
      ax,
      ay,
      bx,
      by,
      speed,
      phase: Math.random() * Math.PI * 2,
      label
    });
  }

  private scaleToHeight(img: Phaser.GameObjects.Image, targetH: number) {
    const h = img.height || 256;
    img.setScale(targetH / h);
  }

  private addProgressionProp(tex: string, x: number, y: number, height: number, flatOnGround = false) {
    const shadow = this.add.ellipse(
      x,
      y + (flatOnGround ? height * 0.44 : height * 0.36),
      height * 0.85,
      height * 0.24,
      0x0b140e,
      flatOnGround ? 0.22 : 0.32
    );
    shadow.setDepth(flatOnGround ? 18 : y - 2);
    const img = this.add.image(x, y, tex);
    this.scaleToHeight(img, height);
    img.setDepth(flatOnGround ? 20 : y + 18);
    return { img, shadow };
  }

  private addGraphicHotspot(opts: {
    id: string;
    emblemTex: string;
    emblemX: number;
    emblemY: number;
    emblemSize?: number;
    zoneX: number;
    zoneY: number;
    zoneW: number;
    zoneH: number;
    interactFootX: number;
    interactFootY: number;
    onReach: () => void;
  }) {
    const sz = opts.emblemSize ?? 64;
    const hitZone = this.registerInteractive(
      this.add.zone(opts.zoneX, opts.zoneY, opts.zoneW, opts.zoneH)
    );

    const glow = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(sz * 1.55, sz * 1.55)
      .setTint(0xffdf8e)
      .setAlpha(0.36)
      .setBlendMode(Phaser.BlendModes.ADD);

    const badge = this.add.image(0, 0, opts.emblemTex);
    this.scaleToHeight(badge, sz);

    const emblemContainer = this.add.container(opts.emblemX, opts.emblemY, [glow, badge]);
    emblemContainer.setDepth(3150);

    this.tweens.add({
      targets: emblemContainer,
      y: opts.emblemY - 5,
      duration: 1650 + Math.random() * 450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const trigger = (pointer: Phaser.Input.Pointer) => {
      if (!this.isDirectCanvasPointer(pointer)) return;
      this.tweens.add({
        targets: badge,
        scaleX: badge.scaleX * 1.16,
        scaleY: badge.scaleY * 1.16,
        duration: 110,
        yoyo: true
      });
      this.walkToAndInteract({
        id: opts.id,
        x: opts.interactFootX,
        y: opts.interactFootY,
        radius: 95,
        onReach: opts.onReach
      });
    };

    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      trigger(pointer);
    });

    this.registerInteractive(badge);
    badge.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      trigger(pointer);
    });
  }

  private createGraphicPortal(opts: {
    id: string;
    emblemTex: string;
    x: number;
    y: number;
    interactFootX: number;
    interactFootY: number;
    onTrigger: () => void;
  }) {
    const pad = this.add.ellipse(opts.x, opts.y + 24, 118, 38, 0xf7df8b, 0.24).setDepth(12);
    pad.setStrokeStyle(2.5, 0xfff0b5, 0.82);

    const glow = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(112, 112)
      .setTint(0xffe696)
      .setAlpha(0.45)
      .setBlendMode(Phaser.BlendModes.ADD);

    const mainBadge = this.add.image(0, 0, opts.emblemTex);
    this.scaleToHeight(mainBadge, 70);

    const subBoot = this.add.image(24, 22, 'emb_door');
    this.scaleToHeight(subBoot, 34);
    if (opts.x < 300) subBoot.setFlipX(true);

    const container = this.add.container(opts.x, opts.y - 8, [glow, mainBadge, subBoot]);
    container.setDepth(3220);

    this.tweens.add({
      targets: container,
      y: opts.y - 14,
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const trigger = (pointer: Phaser.Input.Pointer) => {
      if (!this.isDirectCanvasPointer(pointer)) return;
      this.walkToAndInteract({
        id: opts.id,
        x: opts.interactFootX,
        y: opts.interactFootY,
        radius: 95,
        onReach: opts.onTrigger
      });
    };

    this.registerInteractive(mainBadge);
    mainBadge.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      trigger(pointer);
    });

    const hit = this.registerInteractive(this.add.zone(opts.x, opts.y + 8, 175, 150));
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      trigger(pointer);
    });

    this.activePortals.push({
      id: opts.id,
      padX: opts.x,
      padY: opts.y + 24,
      footX: opts.interactFootX,
      footY: opts.interactFootY,
      armed: true,
      onTrigger: opts.onTrigger
    });
  }

  private addVillagerActor(id: string, tex: string, x: number, y: number) {
    const shadow = this.add.ellipse(0, 40, 62, 24, 0x0d1610, 0.42);
    const sprite = this.add.image(0, 0, tex);
    this.scaleToHeight(sprite, 114);

    const halo = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(92, 92)
      .setTint(0xffdf88)
      .setAlpha(0.50)
      .setBlendMode(Phaser.BlendModes.ADD);
    const badgeImg = this.add.image(0, 0, 'emb_quest');
    this.scaleToHeight(badgeImg, 50);
    const checkDot = this.add.image(17, 15, 'emb_check');
    this.scaleToHeight(checkDot, 24);
    checkDot.setVisible(false);

    const badgeGroup = this.add.container(0, -82, [halo, badgeImg, checkDot]);
    badgeGroup.setVisible(false);

    this.tweens.add({
      targets: badgeGroup,
      y: -89,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const container = this.add.container(x, y, [shadow, sprite, badgeGroup]);
    container.setDepth(y + 40);
    this.questBadges.set(id, { container: badgeGroup, badgeImg, halo, checkDot });

    this.tweens.add({
      targets: sprite,
      y: -3,
      duration: 1550 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const openTalk = (pointer: Phaser.Input.Pointer) => {
      if (!this.isDirectCanvasPointer(pointer)) return;
      this.walkToAndInteract({
        id: `vil_${id}`,
        x,
        y: y + 66,
        radius: 115,
        onReach: () => gameStore.openVillager(id)
      });
    };

    const hitZone = this.registerInteractive(this.add.zone(x, y - 16, 135, 175));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      openTalk(pointer);
    });

    this.registerInteractive(sprite);
    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      openTalk(pointer);
    });

    this.registerInteractive(badgeImg);
    badgeImg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      sound.unlock();
      openTalk(pointer);
    });
  }

  private createForageNode(spot: ForageSpot) {
    const shadow = this.add.ellipse(0, 22, 50, 18, 0x0b160e, 0.36);
    const glow = this.add
      .image(0, 0, 'radial_glow')
      .setDisplaySize(spot.requiredToolId ? 104 : 88, spot.requiredToolId ? 104 : 88)
      .setTint(spot.requiredToolId ? 0xfbbf24 : 0xffe999)
      .setAlpha(spot.requiredToolId ? 0.52 : 0.42)
      .setBlendMode(Phaser.BlendModes.ADD);
    const icon = this.add.image(0, 0, spot.itemId);
    this.scaleToHeight(icon, spot.requiredToolId ? 74 : 68);

    const children: Phaser.GameObjects.GameObject[] = [shadow, glow, icon];
    if (spot.requiredToolId) {
      const toolTag = this.add.image(24, 18, spot.requiredToolId);
      this.scaleToHeight(toolTag, 32);
      children.push(toolTag);
    }

    const c = this.add.container(spot.x, spot.y, children);
    c.setDepth(spot.y);

    this.tweens.add({
      targets: icon,
      y: -5,
      angle: { from: -3, to: 3 },
      duration: 1650 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const harvestTrigger = (pointer: Phaser.Input.Pointer) => {
      if (!this.isDirectCanvasPointer(pointer)) return;
      sound.unlock();
      this.walkToAndInteract({
        id: spot.id,
        x: spot.x,
        y: spot.y + 24,
        radius: 112,
        onReach: () => {
          const ok = gameStore.harvestNode(spot.id, spot.itemId, 2, spot.requiredToolId);
          if (ok) {
            this.spawnIconBurst(spot.x, spot.y - 24, spot.itemId, '+');
          }
        }
      });
    };

    const hitZone = this.registerInteractive(this.add.zone(spot.x, spot.y, 118, 118));
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      harvestTrigger(pointer);
    });

    this.registerInteractive(icon);
    icon.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      harvestTrigger(pointer);
    });

    this.forageMap.set(spot.id, c);
    this.forageHitMap.set(spot.id, hitZone);
  }

  private syncDynamicState() {
    const s = gameStore.getSnapshot();
    this.rebuildNavMesh();

    this.forageMap.forEach((container, nodeId) => {
      const available = !s.forageCollectedToday[nodeId];
      container.setVisible(available);
      const hz = this.forageHitMap.get(nodeId);
      if (hz && hz.input) {
        hz.input.enabled = available;
      }
    });

    this.questBadges.forEach((refs, villagerId) => {
      const activeForVillager = QUESTS.find(
        (q) => q.giverId === villagerId && s.activeQuests.includes(q.id)
      );
      const availableNew = QUESTS.find(
        (q) =>
          q.giverId === villagerId &&
          !s.activeQuests.includes(q.id) &&
          !s.completedQuests.includes(q.id) &&
          (!q.prerequisiteQuestId || s.completedQuests.includes(q.prerequisiteQuestId))
      );

      if (activeForVillager) {
        const ready =
          (s.inventory[activeForVillager.requiredItemId] || 0) >= activeForVillager.requiredCount;
        refs.badgeImg.setTexture(activeForVillager.requiredItemId);
        this.scaleToHeight(refs.badgeImg, 50);
        refs.halo.setTint(ready ? 0x72f7a6 : 0xffdf88);
        refs.halo.setAlpha(ready ? 0.72 : 0.35);
        refs.checkDot.setVisible(ready);
        refs.container.setVisible(true);
      } else if (availableNew) {
        refs.badgeImg.setTexture('emb_quest');
        this.scaleToHeight(refs.badgeImg, 50);
        refs.halo.setTint(0xffc966);
        refs.halo.setAlpha(0.55);
        refs.checkDot.setVisible(false);
        refs.container.setVisible(true);
      } else {
        refs.container.setVisible(false);
      }
    });

    this.progressionObjects.forEach((obj) => obj.destroy());
    this.progressionObjects = [];

    if (this.currentZone === 'interior') {
      if (this.shelfPreviewGroup) {
        this.shelfPreviewGroup.removeAll(true);
        const maxSlots = gameStore.getMaxShelfSlots();
        s.shelfSlots.slice(0, maxSlots).forEach((slot, idx) => {
          if (!slot) return;
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const mini = this.add.image(col * 36 - 14, -85 + row * 72, slot.itemId);
          this.scaleToHeight(mini, 42);
          this.shelfPreviewGroup!.add(mini);
        });
      }

      if (s.upgrades.upg_shelf_6) {
        const p = this.addProgressionProp('st_shelf_grand', 824, 832, 118);
        this.progressionObjects.push(p.img, p.shadow);
      }

      if (s.upgrades.upg_cozy_residence || s.completedQuests.length >= 2) {
        const p = this.addProgressionProp('st_nook', 606, 502, 116);
        this.progressionObjects.push(p.img, p.shadow);
      }

      if (s.upgrades.upg_golden_mortar) {
        const aura = this.add
          .image(196, 420, 'radial_glow')
          .setDisplaySize(220, 220)
          .setTint(0xffd966)
          .setAlpha(0.34)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(440);
        this.progressionObjects.push(aura);
      }

      if (s.upgrades.upg_lantern_sign) {
        for (const lx of [388, 622]) {
          const p = this.addProgressionProp('st_lantern', lx, 1308, 102);
          const g = this.add
            .image(lx - 14, 1288, 'radial_glow')
            .setDisplaySize(165, 165)
            .setTint(0xffc95c)
            .setAlpha(0.38)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(1330);
          this.progressionObjects.push(p.img, p.shadow, g);
        }
      }

      if (s.completedQuests.length >= 1) {
        const p = this.addProgressionProp('st_lantern', 642, 825, 96);
        this.progressionObjects.push(p.img, p.shadow);
      }
    } else if (this.currentZone === 'outskirts') {
      if (s.upgrades.upg_garden_beds) {
        const b1 = this.addProgressionProp('bld_planter', 250, 454, 148, true);
        this.progressionObjects.push(b1.img, b1.shadow);
        if (s.planterReady) {
          const g = this.add
            .image(250, 454, 'radial_glow')
            .setDisplaySize(240, 240)
            .setTint(0x88f5ff)
            .setAlpha(0.38)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(495);
          this.progressionObjects.push(g);
        }
      }

      if (s.upgrades.upg_lantern_sign) {
        for (const lx of [426, 582]) {
          const p = this.addProgressionProp('st_lantern', lx, 535, 98);
          this.progressionObjects.push(p.img, p.shadow);
        }
      }
    }

    if (this.ambientOverlay) {
      const haloBoost =
        s.timePhase === 'Starlight Evening' ? 0.50 : s.timePhase === 'Golden Afternoon' ? 0.36 : 0.25;
      this.lightHalos.forEach((h) => h.setAlpha(haloBoost));

      if (this.currentZone === 'whisperwood' || this.currentZone === 'mire') {
        this.ambientOverlay.setFillStyle(0x0f2822, 0.10);
      } else if (this.currentZone === 'grove') {
        this.ambientOverlay.setFillStyle(0x1f2912, 0.06);
      } else if (this.currentZone === 'sanctum' || this.currentZone === 'grotto') {
        this.ambientOverlay.setFillStyle(0x1e1b4b, s.upgrades.tool_lantern ? 0.04 : 0.12);
      } else if (this.currentZone === 'crag') {
        this.ambientOverlay.setFillStyle(0xc7d2fe, 0.08);
      } else if (s.timePhase === 'Morning') {
        this.ambientOverlay.setFillStyle(0xfff5d6, 0.02);
      } else if (s.timePhase === 'Golden Afternoon') {
        this.ambientOverlay.setFillStyle(0xf59842, 0.10);
      } else {
        this.ambientOverlay.setFillStyle(0x162046, 0.24);
      }
    }
  }

  private trySpawnShopCustomer() {
    const s = gameStore.getSnapshot();
    if (!s.shopOpen) return;
    const maxSlots = gameStore.getMaxShelfSlots();
    const stockedIndices = s.shelfSlots
      .slice(0, maxSlots)
      .map((sl, idx) => (sl ? idx : -1))
      .filter((idx) => idx >= 0);

    if (stockedIndices.length === 0) return;
    const pickSlot = stockedIndices[Math.floor(Math.random() * stockedIndices.length)];
    const buyer = VILLAGERS[Math.floor(Math.random() * VILLAGERS.length)];

    if (this.currentZone !== 'interior') {
      gameStore.processCustomerSale(pickSlot, buyer.id);
      return;
    }

    if (this.customerBusy) return;
    this.customerBusy = true;

    const custShadow = this.add.ellipse(0, 38, 58, 22, 0x0e1610, 0.38);
    const custImg = this.add.image(0, 0, `char_${buyer.id}`);
    this.scaleToHeight(custImg, 110);
    const coinBadge = this.add.image(0, -68, 'ui_coin');
    this.scaleToHeight(coinBadge, 32);
    const shopper = this.add.container(504, 1320, [custShadow, custImg, coinBadge]);
    shopper.setDepth(1358);

    this.tweens.add({
      targets: shopper,
      x: 315,
      y: 1095,
      duration: 2100,
      ease: 'Quad.easeInOut',
      onUpdate: () => shopper.setDepth(shopper.y + 38),
      onComplete: () => {
        const earned = gameStore.processCustomerSale(pickSlot, buyer.id);
        if (earned > 0) {
          this.spawnIconBurst(285, 1025, 'ui_coin', `+${earned}`);
        }
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: shopper,
            x: 504,
            y: 1335,
            alpha: 0,
            duration: 1800,
            onUpdate: () => shopper.setDepth(shopper.y + 38),
            onComplete: () => {
              shopper.destroy();
              this.customerBusy = false;
            }
          });
        });
      }
    });
  }

  private spawnIconBurst(x: number, y: number, texKey: string, numLabel?: string) {
    const ic = this.add.image(numLabel ? -18 : 0, 0, texKey);
    this.scaleToHeight(ic, 46);
    const children: Phaser.GameObjects.GameObject[] = [ic];

    if (numLabel) {
      const num = this.add
        .text(22, 0, numLabel, {
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#fff4bd',
          stroke: '#121c15',
          strokeThickness: 6
        })
        .setOrigin(0.5)
        .setResolution(2);
      children.push(num);
    }

    const burst = this.add.container(x, y, children).setDepth(3650);
    this.tweens.add({
      targets: burst,
      y: y - 58,
      alpha: 0,
      duration: 1250,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy()
    });
  }

  private spawnFootstepDust(x: number, y: number) {
    const puff = this.add.circle(x, y + this.footOffsetY, 7, 0xf2e4c6, 0.34).setDepth(y - 3);
    this.tweens.add({
      targets: puff,
      scale: 1.85,
      alpha: 0,
      y: y + this.footOffsetY - 6,
      duration: 360,
      onComplete: () => puff.destroy()
    });
  }

  private planWalkPathToFoot(goalFootX: number, goalFootY: number) {
    const curFootX = this.player.x;
    const curFootY = this.player.y + this.footOffsetY;
    const footWaypoints = this.navMesh.findPath(curFootX, curFootY, goalFootX, goalFootY);
    this.walkQueue = footWaypoints.map((pt) => ({
      x: pt.x,
      y: pt.y - this.footOffsetY
    }));
  }

  private walkToAndInteract(target: InteractTarget) {
    const safeFoot = this.navMesh.findNearestWalkable(target.x, target.y);
    this.pendingTarget = {
      ...target,
      x: safeFoot.x,
      y: safeFoot.y - this.footOffsetY
    };
    this.setWalkDestination(safeFoot.x, safeFoot.y, false);
  }

  private setWalkDestination(footX: number, footY: number, clearPending: boolean) {
    if (clearPending) this.pendingTarget = null;
    this.planWalkPathToFoot(footX, footY);
    if (this.walkQueue.length === 0) return;
    const finalActorPt = this.walkQueue[this.walkQueue.length - 1];

    this.targetRing.setPosition(finalActorPt.x, finalActorPt.y + this.footOffsetY);
    this.targetRing.setVisible(true);
    this.targetRing.setScale(0.75);
    this.tweens.add({
      targets: this.targetRing,
      scale: 1.15,
      alpha: { from: 0.88, to: 0.2 },
      duration: 420
    });
  }

  private checkPortalPadStep(): boolean {
    if (this.isTransitioningZone || !this.hasMovedInZone) return false;
    if (performance.now() < this.portalGraceUntilMs) return false;
    const pFootX = this.player.x;
    const pFootY = this.player.y + this.footOffsetY;
    for (const p of this.activePortals) {
      const dPad = Math.hypot(pFootX - p.padX, pFootY - p.padY);
      const dFoot = Math.hypot(pFootX - p.footX, pFootY - p.footY);
      const minDist = Math.min(dPad, dFoot);

      if (!p.armed) {
        if (minDist > 145) {
          p.armed = true;
        }
        continue;
      }

      // Do not passively trigger a different portal if the player explicitly tapped another interactive/portal
      if (this.pendingTarget && this.pendingTarget.id !== p.id) {
        continue;
      }

      if (dPad <= 52 || dFoot <= 46) {
        this.pendingTarget = null;
        this.walkQueue = [];
        this.playerSprite.setY(0);
        this.playerSprite.setTexture('char_genevieve');
        this.scaleToHeight(this.playerSprite, this.playerH);
        this.targetRing.setVisible(false);
        p.onTrigger();
        return true;
      }
    }
    return false;
  }

  update(_time: number, delta: number) {
    if (!this.player) return;

    // Update protective Golden Ward Shield, Sunfire Lantern aura & frontier hazard collisions
    const snap = gameStore.getSnapshot();
    const wardActive = Date.now() < snap.wardUntilMs;
    if (this.playerWardRing) {
      this.playerWardRing.setVisible(wardActive);
    }
    if (this.playerLanternHalo) {
      this.playerLanternHalo.setVisible(!!snap.upgrades.tool_lantern && this.currentZone !== 'interior');
    }

    if (this.hazards.length > 0 && !snap.activeModal) {
      const nowPerf = performance.now();
      const pFootX = this.player.x;
      const pFootY = this.player.y + this.footOffsetY;
      const lanternSpeedFactor = snap.upgrades.tool_lantern ? 0.74 : 1.0;
      const hitRadius = snap.upgrades.tool_lantern ? 38 : 46;

      for (const hz of this.hazards) {
        hz.phase += (delta / 1000) * hz.speed * lanternSpeedFactor;
        const t = 0.5 + 0.5 * Math.sin(hz.phase);
        const hx = hz.ax + (hz.bx - hz.ax) * t;
        const hy = hz.ay + (hz.by - hz.ay) * t;
        hz.container.setPosition(hx, hy);
        hz.container.setDepth(hy + 35);

        if (nowPerf >= this.invulnUntilMs) {
          const d = Math.hypot(pFootX - hx, pFootY - hy);
          if (d < hitRadius) {
            this.invulnUntilMs = nowPerf + 1850;
            const outcome = gameStore.applyHazardHit(hz.label);
            if (outcome === 'warded') {
              this.spawnIconBurst(this.player.x, this.player.y - 45, 'potion_warding');
            } else if (outcome === 'hit') {
              this.cameras.main.shake(160, 0.008);
              this.tweens.add({
                targets: this.playerSprite,
                alpha: { from: 0.35, to: 1 },
                duration: 160,
                repeat: 3
              });
            } else {
              return;
            }
          }
        }
      }
    }

    if (this.walkQueue.length === 0) {
      if (this.playerSprite.texture.key !== 'char_genevieve') {
        this.playerSprite.setTexture('char_genevieve');
        this.scaleToHeight(this.playerSprite, this.playerH);
      }
      return;
    }

    const wp = this.walkQueue[0];
    const speed = 340 * (delta / 1000);
    const dx = wp.x - this.player.x;
    const dy = wp.y - this.player.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > 3) {
      this.playerSprite.setFlipX(dx < 0);
    }

    if (dist <= speed + 4) {
      this.player.setPosition(wp.x, wp.y);
      this.player.setDepth(this.player.y + this.footOffsetY);
      this.hasMovedInZone = true;
      this.walkQueue.shift();

      if (this.checkPortalPadStep()) return;

      if (this.walkQueue.length === 0) {
        this.playerSprite.setY(0);
        this.playerSprite.setTexture('char_genevieve');
        this.scaleToHeight(this.playerSprite, this.playerH);
        this.targetRing.setVisible(false);

        if (this.pendingTarget) {
          const pt = this.pendingTarget;
          this.pendingTarget = null;
          pt.onReach();
        }
      }
      return;
    }

    let nx = this.player.x + (dx / dist) * speed;
    let ny = this.player.y + (dy / dist) * speed;

    if (!this.navMesh.isWalkableWorld(nx, ny + this.footOffsetY)) {
      if (this.navMesh.isWalkableWorld(nx, this.player.y + this.footOffsetY)) {
        ny = this.player.y;
      } else if (this.navMesh.isWalkableWorld(this.player.x, ny + this.footOffsetY)) {
        nx = this.player.x;
      } else {
        this.walkQueue = [];
        this.targetRing.setVisible(false);
        return;
      }
    }

    this.player.setPosition(nx, ny);
    this.player.setDepth(ny + this.footOffsetY);
    this.hasMovedInZone = true;

    if (this.checkPortalPadStep()) return;

    this.walkBobPhase += delta * 0.017;
    this.playerSprite.setY(-Math.abs(Math.sin(this.walkBobPhase)) * 4.2);

    this.walkFrameTimer += delta;
    if (this.walkFrameTimer >= 135) {
      this.walkFrameTimer = 0;
      this.walkFrameIdx = (this.walkFrameIdx + 1) % WALK_FRAMES.length;
      const flip = this.playerSprite.flipX;
      this.playerSprite.setTexture(WALK_FRAMES[this.walkFrameIdx]);
      this.scaleToHeight(this.playerSprite, this.playerH);
      this.playerSprite.setFlipX(flip);
    }

    this.dustTimer += delta;
    if (this.dustTimer >= 260) {
      this.dustTimer = 0;
      this.spawnFootstepDust(nx, ny);
    }

    if (this.pendingTarget && this.walkQueue.length === 1) {
      const pDist = Math.hypot(this.pendingTarget.x - nx, this.pendingTarget.y - ny);
      if (pDist <= this.pendingTarget.radius) {
        const pt = this.pendingTarget;
        this.pendingTarget = null;
        this.walkQueue = [];
        this.playerSprite.setY(0);
        this.playerSprite.setTexture('char_genevieve');
        this.scaleToHeight(this.playerSprite, this.playerH);
        this.targetRing.setVisible(false);
        pt.onReach();
      }
    }
  }

  shutdown() {
    this.unsubStore?.();
    this.customerTimer?.remove();
  }
}
