import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./Home.tsx";
import Callback from "./Callback.tsx";
import Test from "./Test.tsx";

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </HashRouter>
  );
}
