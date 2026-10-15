<script setup>
import { useId, watch } from "vue";
import { useExpandable } from "../composables/useExpandable";
defineProps({
  title: String,
  expandable: Boolean,
  titleClass: { type: String, default: "" },
});
const emit = defineEmits(["update:expanded"]);
const id = useId();
const { expanded, toggle } = useExpandable();
watch(expanded, (value) => emit("update:expanded", value));
function rowClick(event) {
  if (!event.target.closest("button,input,[data-preview-control]"))
    toggle(event);
}
defineExpose({ expanded });
</script>
<template>
  <div
    :class="{ 'is-expanded': expanded }"
    @click="expandable && rowClick($event)"
  >
    <button
      v-if="expandable"
      type="button"
      class="entry-toggle"
      :class="titleClass"
      :aria-expanded="expanded"
      :aria-controls="id"
      @click.stop="toggle"
    >
      {{ title }}<span class="entry-chevron" aria-hidden="true">⌄</span>
    </button>
    <h3 v-else :class="titleClass">{{ title }}</h3>
    <slot name="summary" />
    <div v-if="expandable" :id="id" :hidden="!expanded" class="entry-panel">
      <slot />
    </div>
  </div>
</template>
