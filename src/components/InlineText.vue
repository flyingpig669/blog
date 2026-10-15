<script setup>
import { computed } from "vue";
import { store, lines } from "../lib/content";
const props = defineProps({ value: [String, Array] });
const pieces = computed(() => {
  const text = lines(props.value),
    result = [];
  let cursor = 0;
  for (const match of text.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
    if (match.index > cursor)
      result.push({ text: text.slice(cursor, match.index) });
    const [key, label] = match[1].split("|");
    const reference = store.resolveLink(key.trim());
    result.push({
      text: label || reference?.title || key,
      href: reference ? "#" + reference.route : undefined,
    });
    cursor = match.index + match[0].length;
  }
  result.push({ text: text.slice(cursor) });
  return result;
});
</script>
<template>
  <span class="whitespace-pre-line"
    ><template v-for="(piece, index) in pieces" :key="index"
      ><a
        v-if="piece.href"
        :href="piece.href"
        class="text-accent hover:underline"
        >{{ piece.text }}</a
      ><template v-else>{{ piece.text }}</template></template
    ></span
  >
</template>
