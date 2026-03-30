import Navbar from "components/Navbar";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Roomify - A Modern 3D Architecture Builder" },
    { name: "description", content: "This application is a modern 3D architecture builder" },
  ];
}

export default function Home() {
  return (
  <>
  <div className="Home">
    <Navbar/>
    <h1 className="text-3xl font-bold">Home</h1>
  </div>
  </>
);
}
