import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./base.css";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import HomePage from "./pages/_index";
import homeLayout from "./pages/_index.pageLayout";
import QuizPage from "./pages/quiz";
import quizLayout from "./pages/quiz.pageLayout";
import LessonPage from "./pages/lesson.$lessonId";
import lessonLayout from "./pages/lesson.$lessonId.pageLayout";
import LecturerPage from "./pages/lecturer";
import lecturerLayout from "./pages/lecturer.pageLayout";
import LoginPage from "./pages/login";
import loginLayout from "./pages/login.pageLayout";

type Layout = React.ComponentType<{ children: React.ReactNode }>;
const page = (layouts: Layout[], Page: React.ComponentType) =>
  layouts.reduceRight<React.ReactNode>(
    (child, L) => <L>{child}</L>,
    <Page />,
  );

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          <Route path="/" element={page(homeLayout, HomePage)} />
          <Route path="/quiz" element={page(quizLayout, QuizPage)} />
          <Route path="/lesson/:lessonId" element={page(lessonLayout, LessonPage)} />
          <Route path="/lecturer" element={page(lecturerLayout, LecturerPage)} />
          <Route path="/login" element={page(loginLayout, LoginPage)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
