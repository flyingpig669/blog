<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { config, registry, navController, hrefFor } from "../lib/content";
import ActionLinks from './ActionLinks.vue';
import ThemeToggle from './ThemeToggle.vue';
import MobileDrawer from './MobileDrawer.vue';
const props = defineProps({ active: String, routeKey: String });
defineEmits(["search"]);
const mobile = ref(false),
  openGroup = ref("");
const groups = computed(() =>
  registry.navGroups(config.nav).map((group) => {
    const selected = group.folded.find((item) => item.id === props.active);
    return {
      ...group,
      desktopHead: selected || group.head,
      desktopFolded: selected
        ? [group.head, ...group.folded.filter((item) => item !== selected)]
        : group.folded,
    };
  }),
);
watch(
  () => props.routeKey,
  () => {
    mobile.value = false;
    openGroup.value = "";
  },
);
function outside(event) {
  if (!event.target.closest(".nav-dropdown")) openGroup.value = "";
}
function key(event) {
  if (event.key === "Escape") {
    mobile.value = false;
    openGroup.value = "";
  }
}
onMounted(() => {
  document.addEventListener("click", outside);
  document.addEventListener("keydown", key);
});
onUnmounted(() => {
  document.removeEventListener("click", outside);
  document.removeEventListener("keydown", key);
});
</script>
<template>
  <header class="site-header sticky top-0 z-40 w-full nav-blur">
    <div
      class="navbar-frame w-full px-4 sm:px-6 md:px-8 lg:px-12 h-14 flex items-center justify-between gap-2 sm:gap-4"
    >
      <div class="flex items-center gap-6 lg:gap-8 min-w-0">
        <a
          id="brand-link"
          :href="hrefFor('home')"
          class="flex items-center gap-2 text-primary font-mono text-[14px] font-semibold min-w-0 md:shrink-0 whitespace-nowrap"
          ><span class="text-accent">/</span
          ><span class="truncate">{{ config.site.brand }}</span></a
        >
        <nav
          id="desktop-nav"
          aria-label="Primary navigation"
          class="hidden md:flex items-center gap-4 lg:gap-6 whitespace-nowrap py-1"
        >
          <template v-for="group in groups" :key="group.head.id">
            <div
              v-if="group.folded.length"
              class="nav-dropdown"
              :class="{ open: openGroup === group.head.id }"
            >
              <a
                :href="navController.navItemHref(group.desktopHead)"
                class="nav-link"
                :class="{ active: active === group.desktopHead.id }"
                :aria-current="
                  active === group.desktopHead.id ? 'page' : undefined
                "
                >{{ group.desktopHead.label }}</a
              >
              <button
                class="nav-dropdown-toggle"
                type="button"
                aria-haspopup="true"
                :aria-expanded="openGroup === group.head.id"
                :aria-label="'展开 ' + group.desktopHead.label + ' 更多链接'"
                @click="
                  openGroup = openGroup === group.head.id ? '' : group.head.id
                "
              >
                <svg
                  class="nav-dropdown-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div class="nav-dropdown-panel">
                <div
                  class="nav-dropdown-menu"
                  role="menu"
                  :aria-label="group.desktopHead.label + ' 子菜单'"
                >
                  <a
                    v-for="item in group.desktopFolded"
                    :key="item.id"
                    :href="navController.navItemHref(item)"
                    class="nav-dropdown-item"
                    role="menuitem"
                    >{{ item.label }}</a
                  >
                </div>
              </div>
            </div>
            <a
              v-else
              :href="navController.navItemHref(group.head)"
              class="nav-link"
              :class="{ active: active === group.head.id }"
              :aria-current="active === group.head.id ? 'page' : undefined"
              >{{ group.head.label }}</a
            >
          </template>
        </nav>
      </div>
      <div class="nav-actions flex gap-1 sm:gap-3 items-center shrink-0">
        <button
          v-if="config.features.searchModal !== false"
          id="search-action"
          class="nav-action nav-search flex items-center gap-2"
          aria-label="Search articles"
          aria-haspopup="dialog"
          aria-controls="search-modal"
          @click="$emit('search')"
        >
          <svg
            aria-hidden="true"
            class="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" /></svg
          ><span class="hidden md:inline">Search</span
          ><kbd
            class="hidden md:inline-block px-1 py-0.5 text-[10px] font-mono text-muted"
            >⌘K</kbd
          >
        </button>
        <ActionLinks />
        <ThemeToggle />
        <button
          id="mobile-nav-toggle"
          class="icon-button md:hidden text-secondary"
          aria-label="Toggle navigation"
          :aria-expanded="mobile"
          aria-controls="mobile-drawer"
          @click="mobile = !mobile"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    <MobileDrawer id="mobile-drawer" title="导航" :open="mobile" :breakpoint="768" @close="mobile = false">
    <nav aria-label="Mobile navigation">
      <template v-for="group in groups" :key="group.head.id"
        ><a
          v-for="(item, index) in [group.head, ...group.folded]"
          :key="item.id"
          :href="navController.navItemHref(item)"
          class="mobile-nav-link"
          :class="{ active: active === item.id, 'is-nested': index > 0 }"
          :aria-current="active === item.id ? 'page' : undefined"
          @click="mobile = false"
          >{{ item.label }}</a
        ></template
      >
    </nav>
    </MobileDrawer>
  </header>
</template>
