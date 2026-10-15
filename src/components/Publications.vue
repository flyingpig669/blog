<script setup>
import { computed, nextTick, reactive } from "vue";
import { config, pad } from "../lib/content";
import {
  normalizeAuthors,
  publicationLinks,
  publicationYear,
  publicationCitations,
} from "../lib/publications";
import ExpandableEntry from "./ExpandableEntry.vue";
import InlineText from "./InlineText.vue";
import PdfPreview from "./PdfPreview.vue";
const props = defineProps({ document: Object });
const entries = computed(() =>
  (props.document.publications || []).map((publication, index) => ({
    publication,
    sequence: index + 1,
    links: publicationLinks(publication),
  })),
);
const groups = computed(() =>
  [...new Set(entries.value.map((entry) => publicationYear(entry.publication)))]
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      entries: entries.value.filter(
        (entry) => publicationYear(entry.publication) === year,
      ),
    })),
);
const selfNames = computed(() =>
  [
    props.document.author,
    props.document.authors,
    props.document.name,
    config.author?.name,
    config.author?.aliases,
  ]
    .flat()
    .filter(Boolean),
);
const expanders = new Map();
const expanded = reactive({});
const citationTotal = computed(() =>
  entries.value.reduce(
    (total, entry) => total + (publicationCitations(entry.publication) || 0),
    0,
  ),
);
const hasCitations = computed(() =>
  entries.value.some(
    (entry) => publicationCitations(entry.publication) !== null,
  ),
);
async function jump(key) {
  const entry = entries.value.find(
    (entry) =>
      String(entry.publication.slug || "") === key ||
      entry.publication.title === key ||
      String(entry.sequence) === String(key),
  );
  if (!entry) return;
  const component = expanders.get(entry.sequence);
  if (component) component.expanded = true;
  await nextTick();
  document
    .getElementById("pub-" + entry.sequence)
    ?.scrollIntoView({ behavior: "smooth" });
}
defineExpose({ jump });
</script>
<template>
  <section v-if="entries.length" id="publications" class="mb-14 scroll-mt-20">
    <div
      class="about-section-header flex justify-between mb-8 pb-3 border-b border-divider"
    >
      <h2 class="text-[18px] font-semibold">Publications</h2>
      <span class="font-mono text-[11px] text-muted"
        >{{ entries.length }} Papers<span v-if="hasCitations">
          · {{ citationTotal }} Citations</span
        ></span
      >
    </div>
    <div v-for="group in groups" :key="group.year" class="pub-year-group">
      <div class="pub-year-label">
        <span class="pub-year-text">{{ group.year || "UNYEARED" }}</span
        ><span class="pub-year-rule"></span
        ><span class="pub-year-count">{{ group.entries.length }}</span>
      </div>
      <article
        v-for="entry in group.entries"
        :id="'pub-' + entry.sequence"
        :key="entry.sequence"
        class="pub-card"
        :class="{ 'is-expanded': expanded[entry.sequence] }"
      >
        <div class="pub-card-head">
          <span class="pub-seq font-mono">{{ pad(entry.sequence) }}</span>
          <div class="pub-card-main">
            <ExpandableEntry
              :ref="
                (component) =>
                  component
                    ? expanders.set(entry.sequence, component)
                    : expanders.delete(entry.sequence)
              "
              @update:expanded="expanded[entry.sequence] = $event"
              :title="entry.publication.title"
              title-class="pub-title"
              :expandable="
                !!(
                  entry.publication.abstract ||
                  entry.publication.summary ||
                  entry.links.some((link) => link.kind === 'pdf')
                )
              "
              ><template #summary
                ><p class="pub-authors">
                  <template
                    v-for="(author, index) in normalizeAuthors(
                      entry.publication.authors || entry.publication.author,
                      selfNames,
                    )"
                    :key="index"
                    ><span v-if="index">, </span
                    ><strong v-if="author.self" class="pub-author-self">{{
                      author.name
                    }}</strong
                    ><span v-else>{{ author.name }}</span></template
                  >
                </p>
                <div class="pub-meta">
                  <span>{{
                    entry.publication.venue || entry.publication.journal
                  }}</span
                  ><span class="font-mono">{{
                    publicationYear(entry.publication) || ""
                  }}</span
                  ><span
                    v-if="publicationCitations(entry.publication) != null"
                    class="font-mono"
                    >{{
                      publicationCitations(entry.publication)
                    }}
                    citations</span
                  >
                </div>
              </template>
              <p class="text-[13px] text-secondary leading-relaxed">
                <InlineText
                  :value="
                    entry.publication.abstract || entry.publication.summary
                  "
                />
              </p>
              <template v-for="link in entry.links" :key="link.kind"
                ><PdfPreview
                  v-if="link.kind === 'pdf'"
                  :url="link.href"
                  :title="entry.publication.title" /></template
            ></ExpandableEntry>
          </div>
          <div class="pub-badges">
            <a
              v-for="link in entry.links"
              :key="link.kind"
              :href="link.href"
              class="pub-badge"
              target="_blank"
              rel="noopener noreferrer"
              >{{ link.kind.toUpperCase() }}</a
            >
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
