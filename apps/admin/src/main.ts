import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

// Design tokens CSS (resolved via the @ajkerbazardor/ui alias in vite.config)
import '@ajkerbazardor/ui/tokens/tokens.css';
import './style.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
