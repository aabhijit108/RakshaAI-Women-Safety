# 🛡️ Raksha Safety: Enhanced Background Security Integration

**Empowering safety through intelligent technology.** Raksha Safety is a sophisticated emergency response system that leverages real-time sensor monitoring and AI-driven risk analysis to provide a discreet safety net for users.

---

## 👥 Meet the Team
* **Abhijit Adhikari** – Lead Backend Developer: Responsible for the core system architecture, AI risk evaluation logic, vault management, and server-side dispatch systems.
* **Purnima** – Frontend Developer: Responsible for the user interface, real-time status visualizations, and seamless integration of emergency triggers.

---

## 🚀 System Architecture (DFD Analysis)

The application operates through a highly synchronized multi-process architecture to ensure zero-latency response during critical situations:

### 🔍 1. Monitoring & Triggering Layer (P1)
* **Active Surveillance**: Continuously monitors **Voice**, **Motion**, and **SOS** inputs from the user.
* **Logic Controller**: Managed via `index.js`, which serves as the central hub for sensor data processing.
* **Instant Activation**: Upon a recognized threat, the system triggers the emergency protocol without requiring manual interaction.

### 🎥 2. Evidence & Vault Management (P4, P6, D2)
* **Background Recording**: Initiates a **Camera Background Recording** (P4) immediately upon trigger.
* **Secure Streaming**: The raw video stream is processed through `videos.js` for vault management.
* **Digital Vault**: Evidence is stored in an encrypted **Vault Folder** (D2) within the local File System for legal and safety verification.

### 🤖 3. AI Risk Evaluation (P2)
* **Intelligent Analysis**: The system communicates with **OpenRouter (AI Risk Analysis)** to perform situational assessment.
* **Scoring System**: Sends an "Analyze Request" to receive a real-time **Risk Level/Score**.
* **Server Logic**: Handled by `server.js` to determine whether to escalate to emergency dispatch.

### 📞 4. Emergency Dispatch & Deterrence (P3, P5)
* **Emergency Dispatch**: Automatically sends **GPS and Contact Data** via SMS or WhatsApp (Direct) to predefined **Emergency Contacts**.
* **Strategic Deterrent**: Initiates a **Fake Call Logic** via `fake-call.ts`, pulling a "Caller Name" from `AsyncStorage` (D1) to help the user exit a dangerous situation.

---

## 🛠️ Technology Stack
* **Backend**: Node.js, Python, and Laravel (developed by Abhijit).
* **Frontend**: React.js / React Native (developed by Purnima).
* **AI Engine**: OpenRouter API for advanced risk scoring.
* **Database/Storage**: `AsyncStorage` for local settings and an encrypted File System for vault storage.

---

## 📂 Repository Structure
* `/RakshaSafetyApp`: The frontend application logic, UI components, and state management.
* `/Backend`: Server-side API logic, AI evaluation scripts, and notification services.

---

## ⚙️ Installation & Setup
1. **Clone the Repository**:
   ```bash
   git clone [https://github.com/aabhijit108/AI-Women-Safety.git](https://github.com/aabhijit108/AI-Women-Safety.git)