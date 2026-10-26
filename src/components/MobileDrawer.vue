<script setup>
import { ref, useId, watch, onMounted, onUnmounted } from 'vue';
import { trapDialogFocus } from '../lib/focus';

const props = defineProps({
  open: Boolean,
  id: String,
  title: String,
  breakpoint: { type: Number, default: 900 },
});
const emit = defineEmits(['close', 'opened']);
const dialog = ref(null);
const heading = useId();
let media, previousOverflow;

function unlock() {
  if (previousOverflow !== undefined) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = undefined;
  }
}
function sync() {
  if (!dialog.value) return;
  if (props.open && !media?.matches) {
    if (!dialog.value.open) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.value.showModal();
      emit('opened');
    }
  } else {
    dialog.value.close();
    unlock();
    if (props.open) emit('close');
  }
}
function keydown(event) {
  trapDialogFocus(event, dialog.value);
}
watch(() => props.open, sync, { flush: 'post' });
onMounted(() => {
  media = window.matchMedia(`(min-width: ${props.breakpoint}px)`);
  media.addEventListener('change', sync);
  sync();
});
onUnmounted(() => {
  dialog.value?.close();
  media?.removeEventListener('change', sync);
  unlock();
});
</script>

<template>
  <Teleport to="body">
    <dialog
      :id="id"
      ref="dialog"
      class="mobile-sheet"
      :aria-labelledby="heading"
      @cancel.prevent="$emit('close')"
      @click="event => event.target === dialog && $emit('close')"
      @keydown.stop="keydown"
    >
      <div class="mobile-sheet-header">
        <h2 :id="heading" class="font-sans text-[15px] font-semibold">{{ title }}</h2>
        <button type="button" class="icon-button" :aria-label="'关闭' + title" autofocus @click="$emit('close')">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div class="mobile-sheet-body" data-sheet-scroll><slot /></div>
    </dialog>
  </Teleport>
</template>
