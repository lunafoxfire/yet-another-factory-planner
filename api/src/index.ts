import '@/config';
import DB from '@/db';
import App from '@/app';

(async () => {
  try {
    await DB.init();
    await App.init();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(-1);
  }
})();
