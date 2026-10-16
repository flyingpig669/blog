import { createApp } from "vue";
import App from "./App.vue";
import { store } from "./lib/content";
import { createVueRouter } from "./lib/router";

export async function bootstrap() {
  const response = await fetch("data/index.json");
  if (!response.ok) throw new Error("Content index could not load.");
  store.init(await response.json());
  createApp(App).use(createVueRouter()).mount("#app");
}
