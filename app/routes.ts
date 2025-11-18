import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    path: "/login",
    file: "routes/login.tsx"
  },
  {
    path: "/register",
    file: "routes/register.tsx"
  },
  {
    path: "/profile",
    file: "routes/profile.tsx"
  },
  {
    path: "/books",
    file: "routes/books.tsx"
  },
  {
    path: "/notes",
    file: "routes/notes.tsx"
  },
  {
    path: "/admin",
    file: "routes/admin/index.tsx"
  },
  {
    path: "/admin/upload",
    file: "routes/admin/upload.tsx"
  }
] satisfies RouteConfig;
