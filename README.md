# 📝✨ LiveNotes – Real-Time Note Sharing App

<div align="center">
    <h3>LiveNotes</h3>

  <p>
    Real-time collaborative notes with AI-powered smart assistance.<br />
  </p>

  <p>
    <a href="https://opensource.org/licenses/Apache">
      <img src="https://img.shields.io/badge/Apache--2.0-green?style=for-the-badge" alt="apache-2.0-license" />
    </a>
    <a href="https://react.dev">
      <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="socket.io">
    </a>
    <a href="https://www.npmjs.com/">
        <img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white">
    </a>
    <a href="https://socket.io/">
        <img src="https://img.shields.io/badge/Socket.io-010101?&style=for-the-badge&logo=Socket.io&logoColor=white">
    </a>
  </p>

</div>

<div align="center">
    <img src="./screenshot.png" alt="Preview Image" height="500" width="100%" />
</div>


LiveNotes is a collaborative platform that allows users to share and edit notes in real-time with friends and colleagues. Whether you're brainstorming ideas, managing tasks, or sharing quick notes, LiveNotes makes collaboration seamless and efficient. It also integrates with multimodal AI assistance and terminal-based workflows to enhance productivity and streamline note management.

## 🌟 Features

- ⚡ **Real-Time Collaborative Editing** – Enables multi-user note synchronization using WebSockets for instant updates across all connected clients  
- 🧑‍🤝‍🧑 **Room-Based Access Control System** – Implements dynamic room creation and permission-based editing with controlled write access  
- 🎨 **Interactive Canvas with Live Shape Synchronization** – Supports real-time drawing and geometric shape sharing across users with event-driven rendering  
- 📄 **Integrated PDF Preview & Document Sharing** – Allows users to upload, view, and collaborate on documents within the workspace  
- 🤖 **AI-Powered Assistant (Ask Elloy)** – Provides contextual responses, screenshot-based analysis, and intelligent query handling using LLM integration  
- 🖼️ **Screenshot-to-AI Workflow** – Capture screen regions and directly query AI for contextual understanding and explanations  
- 💻 **CLI-to-Web Integration for Note Management** – Enables users to create and store notes directly from the terminal, synced with their LiveNotes account  
- 📊 **Persistent Note Storage with Structured Data Model** – Stores notes with metadata (title, timestamp) for efficient retrieval and organization  

## 🛠️ Technologies Used

- Next.js – Frontend framework for building scalable UI  
- Tailwind CSS – Utility-first styling for responsive design  
- Node.js – Runtime environment for backend services  
- Express.js – REST API and server-side routing  
- MongoDB – NoSQL database for persistent data storage  
- WebSockets (Socket.IO) – Real-time, bidirectional communication for live collaboration  
- Multi-Modal AI Integration – Supports multiple AI models for advanced reasoning, contextual understanding, and intelligent response generation
- CLI Tool – Terminal-based interface for note management and synchronization  


## 🚀 How to Use

### 1. Create or Join a Room
- Enter a unique room name on the homepage  
- Click **Join Room** to create or join a session  
- Share the room name with others to collaborate in real-time  

### 2. Start Real-Time Collaboration
- Type notes and see updates instantly across all connected users  
- Request edit access if you're a viewer  
- Use the canvas to draw diagrams and share visuals collaboratively  

### 3. Use AI Assistant (Ask Elloy)
- Ask questions directly in the chat panel  
- Upload screenshots or select screen regions for AI-based analysis  
- Get instant, contextual responses  

### 4. Work with Documents
- Upload PDF files to the workspace  
- View and collaborate on documents in real-time  
- Use AI to extract insights from content  

### 5. Save Notes via CLI
- Install and login using the LiveNotes CLI  
- Run commands like:
  ```bash
  livenotes login
  livenotes save "Lab Work"
  ```
  - Paste your code or notes directly in the terminal
- Notes are automatically synced to your Saved Notes section


### 6. Access Saved Notes
- Navigate to the Saved Notes section in the dashboard
- View, manage, and organize all notes saved via CLI or web

## 📜 License

This project is licensed under the `Apache-2.0 license`. See the [LICENSE](LICENSE) file for details.
