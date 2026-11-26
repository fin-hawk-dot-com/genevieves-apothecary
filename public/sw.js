const CACHE_NAME = 'genevieves-apothecary-v14';
const CORE_SHELL = ['./', './index.html', './manifest.webmanifest'];
const GAME_ASSETS = [
  "./assets/backgrounds/bg_crag.png",
  "./assets/backgrounds/bg_grotto.png",
  "./assets/backgrounds/bg_grove.png",
  "./assets/backgrounds/bg_interior.png",
  "./assets/backgrounds/bg_mire.png",
  "./assets/backgrounds/bg_outskirts.png",
  "./assets/backgrounds/bg_sanctum.png",
  "./assets/backgrounds/bg_village.png",
  "./assets/backgrounds/bg_whisperwood.png",
  "./assets/backgrounds/care_table.png",
  "./assets/buildings/apothecary.png",
  "./assets/buildings/forge_bakery.png",
  "./assets/buildings/fountain.png",
  "./assets/buildings/market_stall.png",
  "./assets/buildings/notice_board.png",
  "./assets/buildings/oak_tree.png",
  "./assets/buildings/planter.png",
  "./assets/buildings/weaver_cottage.png",
  "./assets/characters/bram.png",
  "./assets/characters/clara.png",
  "./assets/characters/genevieve.png",
  "./assets/characters/genevieve_walk1.png",
  "./assets/characters/genevieve_walk2.png",
  "./assets/characters/maeve.png",
  "./assets/characters/nutmeg.png",
  "./assets/characters/pip.png",
  "./assets/characters/rowan.png",
  "./assets/items/potion_chamomile.png",
  "./assets/items/potion_ginger.png",
  "./assets/items/potion_lavender.png",
  "./assets/items/potion_moonpetal.png",
  "./assets/items/potion_starfall.png",
  "./assets/items/potion_warding.png",
  "./assets/items/poultice_frostfire.png",
  "./assets/items/poultice_ginger.png",
  "./assets/items/poultice_heartwood.png",
  "./assets/items/poultice_mint.png",
  "./assets/items/poultice_resin.png",
  "./assets/items/poultice_willow.png",
  "./assets/items/prep_chamomile.png",
  "./assets/items/prep_frostbloom.png",
  "./assets/items/prep_ghostcap.png",
  "./assets/items/prep_ginger.png",
  "./assets/items/prep_heartwood.png",
  "./assets/items/prep_lavender.png",
  "./assets/items/prep_mint.png",
  "./assets/items/prep_moonpetal.png",
  "./assets/items/prep_prismcrystal.png",
  "./assets/items/prep_resin.png",
  "./assets/items/prep_starlotus.png",
  "./assets/items/prep_sundew.png",
  "./assets/items/prep_willowbark.png",
  "./assets/items/raw_chamomile.png",
  "./assets/items/raw_frostbloom.png",
  "./assets/items/raw_ghostcap.png",
  "./assets/items/raw_ginger.png",
  "./assets/items/raw_heartwood.png",
  "./assets/items/raw_lavender.png",
  "./assets/items/raw_linen.png",
  "./assets/items/raw_mint.png",
  "./assets/items/raw_moonpetal.png",
  "./assets/items/raw_prismcrystal.png",
  "./assets/items/raw_resin.png",
  "./assets/items/raw_starlotus.png",
  "./assets/items/raw_sundew.png",
  "./assets/items/raw_willowbark.png",
  "./assets/portraits/bram.png",
  "./assets/portraits/clara.png",
  "./assets/portraits/genevieve.png",
  "./assets/portraits/maeve.png",
  "./assets/portraits/pip.png",
  "./assets/portraits/rowan.png",
  "./assets/stations/bed_cozy.png",
  "./assets/stations/cauldron.png",
  "./assets/stations/lantern_pair.png",
  "./assets/stations/poultice_table.png",
  "./assets/stations/prep_bench.png",
  "./assets/stations/quest_keepsakes.png",
  "./assets/stations/reading_nook.png",
  "./assets/stations/shelf.png",
  "./assets/stations/shelf_grand.png",
  "./assets/stations/storage_rack.png",
  "./assets/ui/app_icon.png",
  "./assets/ui/app_icon_192.png",
  "./assets/ui/apple_touch_icon.png",
  "./assets/ui/btn_frontier.png",
  "./assets/ui/btn_inventory.png",
  "./assets/ui/btn_journal.png",
  "./assets/ui/btn_meadow.png",
  "./assets/ui/btn_menu.png",
  "./assets/ui/btn_quests.png",
  "./assets/ui/btn_recipes.png",
  "./assets/ui/btn_sanctum.png",
  "./assets/ui/btn_shelves.png",
  "./assets/ui/btn_shop.png",
  "./assets/ui/btn_sound_off.png",
  "./assets/ui/btn_sound_on.png",
  "./assets/ui/btn_village.png",
  "./assets/ui/emblem_cauldron.png",
  "./assets/ui/emblem_check.png",
  "./assets/ui/emblem_close.png",
  "./assets/ui/emblem_door.png",
  "./assets/ui/emblem_poultice.png",
  "./assets/ui/emblem_prep.png",
  "./assets/ui/emblem_quest.png",
  "./assets/ui/emblem_sleep.png",
  "./assets/ui/emblem_tool_badge.png",
  "./assets/ui/hazard_wisp.png",
  "./assets/ui/icon_bell.png",
  "./assets/ui/icon_coin.png",
  "./assets/ui/icon_heart.png",
  "./assets/ui/icon_journal.png",
  "./assets/ui/icon_rune.png",
  "./assets/ui/rune_pack_chest.png",
  "./assets/ui/rune_pack_coffer.png",
  "./assets/ui/rune_pack_pouch.png",
  "./assets/ui/rune_pack_vault.png",
  "./assets/ui/sanctum_wisp.png",
  "./assets/ui/stage_cauldron_top.png",
  "./assets/ui/stage_mortar_bowl.png",
  "./assets/ui/title_hero.png",
  "./assets/ui/tool_ladle.png",
  "./assets/ui/tool_lantern.png",
  "./assets/ui/tool_pestle.png",
  "./assets/ui/tool_pick.png",
  "./assets/ui/tool_satchel.png",
  "./assets/ui/tool_shears.png"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        for (const url of GAME_ASSETS) {
          try {
            const hit = await cache.match(url, { ignoreSearch: true });
            if (!hit) await cache.add(url);
          } catch (_) {}
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
