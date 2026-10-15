<script setup>
import { computed, ref, provide } from "vue";
import { config, store, safeUrl, lines } from "../lib/content";
import ExpandableEntry from "./ExpandableEntry.vue";
import EntryResources from "./EntryResources.vue";
import InlineText from "./InlineText.vue";
import Publications from "./Publications.vue";
import MarkdownBody from "./MarkdownBody.vue";
import Attachments from "./Attachments.vue";
const props = defineProps({ document: Object });
const publications = ref(null);
provide("jumpToPaper", (key) => publications.value?.jump(key));
const author = config.author || {};
const isAbout = computed(() => props.document.slug === store.about?.slug);
const name = computed(
  () => props.document.name || props.document.author || author.name,
);
const contacts = computed(() =>
  props.document.social?.length
    ? props.document.social
    : props.document.contacts?.length
      ? props.document.contacts
      : props.document.links || [],
);
const sections = computed(() =>
  [
    ["publications", "Publications", props.document.publications?.length],
    ["timeline", "Timeline", props.document.timeline?.length],
    ["focus-areas", "Focus Areas", props.document.focusAreas?.length],
    ["about-content", "Notes", props.document.content?.trim()],
  ].filter((section) => section[2]),
);
const expandable = (item) =>
  !!(
    item.detail ||
    item.details ||
    item.more ||
    Object.keys(item.links || {}).length
  );
function scroll(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
</script>
<template>
  <div class="shell mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-20">
    <header class="mb-10 pb-6 border-b border-divider">
      <div v-if="isAbout" class="flex items-center gap-4 mb-5">
        <span class="about-avatar-wrap" :data-initial="name?.charAt(0)"
          ><img
            v-if="safeUrl(document.avatar || author.avatar)"
            class="about-avatar-img"
            :src="safeUrl(document.avatar || author.avatar)"
            :alt="name"
            width="64"
            height="64"
            loading="lazy"
        /></span>
        <div>
          <h1 class="text-[30px] sm:text-[34px] font-bold text-primary">
            {{ name || document.title }}
          </h1>
          <p class="font-mono text-[13px] text-muted mt-1.5">
            {{ [author.title, author.location].filter(Boolean).join(" · ") }}
          </p>
          <div
            v-if="document.focus"
            class="about-status-pill font-mono text-[12px] mt-2.5"
          >
            <span class="about-status-dot-pulse"
              ><span class="about-status-dot-ping"></span
              ><span class="about-status-dot-core"></span></span
            >{{ document.focus }}
          </div>
        </div>
      </div>
      <template v-else
        ><h1 class="text-[32px] sm:text-[36px] font-bold text-primary mb-3">
          {{ document.title }}
        </h1>
        <p v-if="document.focus" class="font-mono text-accent text-[12px] mb-3">
          {{ document.focus }}
        </p></template
      >
      <p
        v-if="document.bio || document.excerpt"
        class="text-secondary text-[16px] leading-relaxed mb-3"
      >
        <InlineText :value="document.bio || document.excerpt" />
      </p>
      <div
        v-if="contacts.length"
        class="about-contacts-row flex flex-wrap gap-4 mt-3 font-mono text-[13px]"
      >
        <a
          v-for="(contact, index) in contacts"
          :key="index"
          :href="safeUrl(contact.url || contact.href)"
          class="about-contact-text-link"
          :target="
            /^http/.test(contact.url || contact.href) ? '_blank' : undefined
          "
          rel="noopener noreferrer"
          >{{ lines(contact.name || contact.title || contact.label) }} ↗</a
        >
      </div>
    </header>
    <nav
      v-if="sections.length > 1"
      class="about-section-nav"
      aria-label="On this page"
    >
      <button v-for="[id, label] in sections" :key="id" @click="scroll(id)">
        {{ label }}
      </button>
    </nav>
    <div v-if="document.quote" class="about-quote-box mb-10">
      “<InlineText :value="document.quote" />”
    </div>
    <Publications ref="publications" :document="document" />
    <section
      v-if="document.timeline?.length"
      id="timeline"
      class="mb-14 scroll-mt-20"
    >
      <h2 class="text-[18px] font-semibold border-b border-divider pb-3 mb-8">
        Timeline
      </h2>
      <div class="border-l border-subtle pl-6 space-y-8">
        <div
          v-for="(item, index) in document.timeline"
          :key="index"
          class="relative"
        >
          <span
            class="absolute w-2 h-2 rounded-full bg-muted -left-7 top-2"
            :class="{ 'bg-accent': index === 0 }"
          ></span>
          <p class="font-mono text-[12px] text-muted mb-2">{{ item.period }}</p>
          <ExpandableEntry
            :title="lines(item.title)"
            title-class="text-[16px] font-semibold text-primary mb-1"
            :expandable="expandable(item)"
            ><template #summary
              ><p class="text-[13px] text-secondary">
                <InlineText :value="item.desc" /></p></template
            ><EntryResources :item="item"
          /></ExpandableEntry>
        </div>
      </div>
    </section>
    <section
      v-if="document.focusAreas?.length"
      id="focus-areas"
      class="mb-14 scroll-mt-20"
    >
      <h2 class="text-[18px] font-semibold border-b border-divider pb-3 mb-6">
        Focus Areas
      </h2>
      <div class="space-y-5">
        <div
          v-for="(item, index) in document.focusAreas"
          :key="index"
          class="flex gap-3"
        >
          <span class="font-mono text-accent">/</span
          ><ExpandableEntry
            :title="lines(item.title)"
            title-class="text-[15px] font-semibold text-primary mb-1"
            :expandable="expandable(item)"
            ><template #summary
              ><p class="text-[13px] text-secondary">
                <InlineText :value="item.desc" /></p></template
            ><EntryResources :item="item"
          /></ExpandableEntry>
        </div>
      </div>
    </section>
    <section
      v-if="document.content?.trim()"
      id="about-content"
      class="mb-14 scroll-mt-20"
    >
      <MarkdownBody
        :content="document.content"
        :source-path="document.sourcePath"
        :toc-levels="document.tocLevels"
      />
    </section>
    <Attachments :document="document" />
  </div>
</template>
