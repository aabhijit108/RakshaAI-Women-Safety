# 🛡️ Raksha AI: Intelligent Safety Sentinel

**Empowering safety through intelligent technology.** Raksha AI is a sophisticated emergency response system that leverages real-time sensor monitoring and AI-driven risk analysis to provide a discreet safety net for users.

---
## 🚀 System Architecture (DFD Analysis)

The application operates through a highly synchronized multi-process architecture to ensure zero-latency response during critical situations:

### 🔍 1. Neural Monitoring & Triggering (P1)
* **Active Surveillance**: Continuously monitors **Voice**, **Motion**, and **SOS** inputs from the mobile device sensors.
* **Logic Controller**: Managed via `index.tsx` within the Expo environment, serving as the central hub for real-time sensor data processing.
* **Instant Activation**: Automatically triggers emergency protocols upon threat detection without requiring manual user interaction.

### 🎥 2. Evidence & Vault Management (P4, P6, D2)
* **Background Recording**: Initiates a **Camera Background Recording** (P4) immediately upon trigger activation.
* **Secure Streaming**: The raw video stream is handled through `videos.tsx` for efficient vault management.
* **Digital Vault**: Evidence is stored in an encrypted **Vault Folder** (D2) within the local File System for legal and safety verification.

### 🤖 3. AI Risk Evaluation (P2)
* **Intelligent Analysis**: The Node.js backend communicates with the **OpenRouter API** for situational assessment.
* **Scoring System**: Dispatches an "Analyze Request" to receive a real-time **Risk Level/Score**.
* **Server Logic**: Handled by `server.js` to determine whether to escalate to an emergency dispatch.

### 📞 4. Emergency Dispatch & Deterrence (P3, P5)
* **Emergency Dispatch**: Automatically pushes **GPS and Contact Data** via SMS or WhatsApp (Direct) to predefined **Emergency Contacts**.
* **Strategic Deterrent**: Initiates **Fake Call Logic** via `fake-call.tsx`, pulling a "Caller Name" from `AsyncStorage` (D1) to provide a strategic exit for the user.

---

## 🛠️ Technology Stack
* **Backend**: Node.js (developed by Abhijit).
* **Frontend**: React Native with Expo (TypeScript `.tsx`) (developed by Purnima).
* **AI Engine**: OpenRouter API for LLM-based risk scoring.
* **Database/Storage**: `AsyncStorage` for local settings and encrypted File System for vault storage.

---

## 📂 Repository Structure
* `/RakshaAI`: React Native Expo frontend (Logic, UI Components, State Management).
* `/Backend`: Node.js server-side API, AI evaluation scripts, and notification services.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/aabhijit108/AI-Women-Safety.git](https://github.com/aabhijit108/AI-Women-Safety.git)
```

---

## 👥 Meet the Team
* **[Abhijit](https://github.com/aabhijit108)** – *Lead Backend Developer*: Architected the Node.js core, AI risk evaluation logic, secure vault management, and server-side dispatch systems.
* **[Purnima](https://github.com/PurniMAkk)** – *Frontend Developer*: Developed the React Native Expo application, featuring real-time status visualizations and seamless trigger integrations.

---
