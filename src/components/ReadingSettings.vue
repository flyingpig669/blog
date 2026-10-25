<script setup>
import { reading,setReadingSettings } from '../lib/reading.js';
import ExpandableEntry from './ExpandableEntry.vue';
</script>
<template>
  <ExpandableEntry title="阅读设置" expandable title-class="text-[12px] text-secondary" class="reading-settings mb-5">
    <div class="reader-options flex flex-wrap gap-4 mt-3 text-[12px] text-secondary" @click.stop>
      <label>字号 <select :value="reading.fontSize" class="reader-select" @change="setReadingSettings($event.target.value,reading.lineHeight)"><option v-for="size in [16,17,18,20,22]" :key="size" :value="size">{{ size }} px</option></select></label>
      <label>行距 <select :value="reading.lineHeight" class="reader-select" @change="setReadingSettings(reading.fontSize,$event.target.value)"><option v-for="height in [1.6,1.8,2,2.2]" :key="height" :value="height">{{ height }}</option></select></label>
      <button class="text-accent" @click="setReadingSettings(17,1.8)">恢复默认</button>
    </div>
  </ExpandableEntry>
</template>
