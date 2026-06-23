import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Tests from "@/pages/Tests";
import Topics from "@/pages/Topics";
import Calendar from "@/pages/Calendar";
import Quiz from "@/pages/Quiz";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>
        <Route path="/quiz/:mode/:id?" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}
