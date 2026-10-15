<script setup>
import { computed, inject } from "vue";
import { resourceLink } from "../lib/publications";
import InlineText from "./InlineText.vue";
const props = defineProps({ item: Object });
const jump = inject("jumpToPaper", () => {});
const links = computed(() =>
  Object.entries(props.item.links || {}).flatMap(([kind, value]) =>
    (Array.isArray(value) ? value : [value]).map((value) => ({
      kind,
      value,
      href: resourceLink(kind, value),
    })),
  ),
);
</script>
<template>
  <div class="pt-3">
    <p
      v-if="item.detail || item.details || item.more"
      class="text-[13px] text-secondary leading-relaxed mb-3"
    >
      <InlineText :value="item.detail || item.details || item.more" />
    </p>
    <div class="flex flex-wrap gap-2">
      <template v-for="(link, index) in links" :key="index"
        ><button
          v-if="link.kind === 'paper'"
          class="tag-pill"
          data-pub-jump
          @click="jump(link.value)"
        >
          PAPER ↗</button
        ><a
          v-else-if="link.href"
          :href="link.href"
          class="tag-pill"
          :target="/^https?:/.test(link.href) ? '_blank' : undefined"
          rel="noopener noreferrer"
          >{{ link.kind.toUpperCase() }} ↗</a
        ></template
      >
    </div>
  </div>
</template>
