import { index, route } from "@react-router/dev/routes";

export default [
  route("index.html", "./routes/index-html.ts"),
  index("./routes/_index.tsx"),
];
