import { viteSingleFile } from "vite-plugin-singlefile";

export default {
  plugins: [
    viteSingleFile(),

  ],
  build: {
    modulePreload: false,
  },
};
