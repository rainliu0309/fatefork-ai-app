import { Route, Routes } from "react-router-dom";
import { PageShell } from "@/components/layout/PageShell";
import { HomePage } from "@/pages/HomePage";
import { ZiweiPage } from "@/pages/ZiweiPage";
import { TarotPage } from "@/pages/TarotPage";
import { ChatPage } from "@/pages/ChatPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** A small explicit route tree keeps every product channel linkable and deployable. */
export function App() {
  return (
    <Routes>
      <Route element={<PageShell />}>
        <Route index element={<HomePage />} />
        <Route path="ziwei" element={<ZiweiPage />} />
        <Route path="tarot" element={<TarotPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
