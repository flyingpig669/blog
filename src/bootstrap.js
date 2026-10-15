import { createApp } from "vue";
import App from "./App.vue";
import { store } from "./lib/content";
import { createVueRouter } from "./lib/router";

export function bootstrap() {
  store.init();
  createApp(App).use(createVueRouter()).mount("#app");
}
