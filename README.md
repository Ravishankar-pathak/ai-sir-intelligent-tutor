# AI Sir - The Intelligent Tutor 🎓

**AI Sir** is a smart, interactive educational platform designed to act as your personal private tutor. It mimics the teaching style of an Indian teacher, explaining complex textbook chapters in **Hinglish** (Hindi + English mix), drawing diagrams on a whiteboard, and answering doubts via voice.

![AI Tutor Screenshot](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80)

## 🚀 Features

*   **📸 Image to Lecture:** Upload a photo of any textbook chapter (Maths, Science, History), and AI Sir will start teaching it step-by-step.
*   **✍️ Live Whiteboard:** The AI writes, draws diagrams (Triangles, Graphs, etc.), and highlights key points in real-time while speaking.
*   **🗣️ Voice Interaction:**
    *   **Teacher Voice:** Explains concepts in a natural Hinglish accent.
    *   **Voice Doubts:** Students can click the mic and ask questions.
*   **✋ Live Interruption:** Just like a real class, click "Raise Hand" to interrupt the teacher and ask a doubt instantly. The teacher solves it and then resumes the lecture.
*   **🧠 Google Gemini AI:** Powered by the latest Gemini 2.5 Flash model for fast, multimodal reasoning.

---

## 🛠️ Installation & Setup (Run Locally)

You need **Node.js** installed on your computer.

1.  **Create a new Vite Project:**
    Open your terminal/command prompt and run:
    ```bash
    npm create vite@latest ai-tutor -- --template react-ts
    cd ai-tutor
    ```

2.  **Install Dependencies:**
    Copy and paste this command to install the required libraries:
    ```bash
    npm install lucide-react @google/genai react-markdown
    ```
    *(Note: Tailwind CSS installation is also required if running locally, see Tailwind docs)*

3.  **Add Project Files:**
    *   Copy the `src` folder content from your download into the `src` folder of this new project.
    *   Ensure `App.tsx`, `main.tsx` (rename index.tsx to main.tsx), and components are in place.

4.  **Run the App:**
    ```bash
    npm run dev
    ```
    Open the link (usually `http://localhost:5173`) in your browser.

---

## 🌐 Deploy to GitHub (Hosting)

To host this for free on GitHub Pages:

1.  **Initialize Git:**
    ```bash
    git init
    git add .
    git commit -m "Initial commit - AI Tutor by Ravi"
    ```

2.  **Create Repository:**
    Go to GitHub, create a new repo named `ai-tutor`.

3.  **Push Code:**
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/ai-tutor.git
    git push -u origin main
    ```

4.  **Deploy:**
    *   Go to Repo Settings > Pages.
    *   Select Source: `GitHub Actions` or use the `gh-pages` package to build and deploy the `dist` folder.

---

## 👨‍💻 Developer

**Developed with ❤️ by Ravi**

© 2024 AI Sir Project. All rights reserved.
