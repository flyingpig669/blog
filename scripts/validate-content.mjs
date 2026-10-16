import { store } from '../src/lib/store.js';
import { navigation } from '../src/lib/navigation.js';
import { html } from '../src/lib/html.js';
import { config } from '../src/config/blog.config.js';
import { registry, routeTable } from '../src/config/routes.js';
import validateContent from './validate-content.js';
validateContent({store, navigation, html, config, registry, routeTable});
